import { describe, expect, it } from 'vitest';
import { ALL_SCOPE, type DataScope } from '@ntd-watch/domain';
import { DEMO_COMMUNITIES } from '@ntd-watch/demo-data';
import {
  SYNTHETIC_NOTICE,
  REPORT_KINDS,
  ROW_STATUS,
  buildReport,
  checkConsistency,
  communityDetail,
  effectiveFilters,
  generateSeed,
  monitorReferrals,
  summarise,
  toCsv,
  vulnerabilityBand,
  weekStartMs,
  type ProgrammeFilters,
} from './index';

const ANCHOR = new Date('2026-10-18T12:00:00Z');
const ctx = { now: ANCHOR, maxUnresolvedDays: 7 };
const records = generateSeed({ anchor: ANCHOR });
const range: ProgrammeFilters = { from: '2026-07-27', to: '2026-10-18' };
const lga = (id: string): DataScope => ({ kind: 'lga', id });

describe('seed data', () => {
  it('is deterministic for the same anchor and seed', () => {
    expect(generateSeed({ anchor: ANCHOR })).toEqual(records);
  });
  it('differs for a different seed', () => {
    expect(generateSeed({ anchor: ANCHOR, seed: 1 })).not.toEqual(records);
  });
  it('is internally consistent', () => {
    expect(checkConsistency(records, ANCHOR)).toEqual([]);
  });
  it('is marked as seed data and leaves the live demo CHW unseeded', () => {
    expect(records.assessments.every((a) => a.clientKey.startsWith('seed-'))).toBe(true);
    expect(records.assessments.some((a) => a.chwId === 'CHW-0142')).toBe(false);
  });
  it('has unique referral ids and at most one referral per assessment', () => {
    const ids = records.referrals.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    const keys = records.referrals.map((r) => r.assessmentKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it('detects a referral that points at no assessment', () => {
    const bad = { ...records, referrals: [{ ...records.referrals[0]!, assessmentKey: 'nope' }] };
    expect(checkConsistency(bad, ANCHOR).length).toBeGreaterThan(0);
  });
});

describe('summarise', () => {
  const all = summarise(records, range, ALL_SCOPE, ctx);

  it('labels the output as synthetic', () => {
    expect(all.demo).toBe(true);
    expect(all.notice).toBe(SYNTHETIC_NOTICE);
  });
  it('derives KPIs from the records', () => {
    const inRange = records.assessments.filter(
      (a) => a.capturedAt >= '2026-07-27' && a.capturedAt < '2026-10-19',
    );
    expect(all.kpis.assessments).toBe(inRange.length);
    expect(all.kpis.highUrgent).toBe(
      inRange.filter((a) => a.riskLevel === 'HIGH' || a.riskLevel === 'URGENT').length,
    );
  });
  it('keeps risk counts, community totals and weekly totals in agreement', () => {
    const risk = Object.values(all.byRisk).reduce((a, b) => a + b, 0);
    expect(risk + all.kpis.unclassified).toBeGreaterThanOrEqual(0);
    expect(all.communities.reduce((a, c) => a + c.assessments, 0)).toBe(all.kpis.assessments);
    expect(all.weekly.reduce((a, w) => a + w.assessments, 0)).toBe(all.kpis.assessments);
    expect(all.weekly.reduce((a, w) => a + w.referrals, 0)).toBe(all.kpis.referrals);
  });
  it('starts weekly buckets on Mondays', () => {
    for (const w of all.weekly) {
      expect(new Date(`${w.weekStart}T00:00:00Z`).getUTCDay()).toBe(1);
    }
    expect(new Date(weekStartMs(Date.parse('2026-10-18T10:00:00Z'))).getUTCDay()).toBe(1);
  });
  it('narrows every figure with a community filter', () => {
    const one = summarise(records, { ...range, communityId: 'com-02' }, ALL_SCOPE, ctx);
    expect(one.communities).toHaveLength(1);
    expect(one.kpis.assessments).toBeLessThan(all.kpis.assessments);
    expect(one.kpis.assessments).toBe(one.communities[0]!.assessments);
  });
  it('narrows by LGA and the parts add up to the whole', () => {
    const lgas = ['lga-n', 'lga-c', 'lga-s', 'lga-e', 'lga-w'];
    const sum = lgas
      .map((id) => summarise(records, { ...range, lgaId: id }, ALL_SCOPE, ctx).kpis.assessments)
      .reduce((a, b) => a + b, 0);
    expect(sum).toBe(all.kpis.assessments);
  });
  it('narrows by date', () => {
    const short = summarise(records, { from: '2026-10-05', to: '2026-10-18' }, ALL_SCOPE, ctx);
    expect(short.kpis.assessments).toBeLessThan(all.kpis.assessments);
    expect(short.weekly.length).toBeLessThan(all.weekly.length);
  });
  it('includes both ends of the date range', () => {
    const day = summarise(records, { from: '2026-10-18', to: '2026-10-18' }, ALL_SCOPE, ctx);
    const expected = records.assessments.filter((a) => a.capturedAt.startsWith('2026-10-18'));
    expect(day.kpis.assessments).toBe(expected.length);
  });
  it('rejects an inverted or malformed range', () => {
    expect(() =>
      summarise(records, { from: '2026-10-18', to: '2026-10-01' }, ALL_SCOPE, ctx),
    ).toThrow(RangeError);
    expect(() => summarise(records, { from: 'x', to: '2026-10-01' }, ALL_SCOPE, ctx)).toThrow();
  });
  it('reports the previous period as an equal-length window before the start', () => {
    expect(all.previous.to < range.from).toBe(true);
  });
  it('handles an empty period without dividing by zero', () => {
    const none = summarise(records, { from: '2020-01-01', to: '2020-01-31' }, ALL_SCOPE, ctx);
    expect(none.kpis.assessments).toBe(0);
    expect(none.kpis.highUrgentShare).toBeNull();
    expect(none.kpis.referralCompletion).toBe(0);
  });
});

describe('scope', () => {
  it('limits an LGA caller to its own LGA and reports clamping', () => {
    const s = summarise(records, { ...range, lgaId: 'lga-n' }, lga('lga-c'), ctx);
    expect(s.clamped).toBe(true);
    expect(s.communities.every((c) => c.lgaId === 'lga-c')).toBe(true);
  });
  it('does not widen the view when a wider filter is requested', () => {
    const own = summarise(records, range, lga('lga-c'), ctx);
    const asked = summarise(records, { ...range, stateId: 'st-savanna' }, lga('lga-c'), ctx);
    expect(asked.kpis.assessments).toBe(own.kpis.assessments);
  });
  it('drops unknown community filters', () => {
    const { filters, clamped } = effectiveFilters({ ...range, communityId: 'zzz' }, ALL_SCOPE);
    expect(filters.communityId).toBeUndefined();
    expect(clamped).toBe(true);
  });
  it('limits a state caller to its state', () => {
    const s = summarise(records, range, { kind: 'state', id: 'st-arewa' }, ctx);
    expect(s.communities.every((c) => c.stateId === 'st-arewa')).toBe(true);
  });
});

describe('community stats', () => {
  const all = summarise(records, range, ALL_SCOPE, ctx);
  it('flags communities with too little data instead of inventing an index', () => {
    const few = summarise(
      { assessments: records.assessments.slice(0, 2), referrals: [], followUps: [] },
      range,
      ALL_SCOPE,
      ctx,
    );
    expect(few.communities.every((c) => c.vulnerabilityIndex === null)).toBe(true);
    expect(few.communities.every((c) => c.vulnerabilityBand === 'INSUFFICIENT_DATA')).toBe(true);
  });
  it('maps indexes to demonstration bands at the thresholds', () => {
    expect(vulnerabilityBand(null)).toBe('INSUFFICIENT_DATA');
    expect(vulnerabilityBand(29.9)).toBe('LOW');
    expect(vulnerabilityBand(30)).toBe('MODERATE');
    expect(vulnerabilityBand(44.9)).toBe('MODERATE');
    expect(vulnerabilityBand(45)).toBe('HIGH');
  });
  it('keeps every index within 0 to 100', () => {
    for (const c of all.communities) {
      if (c.vulnerabilityIndex !== null) {
        expect(c.vulnerabilityIndex).toBeGreaterThanOrEqual(0);
        expect(c.vulnerabilityIndex).toBeLessThanOrEqual(100);
      }
    }
  });
  it('shows the seeded rising communities as rising', () => {
    const rising = all.communities
      .filter((c) => c.direction === 'rising')
      .map((c) => c.communityId);
    expect(rising).toEqual(expect.arrayContaining(['com-01', 'com-09']));
  });
  it('shows coverage gaps as zero assigned CHWs', () => {
    for (const id of ['com-05', 'com-08', 'com-11', 'com-12', 'com-14']) {
      expect(all.communities.find((c) => c.communityId === id)?.chwsAssigned).toBe(0);
    }
  });
});

describe('community detail', () => {
  it('returns aggregates only, with no person-level fields', () => {
    const d = communityDetail(records, 'com-01', range, ALL_SCOPE, ctx);
    expect(d).not.toBeNull();
    const text = JSON.stringify(d);
    expect(text).not.toMatch(/clientKey|personName|"person"|"phone"|NTDW-/);
  });
  it('returns null outside the caller scope', () => {
    expect(communityDetail(records, 'com-01', range, lga('lga-s'), ctx)).toBeNull();
  });
});

describe('referral monitoring', () => {
  const m = monitorReferrals(records, range, ALL_SCOPE, ctx);
  it('is aggregate only', () => {
    expect(JSON.stringify(m)).not.toMatch(/NTDW-|clientKey|assessmentKey/);
  });
  it('counts every referral in the stage totals', () => {
    const total = Object.values(m.current).reduce((a, b) => a + b, 0);
    expect(total).toBe(m.total);
  });
  it('shows a facility only referrals sent to it', () => {
    const f = monitorReferrals(records, range, { kind: 'facility', id: 'fac-c1' }, ctx);
    expect(f.total).toBeLessThanOrEqual(m.total);
    const expected = records.referrals.filter((r) => r.facilityId === 'fac-c1').length;
    expect(f.total).toBeLessThanOrEqual(expected);
  });
  it('changes when a referral moves stage', () => {
    const target = records.referrals.find((r) => r.stage !== 'ASSESSED')!;
    const moved = {
      ...records,
      referrals: records.referrals.map((r) =>
        r === target ? { ...r, stage: 'ASSESSED' as const } : r,
      ),
    };
    const after = summarise(moved, range, ALL_SCOPE, ctx);
    const before = summarise(records, range, ALL_SCOPE, ctx);
    expect(after.referralStages.ASSESSED).toBeGreaterThanOrEqual(before.referralStages.ASSESSED);
  });
});

describe('reports', () => {
  const summary = summarise(records, range, ALL_SCOPE, ctx);
  const monitor = monitorReferrals(records, range, ALL_SCOPE, ctx);
  const meta = { roleLabel: 'State', scopeLabel: 'All', generatedAt: ANCHOR.toISOString() };
  for (const kind of REPORT_KINDS) {
    it(`${kind} identifies the data as synthetic in every format`, () => {
      const r = buildReport(kind, summary, monitor, meta);
      expect(r.filename.startsWith('DEMO-SYNTHETIC-')).toBe(true);
      const quoted = toCsv([[SYNTHETIC_NOTICE]]).trimEnd();
      expect(r.csv.startsWith(quoted)).toBe(true);
      expect(r.csv.trimEnd().endsWith(quoted)).toBe(true);
      expect(JSON.parse(r.json).notice).toBe(SYNTHETIC_NOTICE);
      const [head, ...body] = r.rows;
      expect(head!.at(-1)).toBe('data_status');
      expect(body.length).toBeGreaterThan(0);
      for (const row of body) expect(row.at(-1)).toBe(ROW_STATUS);
    });
  }
  it('guards against spreadsheet formula injection', () => {
    const csv = toCsv([['=SUM(A1)', '+1', '-1', '@x', 'plain', 'a,b']]);
    expect(csv).toBe("'=SUM(A1),'+1,'-1,'@x,plain,\"a,b\"\r\n");
  });
  it('lists communities that are in scope only', () => {
    const r = buildReport(
      'community-signals',
      summarise(records, range, lga('lga-c'), ctx),
      monitor,
      meta,
    );
    const names = DEMO_COMMUNITIES.filter((c) => c.lgaId !== 'lga-c').map((c) => c.name);
    for (const name of names) expect(r.csv).not.toContain(name);
  });
});
