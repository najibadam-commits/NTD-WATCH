import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import '../i18n';
import { ConnectivityBanner } from '../chw/components/Shared';
import { useMockControls } from '../mock/controls';
import { mockServer } from '../mock/node';
import { resetServerDb, serverDb, serverGeneration } from '../mock/serverDb';
import {
  makeAssessment,
  makeFgsAssessment,
  makeFollowUp,
  makeReferral,
} from '../testing/factories';
import { resetAll } from '../testing/resetAll';
import { useConnectivity } from './connectivity';
import { localDb } from './localDb';
import {
  requestDeletion,
  saveAssessment,
  saveFollowUp,
  saveReferral,
  withdrawConsent,
} from './repository';
import { syncOutbox } from './sync';

/**
 * Mock-server loss. The "server" is a browser database; clearing it is what the audit did by
 * hand. These tests stand in for that with `resetServerDb()`, which deletes and reopens it.
 * All records are synthetic.
 */

const A = 'assessment:key-assess-0001';
const R = 'referral:key-assess-0001';
const F = 'followUp:key-follow-0001';

let requests: string[] = [];
const onRequest = ({ request }: { request: Request }) => {
  requests.push(`${request.method} ${new URL(request.url).pathname}`);
};
const posts = () => requests.filter((r) => r.startsWith('POST'));
const statusOf = async (key: string) => (await localDb.outbox.get(key))?.status;
const allStatuses = async () => (await localDb.outbox.toArray()).map((i) => i.status);

async function captureAndSyncAll() {
  await saveAssessment(makeAssessment());
  await saveReferral(makeReferral());
  await saveFollowUp(makeFollowUp());
  const summary = await syncOutbox({ force: true });
  expect(summary.sent).toBe(3);
  expect(await allStatuses()).toEqual(['synced', 'synced', 'synced']);
  requests = [];
}

beforeAll(() => {
  mockServer.listen({ onUnhandledFrame: 'error' });
  mockServer.events.on('request:start', onRequest);
});
afterAll(() => mockServer.close());
beforeEach(async () => {
  requests = [];
  await resetAll();
});
afterEach(() => {
  mockServer.resetHandlers();
  vi.useRealTimers();
});

describe('A. server database cleared after a successful sync', () => {
  it('is detected on the next sync run, and the record is no longer claimed as synced', async () => {
    await saveAssessment(makeAssessment());
    await syncOutbox();
    expect(await localDb.assessments.count()).toBe(1);
    expect(await serverDb.assessments.count()).toBe(1);
    const before = (await localDb.outbox.get(A))?.serverGeneration;
    expect(before).toBeTruthy();

    // the server is lost while the device still believes the record is synced
    await resetServerDb();
    expect(await serverDb.assessments.count()).toBe(0);
    expect(await statusOf(A)).toBe('synced'); // stale until the device next asks the server

    // the next run asks which generation is answering; it differs, so the item is not "synced"
    // hold the re-send back so the detected state is observable
    mockServer.use(http.post('*/api/v1/assessments', () => HttpResponse.json({}, { status: 503 })));
    await syncOutbox({ force: true });

    const item = await localDb.outbox.get(A);
    expect(item?.status).toBe('failed');
    expect(item?.restore).toBe(true);
    expect(item?.syncedAt).toBeNull();
    // the valid local record is untouched
    expect(await localDb.assessments.count()).toBe(1);
  });

  it('says so in the banner instead of "Everything is synced"', async () => {
    await saveAssessment(makeAssessment());
    await syncOutbox();
    render(<ConnectivityBanner />);
    await screen.findByText(/Everything is synced/);

    await resetServerDb();
    mockServer.use(http.post('*/api/v1/assessments', () => HttpResponse.json({}, { status: 503 })));
    await syncOutbox({ force: true });

    await waitFor(() => expect(screen.queryByText(/Everything is synced/)).toBeNull());
    expect(screen.getByRole('status')).toHaveTextContent(/1 waiting to sync/);
    expect(screen.getByRole('status')).toHaveTextContent(/1 being restored/);
    expect(screen.getByRole('status')).toHaveTextContent(
      /demonstration server, which lives in this browser/,
    );
  });
});

describe('B. successful recovery', () => {
  it('restores the assessment once, without a duplicate, and reports synced only after the acknowledgement', async () => {
    await saveAssessment(makeAssessment());
    await syncOutbox();
    const oldGeneration = await serverGeneration();
    await resetServerDb();

    render(<ConnectivityBanner />);
    // hold the acknowledgement back: the first attempt fails, so nothing is claimed
    mockServer.use(
      http.post('*/api/v1/assessments', () => HttpResponse.json({}, { status: 503 }), {
        once: true,
      }),
    );
    await syncOutbox({ force: true });
    expect(await serverDb.assessments.count()).toBe(0);
    await waitFor(() => expect(screen.queryByText(/Everything is synced/)).toBeNull());

    // the retry is acknowledged
    await syncOutbox({ force: true });
    expect(await serverDb.assessments.count()).toBe(1);
    expect(await localDb.assessments.count()).toBe(1);
    const item = await localDb.outbox.get(A);
    expect(item?.status).toBe('synced');
    expect(item?.restore).toBe(false);
    expect(item?.serverGeneration).toBe(await serverGeneration());
    expect(item?.serverGeneration).not.toBe(oldGeneration);
    await screen.findByText(/Everything is synced/);
    expect(screen.getByRole('status')).not.toHaveTextContent(/being restored/);
  });
});

describe('C. dependent referral and follow-up recovery', () => {
  it('restores the assessment first, and the relationships stay intact', async () => {
    await captureAndSyncAll();
    await resetServerDb();

    const summary = await syncOutbox({ force: true });
    expect(summary.sent).toBe(3);
    expect(posts()).toEqual([
      'POST /api/v1/assessments',
      'POST /api/v1/referrals',
      'POST /api/v1/follow-ups',
    ]);
    expect(await allStatuses()).toEqual(['synced', 'synced', 'synced']);
    const referral = await serverDb.referrals.toArray();
    const followUp = await serverDb.followUps.toArray();
    expect(await serverDb.assessments.count()).toBe(1);
    expect(referral).toHaveLength(1);
    expect(referral[0]?.assessmentKey).toBe('key-assess-0001');
    expect(followUp).toHaveLength(1);
    expect(followUp[0]?.assessmentKey).toBe('key-assess-0001');
  });

  it('does not send the dependents while the assessment has not been restored', async () => {
    await captureAndSyncAll();
    await resetServerDb();
    mockServer.use(http.post('*/api/v1/assessments', () => HttpResponse.json({}, { status: 503 })));

    const summary = await syncOutbox({ force: true });
    expect(summary.sent).toBe(0);
    expect(posts()).toEqual(['POST /api/v1/assessments']);
    expect(await serverDb.referrals.count()).toBe(0);
    expect(await serverDb.followUps.count()).toBe(0);
    expect(await localDb.referrals.count()).toBe(1);
    expect(await localDb.followUps.count()).toBe(1);
  });

  it('sends a referral as it stands on the device now, not as first queued', async () => {
    await captureAndSyncAll();
    await localDb.referrals
      .where('assessmentKey')
      .equals('key-assess-0001')
      .modify({
        stage: 'ACCEPTED',
        stageTimestamps: ['2026-10-17T10:05:00.000Z', '2026-10-18T09:00:00.000Z'],
      });
    await resetServerDb();
    await syncOutbox({ force: true });
    expect((await serverDb.referrals.toArray())[0]?.stage).toBe('ACCEPTED');
  });
});

describe('D. repeated recovery', () => {
  it('is idempotent: later runs send nothing and create no duplicates', async () => {
    await captureAndSyncAll();
    await resetServerDb();
    await syncOutbox({ force: true });
    const after = await localDb.outbox.toArray();
    requests = [];

    await syncOutbox({ force: true });
    await syncOutbox({ force: true });

    expect(posts()).toEqual([]);
    expect(await serverDb.assessments.count()).toBe(1);
    expect(await serverDb.referrals.count()).toBe(1);
    expect(await serverDb.followUps.count()).toBe(1);
    expect(await localDb.outbox.toArray()).toEqual(after);
  });

  it('sending a restored item again, as after a lost acknowledgement, still creates no duplicate', async () => {
    await captureAndSyncAll();
    await resetServerDb();
    useMockControls.getState().setDropResponseNext(0);
    await syncOutbox({ force: true });
    // pretend the device never saw the acknowledgement: mark the assessment pending again
    await localDb.outbox.update(A, { status: 'pending', nextAttemptAt: 0, restore: true });
    await syncOutbox({ force: true });
    expect(await serverDb.assessments.count()).toBe(1);
    expect(await statusOf(A)).toBe('synced');
  });
});

describe('E. temporary outage', () => {
  it('is not taken for server loss, keeps local records, and recovers with no resend', async () => {
    await captureAndSyncAll();
    const generation = (await localDb.outbox.get(A))?.serverGeneration;

    useMockControls.getState().setServerDown(true);
    await syncOutbox({ force: true });
    expect(await allStatuses()).toEqual(['synced', 'synced', 'synced']);
    expect((await localDb.outbox.toArray()).some((i) => i.restore)).toBe(false);
    expect(await localDb.assessments.count()).toBe(1);
    expect(posts()).toEqual([]); // no re-send was attempted: the probe got no answer

    useMockControls.getState().setServerDown(false);
    requests = [];
    await syncOutbox({ force: true });
    expect(posts()).toEqual([]);
    expect((await localDb.outbox.get(A))?.serverGeneration).toBe(generation);
    expect(await serverDb.assessments.count()).toBe(1);
  });

  it('still captures offline and retries new work through an outage', async () => {
    await captureAndSyncAll();

    useMockControls.getState().setServerDown(true);
    await saveAssessment(makeAssessment('key-assess-0002', { id: 'A-0002' }));
    await syncOutbox({ force: true });
    expect(await statusOf('assessment:key-assess-0002')).toBe('failed');
    expect(await statusOf(A)).toBe('synced');

    useMockControls.getState().setServerDown(false);
    await syncOutbox({ force: true });
    expect(await statusOf('assessment:key-assess-0002')).toBe('synced');
    expect(await serverDb.assessments.count()).toBe(2);
  });

  it('keeps the device offline-first: nothing is probed or sent while offline', async () => {
    await captureAndSyncAll();
    useConnectivity.getState().setSimulatedOffline(true);
    await saveAssessment(makeAssessment('key-assess-0003', { id: 'A-0003' }));
    expect(await syncOutbox()).toMatchObject({ skipped: 'offline' });
    expect(requests).toEqual([]);
  });
});

describe('F. partial failure', () => {
  it('does not report total recovery while a record is still missing, and finishes on retry', async () => {
    await captureAndSyncAll();
    await resetServerDb();
    render(<ConnectivityBanner />);
    mockServer.use(
      http.post('*/api/v1/follow-ups', () => HttpResponse.json({}, { status: 500 }), {
        once: true,
      }),
    );

    const first = await syncOutbox({ force: true });
    expect(first.sent).toBe(2);
    expect(await statusOf(A)).toBe('synced');
    expect(await statusOf(R)).toBe('synced');
    expect(await statusOf(F)).toBe('failed');
    expect((await localDb.outbox.get(F))?.restore).toBe(true);
    expect(await serverDb.followUps.count()).toBe(0);
    expect(await localDb.followUps.count()).toBe(1);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/1 waiting to sync/));
    expect(screen.queryByText(/Everything is synced/)).toBeNull();

    // the acknowledged ones are not sent again; only the failed one is
    requests = [];
    await syncOutbox({ force: true });
    expect(posts()).toEqual(['POST /api/v1/follow-ups']);
    expect(await allStatuses()).toEqual(['synced', 'synced', 'synced']);
    expect(await serverDb.followUps.count()).toBe(1);
    await screen.findByText(/Everything is synced/);
  });

  it('applies the existing back-off to a failed restore', async () => {
    await captureAndSyncAll();
    await resetServerDb();
    mockServer.use(http.post('*/api/v1/assessments', () => HttpResponse.json({}, { status: 503 })));
    await syncOutbox({ force: true });
    const item = await localDb.outbox.get(A);
    expect(item?.attempts).toBe(1);
    expect(item?.nextAttemptAt).toBeGreaterThan(Date.now());
  });
});

describe('records that must not come back', () => {
  it('does not resurrect a record whose deletion was requested', async () => {
    await saveAssessment(makeAssessment());
    await syncOutbox({ force: true });
    await requestDeletion('key-assess-0001');
    await syncOutbox({ force: true });
    await resetServerDb();
    requests = [];
    await syncOutbox({ force: true });
    expect(posts().filter((p) => p === 'POST /api/v1/assessments')).toEqual([]);
    expect(await serverDb.assessments.count()).toBe(0);
  });

  it('restores a withdrawn assessment and its withdrawal event, in that order, ending withdrawn', async () => {
    await saveAssessment(makeFgsAssessment());
    await syncOutbox({ force: true });
    await withdrawConsent('key-fgs-0001');
    await syncOutbox({ force: true });
    expect((await serverDb.assessments.get('key-fgs-0001'))?.consent?.state).toBe('WITHDRAWN');

    await resetServerDb();
    requests = [];
    await syncOutbox({ force: true });
    expect(posts()).toEqual(['POST /api/v1/assessments', 'POST /api/v1/consent-events']);
    expect((await serverDb.assessments.get('key-fgs-0001'))?.consent?.state).toBe('WITHDRAWN');
    expect(await serverDb.assessments.count()).toBe(1);
    expect(await localDb.assessments.count()).toBe(1);
  });

  it('re-sends an item acknowledged before generations were recorded, once', async () => {
    await saveAssessment(makeAssessment());
    await syncOutbox({ force: true });
    await localDb.outbox.update(A, { serverGeneration: undefined });
    requests = [];
    await syncOutbox({ force: true });
    expect(posts()).toEqual(['POST /api/v1/assessments']);
    expect(await serverDb.assessments.count()).toBe(1);
    requests = [];
    await syncOutbox({ force: true });
    expect(posts()).toEqual([]);
  });
});
