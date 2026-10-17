import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { referralIdFor } from '@ntd-watch/domain';
import { DEMO_ROLE_HEADER } from '@ntd-watch/api-contract';
import { useMockControls } from '../mock/controls';
import { mockServer } from '../mock/node';
import { serverDb } from '../mock/serverDb';
import { makeAssessment, makeFollowUp, makeReferral } from '../testing/factories';
import { resetAll } from '../testing/resetAll';
import { apiUrl } from './apiClient';
import { isOnline, useConnectivity, watchBrowserConnectivity } from './connectivity';
import { localDb } from './localDb';
import { pullReferralStatus, saveAssessment, saveFollowUp, saveReferral } from './repository';
import { backoffMs, recoverInterrupted, requeue, syncOutbox } from './sync';

const goOffline = () => useConnectivity.getState().setSimulatedOffline(true);
const goOnline = () => useConnectivity.getState().setSimulatedOffline(false);
const outboxOf = (key: string) => localDb.outbox.get(key);

let requests: string[] = [];
const onRequest = ({ request }: { request: Request }) => {
  requests.push(`${request.method} ${new URL(request.url).pathname}`);
};

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

describe('offline capture', () => {
  it('saves on the device and queues the assessment without contacting the server', async () => {
    goOffline();
    await saveAssessment(makeAssessment());

    expect(await localDb.assessments.count()).toBe(1);
    expect((await outboxOf('assessment:key-assess-0001'))?.status).toBe('pending');
    expect(await syncOutbox()).toMatchObject({ skipped: 'offline', sent: 0 });
    expect(requests).toEqual([]);
    expect(await serverDb.assessments.count()).toBe(0);
  });

  it('delivers everything in order once the connection returns', async () => {
    goOffline();
    await saveAssessment(makeAssessment());
    await saveReferral(makeReferral());
    await saveFollowUp(makeFollowUp());

    goOnline();
    const summary = await syncOutbox();

    expect(summary.sent).toBe(3);
    expect(await serverDb.assessments.count()).toBe(1);
    expect(await serverDb.referrals.count()).toBe(1);
    expect(await serverDb.followUps.count()).toBe(1);
    const statuses = (await localDb.outbox.toArray()).map((i) => i.status);
    expect(statuses).toEqual(['synced', 'synced', 'synced']);
    expect(requests).toEqual([
      'POST /api/v1/assessments',
      'POST /api/v1/referrals',
      'POST /api/v1/follow-ups',
    ]);
  });

  it('reports the browser being offline from the real online/offline events', () => {
    const stop = watchBrowserConnectivity();
    window.dispatchEvent(new Event('offline'));
    expect(isOnline()).toBe(false);
    window.dispatchEvent(new Event('online'));
    expect(isOnline()).toBe(true);
    stop();
  });
});

describe('browser refresh', () => {
  it('keeps an offline capture after a full reload and sends it afterwards', async () => {
    goOffline();
    await saveAssessment(makeAssessment());

    // A refresh discards every in-memory module but keeps IndexedDB.
    vi.resetModules();
    const freshDb = (await import('./localDb')).localDb;
    const freshSync = await import('./sync');
    expect(await freshDb.assessments.count()).toBe(1);
    expect((await freshDb.outbox.toArray())[0]?.status).toBe('pending');

    const summary = await freshSync.syncOutbox();
    expect(summary.sent).toBe(1);
    expect(await serverDb.assessments.count()).toBe(1);
  });

  it('recovers an item that was mid-send when the page closed', async () => {
    await saveAssessment(makeAssessment());
    await localDb.outbox.update('assessment:key-assess-0001', { status: 'syncing' });

    expect(await recoverInterrupted()).toBe(1);
    expect((await outboxOf('assessment:key-assess-0001'))?.status).toBe('pending');
  });

  it('does not resend an item that already synced before the refresh', async () => {
    await saveAssessment(makeAssessment());
    await syncOutbox();
    requests = [];

    vi.resetModules();
    const freshSync = await import('./sync');
    await freshSync.recoverInterrupted();
    await freshSync.syncOutbox({ force: true });
    expect(requests).toEqual([]);
  });
});

describe('duplicate submissions', () => {
  it('keeps one record and one queue entry when the same assessment is saved twice', async () => {
    const first = await saveAssessment(makeAssessment());
    const second = await saveAssessment(makeAssessment());

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(await localDb.assessments.count()).toBe(1);
    expect(await localDb.outbox.count()).toBe(1);
  });

  it('survives a double tap: two simultaneous saves create one record', async () => {
    const results = await Promise.all([
      saveAssessment(makeAssessment()),
      saveAssessment(makeAssessment()),
    ]);
    expect(results.filter((r) => r.created)).toHaveLength(1);
    expect(await localDb.outbox.count()).toBe(1);
  });

  it('two sync runs at the same moment send each item once', async () => {
    goOffline();
    await saveAssessment(makeAssessment());
    goOnline();
    useMockControls.getState().setLatency(30);

    await Promise.all([syncOutbox(), syncOutbox(), syncOutbox()]);
    expect(requests.filter((r) => r === 'POST /api/v1/assessments')).toHaveLength(1);
    expect(await serverDb.assessments.count()).toBe(1);
  });

  it('a lost response does not create a second record when the item is retried', async () => {
    goOffline();
    await saveAssessment(makeAssessment());
    goOnline();
    useMockControls.getState().setDropResponseNext(1);

    const first = await syncOutbox();
    expect(first.failed).toBe(1);
    expect(await serverDb.assessments.count()).toBe(1); // stored, but the device never heard back
    expect((await outboxOf('assessment:key-assess-0001'))?.status).toBe('failed');

    const second = await syncOutbox({ force: true });
    expect(second.sent).toBe(1);
    expect(await serverDb.assessments.count()).toBe(1); // still exactly one
    expect((await outboxOf('assessment:key-assess-0001'))?.status).toBe('synced');
  });

  it('the server answers a repeated key with the existing record, never a second one', async () => {
    const a = makeAssessment();
    const call = () =>
      fetch(apiUrl('/api/v1/assessments'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [DEMO_ROLE_HEADER]: 'chw',
          'Idempotency-Key': a.clientKey,
        },
        body: JSON.stringify(a),
      });
    const first = await call();
    const again = await call();
    expect(first.status).toBe(201);
    expect(again.status).toBe(200);
    expect(((await again.json()) as { duplicate: boolean }).duplicate).toBe(true);
    expect(await serverDb.assessments.count()).toBe(1);
  });

  it('rejects a request whose Idempotency-Key does not match the record', async () => {
    const a = makeAssessment();
    const res = await fetch(apiUrl('/api/v1/assessments'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [DEMO_ROLE_HEADER]: 'chw',
        'Idempotency-Key': 'some-other-key',
      },
      body: JSON.stringify(a),
    });
    expect(res.status).toBe(400);
  });
});

describe('sync failures and retry', () => {
  it('marks a server error as failed, waits, then retries successfully', async () => {
    goOffline();
    await saveAssessment(makeAssessment());
    goOnline();
    useMockControls.getState().setFailNext(1);

    const t0 = 1_000_000;
    const first = await syncOutbox({ now: () => t0 });
    expect(first.failed).toBe(1);
    const failed = await outboxOf('assessment:key-assess-0001');
    expect(failed).toMatchObject({ status: 'failed', attempts: 1 });
    expect(failed?.lastError).toMatch(/500/);
    expect(failed?.nextAttemptAt).toBe(t0 + backoffMs(1));

    requests = [];
    const tooSoon = await syncOutbox({ now: () => t0 + 1_000 });
    expect(tooSoon.deferred).toBe(1);
    expect(requests).toEqual([]); // back-off respected, nothing sent

    const later = await syncOutbox({ now: () => t0 + 2_001 });
    expect(later.sent).toBe(1);
    expect((await outboxOf('assessment:key-assess-0001'))?.status).toBe('synced');
    expect(await serverDb.assessments.count()).toBe(1);
  });

  it('keeps failing while the server is down, with growing back-off, and recovers after', async () => {
    goOffline();
    await saveAssessment(makeAssessment());
    goOnline();
    useMockControls.getState().setServerDown(true);

    let clock = 5_000_000;
    for (let attempt = 1; attempt <= 3; attempt++) {
      await syncOutbox({ now: () => clock });
      const item = await outboxOf('assessment:key-assess-0001');
      expect(item).toMatchObject({ status: 'failed', attempts: attempt });
      expect(item?.lastError).toMatch(/503/);
      clock = item!.nextAttemptAt;
    }
    expect([backoffMs(1), backoffMs(2), backoffMs(3)]).toEqual([2_000, 4_000, 8_000]);
    expect(backoffMs(20)).toBe(60_000);

    useMockControls.getState().setServerDown(false);
    await syncOutbox({ now: () => clock });
    expect((await outboxOf('assessment:key-assess-0001'))?.status).toBe('synced');
  });

  it('manual "sync now" ignores back-off', async () => {
    goOffline();
    await saveAssessment(makeAssessment());
    goOnline();
    useMockControls.getState().setFailNext(1);
    await syncOutbox({ now: () => 1_000 });
    const result = await syncOutbox({ force: true, now: () => 1_001 });
    expect(result.sent).toBe(1);
  });

  it('rejects a record the server says is invalid and never retries it', async () => {
    const bad = { ...makeAssessment(), ageGroup: '999' } as never;
    await localDb.assessments.add(bad);
    await localDb.outbox.add({
      key: 'assessment:key-assess-0001',
      kind: 'assessment',
      clientKey: 'key-assess-0001',
      dependsOn: null,
      payload: bad,
      status: 'pending',
      attempts: 0,
      lastError: null,
      createdAt: 1,
      nextAttemptAt: 0,
      syncedAt: null,
    });

    const first = await syncOutbox();
    expect(first.rejected).toBe(1);
    const item = await outboxOf('assessment:key-assess-0001');
    expect(item).toMatchObject({ status: 'rejected', attempts: 1 });
    expect(item?.lastError).toMatch(/422/);

    requests = [];
    await syncOutbox({ force: true });
    expect(requests).toEqual([]);
    expect(await serverDb.assessments.count()).toBe(0);
  });

  it('can put a failed item back in the queue by hand', async () => {
    goOffline();
    await saveAssessment(makeAssessment());
    goOnline();
    useMockControls.getState().setServerDown(true);
    await syncOutbox();
    useMockControls.getState().setServerDown(false);

    await requeue('assessment:key-assess-0001');
    expect((await outboxOf('assessment:key-assess-0001'))?.status).toBe('pending');
    expect((await syncOutbox()).sent).toBe(1);
  });

  it('stops sending as soon as the connection drops mid-run', async () => {
    goOffline();
    await saveAssessment(makeAssessment('key-assess-0001'));
    await saveAssessment(makeAssessment('key-assess-0002', { id: 'A-0002' }));
    goOnline();
    mockServer.events.on('request:end', goOffline);
    const summary = await syncOutbox();
    mockServer.events.removeListener('request:end', goOffline);

    expect(summary.sent).toBe(1);
    expect(summary.skipped).toBe('offline');
    expect((await outboxOf('assessment:key-assess-0002'))?.status).toBe('pending');
  });
});

describe('dependencies between records', () => {
  it('holds a referral back until its assessment has reached the server', async () => {
    goOffline();
    await saveAssessment(makeAssessment());
    await saveReferral(makeReferral());
    goOnline();
    useMockControls.getState().setFailNext(1); // the assessment fails first

    const first = await syncOutbox({ now: () => 10 });
    expect(first.failed).toBe(1);
    expect(first.deferred).toBe(1);
    expect(requests.filter((r) => r.includes('referrals'))).toEqual([]);
    expect((await outboxOf(`referral:key-assess-0001`))?.attempts).toBe(0);

    const second = await syncOutbox({ force: true });
    expect(second.sent).toBe(2);
    expect(await serverDb.referrals.count()).toBe(1);
  });

  it('the server itself refuses a referral for an unknown assessment', async () => {
    const r = makeReferral('key-orphan-001');
    const res = await fetch(apiUrl('/api/v1/referrals'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [DEMO_ROLE_HEADER]: 'chw' },
      body: JSON.stringify(r),
    });
    expect(res.status).toBe(409);
    expect(((await res.json()) as { code: string }).code).toBe('PARENT_MISSING');
  });

  it('rejects a referral whose id does not match its assessment', async () => {
    await saveAssessment(makeAssessment());
    await syncOutbox();
    const forged = makeReferral('key-assess-0001', { id: 'NTDW-2026-000001' });
    expect(forged.id).not.toBe(referralIdFor('key-assess-0001', 2026));
    const res = await fetch(apiUrl('/api/v1/referrals'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [DEMO_ROLE_HEADER]: 'chw' },
      body: JSON.stringify(forged),
    });
    expect(res.status).toBe(422);
  });

  it('marks a dependent item rejected when its parent is rejected', async () => {
    await saveReferral(makeReferral());
    await localDb.outbox.add({
      key: 'assessment:key-assess-0001',
      kind: 'assessment',
      clientKey: 'key-assess-0001',
      dependsOn: null,
      payload: makeAssessment(),
      status: 'rejected',
      attempts: 1,
      lastError: '422 test',
      createdAt: 0,
      nextAttemptAt: 0,
      syncedAt: null,
    });
    await syncOutbox({ force: true });
    expect(await outboxOf('referral:key-assess-0001')).toMatchObject({ status: 'rejected' });
  });
});

describe('simulated roles on the mock API (not security controls)', () => {
  it('lets a facility worker advance a referral one stage at a time, forward only', async () => {
    await saveAssessment(makeAssessment());
    await saveReferral(makeReferral());
    await syncOutbox();
    const id = makeReferral().id;
    const patch = (stage: string, role = 'facility') =>
      fetch(apiUrl(`/api/v1/referrals/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', [DEMO_ROLE_HEADER]: role },
        body: JSON.stringify({ stage }),
      });

    expect((await patch('ACCEPTED')).status).toBe(200);
    expect((await patch('ASSESSED')).status).toBe(409); // skipped a stage
    expect((await patch('GENERATED')).status).toBe(409); // backwards
    expect((await serverDb.referrals.get(id))?.stageTimestamps).toHaveLength(2);
  });

  it('refuses a community health worker role on the status-update route', async () => {
    const res = await fetch(apiUrl('/api/v1/referrals/NTDW-2026-000001'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', [DEMO_ROLE_HEADER]: 'chw' },
      body: JSON.stringify({ stage: 'ACCEPTED' }),
    });
    expect(res.status).toBe(403);
  });

  it('refuses programme roles on person-level routes and unknown roles everywhere', async () => {
    const post = (role?: string) =>
      fetch(apiUrl('/api/v1/assessments'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(role ? { [DEMO_ROLE_HEADER]: role } : {}),
        },
        body: JSON.stringify(makeAssessment()),
      });
    expect((await post('admin')).status).toBe(403);
    expect((await post('state')).status).toBe(403);
    expect((await post()).status).toBe(401);
  });

  it('pulls a newer stage from the server and never rolls a referral back', async () => {
    await saveAssessment(makeAssessment());
    await saveReferral(makeReferral());
    await syncOutbox();
    const id = makeReferral().id;
    await fetch(apiUrl(`/api/v1/referrals/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', [DEMO_ROLE_HEADER]: 'facility' },
      body: JSON.stringify({ stage: 'ACCEPTED' }),
    });

    expect((await pullReferralStatus(id))?.stage).toBe('ACCEPTED');
    await localDb.referrals.update(id, { stage: 'ASSESSED' }); // device somehow ahead
    expect((await pullReferralStatus(id))?.stage).toBe('ASSESSED');
  });
});
