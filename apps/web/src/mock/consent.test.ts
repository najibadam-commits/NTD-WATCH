import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DEMO_ROLE_HEADER, IDEMPOTENCY_HEADER } from '@ntd-watch/api-contract';
import { CONSENT_AUDIT_ACTIONS, referralIdFor } from '@ntd-watch/domain';
import { mockServer } from './node';
import { loadRecords, setMockClock } from './programmeStore';
import { serverDb } from './serverDb';
import { apiUrl } from '../offline/apiClient';
import { useConnectivity } from '../offline/connectivity';
import { localDb } from '../offline/localDb';
import {
  ConsentWithdrawnError,
  requestDeletion,
  saveAssessment,
  saveFollowUp,
  saveReferral,
  withdrawConsent,
} from '../offline/repository';
import { syncOutbox } from '../offline/sync';
import { makeFgsAssessment, makeFollowUp, makeReferral } from '../testing/factories';
import { resetAll } from '../testing/resetAll';

const NOW = new Date('2026-10-18T12:00:00Z');
const KEY = 'key-fgs-0001';
const goOffline = () => useConnectivity.getState().setSimulatedOffline(true);
const goOnline = () => useConnectivity.getState().setSimulatedOffline(false);
const actions = async () => (await serverDb.audit.toArray()).map((a) => a.action);

beforeAll(() => mockServer.listen({ onUnhandledFrame: 'error' }));
afterAll(() => mockServer.close());
beforeEach(async () => {
  setMockClock(() => NOW);
  await resetAll();
});
afterEach(() => {
  mockServer.resetHandlers();
  setMockClock(null);
});

describe('consent given', () => {
  it('is audited on the server when the FGS assessment arrives, with the pseudonymous case id', async () => {
    await saveAssessment(makeFgsAssessment(KEY));
    await syncOutbox();
    const rows = await serverDb.audit.toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      action: CONSENT_AUDIT_ACTIONS.given,
      target: 'PC-3F9A-07C2',
      actor: 'CHW-0142',
    });
    // the audit trail records no person fields
    expect(JSON.stringify(rows)).not.toMatch(/symptom|latitude|phone/i);
  });

  it('does not store or queue a record whose consent was declined', async () => {
    const declined = makeFgsAssessment(KEY, {
      consent: {
        state: 'DECLINED',
        version: 'demo-consent-0.1',
        recordedAt: '2026-10-17T09:58:00.000Z',
        scope: 'ASSESSMENT_AND_REFERRAL',
      },
    });
    const response = await fetch(apiUrl('/api/v1/assessments'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [DEMO_ROLE_HEADER]: 'chw',
        [IDEMPOTENCY_HEADER]: KEY,
      },
      body: JSON.stringify(declined),
    });
    expect(response.status).toBe(422);
    expect(await serverDb.assessments.count()).toBe(0);
  });
});

describe('withdrawal', () => {
  it('stops further use, keeps the record, and removes it from programme views once synced', async () => {
    await saveAssessment(makeFgsAssessment(KEY));
    await saveReferral(makeReferral(KEY, { id: referralIdFor(KEY, 2026) }));
    await syncOutbox();
    expect((await loadRecords()).assessments.some((a) => a.clientKey === KEY)).toBe(true);

    const first = await withdrawConsent(KEY, NOW);
    expect(first).toEqual({ changed: true, queuedEvent: true });
    expect((await localDb.assessments.get(KEY))?.consent?.state).toBe('WITHDRAWN');
    await syncOutbox();

    expect((await serverDb.assessments.get(KEY))?.consent?.state).toBe('WITHDRAWN');
    expect(await serverDb.assessments.count()).toBe(1); // withdrawn is not deleted
    const records = await loadRecords();
    expect(records.assessments.some((a) => a.clientKey === KEY)).toBe(false);
    expect(records.referrals.some((r) => r.assessmentKey === KEY)).toBe(false);
    expect(await actions()).toEqual([CONSENT_AUDIT_ACTIONS.given, CONSENT_AUDIT_ACTIONS.withdrawn]);
  });

  it('is idempotent: a duplicate action neither queues nor audits twice', async () => {
    await saveAssessment(makeFgsAssessment(KEY));
    await syncOutbox();
    await withdrawConsent(KEY, NOW);
    expect(await withdrawConsent(KEY, NOW)).toEqual({ changed: false, queuedEvent: false });
    await syncOutbox();
    await syncOutbox();
    expect((await actions()).filter((a) => a === CONSENT_AUDIT_ACTIONS.withdrawn)).toHaveLength(1);
    expect((await localDb.outbox.toArray()).filter((i) => i.kind === 'consentEvent')).toHaveLength(
      1,
    );
  });

  it('blocks a new referral or follow-up after withdrawal, on the device and on the server', async () => {
    await saveAssessment(makeFgsAssessment(KEY));
    await syncOutbox();
    await withdrawConsent(KEY, NOW);
    await expect(saveReferral(makeReferral(KEY))).rejects.toBeInstanceOf(ConsentWithdrawnError);
    await expect(saveFollowUp(makeFollowUp('key-follow-0009', KEY))).rejects.toBeInstanceOf(
      ConsentWithdrawnError,
    );
    await syncOutbox();
    const response = await fetch(apiUrl('/api/v1/referrals'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [DEMO_ROLE_HEADER]: 'chw',
        [IDEMPOTENCY_HEADER]: KEY,
      },
      body: JSON.stringify(makeReferral(KEY, { id: referralIdFor(KEY, 2026) })),
    });
    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe('CONSENT_WITHDRAWN');
  });

  it('drops queued referral work that has not left the device', async () => {
    goOffline();
    await saveAssessment(makeFgsAssessment(KEY));
    await saveReferral(makeReferral(KEY, { id: referralIdFor(KEY, 2026) }));
    await withdrawConsent(KEY, NOW);
    const kinds = (await localDb.outbox.toArray()).map((i) => i.kind).sort();
    expect(kinds).toEqual(['assessment', 'consentEvent']);
  });

  it('works offline and delivers in order when the connection returns', async () => {
    goOffline();
    await saveAssessment(makeFgsAssessment(KEY));
    await withdrawConsent(KEY, NOW);
    expect(await serverDb.audit.count()).toBe(0);
    goOnline();
    await syncOutbox();
    expect(await actions()).toEqual([CONSENT_AUDIT_ACTIONS.given, CONSENT_AUDIT_ACTIONS.withdrawn]);
  });
});

describe('deletion request', () => {
  it('removes a record that never left the device without contacting the server', async () => {
    goOffline();
    await saveAssessment(makeFgsAssessment(KEY));
    await saveReferral(makeReferral(KEY, { id: referralIdFor(KEY, 2026) }));
    expect(await requestDeletion(KEY, NOW)).toEqual({ changed: true, queuedEvent: false });
    expect(await localDb.assessments.count()).toBe(0);
    expect(await localDb.referrals.count()).toBe(0);
    expect(await localDb.outbox.count()).toBe(0);
    goOnline();
    await syncOutbox();
    expect(await serverDb.assessments.count()).toBe(0);
  });

  it('removes the synced record, referral and follow-up from the mock server, and audits it', async () => {
    await saveAssessment(makeFgsAssessment(KEY));
    await saveReferral(makeReferral(KEY, { id: referralIdFor(KEY, 2026) }));
    await saveFollowUp(makeFollowUp('key-follow-0009', KEY));
    await syncOutbox();
    expect(await serverDb.referrals.count()).toBe(1);

    expect((await requestDeletion(KEY, NOW)).queuedEvent).toBe(true);
    // nothing person-level remains in the device outbox
    const left = await localDb.outbox.toArray();
    expect(left.map((i) => i.kind)).toEqual(['consentEvent']);
    await syncOutbox();

    expect(await serverDb.assessments.count()).toBe(0);
    expect(await serverDb.referrals.count()).toBe(0);
    expect(await serverDb.followUps.count()).toBe(0);
    expect(await actions()).toEqual([
      CONSENT_AUDIT_ACTIONS.given,
      CONSENT_AUDIT_ACTIONS.deletionRequested,
      CONSENT_AUDIT_ACTIONS.deletionCompleted,
    ]);
  });

  it('cannot be undone by a late queued copy of the assessment', async () => {
    await saveAssessment(makeFgsAssessment(KEY));
    await syncOutbox();
    await requestDeletion(KEY, NOW);
    await syncOutbox();
    const response = await fetch(apiUrl('/api/v1/assessments'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [DEMO_ROLE_HEADER]: 'chw',
        [IDEMPOTENCY_HEADER]: KEY,
      },
      body: JSON.stringify(makeFgsAssessment(KEY)),
    });
    expect(response.status).toBe(410);
    expect(await serverDb.assessments.count()).toBe(0);
  });

  it('does nothing for an unknown record (duplicate action)', async () => {
    expect(await requestDeletion('key-never-existed', NOW)).toEqual({
      changed: false,
      queuedEvent: false,
    });
  });
});

describe('consent events and roles', () => {
  it('may be sent by the CHW role only (simulated)', async () => {
    const response = await fetch(apiUrl('/api/v1/consent-events'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [DEMO_ROLE_HEADER]: 'state',
        [IDEMPOTENCY_HEADER]: 'cev-wd-12345678',
      },
      body: '{}',
    });
    expect(response.status).toBe(403);
  });
});
