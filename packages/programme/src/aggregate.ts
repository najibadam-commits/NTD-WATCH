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
  type Kpis,
  type ProgrammeFilters,
  type ProgrammeRecords,
  type ProgrammeSummary,
  type QueryContext,
  type ReferralMonitor,
  type RiskCounts,
  type SignalDirection,
  type StageCounts,
  type VulnerabilityBand,
  type WashRates,
  type WeeklyPoint,
} from './types';

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

const emptyRisk = (): RiskCounts => ({ LOW: 0, MODERATE: 0, HIGH: 0, URGENT: 0 });
const emptyStages = (): StageCounts => ({
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
  byRisk: RiskCounts;
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

const signalCount = (b: RiskCounts) => b.HIGH + b.URGENT;

function direction(recent: number, previous: number): SignalDirection {
  if (recent - previous >= 2 && recent > previous * 1.5) return 'rising';
  if (previous - recent >= 2 && previous > recent * 1.5) return 'falling';
  return 'steady';
}

function stageCounts(referrals: readonly Referral[]): StageCounts {
  const c = emptyStages();
  for (const r of referrals) c[r.stage]++;
  return c;
}

/**
 * Counts below this are not published for the women-and-girls (FGS) module, because a count of
 * one or two can point at a single person. This is the small-cell suppression PATTERN for the
 * prototype. It is applied to FGS signal counts only; the general counts are synthetic and are not
 * suppressed. A real deployment needs a reviewed rule that also covers combinations of filters.
 */
export const SMALL_CELL_THRESHOLD = 5;

function symptomCounts(assessments: readonly Assessment[]): Record<string, number> {
  const counts: Record<string, number> = {};
  const fgsCounts: Record<string, number> = {};
  for (const a of assessments) {
    const target = a.module === 'FGS' ? fgsCounts : counts;
    for (const s of a.symptoms) target[s] = (target[s] ?? 0) + 1;
  }
  for (const [id, n] of Object.entries(fgsCounts)) {
    if (n >= SMALL_CELL_THRESHOLD) counts[id] = (counts[id] ?? 0) + n;
  }
  return counts;
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
): CommunityStat {
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

function weeklySeries(s: Slice, fromMs: number, toMs: number): WeeklyPoint[] {
  const points: WeeklyPoint[] = [];
  for (let w = weekStartMs(fromMs); w < toMs; w += WEEK) {
    const a = s.assessments.filter((x) => {
      const t = Date.parse(x.capturedAt);
      return t >= w && t < w + WEEK;
    });
    const r = s.referrals.filter((x) => {
      const t = referralCreatedMs(x);
      return t >= w && t < w + WEEK;
    });
    const { byRisk } = countRisk(a);
    points.push({
      weekStart: isoDate(w),
      assessments: a.length,
      byRisk,
      signals: signalCount(byRisk),
      referrals: r.length,
      vulnerabilityIndex: vulnerabilityIndex(a),
    });
  }
  return points;
}

/* ---------------------------------------------------------------- outputs */

function kpisFor(s: Slice, communities: CommunityStat[], ctx: QueryContext): Kpis {
  const { byRisk, unclassified } = countRisk(s.assessments);
  const highUrgent = signalCount(byRisk);
  return {
    assessments: s.assessments.length,
    highUrgent,
    highUrgentShare: s.assessments.length === 0 ? null : highUrgent / s.assessments.length,
    referrals: s.referrals.length,
    referralCompletion: completionRate(s.referrals.map((r) => r.stage)),
    unresolved: unresolvedCount(s.referrals, ctx),
    followUps: s.followUps.length,
    followUpsDue: communities.reduce((n, c) => n + c.followUpsDue, 0),
    followUpsWorse: s.followUps.filter((f) => f.condition === 'worse').length,
    activeChws: new Set(s.assessments.map((a) => a.chwId)).size,
    communitiesReporting: communities.filter((c) => c.assessments > 0).length,
    communitiesInScope: communities.length,
    unclassified,
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
  const { filters, clamped } = effectiveFilters(requested, scope);
  const communities = communitiesFor(filters, scope);
  const ids = new Set(communities.map((c) => c.id));
  const fromMs = dayStartMs(filters.from);
  const toMs = dayEndMs(filters.to);
  const s = slice(records, ids, fromMs, toMs);

  const stats = communities.map((c) => communityStat(c, s, toMs, ctx));
  const length = toMs - fromMs;
  const prev = slice(records, ids, fromMs - length, fromMs);
  const prevRisk = countRisk(prev.assessments).byRisk;

  return {
    demo: true,
    notice: SYNTHETIC_NOTICE,
    generatedAt: ctx.now.toISOString(),
    filters,
    clamped,
    scope,
    kpis: kpisFor(s, stats, ctx),
    previous: {
      from: isoDate(fromMs - length),
      to: isoDate(fromMs - DAY),
      assessments: prev.assessments.length,
      highUrgent: signalCount(prevRisk),
      referrals: prev.referrals.length,
    },
    byRisk: countRisk(s.assessments).byRisk,
    communities: stats,
    weekly: weeklySeries(s, fromMs, toMs),
    symptomCounts: symptomCounts(s.assessments),
    referralStages: stageCounts(s.referrals),
    dataSources: {
      seeded: s.assessments.filter((a) => isSeedKey(a.clientKey)).length,
      live: s.assessments.filter((a) => !isSeedKey(a.clientKey)).length,
    },
  };
}

/** One community's aggregates. Null when the community is outside the caller's scope. */
export function communityDetail(
  records: ProgrammeRecords,
  communityId: string,
  requested: ProgrammeFilters,
  scope: DataScope,
  ctx: QueryContext,
): CommunityDetail | null {
  checkDates(requested);
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
  return {
    demo: true,
    notice: SYNTHETIC_NOTICE,
    generatedAt: ctx.now.toISOString(),
    filters,
    stat: communityStat(community, s, toMs, ctx),
    weekly: weeklySeries(s, fromMs, toMs),
    symptomCounts: symptomCounts(s.assessments),
    referralStages: stageCounts(s.referrals),
    facilities: [...perFacility.entries()]
      .map(([facilityId, referrals]) => ({ facilityId, name: facilityName(facilityId), referrals }))
      .sort((a, b) => b.referrals - a.referrals),
  };
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function reachedCounts(referrals: readonly Referral[]): StageCounts {
  const c = emptyStages();
  for (const r of referrals) {
    for (const stage of REFERRAL_STAGES) {
      if (stageIndex(r.stage) >= stageIndex(stage)) c[stage]++;
    }
  }
  return c;
}

function facilityStat(
  facilityId: string,
  referrals: readonly Referral[],
  ctx: QueryContext,
): FacilityStat {
  const fac = DEMO_FACILITIES.find((f) => f.id === facilityId);
  return {
    facilityId,
    name: facilityName(facilityId),
    lgaId: fac?.lgaId ?? '',
    referrals: referrals.length,
    byStage: stageCounts(referrals),
    completionRate: completionRate(referrals.map((r) => r.stage)),
    unresolved: unresolvedCount(referrals, ctx),
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

  const ageing = [
    { label: '0–3 days', min: 0, max: 3 },
    { label: '4–7 days', min: 3, max: 7 },
    { label: '8–14 days', min: 7, max: 14 },
    { label: 'Over 14 days', min: 14, max: Infinity },
  ].map((band) => ({
    label: band.label,
    count: referrals.filter((r) => {
      if (stageIndex(r.stage) >= stageIndex('ASSESSED')) return false;
      const age = (ctx.now.getTime() - referralCreatedMs(r)) / DAY;
      return age > band.min && age <= band.max;
    }).length,
  }));

  const facilityIds = [...new Set(referrals.map((r) => r.facilityId))];
  const byFacility = facilityIds
    .map((id) =>
      facilityStat(
        id,
        referrals.filter((r) => r.facilityId === id),
        ctx,
      ),
    )
    .sort((a, b) => b.referrals - a.referrals);

  const lgaIds = [...new Set(byFacility.map((f) => f.lgaId))];
  const byLga = lgaIds
    .map((id) => {
      const inLga = referrals.filter(
        (r) => DEMO_FACILITIES.find((f) => f.id === r.facilityId)?.lgaId === id,
      );
      return {
        lgaId: id,
        name: lgaName(id),
        referrals: inLga.length,
        completionRate: completionRate(inLga.map((r) => r.stage)),
        unresolved: unresolvedCount(inLga, ctx),
      };
    })
    .sort((a, b) => b.referrals - a.referrals);

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
    total: referrals.length,
    current: stageCounts(referrals),
    reached: reachedCounts(referrals),
    completionRate: completionRate(referrals.map((r) => r.stage)),
    unresolved: unresolvedCount(referrals, ctx),
    ageing,
    byFacility,
    byLga,
    medianHoursToAccept: median(hoursToAccept),
    medianDaysToAssessed: median(daysToAssessed),
  };
}
