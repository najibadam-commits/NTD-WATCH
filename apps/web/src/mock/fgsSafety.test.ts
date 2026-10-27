import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DEMO_ROLE_HEADER } from '@ntd-watch/api-contract';
import { CASE_ID_PATTERN, caseIdFor, referralIdFor } from '@ntd-watch/domain';
import { mockServer } from './node';
import { setMockClock } from './programmeStore';
import { serverDb } from './serverDb';
import { apiUrl } from '../offline/apiClient';
import { useConnectivity } from '../offline/connectivity';
import { localDb } from '../offline/localDb';
import { saveAssessment, saveReferral } from '../offline/repository';
import { syncOutbox } from '../offline/sync';
import { fetchCommunity, fetchReferralMonitor, fetchSummary } from '../programme/api';
import { makeFgsAssessment, makeReferral } from '../testing/factories';
import { resetAll } from '../testing/resetAll';

const NOW = new Date('2026-10-18T12:00:00Z');
const KEY = 'key-fgs-0001';
const range = { from: '2026-07-27', to: '2026-10-18' };

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

const patch = (id: string, stage: string, role = 'facility') =>
  fetch(apiUrl(`/api/v1/referrals/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', [DEMO_ROLE_HEADER]: role },
    body: JSON.stringify({ stage }),
  });

describe('FGS referral workflow (Generated to Outcome)', () => {
  it('moves one stage at a time, refuses skips and reversals, and repeats do not double-count', async () => {
    await saveAssessment(makeFgsAssessment(KEY));
    const referral = makeReferral(KEY);
    await saveReferral(referral);
    await syncOutbox();
    const id = referral.id;

    expect((await patch(id, 'PATCH_BAD')).status).toBeGreaterThanOrEqual(400);
    expect((await patch(id, 'ASSESSED')).status).toBe(409); // skips two stages
    for (const stage of ['ACCEPTED', 'PATIENT_ARRIVED', 'ASSESSED', 'FOLLOW_UP', 'CLOSED']) {
      expect((await patch(id, stage)).status).toBe(200);
    }
    expect((await patch(id, 'CLOSED')).status).toBe(409); // duplicate action
    expect((await patch(id, 'GENERATED')).status).toBe(409); // backwards
    const stored = await serverDb.referrals.get(id);
    expect(stored?.stage).toBe('CLOSED');
    expect(stored?.stageTimestamps).toHaveLength(6);
  });

  it('refuses stage changes from the CHW and programme roles (simulated roles)', async () => {
    await saveAssessment(makeFgsAssessment(KEY));
    const referral = makeReferral(KEY);
    await saveReferral(referral);
    await syncOutbox();
    expect((await patch(referral.id, 'ACCEPTED', 'chw')).status).toBe(403);
    expect((await patch(referral.id, 'ACCEPTED', 'lga')).status).toBe(403);
  });

  it('keeps the referral queued offline and delivers it, once, after the assessment', async () => {
    useConnectivity.getState().setSimulatedOffline(true);
    await saveAssessment(makeFgsAssessment(KEY));
    const referral = makeReferral(KEY);
    await saveReferral(referral);
    await saveReferral(referral); // duplicate action
    expect(await localDb.outbox.count()).toBe(2);
    expect(await serverDb.assessments.count()).toBe(0);
    useConnectivity.getState().setSimulatedOffline(false);
    await syncOutbox();
    expect(await serverDb.assessments.count()).toBe(1);
    expect(await serverDb.referrals.count()).toBe(1);
    expect((await localDb.outbox.toArray()).every((i) => i.status === 'synced')).toBe(true);
  });
});

describe('FGS privacy at the programme level', () => {
  it('programme responses carry no case id, no household coordinates and no person-level fields', async () => {
    await saveAssessment(makeFgsAssessment(KEY));
    await saveReferral(makeReferral(KEY));
    await syncOutbox();
    const caseId = makeFgsAssessment(KEY).caseId!;
    expect(caseId).toMatch(CASE_ID_PATTERN);

    const bodies = JSON.stringify([
      await fetchSummary('state', range),
      await fetchReferralMonitor('state', range),
      await fetchCommunity('state', 'com-01', range),
    ]);
    expect(bodies).not.toContain(caseId);
    expect(bodies).not.toContain(KEY);
    expect(bodies).not.toMatch(/"(latitude|longitude|lat|lng|household|householdCoordinates)"/i);
    expect(bodies).not.toMatch(/"(consent|caseId|distress|safeContact)"/);
  });

  it('a case id is derived from the random key and carries no identifying content', () => {
    const id = caseIdFor('3f9a07c2-1111-4222-8333-444455556666');
    expect(id).toMatch(CASE_ID_PATTERN);
    expect(id).not.toMatch(/[a-z]{3,}/);
    expect(referralIdFor(KEY, 2026)).not.toContain(id);
  });
});
