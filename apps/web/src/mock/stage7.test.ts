import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DEMO_ROLE_HEADER } from '@ntd-watch/api-contract';
import { mockServer } from './node';
import { setMockClock } from './programmeStore';
import { apiUrl } from '../offline/apiClient';
import { localDb } from '../offline/localDb';
import { saveAssessment, saveReferral } from '../offline/repository';
import { syncOutbox } from '../offline/sync';
import { ApiError, fetchInbox, fetchSummary, patchReferralStage } from '../programme/api';
import { resetDemoEnvironment } from '../demo/resetDemo';
import { useMockControls } from './controls';
import { makeAssessment, makeReferral } from '../testing/factories';
import { resetAll } from '../testing/resetAll';

const NOW = new Date('2026-10-18T12:00:00Z');
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

const status = async (p: Promise<unknown>) => {
  try {
    await p;
    return 200;
  } catch (e) {
    return e instanceof ApiError ? e.status : -1;
  }
};

describe('facility inbox (simulated role and scope)', () => {
  it('is for the facility role only', async () => {
    expect(await status(fetchInbox('chw'))).toBe(403);
    expect(await status(fetchInbox('lga'))).toBe(403);
    expect(await status(fetchInbox('state'))).toBe(403);
    expect(await status(fetchInbox('admin'))).toBe(403);
    expect(await status(fetchInbox('facility'))).toBe(200);
  });
  it('lists only referrals sent to the facility, with a synthetic notice', async () => {
    const inbox = await fetchInbox('facility');
    expect(inbox.facilityId).toBe('fac-n1');
    expect(inbox.demo).toBe(true);
    expect(inbox.notice).toMatch(/SYNTHETIC/);
    expect(inbox.items.length).toBeGreaterThan(0);
    expect(inbox.items.every((i) => i.referral.facilityId === 'fac-n1')).toBe(true);
  });
  it('carries no name, phone or address, only the assessment summary', async () => {
    const inbox = await fetchInbox('facility');
    const text = JSON.stringify(inbox.items);
    expect(text).not.toMatch(/"(name|phone|address|email)"/i);
  });
  it('shows a live CHW referral once it has synced', async () => {
    await saveAssessment(makeAssessment('key-assess-live1', { id: 'A-0042' }));
    await saveReferral(makeReferral('key-assess-live1', { assessmentId: 'A-0042' }));
    await syncOutbox();
    const inbox = await fetchInbox('facility');
    const live = inbox.items.filter((i) => i.source === 'live');
    expect(live).toHaveLength(1);
    expect(live[0]!.assessment?.communityName).toBe('Demo Riverside');
    expect(live[0]!.assessment?.riskLevel).toBe('HIGH');
  });
});

describe('referral outcome and the closed loop', () => {
  it('walks a seeded referral forward and records an outcome at ASSESSED only', async () => {
    const inbox = await fetchInbox('facility');
    const item = inbox.items.find((i) => i.referral.stage === 'GENERATED')!;
    const id = item.referral.id;
    await patchReferralStage('facility', id, 'ACCEPTED');
    await patchReferralStage('facility', id, 'PATIENT_ARRIVED');
    // an outcome on any other stage is refused
    const early = await fetch(apiUrl(`/api/v1/referrals/${encodeURIComponent(id)}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', [DEMO_ROLE_HEADER]: 'facility' },
      body: JSON.stringify({ stage: 'ASSESSED', outcome: 'NOT_A_REAL_OUTCOME' }),
    });
    expect(early.status).toBe(422);
    const done = await patchReferralStage('facility', id, 'ASSESSED', 'FOLLOW_UP_NEEDED');
    expect(done.referral.outcome).toBe('FOLLOW_UP_NEEDED');
    const after = await fetchInbox('facility');
    expect(after.items.find((i) => i.referral.id === id)!.referral.stage).toBe('ASSESSED');
  });
  it('refuses to skip a stage or send an outcome with a non-assessed stage', async () => {
    const inbox = await fetchInbox('facility');
    const id = inbox.items.find((i) => i.referral.stage === 'GENERATED')!.referral.id;
    expect(await status(patchReferralStage('facility', id, 'ASSESSED'))).toBe(409);
    expect(await status(patchReferralStage('facility', id, 'ACCEPTED', 'CARE_PROVIDED'))).toBe(422);
  });
  it('is not double counted: a seeded referral updated once still counts once', async () => {
    const before = await fetchSummary('admin', range);
    const inbox = await fetchInbox('facility');
    const id = inbox.items.find((i) => i.referral.stage === 'GENERATED')!.referral.id;
    await patchReferralStage('facility', id, 'ACCEPTED');
    const after = await fetchSummary('admin', range);
    expect(after.kpis.referrals).toBe(before.kpis.referrals);
    expect(after.kpis.assessments).toEqual(before.kpis.assessments);
    expect(after.byRisk).toEqual(before.byRisk);
  });
  it('raises follow-ups due when a referral is assessed without a follow-up', async () => {
    const before = await fetchSummary('admin', range);
    const inbox = await fetchInbox('facility');
    const id = inbox.items.find((i) => i.referral.stage === 'GENERATED')!.referral.id;
    await patchReferralStage('facility', id, 'ACCEPTED');
    await patchReferralStage('facility', id, 'PATIENT_ARRIVED');
    await patchReferralStage('facility', id, 'ASSESSED', 'CARE_PROVIDED');
    const after = await fetchSummary('admin', range);
    expect(after.kpis.followUpsDue).toBe(before.kpis.followUpsDue! + 1);
  });
});

describe('reset demo', () => {
  it('returns the server, the device queue and the simulation switches to the start', async () => {
    const startKpis = (await fetchSummary('admin', range)).kpis;
    await saveAssessment(makeAssessment('key-assess-rst1', { id: 'A-0043' }));
    await saveReferral(makeReferral('key-assess-rst1', { assessmentId: 'A-0043' }));
    await syncOutbox();
    await saveAssessment(makeAssessment('key-assess-pnd1', { id: 'A-0044' })); // left in the queue
    useMockControls.getState().setServerDown(true);
    expect((await localDb.outbox.count()) > 0).toBe(true);

    await resetDemoEnvironment();

    expect(await localDb.outbox.count()).toBe(0);
    expect(await localDb.assessments.count()).toBe(0);
    expect(await localDb.referrals.count()).toBe(0);
    expect(useMockControls.getState().serverDown).toBe(false);
    const again = (await fetchSummary('admin', range)).kpis;
    expect(again.assessments).toBe(startKpis.assessments);
    expect(again.referrals).toBe(startKpis.referrals);
    expect(again.followUpsDue).toBe(startKpis.followUpsDue);
  });
});
