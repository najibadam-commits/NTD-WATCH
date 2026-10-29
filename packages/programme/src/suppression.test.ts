import { describe, expect, it } from 'vitest';
import { ALL_SCOPE } from '@ntd-watch/domain';
import {
  NOT_SHOWN_TEXT,
  SMALL_COUNT_THRESHOLD,
  buildReport,
  communityDetail,
  generateSeed,
  isSmallCount,
  monitorReferrals,
  publishTotal,
  summarise,
  suppress,
  type Count,
  type ProgrammeRecords,
} from './index';

const ANCHOR = new Date('2026-10-18T12:00:00Z');
const ctx = { now: ANCHOR, maxUnresolvedDays: 7 };
const range = { from: '2026-07-27', to: '2026-10-18' };
const seed = generateSeed({ anchor: ANCHOR });

/**
 * A synthetic fixture with KNOWN small counts: community com-01 gets exactly 3 HIGH and 2
 * URGENT assessments and 40 LOW ones, taken from the synthetic seed. No real data is involved.
 */
function fixture(counts: { LOW: number; HIGH: number; URGENT: number }): ProgrammeRecords {
  const own = seed.assessments.filter((a) => a.communityId === 'com-01');
  const pick = (level: string, n: number) => own.filter((a) => a.riskLevel === level).slice(0, n);
  const chosen = [
    ...pick('LOW', counts.LOW),
    ...pick('HIGH', counts.HIGH),
    ...pick('URGENT', counts.URGENT),
  ];
  const keys = new Set(chosen.map((a) => a.clientKey));
  return {
    assessments: chosen,
    referrals: seed.referrals.filter((r) => keys.has(r.assessmentKey)),
    followUps: [],
  };
}

describe('small-count rule', () => {
  it('suppresses every count from 1 to 4 and nothing else', () => {
    for (const n of [1, 2, 3, 4]) {
      expect(isSmallCount(n)).toBe(true);
      expect(suppress(n)).toBeNull();
    }
  });
  it('publishes zero, and counts at and above the threshold, exactly', () => {
    expect(SMALL_COUNT_THRESHOLD).toBe(5);
    for (const n of [0, 5, 6, 40, 684]) {
      expect(isSmallCount(n)).toBe(false);
      expect(suppress(n)).toBe(n);
    }
  });
  it('keeps zero, not shown and no data distinguishable', () => {
    const zero: Count = suppress(0);
    const hidden: Count = suppress(3);
    expect(zero).toBe(0);
    expect(hidden).toBeNull();
    expect(zero).not.toBe(hidden);
    // "No data" is a different field, not a count: the vulnerability band says so.
    const few = summarise(
      { assessments: seed.assessments.slice(0, 2), referrals: [], followUps: [] },
      range,
      ALL_SCOPE,
      ctx,
    );
    expect(few.communities.every((c) => c.vulnerabilityBand === 'INSUFFICIENT_DATA')).toBe(true);
    // A community with no assessments at all publishes a real zero, not "not shown".
    const empty = summarise(
      { assessments: [], referrals: [], followUps: [] },
      range,
      ALL_SCOPE,
      ctx,
    );
    expect(empty.communities[0]!.assessments).toBe(0);
    expect(empty.communities[0]!.signals).toBe(0);
  });
  it('never writes the word "zero" or a number for a hidden count in the display text', () => {
    expect(NOT_SHOWN_TEXT).not.toMatch(/\d|zero/i);
  });
});

describe('totals cannot be subtracted to find a hidden count', () => {
  const part = (raw: number) => ({ raw, shown: suppress(raw) });
  it('withholds a total when exactly one part is hidden', () => {
    // 62 - 40 - 19 = 3: the total would hand over the hidden 3.
    expect(publishTotal(62, [part(40), part(19), part(3)])).toBeNull();
  });
  it('withholds a total when the hidden parts can only be all ones or all fours', () => {
    expect(publishTotal(62, [part(40), part(20), part(1), part(1)])).toBeNull();
    expect(publishTotal(60, [part(40), part(12), part(4), part(4)])).toBeNull();
  });
  it('publishes a total when two hidden parts could be any of several pairs', () => {
    expect(publishTotal(64, [part(40), part(21), part(1), part(2)])).toBe(64);
    expect(publishTotal(64, [part(40), part(21), part(1), part(2)])).not.toBeNull();
  });
  it('withholds a total that is itself small', () => {
    expect(publishTotal(4, [part(4)])).toBeNull();
  });
  it('publishes a total whose parts are all published', () => {
    expect(publishTotal(60, [part(40), part(20)])).toBe(60);
  });

  it('hides a second cell when one risk level is small, in a community', () => {
    const d = communityDetail(
      fixture({ LOW: 40, HIGH: 3, URGENT: 0 }),
      'com-01',
      range,
      ALL_SCOPE,
      ctx,
    )!;
    const cells = d.stat.byRisk;
    expect(cells.HIGH).toBeNull();
    // URGENT is a published zero; LOW is the only other non-zero cell, so it is hidden as well.
    expect(cells.URGENT).toBe(0);
    expect(cells.LOW).toBeNull();
    // With two cells hidden the total is either withheld or cannot isolate the 3.
    const total = d.stat.assessments;
    if (total !== null) expect(total - (cells.MODERATE ?? 0)).toBeGreaterThanOrEqual(5);
  });

  it('never leaves a lone hidden cell next to a published total, in any group of the seed', () => {
    const s = summarise(seed, range, ALL_SCOPE, ctx);
    const groups = [
      ...s.communities.map((c) => ({ cells: c.byRisk, total: c.assessments })),
      ...s.weekly.map((w) => ({ cells: w.byRisk, total: w.assessments })),
      { cells: s.byRisk, total: s.kpis.assessments },
    ];
    for (const g of groups) {
      const hidden = Object.values(g.cells).filter((v) => v === null).length;
      if (hidden === 1) expect(g.total).toBeNull();
    }
  });

  it('keeps the national total from isolating one community (list vs total)', () => {
    const s = summarise(seed, range, ALL_SCOPE, ctx);
    for (const key of ['assessments', 'signals', 'referrals', 'unresolved'] as const) {
      const hidden = s.communities.filter((c) => c[key] === null).length;
      const total = s.kpis[key === 'signals' ? 'highUrgent' : key];
      if (hidden === 1) expect(total).toBeNull();
    }
  });

  it('hides cumulative stage counts that would reveal a hidden current-stage count', () => {
    const m = monitorReferrals(seed, { ...range, communityId: 'com-01' }, ALL_SCOPE, ctx);
    const order = [
      'GENERATED',
      'ACCEPTED',
      'PATIENT_ARRIVED',
      'ASSESSED',
      'FOLLOW_UP',
      'CLOSED',
    ] as const;
    const lastHidden = order.reduce((i, st, k) => (m.current[st] === null ? k : i), -1);
    order.forEach((st, k) => {
      if (k <= lastHidden) expect(m.reached[st]).toBeNull();
    });
  });
});

describe('a known small count is not present anywhere in what is published', () => {
  // Collect every number that the aggregation returns under a count-like key.
  const COUNT_KEYS =
    /^(assessments|signals|signalsRecent|signalsPrevious|referrals|referralsCompleted|unresolved|followUps|followUpsDue|followUpsWorse|unclassified|highUrgent|total|count|seeded|live|LOW|MODERATE|HIGH|URGENT|GENERATED|ACCEPTED|PATIENT_ARRIVED|ASSESSED|FOLLOW_UP|CLOSED)$/;
  function numbers(node: unknown, key = ''): number[] {
    if (typeof node === 'number') return COUNT_KEYS.test(key) ? [node] : [];
    if (Array.isArray(node)) return node.flatMap((n) => numbers(n, key));
    if (node && typeof node === 'object') {
      return Object.entries(node).flatMap(([k, v]) => numbers(v, k));
    }
    return [];
  }

  it.each([
    ['summary', () => summarise(fixture({ LOW: 40, HIGH: 3, URGENT: 2 }), range, ALL_SCOPE, ctx)],
    [
      'community detail',
      () =>
        communityDetail(fixture({ LOW: 40, HIGH: 3, URGENT: 2 }), 'com-01', range, ALL_SCOPE, ctx),
    ],
    [
      'referral monitor',
      () => monitorReferrals(fixture({ LOW: 40, HIGH: 3, URGENT: 2 }), range, ALL_SCOPE, ctx),
    ],
  ])('%s carries no count from 1 to 4', (_name, build) => {
    const out = build();
    const found = numbers(out).filter((n) => n >= 1 && n < SMALL_COUNT_THRESHOLD);
    expect(found).toEqual([]);
  });

  it('the seeded summary, detail and monitor carry no count from 1 to 4 either', () => {
    for (const out of [
      summarise(seed, range, ALL_SCOPE, ctx),
      communityDetail(seed, 'com-02', range, ALL_SCOPE, ctx),
      monitorReferrals(seed, range, ALL_SCOPE, ctx),
    ]) {
      expect(numbers(out).filter((n) => n >= 1 && n < SMALL_COUNT_THRESHOLD)).toEqual([]);
    }
  });
});

describe('exports follow the same rule', () => {
  const summary = summarise(seed, range, ALL_SCOPE, ctx);
  const monitor = monitorReferrals(seed, range, ALL_SCOPE, ctx);
  const meta = { roleLabel: 'State', scopeLabel: 'All', generatedAt: ANCHOR.toISOString() };

  it('writes the not-shown text, never a blank, a zero or a small number, in every report', () => {
    for (const kind of [
      'programme-summary',
      'community-signals',
      'referral-monitoring',
      'weekly-trends',
    ] as const) {
      const r = buildReport(kind, summary, monitor, meta);
      // CHW staff numbers are not counts of the people assessed and are left as they are.
      const [columns = [], ...data] = r.rows;
      columns.forEach((col, c) => {
        if (/chw/i.test(String(col))) return;
        for (const row of data) {
          const v = row[c];
          expect(typeof v === 'number' && v >= 1 && v < SMALL_COUNT_THRESHOLD).toBe(false);
        }
      });
    }
  });
  it('states in the export that small counts are not shown', () => {
    const r = buildReport('community-signals', summary, monitor, meta);
    expect(r.csv).toContain(NOT_SHOWN_TEXT);
    expect(r.csv.toLowerCase()).toContain('small');
  });
  it('agrees with the published table: a hidden signals cell is hidden in the export', () => {
    const r = buildReport('community-signals', summary, monitor, meta);
    const hidden = summary.communities.find((c) => c.signals === null)!;
    const line = r.csv.split('\n').find((l) => l.includes(hidden.name))!;
    expect(line).toContain(NOT_SHOWN_TEXT);
  });
});
