import { describe, expect, it } from 'vitest';
import { ALL_SCOPE, type DataScope } from '@ntd-watch/domain';
import { DEMO_COMMUNITIES } from '@ntd-watch/demo-data';
import {
  INTELLIGENCE_THRESHOLD,
  PROGRAMME_PRIORITIES,
  checkConsistency,
  communityDetail,
  generateFgsSeed,
  generateSeed,
  summarise,
  type CommunityIntelligence,
  type ProgrammeFilters,
  type ProgrammeRecords,
} from './index';

const ANCHOR = new Date('2026-10-18T12:00:00Z');
const ctx = { now: ANCHOR, maxUnresolvedDays: 7 };
const base = generateSeed({ anchor: ANCHOR });
const fgs = generateFgsSeed({ anchor: ANCHOR });
const records: ProgrammeRecords = { ...base, assessments: [...base.assessments, ...fgs] };
const range: ProgrammeFilters = { from: '2026-07-27', to: '2026-10-18' };
const lga = (id: string): DataScope => ({ kind: 'lga', id });
const rowOf = (communityId: string, rs = records, f = range, scope: DataScope = ALL_SCOPE) =>
  summarise(rs, f, scope, ctx).intelligence.rows.find((r) => r.communityId === communityId);

describe('synthetic women-and-girls seed', () => {
  it('is deterministic and internally consistent', () => {
    expect(generateFgsSeed({ anchor: ANCHOR })).toEqual(fgs);
    expect(checkConsistency(records, ANCHOR)).toEqual([]);
  });
  it('is module FGS, consented, marked as seed data and uses demonstration rules only', () => {
    expect(fgs.length).toBeGreaterThan(0);
    for (const a of fgs) {
      expect(a.module).toBe('FGS');
      expect(a.clientKey.startsWith('seed-')).toBe(true);
      expect(a.consent?.state).toBe('GIVEN');
      expect(a.ruleSetStatus).toBe('DEMO');
    }
  });
});

describe('community aggregation', () => {
  const s = summarise(records, range, ALL_SCOPE, ctx);
  it('is labelled as a synthetic prototype and carries the threshold', () => {
    expect(s.intelligence.demo).toBe(true);
    expect(s.intelligence.threshold).toBe(INTELLIGENCE_THRESHOLD);
    expect(s.intelligence.note).toMatch(/not a validated epidemiological model/i);
    expect(s.intelligence.note).toMatch(/synthetic/i);
    for (const r of s.intelligence.rows) expect(r.synthetic).toBe(true);
  });
  it('has one row per community in scope', () => {
    expect(s.intelligence.rows).toHaveLength(s.communities.length);
    expect(s.intelligence.rows).toHaveLength(DEMO_COMMUNITIES.length);
  });
  it('shows different categories and confidence levels for different communities', () => {
    const priorities = new Set(s.intelligence.rows.map((r) => r.priority));
    const confidences = new Set(s.intelligence.rows.map((r) => r.confidence));
    expect(priorities.size).toBeGreaterThanOrEqual(3);
    expect(confidences.has('INSUFFICIENT')).toBe(true);
    expect(confidences.size).toBeGreaterThanOrEqual(3);
  });
  it('is ordered with the most programme attention first', () => {
    const rank = (r: CommunityIntelligence) => PROGRAMME_PRIORITIES.indexOf(r.priority);
    const ranks = s.intelligence.rows.map(rank);
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
  });
  it('takes signals, water contact and access from women-and-girls records only', () => {
    // The water and environment band comes from the general synthetic data that is already
    // published, so it is the one dimension allowed to differ without the general records.
    const only = summarise({ ...base, assessments: fgs }, range, ALL_SCOPE, ctx);
    const pick = (r: CommunityIntelligence) => [
      r.communityId,
      r.observations,
      r.signalActivity,
      r.dimensions.waterContact,
      r.dimensions.access,
    ];
    const byId = (rows: CommunityIntelligence[]) =>
      rows.map(pick).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    expect(byId(only.intelligence.rows)).toEqual(byId(s.intelligence.rows));
  });
  it('shows nothing for a community without women-and-girls observations', () => {
    const none = s.intelligence.rows.find((r) => !(r.communityId in observedIds()));
    expect(none?.priority).toBe('INSUFFICIENT_DATA');
    expect(none?.observations).toBe('UNDER_THRESHOLD');
  });
  it('holds back the top category for a community whose data confidence is low', () => {
    const lowConf = s.intelligence.rows.filter((r) => r.confidence === 'LOW');
    expect(lowConf.length).toBeGreaterThan(0);
    for (const r of lowConf) expect(r.priority).not.toBe('HIGH_PRIORITY_FOR_ATTENTION');
  });
});

function observedIds(): Record<string, true> {
  return Object.fromEntries(fgs.map((a) => [a.communityId, true as const]));
}

describe('privacy boundary for the intelligence layer', () => {
  const summary = summarise(records, range, ALL_SCOPE, ctx);
  const json = JSON.stringify(summary.intelligence);
  const detail = communityDetail(records, 'com-01', range, ALL_SCOPE, ctx)!;

  it('does not leak participant ids, case codes, client keys, assessment ids or CHW ids', () => {
    for (const a of fgs) {
      expect(json).not.toContain(a.clientKey);
      expect(json).not.toContain(a.id);
      expect(json).not.toContain(a.caseId);
      expect(json).not.toContain(a.chwId);
    }
    expect(json).not.toMatch(/PC-[0-9A-F]{4}-[0-9A-F]{4}/);
    expect(json).not.toMatch(/CHW-\d+/);
  });
  it('has no person-level or location fields, and no coordinates', () => {
    const allowed = new Set([
      'synthetic',
      'communityId',
      'name',
      'stateId',
      'lgaId',
      'wardId',
      'observations',
      'signalActivity',
      'dimensions',
      'vulnerability',
      'confidence',
      'priority',
      'cappedByConfidence',
      'why',
    ]);
    for (const r of summary.intelligence.rows) {
      for (const k of Object.keys(r)) expect(allowed.has(k), k).toBe(true);
    }
    expect(json).not.toMatch(
      /"(lat|lng|lon|latitude|longitude|coordinates|household|name_|phone|address|age|ageGroup|sex|responses|symptoms|consent|caseId|clientKey|chwId)"/i,
    );
  });
  it('publishes no exact counts: only ranges, bands and flags', () => {
    for (const r of summary.intelligence.rows) {
      expect(['UNDER_THRESHOLD', '5_9', '10_19', '20_49', '50_PLUS']).toContain(r.observations);
      expect(typeof r.observations).toBe('string');
    }
    // Numbers appear in no explanation text.
    for (const r of summary.intelligence.rows) expect(r.why.join(' ')).not.toMatch(/\d/);
  });
  it('keeps small cells suppressed: below the threshold nothing about signals is shown', () => {
    const small = summary.intelligence.rows.filter((r) => r.observations === 'UNDER_THRESHOLD');
    expect(small.length).toBeGreaterThan(0);
    for (const r of small) {
      expect(r.signalActivity).toBe('NOT_SHOWN');
      // Only the already-published general water and environment band can remain.
      expect(['NOT_SHOWN', r.dimensions.wash]).toContain(r.vulnerability);
      expect(r.dimensions.waterContact).toBe('NOT_SHOWN');
      expect(r.dimensions.access).toBe('NOT_SHOWN');
      expect(r.priority).toBe('INSUFFICIENT_DATA');
      expect(r.confidence).toBe('INSUFFICIENT');
    }
  });
  it('does not change the size of a hidden count with the filters: a narrow date range stays suppressed', () => {
    // com-09 has many observations over the whole period, but a one-week window may hold few.
    const narrow: ProgrammeFilters = { from: '2026-10-12', to: '2026-10-18' };
    const r = rowOf('com-09', records, narrow)!;
    if (r.observations === 'UNDER_THRESHOLD') {
      expect(r.signalActivity).toBe('NOT_SHOWN');
      expect(r.priority).toBe('INSUFFICIENT_DATA');
    }
    // A single-day window is always below the threshold for every community.
    const day: ProgrammeFilters = { from: '2026-10-18', to: '2026-10-18' };
    for (const row of summarise(records, day, ALL_SCOPE, ctx).intelligence.rows) {
      expect(row.observations).toBe('UNDER_THRESHOLD');
      expect(row.priority).toBe('INSUFFICIENT_DATA');
    }
  });
  it('does not let a community filter reveal what the all-community view hides', () => {
    for (const c of DEMO_COMMUNITIES) {
      const all = rowOf(c.id)!;
      const one = rowOf(c.id, records, { ...range, communityId: c.id })!;
      expect(one).toEqual(all);
    }
  });
  it('shows only communities inside the caller scope', () => {
    const scoped = summarise(records, range, lga('lga-c'), ctx).intelligence.rows;
    expect(scoped.length).toBeGreaterThan(0);
    for (const r of scoped) expect(r.lgaId).toBe('lga-c');
  });
  it('removes an added record from the aggregate only through the same suppression, never as a count', () => {
    // Adding one observation to a community below the threshold must not reveal a number.
    const comm = 'com-04';
    const extra = fgs.find((a) => a.communityId === comm)!;
    const more = {
      ...records,
      assessments: [
        ...records.assessments,
        { ...extra, id: 'X1', clientKey: 'seed-fgs-extra-1', caseId: 'PC-0000-0000' },
      ],
    };
    const r = rowOf(comm, more)!;
    expect(JSON.stringify(r)).not.toMatch(/"(observations)":\s*\d/);
  });
  it('leaves general summary, community detail and the FGS aggregate free of person-level data', () => {
    const general = JSON.stringify([
      summary.communities,
      summary.weekly,
      summary.symptomCounts,
      detail.stat,
    ]);
    for (const a of fgs) {
      expect(general).not.toContain(a.caseId);
      expect(general).not.toContain(a.clientKey);
    }
    expect(JSON.stringify(summary.fgs)).not.toMatch(/PC-[0-9A-F]{4}/);
  });
  it('keeps the documented limitation: it states it is not a validated disclosure control', () => {
    expect(summary.fgs.note).toMatch(/differenc|not a reviewed|prototype/i);
  });
});
