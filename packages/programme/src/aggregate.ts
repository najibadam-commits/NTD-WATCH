import {
  DEMO_COMMUNITIES,
  DEMO_CHWS,
  DEMO_FACILITIES,
  communityById,
  facilityName,
  lgaName,
  type DemoCommunity,
} from '@ntd-watch/demo-data';
import {
  REFERRAL_STAGES,
  type ReferralStage,
  SIGNAL_CATEGORIES,
  SIGNAL_CATEGORY_BY_LEVEL,
  completionRate,
  isHigherRisk,
  isUnresolved,
  stageIndex,
  type Assessment,
  type DataScope,
  type FollowUp,
  type Referral,
} from '@ntd-watch/domain';
import {
  SYNTHETIC_NOTICE,
  type CommunityDetail,
  type CommunityStat,
  type FacilityStat,
  type FgsAggregate,
  type Kpis,
  type ProgrammeFilters,
  type ProgrammeRecords,
  type ProgrammeSummary,
  type QueryContext,
  type ReferralMonitor,
  type RawRiskCounts,
  type RawStageCounts,
  type SignalDirection,
  type VulnerabilityBand,
  type WashRates,
  type WeeklyPoint,
} from './types';
import { signalBand, type SignalBand } from './priority';
import {
  SMALL_COUNT_THRESHOLD,
  isSmallCount,
  suppress,
  suppressRecord,
  publishTotal,
  type Count,
  type Part,
} from './suppression';
import {
  INTELLIGENCE_NOTE,
  INTELLIGENCE_THRESHOLD,
  intelligenceRow,
  rankIntelligence,
  type CommunityIntelligenceInput,
  type IntelligenceSummary,
} from './intelligence';

/** Fewer assessments than this and a community gets no vulnerability index. */
export const MIN_ASSESSMENTS_FOR_INDEX = 5;
export const DEFAULT_MAX_UNRESOLVED_DAYS = 7;
/** Length of the window compared with the one before it when judging whether signals are rising. */
export const SIGNAL_WINDOW_DAYS = 28;
/** Demonstration banding of the 0 to 100 index. Not a validated threshold. */
export const VULNERABILITY_BAND_LIMITS = { moderate: 30, high: 45 } as const;
const DAY = 86_400_000;
const WEEK = 7 * DAY;

export const isSeedKey = (clientKey: string) => clientKey.startsWith('seed-');

/**
 * A record created through the demonstration workflow that carries its own evidence of being a
 * demonstration record: a key that is not a generated seed key, the `demo` flag every stored
 * record must have (the mock API refuses anything else), and a demonstration rule set. The key
 * prefix alone is never enough. Read at run time, because stored data is not trusted to match
 * its type.
 */
export function isVerifiedDemoCreated(a: Assessment): boolean {
  return (
    !isSeedKey(a.clientKey) &&
    (a as { demo?: unknown }).demo === true &&
    typeof a.ruleSetId === 'string' &&
    a.ruleSetId.startsWith('demo-')
  );
}

/**
 * Demo-created count for the overview. When every non-seed assessment in the view is verified
 * demo-created, the count holds only synthetic demonstration records and is published as it
 * is, including 1 to 4: it describes nothing about real people. If even one non-seed record
 * cannot be verified, the existing small-count rule applies to the whole figure.
 */
function demoCreatedCount(nonSeed: Assessment[]): Count {
  return nonSeed.every(isVerifiedDemoCreated) ? nonSeed.length : suppress(nonSeed.length);
}

const emptyRisk = (): RawRiskCounts => ({ LOW: 0, MODERATE: 0, HIGH: 0, URGENT: 0 });
const emptyStages = (): RawStageCounts => ({
  GENERATED: 0,
  ACCEPTED: 0,
  PATIENT_ARRIVED: 0,
  ASSESSED: 0,
  FOLLOW_UP: 0,
  CLOSED: 0,
});

/* ---------------------------------------------------------------- dates */

export function dayStartMs(date: string): number {
  return Date.parse(`${date}T00:00:00.000Z`);
}
/** Exclusive end of an inclusive end date. */
export function dayEndMs(date: string): number {
  return dayStartMs(date) + DAY;
}
export function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
/** Monday (UTC) of the week containing the instant. */
export function weekStartMs(ms: number): number {
  const day = new Date(ms).getUTCDay(); // 0 = Sunday
  const back = (day + 6) % 7;
  return Date.UTC(
    new Date(ms).getUTCFullYear(),
    new Date(ms).getUTCMonth(),
    new Date(ms).getUTCDate() - back,
  );
}

export function isValidDate(date: unknown): date is string {
  return (
    typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(dayStartMs(date))
  );
}

/* ----------------------------------------------------------- filters/scope */

const inScope = (community: DemoCommunity, scope: DataScope): boolean => {
  switch (scope.kind) {
    case 'all':
      return true;
    case 'state':
      return community.stateId === scope.id;
    case 'lga':
      return community.lgaId === scope.id;
    case 'facility': {
      const fac = DEMO_FACILITIES.find((f) => f.id === scope.id);
      return fac ? community.lgaId === fac.lgaId : false;
    }
  }
};

/**
 * Applies the caller's scope to the requested filters. A filter outside the scope is dropped
 * and `clamped` is set, so a narrower role can never widen its view by asking.
 */
export function effectiveFilters(
  requested: ProgrammeFilters,
  scope: DataScope,
): { filters: ProgrammeFilters; clamped: boolean } {
  const filters: ProgrammeFilters = { ...requested };
  let clamped = false;
  const allowed = new Set(DEMO_COMMUNITIES.filter((c) => inScope(c, scope)).map((c) => c.id));
  const matches = (c: DemoCommunity) => allowed.has(c.id);

  const unknown = (key: 'stateId' | 'lgaId' | 'wardId' | 'communityId') => {
    delete filters[key];
    clamped = true;
  };
  if (filters.communityId) {
    const c = communityById(filters.communityId);
    if (!c || !matches(c)) unknown('communityId');
  }
  if (filters.wardId) {
    const some = DEMO_COMMUNITIES.some((c) => c.wardId === filters.wardId && matches(c));
    if (!some) unknown('wardId');
  }
  if (filters.lgaId) {
    const some = DEMO_COMMUNITIES.some((c) => c.lgaId === filters.lgaId && matches(c));
    if (!some) unknown('lgaId');
  }
  if (filters.stateId) {
    const some = DEMO_COMMUNITIES.some((c) => c.stateId === filters.stateId && matches(c));
    if (!some) unknown('stateId');
  }
  return { filters, clamped };
}

/** Communities that satisfy the (already scope-clamped) geographic filters AND the scope. */
export function communitiesFor(filters: ProgrammeFilters, scope: DataScope): DemoCommunity[] {
  return DEMO_COMMUNITIES.filter(
    (c) =>
      inScope(c, scope) &&
      (!filters.stateId || c.stateId === filters.stateId) &&
      (!filters.lgaId || c.lgaId === filters.lgaId) &&
      (!filters.wardId || c.wardId === filters.wardId) &&
      (!filters.communityId || c.id === filters.communityId),
  );
}

const referralCreatedMs = (r: Referral) => Date.parse(r.stageTimestamps[0]!);

interface Slice {
  assessments: Assessment[];
  referrals: Referral[];
  followUps: FollowUp[];
}

function slice(
  records: ProgrammeRecords,
  communityIds: ReadonlySet<string>,
  fromMs: number,
  toMs: number,
): Slice {
  const assessments = records.assessments.filter((a) => {
    const t = Date.parse(a.capturedAt);
    return communityIds.has(a.communityId) && t >= fromMs && t < toMs;
  });
  const referrals = records.referrals.filter((r) => {
    const t = referralCreatedMs(r);
    return communityIds.has(r.communityId) && t >= fromMs && t < toMs;
  });
  const communityOfAssessment = new Map(
    records.assessments.map((a) => [a.clientKey, a.communityId]),
  );
  const followUps = records.followUps.filter((f) => {
    const t = Date.parse(f.performedAt);
    const community = communityOfAssessment.get(f.assessmentKey);
    return community !== undefined && communityIds.has(community) && t >= fromMs && t < toMs;
  });
  return { assessments, referrals, followUps };
}

/* ------------------------------------------------------------ statistics */

function washRates(assessments: readonly Assessment[]): WashRates {
  const rate = (known: (a: Assessment) => boolean, positive: (a: Assessment) => boolean) => {
    const base = assessments.filter(known);
    return base.length === 0 ? null : base.filter(positive).length / base.length;
  };
  return {
    unimprovedWater: rate(
      (a) => a.wash.waterSource !== 'unknown',
      (a) => a.wash.waterSource === 'unimproved',
    ),
    noSanitation: rate(
      (a) => a.wash.sanitation !== 'unknown',
      (a) => a.wash.sanitation === 'none',
    ),
    noHandwashing: rate(
      (a) => a.wash.handwashing !== 'unknown',
      (a) => a.wash.handwashing === 'no',
    ),
    standingWater: rate(
      (a) => a.wash.standingWater !== 'unknown',
      (a) => a.wash.standingWater === 'yes',
    ),
  };
}

/** Mean of the available indicator rates times 100; null if the sample or the data is too thin. */
export function vulnerabilityIndex(assessments: readonly Assessment[]): number | null {
  if (assessments.length < MIN_ASSESSMENTS_FOR_INDEX) return null;
  const rates = Object.values(washRates(assessments)).filter((r): r is number => r !== null);
  if (rates.length < 3) return null;
  return Math.round((rates.reduce((s, r) => s + r, 0) / rates.length) * 1000) / 10;
}

export function vulnerabilityBand(index: number | null): VulnerabilityBand {
  if (index === null) return 'INSUFFICIENT_DATA';
  if (index >= VULNERABILITY_BAND_LIMITS.high) return 'HIGH';
  if (index >= VULNERABILITY_BAND_LIMITS.moderate) return 'MODERATE';
  return 'LOW';
}

function countRisk(assessments: readonly Assessment[]): {
  byRisk: RawRiskCounts;
  unclassified: number;
} {
  const byRisk = emptyRisk();
  let unclassified = 0;
  for (const a of assessments) {
    if (a.riskLevel) byRisk[a.riskLevel]++;
    else unclassified++;
  }
  return { byRisk, unclassified };
}

const signalCount = (b: RawRiskCounts) => b.HIGH + b.URGENT;

function direction(recent: number, previous: number): SignalDirection {
  if (recent - previous >= 2 && recent > previous * 1.5) return 'rising';
  if (previous - recent >= 2 && previous > recent * 1.5) return 'falling';
  return 'steady';
}

function stageCounts(referrals: readonly Referral[]): RawStageCounts {
  const c = emptyStages();
  for (const r of referrals) c[r.stage]++;
  return c;
}

/**
 * SMALL-CELL SUPPRESSION PATTERN (prototype). FGS counts below this are not published. The value 5
 * is a placeholder for demonstration. It is NOT a validated disclosure-control threshold, not a
 * regulatory requirement and not claimed to be appropriate everywhere; it needs privacy and
 * data-protection review before any real deployment.
 */
export const SMALL_CELL_THRESHOLD = INTELLIGENCE_THRESHOLD;

function symptomCounts(assessments: readonly Assessment[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const a of assessments) for (const s of a.symptoms) counts[s] = (counts[s] ?? 0) + 1;
  return counts;
}

const isFgs = (a: Assessment) => a.module === 'FGS';

/**
 * The records every GENERAL programme view is built from: women-and-girls (FGS) assessments, and
 * the referrals and follow-ups that belong to them, are removed. FGS reaches programme output only
 * through `fgsAggregate`, which suppresses small cells. Every public aggregate function starts
 * here, so an FGS record cannot leak through risk counts, weekly series, stage counts, facility
 * tables or any other general aggregate.
 */
export function generalView(records: ProgrammeRecords): ProgrammeRecords {
  const fgsKeys = new Set(records.assessments.filter(isFgs).map((a) => a.clientKey));
  if (fgsKeys.size === 0) return records;
  return {
    assessments: records.assessments.filter((a) => !fgsKeys.has(a.clientKey)),
    referrals: records.referrals.filter((r) => !fgsKeys.has(r.assessmentKey)),
    followUps: records.followUps.filter((f) => !fgsKeys.has(f.assessmentKey)),
  };
}

function fgsOnly(records: ProgrammeRecords): ProgrammeRecords {
  const fgsKeys = new Set(records.assessments.filter(isFgs).map((a) => a.clientKey));
  return {
    assessments: records.assessments.filter(isFgs),
    referrals: records.referrals.filter((r) => fgsKeys.has(r.assessmentKey)),
    followUps: records.followUps.filter((f) => fgsKeys.has(f.assessmentKey)),
  };
}

export const FGS_SUPPRESSION_NOTE = `Counts below ${SMALL_CELL_THRESHOLD} are not shown. Prototype suppression pattern only; requires privacy and data-protection review before real use.`;

const published = (n: number): number | null => (n >= SMALL_CELL_THRESHOLD ? n : null);

/**
 * Women-and-girls aggregate with small-cell suppression applied where the data leaves the
 * programme layer. No community breakdown is offered. If exactly one category cell is hidden, the
 * smallest visible non-zero cell is hidden too so the hidden value cannot be recovered from the
 * total. This does not defend against differencing across overlapping filters or time ranges.
 */
export function fgsAggregate(
  records: ProgrammeRecords,
  communityIds: ReadonlySet<string>,
  fromMs: number,
  toMs: number,
): FgsAggregate {
  const s = slice(fgsOnly(records), communityIds, fromMs, toMs);
  const total = s.assessments.length;
  const raw = Object.fromEntries(SIGNAL_CATEGORIES.map((c) => [c, 0])) as Record<
    (typeof SIGNAL_CATEGORIES)[number],
    number
  >;
  for (const a of s.assessments) if (a.riskLevel) raw[SIGNAL_CATEGORY_BY_LEVEL[a.riskLevel]]++;

  const totalShown = published(total);
  const cells = Object.fromEntries(
    SIGNAL_CATEGORIES.map((c) => [
      c,
      totalShown === null ? null : raw[c] === 0 ? 0 : published(raw[c]),
    ]),
  ) as FgsAggregate['byCategory'];
  const hidden = SIGNAL_CATEGORIES.filter((c) => cells[c] === null);
  if (totalShown !== null && hidden.length === 1) {
    const visible = SIGNAL_CATEGORIES.filter((c) => typeof cells[c] === 'number' && cells[c]! > 0);
    const smallest = visible.sort((a, b) => cells[a]! - cells[b]!)[0];
    if (smallest) cells[smallest] = null;
  }

  const signalCounts: Record<string, number> = {};
  for (const [id, n] of Object.entries(symptomCounts(s.assessments))) {
    const shown = published(n);
    if (shown !== null) signalCounts[id] = shown;
  }
  return {
    threshold: SMALL_CELL_THRESHOLD,
    note: FGS_SUPPRESSION_NOTE,
    assessments: totalShown,
    referrals: published(s.referrals.length),
    byCategory: cells,
    signalCounts: totalShown === null ? {} : signalCounts,
  };
}

/**
 * Community-level programme intelligence for the women-and-girls module. Takes FGS records only
 * to count them per community; what leaves this function is bands and ranges, never a record,
 * case code, response or exact count, and nothing at all below the threshold.
 */
export function communityIntelligence(
  records: ProgrammeRecords,
  communities: readonly Pick<
    RawCommunityStat,
    'communityId' | 'name' | 'stateId' | 'lgaId' | 'wardId' | 'vulnerabilityBand'
  >[],
  communityIds: ReadonlySet<string>,
  fromMs: number,
  toMs: number,
): IntelligenceSummary {
  const s = slice(fgsOnly(records), communityIds, fromMs, toMs);
  const rows = communities.map((c) => {
    const own = s.assessments.filter((a) => a.communityId === c.communityId);
    const input: CommunityIntelligenceInput = {
      communityId: c.communityId,
      name: c.name,
      stateId: c.stateId,
      lgaId: c.lgaId,
      wardId: c.wardId,
      washBand: c.vulnerabilityBand,
      observations: own.length,
      withSignal: own.filter((a) => a.riskLevel !== null && a.riskLevel !== 'LOW').length,
      withWaterContact: own.filter((a) => a.fgs?.exposure.includes('fgs_exp_freshwater')).length,
      withAccessBarrier: own.filter((a) => a.fgs?.context.includes('fgs_ctx_far')).length,
      weeksWithData: new Set(own.map((a) => weekStartMs(Date.parse(a.capturedAt)))).size,
    };
    return intelligenceRow(input);
  });
  return {
    demo: true,
    note: INTELLIGENCE_NOTE,
    threshold: INTELLIGENCE_THRESHOLD,
    rows: rankIntelligence(rows),
  };
}

/* ------------------------------------------------ exact (internal) and published shapes */

/** Exact figures for one community. Internal: suppressed by `publishCommunity` before it leaves. */
interface RawCommunityStat {
  communityId: string;
  name: string;
  stateId: string;
  lgaId: string;
  wardId: string;
  assessments: number;
  byRisk: RawRiskCounts;
  unclassified: number;
  signals: number;
  signalsRecent: number;
  signalsPrevious: number;
  direction: SignalDirection;
  referrals: number;
  referralsCompleted: number;
  unresolved: number;
  followUps: number;
  followUpsDue: number;
  wash: WashRates;
  vulnerabilityIndex: number | null;
  vulnerabilityBand: VulnerabilityBand;
  chwsAssigned: number;
  chwsActive: number;
}

interface RawWeeklyPoint {
  weekStart: string;
  assessments: number;
  unclassified: number;
  byRisk: RawRiskCounts;
  signals: number;
  referrals: number;
  vulnerabilityIndex: number | null;
}

/**
 * The risk-level cells of one group (a community, a week or the whole selection) plus the total
 * and the signal count they make up. Primary suppression hides each cell of 1 to 4. If exactly
 * one cell is hidden, the smallest visible non-zero cell is hidden as well, so the hidden value
 * cannot be recovered from the published total by subtraction. The total and the signal count are
 * then published by `publishTotal`, which withholds them when they would give a hidden cell away.
 */
function publishRiskGroup(
  byRisk: RawRiskCounts,
  unclassified: number,
  assessments: number,
  /** Lists (communities, weeks) that each risk level is also the sum of, as published. */
  lists: Partial<Record<keyof RawRiskCounts, Part[][]>> = {},
): {
  byRisk: Record<keyof RawRiskCounts, Count>;
  unclassified: Count;
  assessments: Count;
  signals: Count;
} {
  const cells: Record<string, Count> = {
    ...suppressRecord(byRisk),
    unclassified: suppress(unclassified),
  };
  // A risk level that is the sum of a list with a hidden row would give that row away.
  for (const k of Object.keys(lists) as (keyof RawRiskCounts)[]) {
    // A level with no records at all is a true zero whatever its rows show.
    cells[k] = byRisk[k] === 0 ? 0 : publishTotal(byRisk[k], ...(lists[k] ?? []));
  }
  const raw: Record<string, number> = { ...byRisk, unclassified };
  const hiddenKeys = Object.keys(cells).filter((k) => cells[k] === null);
  if (hiddenKeys.length === 1) {
    // One hidden cell would be the total minus the visible cells. Hide the smallest visible
    // non-zero cell as well, so a reader can only recover the sum of the two.
    const smallest = Object.keys(cells)
      .filter((k) => cells[k] !== null && raw[k]! > 0)
      .sort((x, y) => raw[x]! - raw[y]!)[0];
    if (smallest) cells[smallest] = null;
  }
  const parts = (keys: string[]) => keys.map((k) => ({ raw: raw[k]!, shown: cells[k]! }));
  // With no visible non-zero cell left to hide, a lone hidden cell cannot be protected: hide the total.
  let total = publishTotal(assessments, parts(Object.keys(cells)));
  const signals = publishTotal(byRisk.HIGH + byRisk.URGENT, parts(['HIGH', 'URGENT']));
  // Two published sums overlap: the total contains the signals. Their difference is the count of
  // everything that is not a signal (LOW, MODERATE and unclassified), so that difference must
  // itself be safe to publish. Otherwise a reader subtracts the signals from the total and
  // recovers the hidden cells behind it. Withhold the total in that case.
  if (total !== null && signals !== null) {
    const rest = ['LOW', 'MODERATE', 'unclassified'];
    const restRaw = rest.reduce((n, k) => n + raw[k]!, 0);
    if (publishTotal(restRaw, parts(rest)) === null && restRaw !== 0) total = null;
  }
  const { unclassified: unc, ...risk } = cells;
  const riskCells = risk as Record<keyof RawRiskCounts, Count>;
  return {
    byRisk: riskCells,
    unclassified: unc ?? null,
    assessments: total,
    signals,
  };
}

const publishStages = (raw: RawStageCounts) => suppressRecord(raw);

/**
 * The signal band, worked out from the exact counts, unless it would narrow a hidden signals
 * count. When the signals figure is not shown it could be any of 1 to 4; if those values would
 * not all give the same band, the band published beside it would tell a reader which of them it
 * is (for example 8 assessments: 1 signal is MODERATE, 2 to 4 are HIGH). The band is then
 * withheld (INSUFFICIENT_DATA). Where every candidate gives the same band, it is published.
 * A band that differs from that uniform band still shows the count is not 1 to 4: documented.
 */
function publishedSignalBand(signals: number, assessments: number, shown: Count): SignalBand {
  if (shown !== null) return signalBand(signals, assessments);
  const candidates = new Set([1, 2, 3, 4].map((v) => signalBand(v, assessments)));
  return candidates.size > 1 ? 'INSUFFICIENT_DATA' : signalBand(signals, assessments);
}

function publishCommunity(c: RawCommunityStat): CommunityStat {
  const g = publishRiskGroup(c.byRisk, c.unclassified, c.assessments);
  const recent = suppress(c.signalsRecent);
  const previous = suppress(c.signalsPrevious);
  return {
    communityId: c.communityId,
    name: c.name,
    stateId: c.stateId,
    lgaId: c.lgaId,
    wardId: c.wardId,
    assessments: g.assessments,
    byRisk: g.byRisk,
    unclassified: g.unclassified,
    signals: g.signals,
    signalsRecent: recent,
    signalsPrevious: previous,
    // Derived from the exact windows, like signalBand. See suppression.ts, "Known limits".
    direction: c.direction,
    signalBand: publishedSignalBand(c.signals, c.assessments, g.signals),
    referrals: suppress(c.referrals),
    // referrals minus completed is a count of its own: do not let two published numbers give it away.
    referralsCompleted: isSmallCount(c.referrals - c.referralsCompleted)
      ? null
      : suppress(c.referralsCompleted),
    unresolved: suppress(c.unresolved),
    followUps: suppress(c.followUps),
    followUpsDue: suppress(c.followUpsDue),
    wash: c.wash,
    vulnerabilityIndex: c.vulnerabilityIndex,
    vulnerabilityBand: c.vulnerabilityBand,
    chwsAssigned: c.chwsAssigned,
    chwsActive: c.chwsActive,
  };
}

function publishWeekly(w: RawWeeklyPoint): WeeklyPoint {
  const g = publishRiskGroup(w.byRisk, w.unclassified, w.assessments);
  return {
    weekStart: w.weekStart,
    assessments: g.assessments,
    byRisk: g.byRisk,
    signals: g.signals,
    referrals: suppress(w.referrals),
    vulnerabilityIndex: w.vulnerabilityIndex,
  };
}

/**
 * The weekly series, with secondary suppression: if one week is hidden, another is hidden with
 * its risk-level cells, so the weeks cannot be added up and taken from the overall total.
 */
function publishWeeks(raw: readonly RawWeeklyPoint[]): WeeklyPoint[] {
  const weeks = raw.map(publishWeekly);
  const paired = weeks.map((w, i) => ({ w, raw: raw[i]! }));
  const hideRisk = (r: (typeof paired)[number]) => {
    r.w.assessments = null;
    r.w.signals = null;
    r.w.byRisk = { LOW: null, MODERATE: null, HIGH: null, URGENT: null };
  };
  // Every column of the risk detail is a list that adds up to a figure published elsewhere (the
  // summary total, signals and risk bars). Hiding a second week for one column changes the others,
  // so repeat until no column has a lone hidden week.
  const columns: {
    raw: (r: (typeof paired)[number]) => number;
    shown: (r: (typeof paired)[number]) => Count;
  }[] = [
    { raw: (r) => r.raw.assessments, shown: (r) => r.w.assessments },
    { raw: (r) => r.raw.byRisk.HIGH + r.raw.byRisk.URGENT, shown: (r) => r.w.signals },
    ...(['LOW', 'MODERATE', 'HIGH', 'URGENT'] as const).map((k) => ({
      raw: (r: (typeof paired)[number]) => r.raw.byRisk[k],
      shown: (r: (typeof paired)[number]) => r.w.byRisk[k],
    })),
  ];
  for (let pass = 0; pass < paired.length + 1; pass++) {
    const before = paired.filter((r) => r.w.assessments === null).length;
    for (const col of columns) {
      complementAcross(paired, {
        raw: col.raw,
        shown: col.shown,
        hide: hideRisk,
        // Only the assessments column may prefer a week whose own cells cannot rebuild it; the
        // signals and risk columns are rebuilt from the same cells, so any week must do.
        prefer: col === columns[0] ? (r) => anyRiskCellHidden(r.w.byRisk) : undefined,
      });
    }
    if (paired.filter((r) => r.w.assessments === null).length === before) break;
  }
  complementAcross(paired, {
    raw: (r) => r.raw.referrals,
    shown: (r) => r.w.referrals,
    hide: (r) => {
      r.w.referrals = null;
    },
  });
  return weeks;
}

/** Symptom counts: below-threshold symptoms are `null` (not shown); a symptom never seen is absent. */
const publishSymptoms = (raw: Record<string, number>): Record<string, Count> =>
  Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, suppress(v)]));

/**
 * Percent of referrals that reached ASSESSED or beyond, published only when it cannot hand over a
 * small count. A percentage of a published total pins the split: 1 of 5 is 20%, 38 of 40 is 95%.
 * So it is withheld when either side of the split (assessed or beyond, and the rest) is 1 to 4.
 */
function publishedCompletion(stages: readonly ReferralStage[], shownTotal: Count): number | null {
  if (shownTotal === null) return null;
  const done = stages.filter((st) => stageIndex(st) >= stageIndex('ASSESSED')).length;
  if (isSmallCount(done) || isSmallCount(stages.length - done)) return null;
  return completionRate(stages);
}

function unresolvedCount(referrals: readonly Referral[], ctx: QueryContext): number {
  return referrals.filter((r) =>
    isUnresolved(r.stage, new Date(referralCreatedMs(r)), ctx.now, ctx.maxUnresolvedDays),
  ).length;
}

function communityStat(
  community: DemoCommunity,
  s: Slice,
  toMs: number,
  ctx: QueryContext,
): RawCommunityStat {
  const a = s.assessments.filter((x) => x.communityId === community.id);
  const r = s.referrals.filter((x) => x.communityId === community.id);
  const { byRisk, unclassified } = countRisk(a);
  const recentFrom = toMs - SIGNAL_WINDOW_DAYS * DAY;
  const previousFrom = toMs - 2 * SIGNAL_WINDOW_DAYS * DAY;
  const sig = (from: number, to: number) =>
    a.filter(
      (x) =>
        x.riskLevel !== null &&
        isHigherRisk(x.riskLevel) &&
        Date.parse(x.capturedAt) >= from &&
        Date.parse(x.capturedAt) < to,
    ).length;
  const recent = sig(recentFrom, toMs);
  const previous = sig(previousFrom, recentFrom);
  const index = vulnerabilityIndex(a);
  const keys = new Set([...a.map((x) => x.clientKey), ...r.map((x) => x.assessmentKey)]);
  const fu = s.followUps.filter((f) => keys.has(f.assessmentKey));
  const followed = new Set(fu.map((f) => f.assessmentKey));
  const followUpsDue = r.filter(
    (x) => stageIndex(x.stage) >= stageIndex('ASSESSED') && !followed.has(x.assessmentKey),
  ).length;
  const assigned = DEMO_CHWS.filter((c) => c.communityId === community.id);
  return {
    communityId: community.id,
    name: community.name,
    stateId: community.stateId,
    lgaId: community.lgaId,
    wardId: community.wardId,
    assessments: a.length,
    byRisk,
    unclassified,
    signals: signalCount(byRisk),
    signalsRecent: recent,
    signalsPrevious: previous,
    direction: direction(recent, previous),
    referrals: r.length,
    referralsCompleted: r.filter((x) => stageIndex(x.stage) >= stageIndex('ASSESSED')).length,
    unresolved: unresolvedCount(r, ctx),
    followUps: fu.length,
    followUpsDue,
    wash: washRates(a),
    vulnerabilityIndex: index,
    vulnerabilityBand: vulnerabilityBand(index),
    chwsAssigned: assigned.length,
    chwsActive: new Set(a.map((x) => x.chwId)).size,
  };
}

function weeklySeries(s: Slice, fromMs: number, toMs: number): RawWeeklyPoint[] {
  const points: RawWeeklyPoint[] = [];
  for (let w = weekStartMs(fromMs); w < toMs; w += WEEK) {
    const a = s.assessments.filter((x) => {
      const t = Date.parse(x.capturedAt);
      return t >= w && t < w + WEEK;
    });
    const r = s.referrals.filter((x) => {
      const t = referralCreatedMs(x);
      return t >= w && t < w + WEEK;
    });
    const { byRisk, unclassified } = countRisk(a);
    points.push({
      weekStart: isoDate(w),
      assessments: a.length,
      unclassified,
      byRisk,
      signals: signalCount(byRisk),
      referrals: r.length,
      vulnerabilityIndex: vulnerabilityIndex(a),
    });
  }
  return points;
}

/* ---------------------------------------------------------------- outputs */

/**
 * Headline figures. Every total is published only if each community figure it is the sum of is
 * published, and only if the risk-level cells it is made of are, so the total cannot be used to
 * recover a hidden community or risk cell by subtraction.
 */
function kpisFor(
  s: Slice,
  raw: readonly RawCommunityStat[],
  communities: readonly CommunityStat[],
  ctx: QueryContext,
): Kpis {
  const { byRisk, unclassified } = countRisk(s.assessments);
  const risk = publishRiskGroup(byRisk, unclassified, s.assessments.length);
  const over = (rawOf: (c: RawCommunityStat) => number, shownOf: (c: CommunityStat) => Count) =>
    raw.map((c, i) => ({ raw: rawOf(c), shown: shownOf(communities[i]!) }));
  const riskParts = (get: (r: typeof byRisk) => number[], shown: Count[]) =>
    get(byRisk).map((v, i) => ({ raw: v, shown: shown[i]! }));
  const highUrgentRaw = signalCount(byRisk);
  const highUrgent = publishTotal(
    highUrgentRaw,
    over(
      (c) => c.signals,
      (c) => c.signals,
    ),
    riskParts((r) => [r.HIGH, r.URGENT], [risk.byRisk.HIGH, risk.byRisk.URGENT]),
  );
  const referralsRaw = s.referrals.length;
  const stageRaw = stageCounts(s.referrals);
  const stageShown = publishStages(stageRaw);
  const referrals = publishTotal(
    referralsRaw,
    over(
      (c) => c.referrals,
      (c) => c.referrals,
    ),
    (Object.keys(stageRaw) as (keyof typeof stageRaw)[]).map((k) => ({
      raw: stageRaw[k],
      shown: stageShown[k],
    })),
  );
  const assessments = publishTotal(
    s.assessments.length,
    over(
      (c) => c.assessments,
      (c) => c.assessments,
    ),
    [
      ...(Object.keys(byRisk) as (keyof typeof byRisk)[]).map((k) => ({
        raw: byRisk[k],
        shown: risk.byRisk[k],
      })),
      { raw: unclassified, shown: risk.unclassified },
    ],
  );
  const followUpsDueRaw = raw.reduce((n, c) => n + c.followUpsDue, 0);
  return {
    assessments,
    highUrgent,
    highUrgentShare:
      highUrgent === null || assessments === null || s.assessments.length === 0
        ? null
        : highUrgentRaw / s.assessments.length,
    referrals,
    referralCompletion: publishedCompletion(
      s.referrals.map((r) => r.stage),
      referrals,
    ),
    unresolved: publishTotal(
      unresolvedCount(s.referrals, ctx),
      over(
        (c) => c.unresolved,
        (c) => c.unresolved,
      ),
    ),
    followUps: publishTotal(
      s.followUps.length,
      over(
        (c) => c.followUps,
        (c) => c.followUps,
      ),
    ),
    followUpsDue: publishTotal(
      followUpsDueRaw,
      over(
        (c) => c.followUpsDue,
        (c) => c.followUpsDue,
      ),
    ),
    followUpsWorse: suppress(s.followUps.filter((f) => f.condition === 'worse').length),
    activeChws: new Set(s.assessments.map((a) => a.chwId)).size,
    communitiesReporting: raw.filter((c) => c.assessments > 0).length,
    communitiesInScope: communities.length,
    unclassified: publishTotal(
      unclassified,
      over(
        (c) => c.unclassified,
        (c) => c.unclassified,
      ),
    ),
  };
}

function checkDates(filters: ProgrammeFilters): void {
  if (!isValidDate(filters.from) || !isValidDate(filters.to)) {
    throw new RangeError('from and to must be dates in the form YYYY-MM-DD.');
  }
  if (dayStartMs(filters.from) > dayStartMs(filters.to)) {
    throw new RangeError('The start date must not be after the end date.');
  }
}

/** Everything the overview, map, signals, vulnerability and trends views need. Aggregates only. */
export function summarise(
  records: ProgrammeRecords,
  requested: ProgrammeFilters,
  scope: DataScope,
  ctx: QueryContext,
): ProgrammeSummary {
  checkDates(requested);
  const all = records;
  records = generalView(records);
  const { filters, clamped } = effectiveFilters(requested, scope);
  const communities = communitiesFor(filters, scope);
  const ids = new Set(communities.map((c) => c.id));
  const fromMs = dayStartMs(filters.from);
  const toMs = dayEndMs(filters.to);
  const s = slice(records, ids, fromMs, toMs);

  const rawStats = communities.map((c) => communityStat(c, s, toMs, ctx));
  const stats = rawStats.map(publishCommunity);
  const paired = stats.map((st, i) => ({ st, raw: rawStats[i]! }));
  for (const key of [
    'assessments',
    'signals',
    'referrals',
    'unresolved',
    'followUps',
    'followUpsDue',
  ] as const) {
    complementAcross(paired, {
      raw: (r) => r.raw[key],
      shown: (r) => r.st[key],
      hide: (r) => {
        r.st[key] = null;
      },
      // For the headline counts only rows with a hidden risk cell of their own: a row whose
      // cells are all visible could be added back up from them.
      prefer:
        key === 'assessments' || key === 'signals'
          ? (r) => anyRiskCellHidden(r.st.byRisk)
          : undefined,
    });
  }
  const length = toMs - fromMs;
  const prev = slice(records, ids, fromMs - length, fromMs);
  const prevCounts = countRisk(prev.assessments);
  const prevRisk = publishRiskGroup(
    prevCounts.byRisk,
    prevCounts.unclassified,
    prev.assessments.length,
  );
  const nowCounts = countRisk(s.assessments);
  const rawWeeks = weeklySeries(s, fromMs, toMs);
  const weekly = publishWeeks(rawWeeks);
  const levels = ['LOW', 'MODERATE', 'HIGH', 'URGENT'] as const;
  const lists = Object.fromEntries(
    levels.map((k) => [
      k,
      [
        paired.map((r) => ({ raw: r.raw.byRisk[k], shown: r.st.byRisk[k] })),
        rawWeeks.map((w, i) => ({ raw: w.byRisk[k], shown: weekly[i]!.byRisk[k] })),
      ],
    ]),
  );
  const nowRisk = publishRiskGroup(
    nowCounts.byRisk,
    nowCounts.unclassified,
    s.assessments.length,
    lists,
  );

  return {
    demo: true,
    notice: SYNTHETIC_NOTICE,
    generatedAt: ctx.now.toISOString(),
    filters,
    clamped,
    scope,
    kpis: kpisFor(s, rawStats, stats, ctx),
    previous: {
      from: isoDate(fromMs - length),
      to: isoDate(fromMs - DAY),
      assessments: prevRisk.assessments,
      highUrgent: prevRisk.signals,
      referrals: suppress(prev.referrals.length),
    },
    byRisk: nowRisk.byRisk,
    communities: stats,
    weekly,
    symptomCounts: publishSymptoms(symptomCounts(s.assessments)),
    referralStages: publishStages(stageCounts(s.referrals)),
    fgs: fgsAggregate(all, ids, fromMs, toMs),
    intelligence: communityIntelligence(all, rawStats, ids, fromMs, toMs),
    dataSources: {
      seeded: suppress(s.assessments.filter((a) => isSeedKey(a.clientKey)).length),
      live: demoCreatedCount(s.assessments.filter((a) => !isSeedKey(a.clientKey))),
    },
  };
}

/**
 * Secondary (complementary) suppression across a list. If exactly one row of a column is hidden,
 * the overall total minus the visible rows would be that row, and the overall total is usually
 * public elsewhere (the risk-level bars add up to it). So the smallest other row that still has
 * a hidden neighbour of its own is hidden too, and a reader can only recover the sum of the two.
 * `prefer` limits the choice to rows whose value cannot be rebuilt from their own visible cells.
 * When no such row exists nothing is added, and the total itself stays withheld (`publishTotal`).
 */
function complementAcross<T>(
  rows: readonly T[],
  o: {
    raw: (t: T) => number;
    shown: (t: T) => Count;
    hide: (t: T) => void;
    prefer?: (t: T) => boolean;
  },
): void {
  if (rows.filter((t) => o.shown(t) === null).length !== 1) return;
  const pool = rows.filter(
    (t) => o.shown(t) !== null && o.raw(t) > 0 && (o.prefer ? o.prefer(t) : true),
  );
  const pick = pool.sort((a, b) => o.raw(a) - o.raw(b))[0];
  if (pick) o.hide(pick);
}

const anyRiskCellHidden = (b: Record<string, Count>) => Object.values(b).some((v) => v === null);

/** One community's aggregates. Null when the community is outside the caller's scope. */
export function communityDetail(
  records: ProgrammeRecords,
  communityId: string,
  requested: ProgrammeFilters,
  scope: DataScope,
  ctx: QueryContext,
): CommunityDetail | null {
  checkDates(requested);
  const all = records;
  records = generalView(records);
  const community = communityById(communityId);
  if (!community || !inScope(community, scope)) return null;
  const filters: ProgrammeFilters = {
    from: requested.from,
    to: requested.to,
    communityId,
  };
  const fromMs = dayStartMs(filters.from);
  const toMs = dayEndMs(filters.to);
  const s = slice(records, new Set([communityId]), fromMs, toMs);
  const perFacility = new Map<string, number>();
  for (const r of s.referrals)
    perFacility.set(r.facilityId, (perFacility.get(r.facilityId) ?? 0) + 1);
  const rawStat = communityStat(community, s, toMs, ctx);
  const stat = publishCommunity(rawStat);
  const stageCells = publishStages(stageCounts(s.referrals));
  const facilities = [...perFacility.entries()]
    .map(([facilityId, referrals]) => ({
      facilityId,
      name: facilityName(facilityId),
      raw: referrals,
      referrals: suppress(referrals),
    }))
    .sort((a, b) => b.raw - a.raw || a.name.localeCompare(b.name));
  const stageRaw = stageCounts(s.referrals);
  stat.referrals = publishTotal(
    rawStat.referrals,
    (Object.keys(stageRaw) as (keyof typeof stageRaw)[]).map((k) => ({
      raw: stageRaw[k],
      shown: stageCells[k],
    })),
    facilities.map((f) => ({ raw: f.raw, shown: f.referrals })),
  );
  // "Assessed or beyond" is the sum of the later stages, and the remainder is the sum of the
  // earlier ones, so it is withheld unless both sums are safe to publish.
  const assessedAt = stageIndex('ASSESSED');
  const stagePart = (keep: (i: number) => boolean) =>
    REFERRAL_STAGES.filter((_, i) => keep(i)).map((st) => ({
      raw: stageRaw[st],
      shown: stageCells[st],
    }));
  const rawLater = stagePart((i) => i >= assessedAt).reduce((n, p) => n + p.raw, 0);
  const rawEarlier = stagePart((i) => i < assessedAt).reduce((n, p) => n + p.raw, 0);
  if (
    publishTotal(
      rawLater,
      stagePart((i) => i >= assessedAt),
    ) === null ||
    publishTotal(
      rawEarlier,
      stagePart((i) => i < assessedAt),
    ) === null
  ) {
    stat.referralsCompleted = null;
  }
  return {
    demo: true,
    notice: SYNTHETIC_NOTICE,
    generatedAt: ctx.now.toISOString(),
    filters,
    stat,
    weekly: publishWeeks(weeklySeries(s, fromMs, toMs)),
    symptomCounts: publishSymptoms(symptomCounts(s.assessments)),
    referralStages: stageCells,
    fgs: fgsAggregate(all, new Set([communityId]), fromMs, toMs),
    facilities: facilities.map(({ facilityId, name, referrals }) => ({
      facilityId,
      name,
      referrals,
    })),
  };
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function reachedCounts(referrals: readonly Referral[]): RawStageCounts {
  const c = emptyStages();
  for (const r of referrals) {
    for (const stage of REFERRAL_STAGES) {
      if (stageIndex(r.stage) >= stageIndex(stage)) c[stage]++;
    }
  }
  return c;
}

/**
 * Cumulative "reached this stage or beyond" counts. Each one is the sum of the current-stage
 * counts from that stage onwards, so two neighbouring cumulative counts differ by exactly one
 * current-stage count. Whenever a current-stage count is hidden, every cumulative count at or
 * before it is hidden too, so the hidden count cannot be recovered by subtracting them.
 */
function publishReached(
  reached: RawStageCounts,
  currentShown: ReturnType<typeof publishStages>,
): ReturnType<typeof publishStages> {
  const lastHidden = REFERRAL_STAGES.reduce(
    (idx, st, i) => (currentShown[st] === null ? i : idx),
    -1,
  );
  return Object.fromEntries(
    REFERRAL_STAGES.map((st, i) => [st, i <= lastHidden ? null : suppress(reached[st])]),
  ) as ReturnType<typeof publishStages>;
}

function facilityStat(
  facilityId: string,
  referrals: readonly Referral[],
  ctx: QueryContext,
): FacilityStat & { rawReferrals: number } {
  const fac = DEMO_FACILITIES.find((f) => f.id === facilityId);
  const stageRaw = stageCounts(referrals);
  const byStage = publishStages(stageRaw);
  const total = publishTotal(
    referrals.length,
    (Object.keys(stageRaw) as (keyof typeof stageRaw)[]).map((k) => ({
      raw: stageRaw[k],
      shown: byStage[k],
    })),
  );
  return {
    facilityId,
    name: facilityName(facilityId),
    lgaId: fac?.lgaId ?? '',
    referrals: total,
    rawReferrals: referrals.length,
    byStage,
    completionRate: publishedCompletion(
      referrals.map((r) => r.stage),
      total,
    ),
    unresolved: suppress(unresolvedCount(referrals, ctx)),
  };
}

/**
 * Referral monitoring. Aggregated by stage, facility, LGA and age; it never lists a person or
 * a single referral. A facility-scoped caller sees only referrals sent to its own facility.
 */
export function monitorReferrals(
  records: ProgrammeRecords,
  requested: ProgrammeFilters,
  scope: DataScope,
  ctx: QueryContext,
): ReferralMonitor {
  checkDates(requested);
  records = generalView(records);
  const { filters, clamped } = effectiveFilters(requested, scope);
  const fromMs = dayStartMs(filters.from);
  const toMs = dayEndMs(filters.to);
  // A facility sees its own referrals wherever they come from; others are bound by geography.
  const geoIds =
    scope.kind === 'facility'
      ? new Set(DEMO_COMMUNITIES.map((c) => c.id))
      : new Set(communitiesFor(filters, scope).map((c) => c.id));
  let referrals = records.referrals.filter((r) => {
    const t = referralCreatedMs(r);
    return geoIds.has(r.communityId) && t >= fromMs && t < toMs;
  });
  if (scope.kind === 'facility') referrals = referrals.filter((r) => r.facilityId === scope.id);

  const ageingRaw = [
    { label: '0–3 days', min: 0, max: 3 },
    { label: '4–7 days', min: 3, max: 7 },
    { label: '8–14 days', min: 7, max: 14 },
    { label: 'Over 14 days', min: 14, max: Infinity },
  ].map((band) => ({
    label: band.label,
    raw: referrals.filter((r) => {
      if (stageIndex(r.stage) >= stageIndex('ASSESSED')) return false;
      const age = (ctx.now.getTime() - referralCreatedMs(r)) / DAY;
      return age > band.min && age <= band.max;
    }).length,
  }));
  const ageing = ageingRaw.map((b) => ({ label: b.label, count: suppress(b.raw) }));
  const ageingParts = ageingRaw.map((b, i) => ({ raw: b.raw, shown: ageing[i]!.count }));

  const facilityIds = [...new Set(referrals.map((r) => r.facilityId))];
  const facilityRows = facilityIds
    .map((id) =>
      facilityStat(
        id,
        referrals.filter((r) => r.facilityId === id),
        ctx,
      ),
    )
    .sort((a, b) => b.rawReferrals - a.rawReferrals || a.name.localeCompare(b.name));
  complementAcross(facilityRows, {
    raw: (f) => f.rawReferrals,
    shown: (f) => f.referrals,
    hide: (f) => {
      f.referrals = null;
      f.completionRate = null;
    },
    prefer: (f) => anyRiskCellHidden(f.byStage),
  });
  const byFacility: FacilityStat[] = facilityRows.map(({ rawReferrals: _raw, ...rest }) => rest);

  const lgaIds = [...new Set(byFacility.map((f) => f.lgaId))];
  const lgaRows = lgaIds
    .map((id) => {
      const inLga = referrals.filter(
        (r) => DEMO_FACILITIES.find((f) => f.id === r.facilityId)?.lgaId === id,
      );
      const shown = suppress(inLga.length);
      return {
        raw: inLga.length,
        lgaId: id,
        name: lgaName(id),
        referrals: shown,
        completionRate: publishedCompletion(
          inLga.map((r) => r.stage),
          shown,
        ),
        unresolved: suppress(unresolvedCount(inLga, ctx)),
      };
    })
    .sort((a, b) => b.raw - a.raw || a.name.localeCompare(b.name));
  complementAcross(lgaRows, {
    raw: (l) => l.raw,
    shown: (l) => l.referrals,
    hide: (l) => {
      l.referrals = null;
      l.completionRate = null;
    },
  });
  const byLga = lgaRows.map(({ raw: _raw, ...rest }) => rest);
  const currentRaw = stageCounts(referrals);
  const current = publishStages(currentRaw);
  const total = publishTotal(
    referrals.length,
    (Object.keys(currentRaw) as (keyof typeof currentRaw)[]).map((k) => ({
      raw: currentRaw[k],
      shown: current[k],
    })),
    byFacility.map((f, i) => ({ raw: facilityRows[i]!.rawReferrals, shown: f.referrals })),
    lgaRows.map((l, i) => ({ raw: l.raw, shown: byLga[i]!.referrals })),
  );

  const reached = publishReached(reachedCounts(referrals), current);
  // Referrals not yet assessed are total minus completed. If that is a hidden small cell the
  // completion percentage would give it away, so the percentage is withheld.
  const assessedIdx0 = stageIndex('ASSESSED');
  const preAssessed = publishTotal(
    REFERRAL_STAGES.filter((_, i) => i < assessedIdx0).reduce((n, st) => n + currentRaw[st], 0),
    REFERRAL_STAGES.filter((_, i) => i < assessedIdx0).map((st) => ({
      raw: currentRaw[st],
      shown: current[st],
    })),
  );
  const hoursToAccept = referrals
    .filter((r) => r.stageTimestamps.length >= 2)
    .map(
      (r) => (Date.parse(r.stageTimestamps[1]!) - Date.parse(r.stageTimestamps[0]!)) / 3_600_000,
    );
  const assessedIdx = stageIndex('ASSESSED');
  const daysToAssessed = referrals
    .filter((r) => r.stageTimestamps.length > assessedIdx)
    .map((r) => (Date.parse(r.stageTimestamps[assessedIdx]!) - referralCreatedMs(r)) / DAY);

  return {
    demo: true,
    notice: SYNTHETIC_NOTICE,
    generatedAt: ctx.now.toISOString(),
    filters,
    clamped,
    scope,
    maxUnresolvedDays: ctx.maxUnresolvedDays,
    total,
    current,
    reached,
    completionRate:
      reached.ASSESSED === null || preAssessed === null
        ? null
        : publishedCompletion(
            referrals.map((r) => r.stage),
            total,
          ),
    unresolved: publishTotal(unresolvedCount(referrals, ctx), ageingParts),
    ageing,
    byFacility,
    byLga,
    // A median of fewer than the threshold values would describe individual referrals.
    medianHoursToAccept:
      hoursToAccept.length < SMALL_COUNT_THRESHOLD ? null : median(hoursToAccept),
    medianDaysToAssessed:
      daysToAssessed.length < SMALL_COUNT_THRESHOLD ? null : median(daysToAssessed),
  };
}
