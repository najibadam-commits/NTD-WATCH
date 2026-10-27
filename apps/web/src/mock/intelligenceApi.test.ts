import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { INTELLIGENCE_THRESHOLD } from '@ntd-watch/programme';
import { mockServer } from './node';
import { setMockClock } from './programmeStore';
import {
  ApiError,
  fetchCommunity,
  fetchInbox,
  fetchReferralMonitor,
  fetchSummary,
} from '../programme/api';
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

const statusOf = async (p: Promise<unknown>) => {
  try {
    await p;
    return 200;
  } catch (e) {
    return e instanceof ApiError ? e.status : -1;
  }
};

const PERSON_LEVEL = [
  /PC-[0-9A-F]{4}-[0-9A-F]{4}/, // case codes
  /seed-fgs/, // synthetic participant (client) keys
  /CHW-\d{4}/, // worker ids
  /"(caseId|clientKey|chwId|consent|responses|fgs_sig_|household|latitude|longitude|lat|lng)"/i,
];

describe('programme intelligence through the mock API (seeded synthetic data)', () => {
  it('is served to programme analytics roles, marked synthetic, with the prototype note', async () => {
    for (const role of ['lga', 'state', 'admin'] as const) {
      const s = await fetchSummary(role, range);
      expect(s.intelligence.demo).toBe(true);
      expect(s.intelligence.threshold).toBe(INTELLIGENCE_THRESHOLD);
      expect(s.intelligence.note).toMatch(/synthetic/i);
      expect(s.intelligence.rows.length).toBeGreaterThan(0);
      for (const r of s.intelligence.rows) expect(r.synthetic).toBe(true);
    }
  });
  it('carries no participant id, case code, person-level answer or coordinate in any programme response', async () => {
    const s = await fetchSummary('admin', range);
    const community = await fetchCommunity('admin', 'com-01', range);
    const monitor = await fetchReferralMonitor('admin', range);
    // The suppressed P1 aggregate legitimately names signal types above the threshold; the
    // intelligence layer must name no answer at all.
    expect(JSON.stringify(s.intelligence)).not.toMatch(/fgs_(sig|exp|ctx|dist)_/);
    for (const body of [s, community, monitor]) {
      const json = JSON.stringify(body);
      for (const pattern of PERSON_LEVEL) expect(json, String(pattern)).not.toMatch(pattern);
    }
  });
  it('refuses the CHW and facility roles on the intelligence summary', async () => {
    for (const role of ['chw', 'facility'] as const) {
      expect(await statusOf(fetchSummary(role, range)), role).toBe(403);
    }
  });
  it('does not give programme analytics roles the facility person-level inbox', async () => {
    for (const role of ['lga', 'state', 'admin'] as const) {
      expect(await statusOf(fetchInbox(role)), role).toBeGreaterThanOrEqual(400);
    }
  });
  it('narrows to the caller scope: an LGA officer sees only their own communities', async () => {
    const s = await fetchSummary('lga', range);
    expect(new Set(s.intelligence.rows.map((r) => r.lgaId)).size).toBe(1);
    const all = await fetchSummary('admin', range);
    expect(all.intelligence.rows.length).toBeGreaterThan(s.intelligence.rows.length);
  });
  it('filters cannot bypass suppression: a one-day window shows no community signal anywhere', async () => {
    const day = { from: '2026-10-18', to: '2026-10-18' };
    const s = await fetchSummary('admin', day);
    for (const r of s.intelligence.rows) {
      expect(r.observations).toBe('UNDER_THRESHOLD');
      expect(r.signalActivity).toBe('NOT_SHOWN');
      expect(r.priority).toBe('INSUFFICIENT_DATA');
    }
  });
  it('filtering to one community returns the same row as the all-community view', async () => {
    const all = await fetchSummary('admin', range);
    const one = await fetchSummary('admin', { ...range, communityId: 'com-01' });
    const a = all.intelligence.rows.find((r) => r.communityId === 'com-01');
    expect(one.intelligence.rows.find((r) => r.communityId === 'com-01')).toEqual(a);
  });
  it('publishes no exact observation count and no number in any explanation', async () => {
    const s = await fetchSummary('admin', range);
    for (const r of s.intelligence.rows) {
      expect(typeof r.observations).toBe('string');
      expect(r.why.join(' ')).not.toMatch(/\d/);
    }
  });
});
