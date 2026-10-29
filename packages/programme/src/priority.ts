import type { CommunityStat, SignalDirection, VulnerabilityBand } from './types';
import type { Count } from './suppression';

/**
 * PRIORITY INTELLIGENCE (Stage 7): combines two synthetic layers per community.
 *
 *   Layer A, NTD SIGNAL: the share of assessments in the period that the DEMONSTRATION rules rated
 *            HIGH or URGENT. This counts assessments, not confirmed cases, and says nothing
 *            about disease.
 *   Layer B, COMMUNITY VULNERABILITY: the existing demonstration index built from reported water,
 *            sanitation and handwashing answers.
 *
 * The bands and the 2 x 2 matrix are DEMONSTRATION CATEGORIES chosen for the prototype. They are
 * not epidemiological thresholds, are not validated, and must be agreed with programme
 * stakeholders before any real use. A priority category is a prompt for a human decision about
 * where to look first. It is not an outbreak finding and does not declare an outbreak.
 */
export type SignalBand = 'LOW' | 'MODERATE' | 'HIGH' | 'INSUFFICIENT_DATA';

/** Share of assessments rated HIGH or URGENT. Demonstration limits only. */
export const SIGNAL_BAND_LIMITS = { moderate: 0.08, high: 0.15 } as const;

/** Same minimum as the vulnerability index: fewer assessments give no band. */
export const MIN_ASSESSMENTS_FOR_SIGNAL_BAND = 5;

export const PRIORITY_CATEGORIES = [
  'PRIORITY_INTERVENTION',
  'INVESTIGATE_SIGNAL',
  'PREVENTION_SURVEILLANCE',
  'LOWER_PRIORITY',
  'INSUFFICIENT_DATA',
] as const;
export type PriorityCategory = (typeof PRIORITY_CATEGORIES)[number];

export const PRIORITY_LABELS: Record<PriorityCategory, string> = {
  PRIORITY_INTERVENTION: 'Priority investigation or intervention',
  INVESTIGATE_SIGNAL: 'Investigate an unusual signal',
  PREVENTION_SURVEILLANCE: 'Prevention or active surveillance opportunity',
  LOWER_PRIORITY: 'Lower immediate priority',
  INSUFFICIENT_DATA: 'Not placed: too few assessments, or counts not shown',
};

/** Order used for ranking (most attention first). */
const CATEGORY_RANK: Record<PriorityCategory, number> = {
  PRIORITY_INTERVENTION: 0,
  INVESTIGATE_SIGNAL: 1,
  PREVENTION_SURVEILLANCE: 2,
  LOWER_PRIORITY: 3,
  INSUFFICIENT_DATA: 4,
};

export function signalBand(signals: number, assessments: number): SignalBand {
  if (assessments < MIN_ASSESSMENTS_FOR_SIGNAL_BAND) return 'INSUFFICIENT_DATA';
  const share = signals / assessments;
  if (share >= SIGNAL_BAND_LIMITS.high) return 'HIGH';
  if (share >= SIGNAL_BAND_LIMITS.moderate) return 'MODERATE';
  return 'LOW';
}

/**
 * The 2 x 2 matrix. Only a HIGH band counts as "high" on either layer; MODERATE and LOW both
 * count as "lower". This is stated in the interface so it is never hidden.
 */
export function priorityCategory(
  signal: SignalBand,
  vulnerability: VulnerabilityBand,
): PriorityCategory {
  if (signal === 'INSUFFICIENT_DATA' || vulnerability === 'INSUFFICIENT_DATA') {
    return 'INSUFFICIENT_DATA';
  }
  const highSignal = signal === 'HIGH';
  const highVulnerability = vulnerability === 'HIGH';
  if (highSignal && highVulnerability) return 'PRIORITY_INTERVENTION';
  if (highSignal) return 'INVESTIGATE_SIGNAL';
  if (highVulnerability) return 'PREVENTION_SURVEILLANCE';
  return 'LOWER_PRIORITY';
}

export interface PriorityRow {
  communityId: string;
  name: string;
  stateId: string;
  lgaId: string;
  wardId: string;
  /** Published counts: a number, or null for "not shown" (see suppression.ts). */
  assessments: Count;
  signals: Count;
  /** 0 to 1. Null with too few assessments, or when either count is not shown. */
  signalShare: number | null;
  signalBand: SignalBand;
  vulnerabilityBand: VulnerabilityBand;
  vulnerabilityIndex: number | null;
  category: PriorityCategory;
  direction: SignalDirection;
  referrals: Count;
  referralsCompleted: Count;
  unresolved: Count;
  followUps: Count;
  followUpsDue: Count;
  /** Plain-language reasons built from the published figures above, never from anything else. */
  why: string[];
}

const hiddenText = 'not shown (small-count rule)';
const shownOr = (c: Count) => (c === null ? hiddenText : String(c));

function reasons(c: CommunityStat, signal: SignalBand, category: PriorityCategory): string[] {
  if (
    category === 'INSUFFICIENT_DATA' &&
    c.signals === null &&
    (c.assessments === null || c.assessments >= MIN_ASSESSMENTS_FOR_SIGNAL_BAND)
  ) {
    return [
      'The signal band is not shown because the signals count is not shown (small-count rule). A count that is not shown is not zero.',
    ];
  }
  if (category === 'INSUFFICIENT_DATA') {
    return [
      `Too few assessments in this period (${c.assessments === null ? 'count not shown' : c.assessments}), so no signal or vulnerability band is shown.`,
    ];
  }
  const out: string[] = [];
  if (c.signals === null || c.assessments === null) {
    out.push(
      `Signals: ${shownOr(c.signals)} of ${shownOr(c.assessments)} assessments were rated HIGH or URGENT by the demonstration rules. The signal band is ${signal.toLowerCase()}. A count that is not shown is not zero.`,
    );
  } else {
    const share = c.assessments === 0 ? 0 : Math.round((c.signals / c.assessments) * 100);
    out.push(
      `${c.signals} of ${c.assessments} assessments (${share}%) were rated HIGH or URGENT by the demonstration rules: signal ${signal.toLowerCase()}.`,
    );
  }
  out.push(
    `Water, sanitation and handwashing answers give a vulnerability index of ${c.vulnerabilityIndex === null ? 'n/a' : c.vulnerabilityIndex.toFixed(0)}: ${c.vulnerabilityBand.toLowerCase()}.`,
  );
  if (c.direction === 'rising' || c.direction === 'falling') {
    out.push(
      `Signals are ${c.direction} (${shownOr(c.signalsRecent)} in the last 28 days, ${shownOr(c.signalsPrevious)} in the 28 before).`,
    );
  }
  if (c.unresolved === null)
    out.push('Some referrals are unresolved beyond the allowed days (count not shown).');
  else if (c.unresolved > 0)
    out.push(`${c.unresolved} referral(s) are unresolved beyond the allowed days.`);
  if (c.followUpsDue === null)
    out.push('Some assessed referrals are waiting for a community follow-up (count not shown).');
  else if (c.followUpsDue > 0)
    out.push(`${c.followUpsDue} assessed referral(s) are waiting for a community follow-up.`);
  return out;
}

export function priorityRow(c: CommunityStat): PriorityRow {
  const sb = c.signalBand;
  const category = priorityCategory(sb, c.vulnerabilityBand);
  return {
    communityId: c.communityId,
    name: c.name,
    stateId: c.stateId,
    lgaId: c.lgaId,
    wardId: c.wardId,
    assessments: c.assessments,
    signals: c.signals,
    signalShare:
      c.signals === null ||
      c.assessments === null ||
      c.assessments < MIN_ASSESSMENTS_FOR_SIGNAL_BAND
        ? null
        : c.signals / c.assessments,
    signalBand: sb,
    vulnerabilityBand: c.vulnerabilityBand,
    vulnerabilityIndex: c.vulnerabilityIndex,
    category,
    direction: c.direction,
    referrals: c.referrals,
    referralsCompleted: c.referralsCompleted,
    unresolved: c.unresolved,
    followUps: c.followUps,
    followUpsDue: c.followUpsDue,
    why: reasons(c, sb, category),
  };
}

/**
 * Ranks communities for "where should attention go first, and why?". Category first, then
 * rising signals, then the signal share, then unresolved work, then name (so the order is stable).
 */
export function rankPriorities(communities: readonly CommunityStat[]): PriorityRow[] {
  return communities
    .map(priorityRow)
    .sort(
      (a, b) =>
        CATEGORY_RANK[a.category] - CATEGORY_RANK[b.category] ||
        Number(b.direction === 'rising') - Number(a.direction === 'rising') ||
        (b.signalShare ?? -1) - (a.signalShare ?? -1) ||
        (b.unresolved ?? 0) +
          (b.followUpsDue ?? 0) -
          ((a.unresolved ?? 0) + (a.followUpsDue ?? 0)) ||
        a.name.localeCompare(b.name),
    );
}

export function countByCategory(rows: readonly PriorityRow[]): Record<PriorityCategory, number> {
  const counts = Object.fromEntries(PRIORITY_CATEGORIES.map((c) => [c, 0])) as Record<
    PriorityCategory,
    number
  >;
  for (const r of rows) counts[r.category]++;
  return counts;
}
