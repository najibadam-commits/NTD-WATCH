import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { legacyReferralIdFor } from '@ntd-watch/domain';
import type { Role } from '@ntd-watch/domain';
import { DEMO_ROLE_HEADER } from '@ntd-watch/api-contract';
import { mockServer } from './node';
import { setMockClock } from './programmeStore';
import { apiUrl } from '../offline/apiClient';
import { saveAssessment, saveFollowUp, saveReferral } from '../offline/repository';
import { syncOutbox } from '../offline/sync';
import {
  ApiError,
  fetchCommunity,
  fetchConfig,
  fetchReferralMonitor,
  fetchSummary,
  fetchUsers,
  patchConfig,
  patchUser,
  postReset,
} from '../programme/api';
import { makeAssessment, makeFollowUp, makeReferral } from '../testing/factories';
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

async function syncChwRecords() {
  await saveAssessment(makeAssessment());
  await saveReferral(makeReferral());
  await saveFollowUp({ ...makeFollowUp(), performedAt: '2026-10-17T15:00:00.000Z' });
  return syncOutbox();
}

describe('programme API permissions (simulated roles, not security controls)', () => {
  it('refuses the CHW role on every programme route', async () => {
    expect(await status(fetchSummary('chw', range))).toBe(403);
    expect(await status(fetchReferralMonitor('chw', range))).toBe(403);
    expect(await status(fetchCommunity('chw', 'com-01', range))).toBe(403);
    expect(await status(fetchUsers('chw'))).toBe(403);
  });
  it('allows LGA, State and Admin roles to read the summary', async () => {
    for (const role of ['lga', 'state', 'admin'] as Role[]) {
      expect(await status(fetchSummary(role, range))).toBe(200);
    }
  });
  it('keeps the facility role off the summary but lets it monitor its referrals', async () => {
    expect(await status(fetchSummary('facility', range))).toBe(403);
    expect(await status(fetchReferralMonitor('facility', range))).toBe(200);
  });
  it('keeps user management and settings for the administrator', async () => {
    for (const role of ['lga', 'state', 'facility'] as Role[]) {
      expect(await status(fetchUsers(role))).toBe(403);
      expect(await status(patchConfig(role, 5))).toBe(403);
      expect(await status(postReset(role))).toBe(403);
    }
    expect(await status(fetchUsers('admin'))).toBe(200);
  });
  it('refuses a community outside the caller scope and an unknown community', async () => {
    expect(await status(fetchCommunity('lga', 'com-01', range))).toBe(403); // lga-c caller
    expect(await status(fetchCommunity('lga', 'nope', range))).toBe(404);
  });
  it('rejects a scope the role may not use', async () => {
    const res = await fetch(
      apiUrl(`/api/v1/intelligence/summary?from=${range.from}&to=${range.to}`),
      {
        headers: { [DEMO_ROLE_HEADER]: 'lga', 'X-Demo-Scope': 'all' },
      },
    );
    expect(res.status).toBe(403);
    expect(((await res.json()) as { code: string }).code).toBe('SCOPE_NOT_ALLOWED');
  });
  it('rejects malformed filters', async () => {
    const res = await fetch(apiUrl('/api/v1/intelligence/summary?from=bad&to=2026-10-18'), {
      headers: { [DEMO_ROLE_HEADER]: 'admin', 'X-Demo-Scope': 'all' },
    });
    expect(res.status).toBe(400);
  });
  it('returns aggregates only, never person-level fields', async () => {
    const d = await fetchCommunity('admin', 'com-01', range);
    expect(JSON.stringify(d)).not.toMatch(/clientKey|NTDW-|"sex"|"ageGroup"/);
    const s = await fetchSummary('admin', range);
    expect(JSON.stringify(s)).not.toMatch(/clientKey|NTDW-/);
  });
});

describe('CHW records flow into the programme views', () => {
  it('a new synced assessment updates the community and overall aggregates', async () => {
    const before = await fetchSummary('admin', range);
    const comBefore = before.communities.find((c) => c.communityId === 'com-01')!;
    await saveAssessment(makeAssessment());
    await syncOutbox();
    const after = await fetchSummary('admin', range);
    const comAfter = after.communities.find((c) => c.communityId === 'com-01')!;
    // The community figures are large enough to be published, so they change by exactly one.
    expect(comAfter.assessments).toBe(comBefore.assessments! + 1);
    expect(comAfter.signals).toBe(comBefore.signals! + 1); // the factory assessment is HIGH
    // The overall HIGH count moves by one too. (The overall assessment total is correctly not
    // shown here, because a hidden community figure sits beneath it.)
    expect(after.byRisk.HIGH).toBe(before.byRisk.HIGH! + 1);
    // One verified demo-created record: published as 1 (Phase 4A), not hidden and not zero.
    expect(before.dataSources.live).toBe(0);
    expect(after.dataSources.live).toBe(1);
  });
  it('does not change anything until the record has synced', async () => {
    const before = await fetchSummary('admin', range);
    await saveAssessment(makeAssessment());
    const after = await fetchSummary('admin', range);
    expect(after.byRisk).toEqual(before.byRisk);
    expect(after.kpis).toEqual(before.kpis);
  });
  it('a new referral and follow-up appear in the programme views', async () => {
    const before = await fetchSummary('admin', range);
    const monBefore = await fetchReferralMonitor('admin', range);
    await syncChwRecords();
    const after = await fetchSummary('admin', range);
    const monAfter = await fetchReferralMonitor('admin', range);
    expect(after.kpis.referrals).toBe(before.kpis.referrals! + 1);
    expect(after.kpis.followUps).toBe(before.kpis.followUps! + 1);
    expect(monAfter.current.GENERATED).toBe(monBefore.current.GENERATED! + 1);
  });
  it('a referral status change moves it between stages', async () => {
    await syncChwRecords();
    const before = await fetchReferralMonitor('admin', range);
    const res = await fetch(apiUrl(`/api/v1/referrals/${makeReferral().id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', [DEMO_ROLE_HEADER]: 'facility' },
      body: JSON.stringify({ stage: 'ACCEPTED' }),
    });
    expect(res.status).toBe(200);
    const after = await fetchReferralMonitor('admin', range);
    expect(after.current.GENERATED).toBe(before.current.GENERATED! - 1);
    expect(after.current.ACCEPTED).toBe(before.current.ACCEPTED! + 1);
    // A cumulative count is withheld whenever a current-stage count at or below it is, so it
    // cannot be used to work that count out. Compare it only when it is published.
    if (before.reached.ACCEPTED !== null && after.reached.ACCEPTED !== null) {
      expect(after.reached.ACCEPTED).toBe(before.reached.ACCEPTED + 1);
    }
  });
  it('an LGA outside the community does not see its records', async () => {
    const before = await fetchSummary('lga', range); // lga-c, which includes com-01
    await saveAssessment(makeAssessment('k2', { communityId: 'com-13', id: 'A-2' }));
    await syncOutbox();
    const after = await fetchSummary('lga', range);
    expect(after.kpis).toEqual(before.kpis);
    expect(after.byRisk).toEqual(before.byRisk);
  });
  it('filters change the summary and the referral monitor consistently', async () => {
    await syncChwRecords();
    const all = await fetchSummary('admin', range);
    const one = await fetchSummary('admin', { ...range, communityId: 'com-01' });
    const monOne = await fetchReferralMonitor('admin', { ...range, communityId: 'com-01' });
    const allTotal = Object.values(all.byRisk).reduce<number>((n, v) => n + (v ?? 0), 0);
    expect(one.communities[0]!.assessments!).toBeLessThan(allTotal);
    expect(one.communities).toHaveLength(1);
    // The summary and the monitor must never contradict each other: where both publish the
    // referral total it is the same figure.
    if (monOne.total !== null && one.kpis.referrals !== null) {
      expect(monOne.total).toBe(one.kpis.referrals);
    }
  });
});

describe('regression: referral ids and duplicates', () => {
  it('accepts a legacy-format id for a referral that matches its assessment', async () => {
    await saveAssessment(makeAssessment());
    await syncOutbox();
    const legacy = makeReferral('key-assess-0001', {
      id: legacyReferralIdFor('key-assess-0001', 2026),
    });
    const res = await fetch(apiUrl('/api/v1/referrals'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [DEMO_ROLE_HEADER]: 'chw' },
      body: JSON.stringify(legacy),
    });
    expect(res.status).toBe(201);
  });
  it('refuses a second referral for the same assessment', async () => {
    await syncChwRecords();
    const other = makeReferral('key-assess-0001', {
      id: legacyReferralIdFor('key-assess-0001', 2026),
    });
    const res = await fetch(apiUrl('/api/v1/referrals'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [DEMO_ROLE_HEADER]: 'chw' },
      body: JSON.stringify(other),
    });
    expect(res.status).toBe(409);
    expect(((await res.json()) as { code: string }).code).toBe('REFERRAL_EXISTS');
  });
});

describe('users, settings and reset', () => {
  it('changes a user role and records it in the audit log', async () => {
    const { users } = await fetchUsers('admin');
    const target = users.find((u) => u.role === 'lga')!;
    await patchUser('admin', target.id, { active: false });
    const after = await fetchUsers('admin');
    expect(after.users.find((u) => u.id === target.id)?.active).toBe(false);
    expect(after.audit.length).toBeGreaterThan(0);
  });
  it('protects the administrator account', async () => {
    const { users } = await fetchUsers('admin');
    const admin = users.find((u) => u.role === 'admin')!;
    expect(await status(patchUser('admin', admin.id, { active: false }))).toBe(409);
  });
  it('validates the unresolved-days setting and applies it', async () => {
    expect(await status(patchConfig('admin', 0))).toBe(422);
    expect(await status(patchConfig('admin', 31))).toBe(422);
    await patchConfig('admin', 3);
    expect((await fetchConfig('admin')).maxUnresolvedDays).toBe(3);
    expect((await fetchReferralMonitor('admin', range)).maxUnresolvedDays).toBe(3);
  });
  it('reset removes live data and restores the settings', async () => {
    await syncChwRecords();
    await patchConfig('admin', 3);
    await postReset('admin');
    const s = await fetchSummary('admin', range);
    expect(s.dataSources.live).toBe(0);
    expect((await fetchConfig('admin')).maxUnresolvedDays).toBe(7);
  });
});
