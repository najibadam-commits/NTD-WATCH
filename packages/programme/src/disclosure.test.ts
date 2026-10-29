import { describe, expect, it } from 'vitest';
import { ALL_SCOPE, REFERRAL_STAGES, type Assessment, type Referral } from '@ntd-watch/domain';
import {
  SMALL_COUNT_THRESHOLD,
  buildReport,
  communityDetail,
  generateSeed,
  monitorReferrals,
  rankPriorities,
  summarise,
  type Count,
  type ProgrammeRecords,
  type ProgrammeSummary,
} from './index';

/**
 * Disclosure verification (deterministic, synthetic). Each test plays the part of a reader who
 * sees only what the aggregation functions publish and tries to work out a hidden count of 1 to 4.
 * A test that PASSES shows the attack fails. Tests named "documented residual" assert, on purpose,
 * that an attack STILL works, so the limit stays visible and cannot be forgotten or overstated.
 */

const ANCHOR = new Date('2026-10-18T12:00:00Z');
const ctx = { now: ANCHOR, maxUnresolvedDays: 7 };
const range = { from: '2026-07-27', to: '2026-10-18' };
const seed = generateSeed({ anchor: ANCHOR });
const small = (n: number) => n >= 1 && n < SMALL_COUNT_THRESHOLD;

// ---------------------------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------------------------

const TEMPLATE: Record<string, Assessment> = {};
for (const a of seed.assessments) if (a.riskLevel) TEMPLATE[a.riskLevel] ??= a;

type Mix = { LOW?: number; MODERATE?: number; HIGH?: number; URGENT?: number };

/** Assessments for one community with exactly the requested number at each risk level. */
function assessmentsFor(communityId: string, mix: Mix, tag = 'x'): Assessment[] {
  const out: Assessment[] = [];
  let n = 0;
  for (const level of ['LOW', 'MODERATE', 'HIGH', 'URGENT'] as const) {
    for (let i = 0; i < (mix[level] ?? 0); i++) {
      const t = TEMPLATE[level]!;
      n += 1;
      out.push({
        ...t,
        communityId,
        id: `${tag}-${communityId}-${n}`,
        clientKey: `${tag}-${communityId}-key-${n}`,
        capturedAt: `2026-09-${String(1 + (n % 20)).padStart(2, '0')}T09:00:00.000Z`,
      });
    }
  }
  return out;
}

const REF_TEMPLATE = seed.referrals[0]!;
const FACILITY = REF_TEMPLATE.facilityId;

/** Referrals for a community with the requested number at each CURRENT stage. */
function referralsFor(
  communityId: string,
  stages: Partial<Record<(typeof REFERRAL_STAGES)[number], number>>,
  tag = 'r',
): Referral[] {
  const out: Referral[] = [];
  let n = 0;
  REFERRAL_STAGES.forEach((stage, idx) => {
    for (let i = 0; i < (stages[stage] ?? 0); i++) {
      n += 1;
      const day = String(1 + (n % 20)).padStart(2, '0');
      out.push({
        ...REF_TEMPLATE,
        id: `NTDW-2026-${String(900000 + n + idx * 1000).padStart(6, '0')}`,
        assessmentId: `${tag}-a-${communityId}-${n}`,
        assessmentKey: `${tag}-akey-${communityId}-${n}`,
        communityId,
        facilityId: FACILITY,
        stage,
        stageTimestamps: Array.from(
          { length: idx + 1 },
          (_, k) => `2026-09-${day}T${String(8 + k).padStart(2, '0')}:00:00.000Z`,
        ),
        outcome: undefined,
      });
    }
  });
  return out;
}

const records = (assessments: Assessment[], referrals: Referral[] = []): ProgrammeRecords => ({
  assessments,
  referrals,
  followUps: [],
});

// ---------------------------------------------------------------------------------------------
// A reader who solves for hidden cells
// ---------------------------------------------------------------------------------------------

/**
 * Hidden cells are unknown positive integers. Published totals and the published signals figure
 * are equations over them. Returns the names of hidden cells whose value is uniquely determined.
 */
function recoveredCells(
  cells: Record<string, Count>,
  equations: { sum: string[]; equals: Count }[],
): string[] {
  const hidden = Object.keys(cells).filter((k) => cells[k] === null);
  const known = (k: string) => cells[k] ?? 0;
  const eqs = equations
    .filter((e) => e.equals !== null)
    .map((e) => ({
      unknown: e.sum.filter((k) => cells[k] === null),
      rest: e.sum.filter((k) => cells[k] !== null).reduce((n, k) => n + known(k), 0),
      target: e.equals as number,
    }));
  const involved = hidden.filter((h) => eqs.some((e) => e.unknown.includes(h)));
  const cap = 80;
  const seen = new Map<string, Set<number>>(involved.map((h) => [h, new Set()]));
  const assign: Record<string, number> = {};
  const walk = (i: number) => {
    if (i === involved.length) {
      for (const e of eqs) {
        if (e.rest + e.unknown.reduce((n, k) => n + (assign[k] ?? 0), 0) !== e.target) return;
      }
      for (const h of involved) seen.get(h)!.add(assign[h]!);
      return;
    }
    const h = involved[i]!;
    for (let v = 1; v <= cap; v++) {
      assign[h] = v;
      // prune: an equation whose unknowns are all assigned must hold, and none may overshoot
      let ok = true;
      for (const e of eqs) {
        const sum = e.rest + e.unknown.reduce((n, k) => n + (assign[k] ?? 0), 0);
        const done = e.unknown.every((k) => assign[k] !== undefined && involved.indexOf(k) <= i);
        if (sum > e.target || (done && sum !== e.target)) ok = false;
      }
      if (!ok) {
        if (e0(eqs, assign, i, involved)) break;
        continue;
      }
      walk(i + 1);
    }
    delete assign[h];
  };
  walk(0);
  return involved.filter((h) => seen.get(h)!.size === 1);
}
/** True when increasing this variable further can only overshoot (lets the search stop early). */
function e0(
  eqs: { unknown: string[]; rest: number; target: number }[],
  assign: Record<string, number>,
  i: number,
  involved: string[],
): boolean {
  return eqs.some((e) => {
    if (!e.unknown.includes(involved[i]!)) return false;
    const sum = e.rest + e.unknown.reduce((n, k) => n + (assign[k] ?? 0), 0);
    return sum > e.target;
  });
}

const riskEquations = (g: { byRisk: Record<string, Count>; total: Count; signals?: Count }) => [
  { sum: ['LOW', 'MODERATE', 'HIGH', 'URGENT'], equals: g.total },
  ...(g.signals === undefined ? [] : [{ sum: ['HIGH', 'URGENT'], equals: g.signals }]),
];

// ---------------------------------------------------------------------------------------------
// A. Community table, map and detail
// ---------------------------------------------------------------------------------------------

describe('A. a reader cannot solve for a hidden risk cell (community, week and total groups)', () => {
  const lows = [0, 3, 9, 40];
  const mods = [0, 2, 12];
  const highs = [0, 1, 3, 4, 5, 8];
  const urgents = [0, 2, 4, 6];

  it('no single community leaks a risk cell through its total or signals figure', () => {
    const leaks: string[] = [];
    for (const LOW of lows)
      for (const MODERATE of mods)
        for (const HIGH of highs)
          for (const URGENT of urgents) {
            const mix = { LOW, MODERATE, HIGH, URGENT };
            const d = communityDetail(
              records(assessmentsFor('com-01', mix)),
              'com-01',
              range,
              ALL_SCOPE,
              ctx,
            );
            if (!d) continue;
            const c = d.stat;
            const found = recoveredCells(
              c.byRisk as Record<string, Count>,
              riskEquations({
                byRisk: c.byRisk as Record<string, Count>,
                total: c.assessments,
                signals: c.signals,
              }),
            );
            if (found.length) leaks.push(`${JSON.stringify(mix)} -> ${found.join(',')}`);
          }
    expect(leaks).toEqual([]);
  });

  it('the summary total and byRisk do not leak either (single community in scope)', () => {
    const leaks: string[] = [];
    for (const LOW of lows)
      for (const HIGH of highs)
        for (const URGENT of urgents) {
          const s = summarise(
            records(assessmentsFor('com-01', { LOW, HIGH, URGENT })),
            { ...range, communityId: 'com-01' },
            ALL_SCOPE,
            ctx,
          );
          const found = recoveredCells(
            s.byRisk as Record<string, Count>,
            riskEquations({
              byRisk: s.byRisk as Record<string, Count>,
              total: s.kpis.assessments,
              signals: s.kpis.highUrgent,
            }),
          );
          if (found.length) leaks.push(`${LOW}/${HIGH}/${URGENT} -> ${found.join(',')}`);
        }
    expect(leaks).toEqual([]);
  });

  it('a single selected community with 3 assessments publishes nothing exact', () => {
    const s = summarise(
      records(assessmentsFor('com-01', { LOW: 3 })),
      { ...range, communityId: 'com-01' },
      ALL_SCOPE,
      ctx,
    );
    expect(s.kpis.assessments).toBeNull();
    expect(s.communities.find((c) => c.communityId === 'com-01')!.assessments).toBeNull();
    expect(
      s.weekly.every((w) => w.assessments === null || w.assessments === 0 || w.assessments >= 5),
    ).toBe(true);
  });
});

describe('A. ratios and percentages do not reveal a hidden count', () => {
  /**
   * A percentage of `total` rounded to a whole number. Returns true when every count that fits
   * the published percentage is itself a count of 1 to 4, on either side of the split.
   */
  const pinsSmall = (total: number, pct: number): boolean => {
    const fits: number[] = [];
    for (let d = 0; d <= total; d++) {
      if (Math.round((d / total) * 100) === pct) fits.push(d);
    }
    return fits.length > 0 && (fits.every(small) || fits.every((d) => small(total - d)));
  };

  const stagesFor = (assessedOrBeyond: number, total: number) => ({
    GENERATED: total - assessedOrBeyond,
    ASSESSED: assessedOrBeyond,
  });

  it('referral completion (summary, monitor, facility, LGA) never pins a small split', () => {
    const leaks: string[] = [];
    for (const total of [5, 6, 8, 12, 20, 40, 60]) {
      for (let done = 0; done <= total; done++) {
        const rec = records([], referralsFor('com-01', stagesFor(done, total)));
        const s = summarise(rec, range, ALL_SCOPE, ctx);
        const m = monitorReferrals(rec, range, ALL_SCOPE, ctx);
        const check = (where: string, count: Count, pct: number | null) => {
          if (count !== null && pct !== null && pinsSmall(count, pct)) {
            leaks.push(`${where}: ${done} of ${total} -> ${pct}% of ${count}`);
          }
        };
        check('kpis', s.kpis.referrals, s.kpis.referralCompletion);
        check('monitor', m.total, m.completionRate);
        for (const f of m.byFacility) check('facility', f.referrals, f.completionRate);
        for (const l of m.byLga) check('lga', l.referrals, l.completionRate);
      }
    }
    expect(leaks).toEqual([]);
  });

  it('the signal share is never published while signals or assessments are hidden', () => {
    for (const HIGH of [0, 1, 3, 5, 9])
      for (const LOW of [0, 4, 12, 60]) {
        const s = summarise(
          records(assessmentsFor('com-01', { LOW, HIGH })),
          { ...range, communityId: 'com-01' },
          ALL_SCOPE,
          ctx,
        );
        if (s.kpis.highUrgent === null || s.kpis.assessments === null) {
          expect(s.kpis.highUrgentShare).toBeNull();
        }
        for (const row of rankPriorities(s.communities)) {
          if (row.signals === null || row.assessments === null) expect(row.signalShare).toBeNull();
        }
      }
  });
});

// ---------------------------------------------------------------------------------------------
// D. Derived indicators
// ---------------------------------------------------------------------------------------------

describe('D. the signal band does not narrow a hidden signals count', () => {
  /** The hidden count is some value 1 to 4. Which of those values give the published band? */
  const bandAfter = (signals: number, assessments: number) =>
    rankPriorities(
      summarise(
        records(assessmentsFor('com-01', { LOW: assessments - signals, HIGH: signals })),
        { ...range, communityId: 'com-01' },
        ALL_SCOPE,
        ctx,
      ).communities,
    ).find((r) => r.communityId === 'com-01')!;

  it('for every assessment total, a band published beside a hidden signals count fits all of 1 to 4', () => {
    const narrowed: string[] = [];
    for (let n = 5; n <= 90; n++) {
      const consistent: number[] = [];
      let published: string | null = null;
      for (const hidden of [1, 2, 3, 4]) {
        const row = bandAfter(hidden, n);
        if (row.signals !== null || row.assessments === null) continue;
        published = row.signalBand;
        consistent.push(hidden);
      }
      // Compare: for each hidden value the band published; the reader sees ONE band. If two
      // different hidden values give different bands, the band narrows the value.
      const bands = new Set(
        [1, 2, 3, 4]
          .map((h) => bandAfter(h, n))
          .filter((r) => r.signals === null && r.assessments !== null)
          .map((r) => r.signalBand),
      );
      if (bands.size > 1)
        narrowed.push(
          `${n} assessments: bands differ (${[...bands].join('/')}), last ${published}`,
        );
    }
    expect(narrowed).toEqual([]);
  });
});

describe('D. documented residual: indicators that are NOT protected', () => {
  // These tests assert that each leak STILL EXISTS. They are here so that nobody can describe
  // these indicators as protected without first changing the code and these tests.

  const at = (a: Assessment, day: string, over: Partial<Assessment> = {}): Assessment => ({
    ...a,
    ...over,
    capturedAt: `${day}T09:00:00.000Z`,
  });

  it('the direction label narrows two hidden window counts', () => {
    // 3 signals in the last 28 days and 1 in the 28 before: both hidden, but direction says rising,
    // which is only possible when recent - previous >= 2 and recent > 1.5 x previous.
    const base = assessmentsFor('com-01', { LOW: 40, HIGH: 4 });
    const high = base.filter((a) => a.riskLevel === 'HIGH');
    const low = base.filter((a) => a.riskLevel === 'LOW');
    const rec = records([
      ...low.map((a) => at(a, '2026-08-01')),
      ...high.slice(0, 3).map((a) => at(a, '2026-10-05')),
      ...high.slice(3).map((a) => at(a, '2026-09-10')),
    ]);
    const c = summarise(rec, { ...range, communityId: 'com-01' }, ALL_SCOPE, ctx).communities.find(
      (x) => x.communityId === 'com-01',
    )!;
    expect(c.signalsRecent).toBeNull();
    expect(c.signalsPrevious).toBeNull();
    expect(c.direction).toBe('rising');
  });

  it('a WASH share is a ratio of exact household counts: 1 household in 12 is 8.3%', () => {
    const base = assessmentsFor('com-01', { LOW: 12 });
    const rec = records(
      base.map((a, i) =>
        at(a, '2026-09-05', { wash: { ...a.wash, sanitation: i === 0 ? 'none' : 'improved' } }),
      ),
    );
    const c = summarise(rec, { ...range, communityId: 'com-01' }, ALL_SCOPE, ctx).communities.find(
      (x) => x.communityId === 'com-01',
    )!;
    expect(c.assessments).toBe(12);
    expect(c.wash.noSanitation).toBeCloseTo(1 / 12, 5); // the small count 1 is recoverable
  });

  it('staff counts are published exactly', () => {
    const s = summarise(records([]), range, ALL_SCOPE, ctx);
    expect(s.communities.some((c) => c.chwsAssigned >= 1 && c.chwsAssigned < 5)).toBe(true);
    expect(typeof s.kpis.activeChws).toBe('number');
  });

  it('the vulnerability index is published from exact household answers', () => {
    const s = summarise(seed, range, ALL_SCOPE, ctx);
    expect(s.communities.some((c) => c.vulnerabilityIndex !== null)).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------
// B. Exports
// ---------------------------------------------------------------------------------------------

describe('B. exports carry published values only, for every report and filter', () => {
  const meta = { roleLabel: 'State', scopeLabel: 'All', generatedAt: ANCHOR.toISOString() };
  const kinds = [
    'programme-summary',
    'community-signals',
    'referral-monitoring',
    'weekly-trends',
  ] as const;
  const filters = [
    range,
    { ...range, communityId: 'com-01' },
    { ...range, lgaId: 'lga-01' },
    { from: '2026-09-01', to: '2026-09-30' },
  ];

  it('no count column of any report, filter or format holds a number from 1 to 4', () => {
    for (const f of filters) {
      const summary = summarise(seed, f, ALL_SCOPE, ctx);
      const monitor = monitorReferrals(seed, f, ALL_SCOPE, ctx);
      for (const kind of kinds) {
        const r = buildReport(kind, summary, monitor, meta);
        const [columns = [], ...data] = r.rows;
        columns.forEach((col, c) => {
          // Staff numbers, indices and percentages are not counts of records (documented).
          if (
            /chw|index|percent|\(%\)|share|week_starting|direction|band|status|metric|lga|ward|community|facility|^value$/i.test(
              String(col),
            )
          )
            return;
          for (const row of data) {
            const v = row[c];
            if (typeof v === 'number') expect(small(v)).toBe(false);
          }
        });
        // JSON carries the same rows, so the same cells.
        const parsed = JSON.parse(r.json) as { rows: Record<string, unknown>[] };
        expect(parsed.rows.length).toBe(data.length);
      }
    }
  });

  it('the programme-summary value column carries no 1 to 4 for a count metric', () => {
    const summary = summarise(seed, range, ALL_SCOPE, ctx);
    const monitor = monitorReferrals(seed, range, ALL_SCOPE, ctx);
    const r = buildReport('programme-summary', summary, monitor, meta);
    for (const [metric, value] of r.rows.slice(1)) {
      if (/active chws|communities/i.test(String(metric))) continue;
      if (typeof value === 'number' && /%/.test(String(metric)) === false) {
        expect(small(value)).toBe(false);
      }
    }
  });

  it('exports are built from the published summary only: they take no raw records', () => {
    // buildReport's signature accepts only a ProgrammeSummary and a ReferralMonitor. There is
    // no path from raw assessments or referrals into a report.
    expect(buildReport.length).toBe(4);
  });
});

// ---------------------------------------------------------------------------------------------
// C. Filters, combinations, dates and the lists that add up to a total
// ---------------------------------------------------------------------------------------------

/** Randomly (but deterministically) thin each community to a chosen size. */
function thinned(sizes: Record<string, number>): ProgrammeRecords {
  const assessments: Assessment[] = [];
  for (const [id, n] of Object.entries(sizes)) {
    assessments.push(
      ...assessmentsFor(id, { LOW: Math.max(0, n - 2), HIGH: Math.min(2, n) }, 'th'),
    );
  }
  return records(assessments);
}

describe('C. a list never leaves exactly one hidden row beside a published total', () => {
  const sizeSets: Record<string, number>[] = [
    { 'com-01': 3, 'com-02': 40, 'com-03': 22 },
    { 'com-01': 3, 'com-02': 4, 'com-03': 22 },
    { 'com-01': 4, 'com-02': 5, 'com-03': 6, 'com-04': 30 },
    { 'com-01': 2, 'com-02': 2, 'com-03': 2, 'com-04': 30 },
    { 'com-01': 1, 'com-05': 9, 'com-09': 17 },
  ];

  it('communities, against the total, for every column', () => {
    for (const sizes of sizeSets) {
      const s = summarise(thinned(sizes), range, ALL_SCOPE, ctx);
      for (const key of ['assessments', 'signals', 'referrals', 'unresolved'] as const) {
        const hidden = s.communities.filter((c) => c[key] === null).length;
        const total = s.kpis[key === 'signals' ? 'highUrgent' : key];
        if (hidden === 1) expect(total, `${key} ${JSON.stringify(sizes)}`).toBeNull();
      }
    }
  });

  it('weekly series, against the total and against each other', () => {
    for (const sizes of sizeSets) {
      const s = summarise(thinned(sizes), range, ALL_SCOPE, ctx);
      for (const key of ['assessments', 'signals', 'referrals'] as const) {
        const hidden = s.weekly.filter((w) => w[key] === null).length;
        const total = s.kpis[key === 'signals' ? 'highUrgent' : key];
        if (hidden === 1) expect(total, `${key} ${JSON.stringify(sizes)}`).toBeNull();
      }
    }
  });

  it('every weekly and community column, including each risk level, has no lone hidden row beside a published figure', () => {
    for (const sizes of sizeSets) {
      const s = summarise(thinned(sizes), range, ALL_SCOPE, ctx);
      const riskKeys = ['LOW', 'MODERATE', 'HIGH', 'URGENT'] as const;
      for (const k of riskKeys) {
        const weeks = s.weekly.filter((w) => w.byRisk[k] === null).length;
        const comms = s.communities.filter((c) => c.byRisk[k] === null).length;
        if (weeks === 1) expect(s.byRisk[k], `week ${k} ${JSON.stringify(sizes)}`).toBeNull();
        if (comms === 1) expect(s.byRisk[k], `community ${k} ${JSON.stringify(sizes)}`).toBeNull();
      }
    }
  });

  it('a hidden week cannot be solved from the weekly groups and the published totals', () => {
    for (const sizes of sizeSets) {
      const s = summarise(thinned(sizes), range, ALL_SCOPE, ctx);
      for (const w of s.weekly) {
        const found = recoveredCells(
          w.byRisk as Record<string, Count>,
          riskEquations({
            byRisk: w.byRisk as Record<string, Count>,
            total: w.assessments,
            signals: w.signals,
          }),
        );
        expect(found, `${w.weekStart} ${JSON.stringify(sizes)}`).toEqual([]);
      }
    }
  });

  it('the cumulative referral stages cannot be differenced to a hidden current stage', () => {
    for (const split of [
      { GENERATED: 30, ACCEPTED: 3, ASSESSED: 20 },
      { GENERATED: 3, ACCEPTED: 30, PATIENT_ARRIVED: 12, ASSESSED: 20 },
      { GENERATED: 12, ACCEPTED: 12, PATIENT_ARRIVED: 12, ASSESSED: 4, CLOSED: 12 },
    ]) {
      const m = monitorReferrals(records([], referralsFor('com-01', split)), range, ALL_SCOPE, ctx);
      const order = REFERRAL_STAGES;
      for (let i = 0; i < order.length; i++) {
        const stage = order[i]!;
        // current[i] = reached[i] - reached[i+1]: a published pair of neighbours would reveal it.
        const next = order[i + 1];
        if (m.current[stage] === null && next !== undefined) {
          expect(m.reached[stage] === null || m.reached[next] === null).toBe(true);
        }
      }
      const hiddenCurrent = order.filter((st) => m.current[st] === null).length;
      if (hiddenCurrent === 1) expect(m.total).toBeNull();
    }
  });
});

describe('C. facility lists do not leave a lone hidden facility beside a published total', () => {
  const otherFacility = seed.referrals.find((r) => r.facilityId !== FACILITY)!.facilityId;
  const split = (small: number, large: number): Referral[] => {
    const all = referralsFor('com-01', { GENERATED: small + large });
    return all.map((r, i) => (i < small ? { ...r, facilityId: otherFacility } : r));
  };

  it('community detail: referrals per facility against the community total', () => {
    for (const [small, large] of [
      [3, 20],
      [2, 30],
      [4, 9],
    ] as const) {
      const d = communityDetail(records([], split(small, large)), 'com-01', range, ALL_SCOPE, ctx)!;
      const hidden = d.facilities.filter((f) => f.referrals === null).length;
      if (hidden === 1) expect(d.stat.referrals, `${small}/${large}`).toBeNull();
    }
  });

  it('referral monitor: facility rows, LGA rows and stages against the total', () => {
    for (const [small, large] of [
      [3, 20],
      [2, 30],
      [4, 9],
    ] as const) {
      const m = monitorReferrals(records([], split(small, large)), range, ALL_SCOPE, ctx);
      const hiddenFacilities = m.byFacility.filter((f) => f.referrals === null).length;
      const hiddenLgas = m.byLga.filter((l) => l.referrals === null).length;
      if (hiddenFacilities === 1) expect(m.total, `facility ${small}/${large}`).toBeNull();
      if (hiddenLgas === 1) expect(m.total, `lga ${small}/${large}`).toBeNull();
    }
  });
});

describe('C. documented residual: separate requests can be differenced', () => {
  // These tests assert that the attack STILL WORKS. Suppression is applied to each response on
  // its own; it does not remember what was published to the same reader before.

  it('a hidden community count equals the all-scope total minus the other community, asked separately', () => {
    // com-01 has 3 assessments and com-02 has 20: the all-scope response hides both (a lone hidden
    // row would be exposed), so it publishes only their sum, 23.
    const rec = thinned({ 'com-01': 3, 'com-02': 20 });
    const all = summarise(rec, range, ALL_SCOPE, ctx);
    expect(all.communities.find((c) => c.communityId === 'com-01')!.assessments).toBeNull();
    expect(all.communities.find((c) => c.communityId === 'com-02')!.assessments).toBeNull();
    expect(all.kpis.assessments).toBe(23);
    // A second request for com-02 alone publishes its exact count, 20, and 23 - 20 gives com-01.
    const alone = summarise(rec, { ...range, communityId: 'com-02' }, ALL_SCOPE, ctx);
    expect(alone.kpis.assessments).toBe(20);
    expect(all.kpis.assessments! - alone.kpis.assessments!).toBe(3);
  });

  it('a date-range split recovers a hidden period count (documented residual)', () => {
    // 27 assessments on 2 September and 3 on 20 September, one community.
    const base = assessmentsFor('com-01', { LOW: 30 });
    const early = base.slice(0, 27).map((a) => ({ ...a, capturedAt: '2026-09-02T09:00:00.000Z' }));
    const late = base.slice(27).map((a) => ({ ...a, capturedAt: '2026-09-20T09:00:00.000Z' }));
    const rec = records([...early, ...late]);
    const whole = summarise(
      rec,
      { from: '2026-09-01', to: '2026-09-30', communityId: 'com-01' },
      ALL_SCOPE,
      ctx,
    );
    const firstHalf = summarise(
      rec,
      { from: '2026-09-01', to: '2026-09-10', communityId: 'com-01' },
      ALL_SCOPE,
      ctx,
    );
    const secondHalf = summarise(
      rec,
      { from: '2026-09-11', to: '2026-09-30', communityId: 'com-01' },
      ALL_SCOPE,
      ctx,
    );
    expect(whole.kpis.assessments).toBe(30);
    expect(firstHalf.kpis.assessments).toBe(27);
    expect(secondHalf.kpis.assessments).toBeNull(); // protected alone ...
    expect(whole.kpis.assessments! - firstHalf.kpis.assessments!).toBe(3); // ... recovered by difference
  });
});

// ---------------------------------------------------------------------------------------------
// Boundary: no raw count is carried alongside the published one
// ---------------------------------------------------------------------------------------------

describe('the published objects carry no raw count under any key', () => {
  function everyNumber(node: unknown, path: string, out: { path: string; v: number }[]) {
    if (typeof node === 'number') out.push({ path, v: node });
    else if (Array.isArray(node)) node.forEach((n, i) => everyNumber(n, `${path}[${i}]`, out));
    else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) everyNumber(v, `${path}.${k}`, out);
    }
  }
  it('no property named raw* exists in a summary, detail or monitor', () => {
    const sample = [
      summarise(seed, range, ALL_SCOPE, ctx),
      communityDetail(seed, 'com-01', range, ALL_SCOPE, ctx),
      monitorReferrals(seed, range, ALL_SCOPE, ctx),
    ];
    for (const out of sample) {
      expect(JSON.stringify(out)).not.toMatch(/"raw[A-Z_a-z]*"/);
    }
  });
  it('the published summary of a fixture with known small counts holds no number 1 to 4 under a count key', () => {
    const s: ProgrammeSummary = summarise(
      records(
        assessmentsFor('com-01', { LOW: 40, HIGH: 3, URGENT: 2 }),
        referralsFor('com-01', { GENERATED: 3, ASSESSED: 2 }),
      ),
      range,
      ALL_SCOPE,
      ctx,
    );
    const nums: { path: string; v: number }[] = [];
    everyNumber(s, 's', nums);
    const countLike = nums.filter(
      (n) =>
        /\.(assessments|signals|signalsRecent|signalsPrevious|referrals|referralsCompleted|unresolved|followUps|followUpsDue|followUpsWorse|unclassified|highUrgent|LOW|MODERATE|HIGH|URGENT|count|seeded|live)$/.test(
          n.path,
        ) && small(n.v),
    );
    expect(countLike).toEqual([]);
  });
});
