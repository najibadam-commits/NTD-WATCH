import { DEMO_FACILITIES, facilityCapability } from '@ntd-watch/demo-data';
import type { VulnerabilityBand } from './types';

/**
 * COMMUNITY INTELLIGENCE (P2): a deterministic, explainable programme-prioritisation pattern for
 * the women-and-girls module. PROTOTYPE ON SYNTHETIC DATA.
 *
 * This is NOT a validated epidemiological model. It does not diagnose disease, does not estimate
 * prevalence and does not say any community "has" a condition. Its categories are PROGRAMME
 * PRIORITY categories (where a human might look first for further review, outreach, referral
 * strengthening or further assessment). They are deliberately not named Low/Moderate/High/Urgent,
 * which are the case-level non-diagnostic referral categories in the CHW workflow.
 *
 * Every limit below is a demonstration setting chosen for the prototype. None is derived from
 * WHO or national guidance or validated against any real data. They must be agreed with
 * programme and clinical stakeholders before any real use.
 *
 * PRIVACY: this module only receives community-level counts and returns community-level bands.
 * It never sees a participant, a case code or a response. Exact counts are not published: below
 * the threshold nothing is shown, and above it the number of observations is a coarse range.
 */

export const INTELLIGENCE_THRESHOLD = 5;

export const PROGRAMME_PRIORITIES = [
  'HIGH_PRIORITY_FOR_ATTENTION',
  'PRIORITY_FOR_REVIEW',
  'MONITOR',
  'LOW_PRIORITY',
  'INSUFFICIENT_DATA',
] as const;
export type ProgrammePriority = (typeof PROGRAMME_PRIORITIES)[number];

export const PRIORITY_RANK: Record<ProgrammePriority, number> = {
  HIGH_PRIORITY_FOR_ATTENTION: 0,
  PRIORITY_FOR_REVIEW: 1,
  MONITOR: 2,
  LOW_PRIORITY: 3,
  INSUFFICIENT_DATA: 4,
};

export type SignalActivity = 'LOW' | 'MODERATE' | 'ELEVATED' | 'NOT_SHOWN';
export type DimensionBand = 'LOW' | 'MODERATE' | 'HIGH' | 'NOT_SHOWN';
export type DataConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT';
export type ObservationRange = 'UNDER_THRESHOLD' | '5_9' | '10_19' | '20_49' | '50_PLUS';

/** Demonstration limits. Not epidemiological thresholds. */
export const INTELLIGENCE_LIMITS = {
  /** Share of observations with a signal above "no priority signal". */
  signalModerate: 0.15,
  signalElevated: 0.35,
  /** Share reporting freshwater contact, or a barrier to visiting a facility. */
  contextModerate: 0.25,
  contextHigh: 0.5,
  /** Overall contextual vulnerability, as a share of the points available. */
  vulnerabilityModerate: 0.3,
  vulnerabilityHigh: 0.6,
} as const;

/** What the aggregation hands over for one community. Counts only; never a record. */
export interface CommunityIntelligenceInput {
  communityId: string;
  name: string;
  stateId: string;
  lgaId: string;
  wardId: string;
  /** Existing WASH and environment band for this community (general synthetic data). */
  washBand: VulnerabilityBand;
  observations: number;
  withSignal: number;
  withWaterContact: number;
  withAccessBarrier: number;
  /** Distinct weeks in the period with at least one observation. */
  weeksWithData: number;
}

export interface CommunityIntelligence {
  synthetic: true;
  communityId: string;
  name: string;
  stateId: string;
  lgaId: string;
  wardId: string;
  observations: ObservationRange;
  signalActivity: SignalActivity;
  dimensions: {
    wash: DimensionBand;
    waterContact: DimensionBand;
    access: DimensionBand;
  };
  vulnerability: DimensionBand;
  confidence: DataConfidence;
  priority: ProgrammePriority;
  /** True when the category was held back because confidence is low. */
  cappedByConfidence: boolean;
  /** Plain-language reasons built only from the bands above. */
  why: string[];
}

export interface IntelligenceSummary {
  demo: true;
  note: string;
  threshold: number;
  rows: CommunityIntelligence[];
}

export const INTELLIGENCE_NOTE =
  'Prototype decision-support and programme-prioritisation pattern on synthetic data. Not a validated epidemiological model. It does not diagnose disease or estimate prevalence. Counts below 5 are not shown.';

export function observationRange(n: number): ObservationRange {
  if (n < INTELLIGENCE_THRESHOLD) return 'UNDER_THRESHOLD';
  if (n < 10) return '5_9';
  if (n < 20) return '10_19';
  if (n < 50) return '20_49';
  return '50_PLUS';
}

export function signalActivityOf(withSignal: number, observations: number): SignalActivity {
  if (observations < INTELLIGENCE_THRESHOLD) return 'NOT_SHOWN';
  const share = withSignal / observations;
  if (share >= INTELLIGENCE_LIMITS.signalElevated) return 'ELEVATED';
  if (share >= INTELLIGENCE_LIMITS.signalModerate) return 'MODERATE';
  return 'LOW';
}

function contextBand(count: number, observations: number): DimensionBand {
  if (observations < INTELLIGENCE_THRESHOLD) return 'NOT_SHOWN';
  const share = count / observations;
  if (share >= INTELLIGENCE_LIMITS.contextHigh) return 'HIGH';
  if (share >= INTELLIGENCE_LIMITS.contextModerate) return 'MODERATE';
  return 'LOW';
}

/**
 * Facilities in the LGA that the SYNTHETIC capability data says could examine and accept a
 * referral. This is invented data. It says nothing about any real facility.
 */
export function syntheticServiceCount(lgaId: string): number {
  return DEMO_FACILITIES.filter((f) => {
    const c = facilityCapability(f.id);
    return (
      f.lgaId === lgaId &&
      c !== undefined &&
      c.relevantService &&
      c.examination &&
      c.referralCapacity !== 'NONE'
    );
  }).length;
}

/**
 * Access and service context: a reported barrier (from the CHW answers) plus the SYNTHETIC
 * service gap in the LGA. 0 to 4 points: 0-1 low, 2 moderate, 3-4 high.
 */
export function accessBand(
  withAccessBarrier: number,
  observations: number,
  serviceCount: number,
): DimensionBand {
  if (observations < INTELLIGENCE_THRESHOLD) return 'NOT_SHOWN';
  const share = withAccessBarrier / observations;
  const reported =
    share >= INTELLIGENCE_LIMITS.contextHigh
      ? 2
      : share >= INTELLIGENCE_LIMITS.contextModerate
        ? 1
        : 0;
  const gap = serviceCount === 0 ? 2 : serviceCount === 1 ? 1 : 0;
  const total = reported + gap;
  return total >= 3 ? 'HIGH' : total === 2 ? 'MODERATE' : 'LOW';
}

const POINTS: Record<Exclude<DimensionBand, 'NOT_SHOWN'>, number> = {
  LOW: 0,
  MODERATE: 1,
  HIGH: 2,
};

function washAsDimension(b: VulnerabilityBand): DimensionBand {
  return b === 'INSUFFICIENT_DATA' ? 'NOT_SHOWN' : b;
}

/** Overall contextual vulnerability: the share of points available across the shown dimensions. */
export function overallVulnerability(dims: CommunityIntelligence['dimensions']): DimensionBand {
  const shown = Object.values(dims).filter((d) => d !== 'NOT_SHOWN') as Exclude<
    DimensionBand,
    'NOT_SHOWN'
  >[];
  if (shown.length === 0) return 'NOT_SHOWN';
  const share = shown.reduce((s, d) => s + POINTS[d], 0) / (2 * shown.length);
  if (share >= INTELLIGENCE_LIMITS.vulnerabilityHigh) return 'HIGH';
  if (share >= INTELLIGENCE_LIMITS.vulnerabilityModerate) return 'MODERATE';
  return 'LOW';
}

/**
 * Data confidence (0 to 5 points): how much the observations support reading the category.
 * Observations 20+ = 2, 10+ = 1; weeks with data 4+ = 2, 2+ = 1; all three context dimensions
 * shown = 1. 4-5 high, 2-3 medium, 0-1 low. Fewer than 5 observations: insufficient.
 */
export function dataConfidence(
  observations: number,
  weeksWithData: number,
  dimensionsShown: number,
): DataConfidence {
  if (observations < INTELLIGENCE_THRESHOLD) return 'INSUFFICIENT';
  const points =
    (observations >= 20 ? 2 : observations >= 10 ? 1 : 0) +
    (weeksWithData >= 4 ? 2 : weeksWithData >= 2 ? 1 : 0) +
    (dimensionsShown >= 3 ? 1 : 0);
  return points >= 4 ? 'HIGH' : points >= 2 ? 'MEDIUM' : 'LOW';
}

const SIGNAL_POINTS: Record<Exclude<SignalActivity, 'NOT_SHOWN'>, number> = {
  LOW: 0,
  MODERATE: 1,
  ELEVATED: 2,
};

/**
 * Programme priority from two transparent inputs: signal activity (0-2) plus contextual
 * vulnerability (0-2). 0-1 low priority, 2 monitor, 3 priority for review, 4 high priority for
 * programme attention. With low data confidence the category is held at "priority for review" at
 * most, and says more information is needed first.
 */
export function programmePriority(
  signal: SignalActivity,
  vulnerability: DimensionBand,
  confidence: DataConfidence,
): { priority: ProgrammePriority; cappedByConfidence: boolean } {
  if (signal === 'NOT_SHOWN' || vulnerability === 'NOT_SHOWN' || confidence === 'INSUFFICIENT') {
    return { priority: 'INSUFFICIENT_DATA', cappedByConfidence: false };
  }
  const total = SIGNAL_POINTS[signal] + POINTS[vulnerability];
  let priority: ProgrammePriority =
    total >= 4
      ? 'HIGH_PRIORITY_FOR_ATTENTION'
      : total === 3
        ? 'PRIORITY_FOR_REVIEW'
        : total === 2
          ? 'MONITOR'
          : 'LOW_PRIORITY';
  let capped = false;
  if (confidence === 'LOW' && priority === 'HIGH_PRIORITY_FOR_ATTENTION') {
    priority = 'PRIORITY_FOR_REVIEW';
    capped = true;
  }
  return { priority, cappedByConfidence: capped };
}

const sig = (s: SignalActivity) => s.toLowerCase();
const dim = (d: DimensionBand) =>
  d === 'HIGH' ? 'higher' : d === 'MODERATE' ? 'moderate' : 'lower';
const conf = (c: DataConfidence) => c.toLowerCase();

/** Explanation text. Built only from bands, so a suppressed number can never appear in it. */
export function explain(
  row: Pick<
    CommunityIntelligence,
    | 'signalActivity'
    | 'vulnerability'
    | 'confidence'
    | 'priority'
    | 'cappedByConfidence'
    | 'dimensions'
  >,
): string[] {
  if (row.priority === 'INSUFFICIENT_DATA') {
    return [
      'Not enough observations in this period to show community signals or a priority. More information is needed.',
    ];
  }
  const out: string[] = [];
  const lead = {
    HIGH_PRIORITY_FOR_ATTENTION: 'High priority for programme attention',
    PRIORITY_FOR_REVIEW: 'Priority for review',
    MONITOR: 'Monitor',
    LOW_PRIORITY: 'Low priority',
  }[row.priority];
  out.push(
    `${lead} because community signal activity is ${sig(row.signalActivity)} and contextual vulnerability is ${dim(row.vulnerability)}, with ${conf(row.confidence)} data confidence.`,
  );
  const d = row.dimensions;
  out.push(
    `Context: water and environment ${dim(d.wash)}, water contact ${dim(d.waterContact)}, access and service ${dim(d.access)}.`,
  );
  if (row.cappedByConfidence) {
    out.push(
      'The category is held at "priority for review" because data confidence is low. More information is needed before higher attention.',
    );
  } else if (row.confidence === 'LOW') {
    out.push(
      'Data confidence is low, so read this category with caution and gather more information.',
    );
  }
  out.push(
    'A programme priority is a prompt for review, outreach or further assessment. It is not a finding about any person or a statement about disease.',
  );
  return out;
}

export function intelligenceRow(input: CommunityIntelligenceInput): CommunityIntelligence {
  const n = input.observations;
  const shown = n >= INTELLIGENCE_THRESHOLD;
  const dimensions = {
    wash: washAsDimension(input.washBand),
    waterContact: contextBand(input.withWaterContact, n),
    access: shown
      ? accessBand(input.withAccessBarrier, n, syntheticServiceCount(input.lgaId))
      : ('NOT_SHOWN' as const),
  };
  const signalActivity = signalActivityOf(input.withSignal, n);
  const vulnerability = overallVulnerability(dimensions);
  const dimensionsShown = Object.values(dimensions).filter((d) => d !== 'NOT_SHOWN').length;
  const confidence = dataConfidence(n, input.weeksWithData, dimensionsShown);
  const { priority, cappedByConfidence } = programmePriority(
    signalActivity,
    vulnerability,
    confidence,
  );
  const row: CommunityIntelligence = {
    synthetic: true,
    communityId: input.communityId,
    name: input.name,
    stateId: input.stateId,
    lgaId: input.lgaId,
    wardId: input.wardId,
    observations: observationRange(n),
    signalActivity,
    dimensions,
    vulnerability,
    confidence,
    priority,
    cappedByConfidence,
    why: [],
  };
  row.why = explain(row);
  return row;
}

/** Most attention first; then higher confidence; then name, so the order is stable. */
export function rankIntelligence(rows: readonly CommunityIntelligence[]): CommunityIntelligence[] {
  const confRank: Record<DataConfidence, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, INSUFFICIENT: 3 };
  return [...rows].sort(
    (a, b) =>
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      confRank[a.confidence] - confRank[b.confidence] ||
      a.name.localeCompare(b.name),
  );
}

export function countByProgrammePriority(
  rows: readonly CommunityIntelligence[],
): Record<ProgrammePriority, number> {
  const counts = Object.fromEntries(PROGRAMME_PRIORITIES.map((p) => [p, 0])) as Record<
    ProgrammePriority,
    number
  >;
  for (const r of rows) counts[r.priority]++;
  return counts;
}
