import type { IntelligenceSummary } from './intelligence';
import type { Count } from './suppression';
import type { SignalBand } from './priority';
import type {
  Assessment,
  FollowUp,
  ReferralStage,
  Referral,
  RiskLevel,
  DataScope,
} from '@ntd-watch/domain';

/** The synthetic text every programme output, export and report must carry. */
export const SYNTHETIC_NOTICE =
  'SYNTHETIC DEMONSTRATION DATA. Not real patients, places or disease. Risk results come from demonstration rules that are NOT CLINICALLY VALIDATED.';

/** Person-level records. Only the mock "server" and the aggregation functions see these. */
export interface ProgrammeRecords {
  assessments: Assessment[];
  referrals: Referral[];
  followUps: FollowUp[];
}

export interface ProgrammeFilters {
  stateId?: string;
  lgaId?: string;
  wardId?: string;
  communityId?: string;
  /** Inclusive, UTC dates (YYYY-MM-DD). */
  from: string;
  to: string;
}

export interface QueryContext {
  now: Date;
  maxUnresolvedDays: number;
}

/** Exact counts. These exist only inside the aggregation functions and are never returned. */
export type RawRiskCounts = Record<RiskLevel, number>;
export type RawStageCounts = Record<ReferralStage, number>;
/** Published counts: every value is a number (0 or at least the threshold) or `null` (not shown). */
export type RiskCounts = Record<RiskLevel, Count>;
export type StageCounts = Record<ReferralStage, Count>;

export type VulnerabilityBand = 'LOW' | 'MODERATE' | 'HIGH' | 'INSUFFICIENT_DATA';
/**
 * A coarse category derived from the exact 28-day windows before suppression. It is published
 * even when a window count is not shown, so it can narrow a hidden count. See suppression.ts.
 */
export type SignalDirection = 'rising' | 'steady' | 'falling';

export interface WashRates {
  /** Share of known answers, 0 to 1. Null when no household gave a known answer. */
  unimprovedWater: number | null;
  noSanitation: number | null;
  noHandwashing: number | null;
  standingWater: number | null;
}

export interface CommunityStat {
  communityId: string;
  name: string;
  stateId: string;
  lgaId: string;
  wardId: string;
  /** All counts below are published counts: a number, or null for "not shown" (see suppression.ts). */
  assessments: Count;
  byRisk: RiskCounts;
  /** Assessments the demonstration rules could not classify. */
  unclassified: Count;
  /** HIGH + URGENT demonstration signals. Assessments, not confirmed cases. */
  signals: Count;
  signalsRecent: Count;
  signalsPrevious: Count;
  direction: SignalDirection;
  /**
   * Demonstration signal band (share of assessments rated HIGH or URGENT), worked out from the
   * exact counts before suppression. A band is coarse, but it is derived from a hidden value.
   */
  signalBand: SignalBand;
  referrals: Count;
  referralsCompleted: Count;
  unresolved: Count;
  /** Follow-up records for this community's assessments and referrals in the period. */
  followUps: Count;
  /** Referrals assessed at the facility (or beyond) that have no CHW follow-up record yet. */
  followUpsDue: Count;
  wash: WashRates;
  /** 0 to 100, or null when there are too few assessments. */
  vulnerabilityIndex: number | null;
  vulnerabilityBand: VulnerabilityBand;
  chwsAssigned: number;
  chwsActive: number;
}

export interface WeeklyPoint {
  /** Monday, UTC, YYYY-MM-DD. */
  weekStart: string;
  assessments: Count;
  byRisk: RiskCounts;
  signals: Count;
  referrals: Count;
  vulnerabilityIndex: number | null;
}

export interface Kpis {
  assessments: Count;
  highUrgent: Count;
  /** HIGH + URGENT as a share of assessments, 0 to 1. Null when there are none or it is not shown. */
  highUrgentShare: number | null;
  referrals: Count;
  /** Percent of referrals that reached ASSESSED or beyond. Null when the referral count is not shown. */
  referralCompletion: number | null;
  unresolved: Count;
  followUps: Count;
  /** Sum of the community figures: assessed referrals still waiting for a CHW follow-up. */
  followUpsDue: Count;
  followUpsWorse: Count;
  activeChws: number;
  communitiesReporting: number;
  communitiesInScope: number;
  unclassified: Count;
}

export interface PreviousPeriod {
  from: string;
  to: string;
  assessments: Count;
  highUrgent: Count;
  referrals: Count;
}

export interface DataSources {
  /** Synthetic seed records in the filtered set. */
  seeded: Count;
  /**
   * Assessments entered through the CHW app in this browser and synced to the mock server. Shown
   * exactly (including 1 to 4) only when every one of them is verified demo-created
   * (`isVerifiedDemoCreated`); otherwise the small-count rule applies.
   */
  live: Count;
}

/**
 * Women-and-girls (FGS) aggregate. Small cells are suppressed (`null`) at the point the data
 * leaves the programme layer. Prototype pattern; see `SMALL_CELL_THRESHOLD`.
 */
export interface FgsAggregate {
  threshold: number;
  note: string;
  /** Null when below the threshold. */
  assessments: number | null;
  referrals: number | null;
  byCategory: Record<
    'NO_PRIORITY_SIGNAL' | 'FURTHER_ASSESSMENT' | 'CLINICAL_ASSESSMENT' | 'URGENT_CLINICAL_REVIEW',
    number | null
  >;
  /** Only signals whose count reaches the threshold appear. */
  signalCounts: Record<string, number>;
}

export interface ProgrammeSummary {
  demo: true;
  notice: string;
  generatedAt: string;
  filters: ProgrammeFilters;
  /** True when the requested filters were narrowed to the caller's scope. */
  clamped: boolean;
  scope: DataScope;
  kpis: Kpis;
  previous: PreviousPeriod;
  byRisk: RiskCounts;
  communities: CommunityStat[];
  weekly: WeeklyPoint[];
  /** A symptom missing from this record has no records; null means it is not shown. */
  symptomCounts: Record<string, Count>;
  referralStages: StageCounts;
  fgs: FgsAggregate;
  /** Community-level programme intelligence (women and girls). Bands only; synthetic. */
  intelligence: IntelligenceSummary;
  dataSources: DataSources;
}

export interface CommunityDetail {
  demo: true;
  notice: string;
  generatedAt: string;
  filters: ProgrammeFilters;
  stat: CommunityStat;
  weekly: WeeklyPoint[];
  symptomCounts: Record<string, Count>;
  referralStages: StageCounts;
  fgs: FgsAggregate;
  facilities: { facilityId: string; name: string; referrals: Count }[];
}

export interface FacilityStat {
  facilityId: string;
  name: string;
  lgaId: string;
  referrals: Count;
  byStage: StageCounts;
  completionRate: number | null;
  unresolved: Count;
}

export interface ReferralMonitor {
  demo: true;
  notice: string;
  generatedAt: string;
  filters: ProgrammeFilters;
  clamped: boolean;
  scope: DataScope;
  maxUnresolvedDays: number;
  total: Count;
  /** Referrals whose CURRENT stage is this one. */
  current: StageCounts;
  /** Referrals that reached this stage or beyond. */
  reached: StageCounts;
  completionRate: number | null;
  unresolved: Count;
  ageing: { label: string; count: Count }[];
  byFacility: FacilityStat[];
  byLga: {
    lgaId: string;
    name: string;
    referrals: Count;
    completionRate: number | null;
    unresolved: Count;
  }[];
  medianHoursToAccept: number | null;
  medianDaysToAssessed: number | null;
}

/**
 * Stage 7 facility inbox. This is PERSON-LEVEL (it is what a facility worker needs to act on a
 * referral sent to their own facility), so it is returned only to the facility role and only for
 * that facility. It carries no name, phone number or address, and nothing here is a clinical
 * record. Every item is synthetic.
 */
export interface InboxAssessmentSummary {
  assessmentId: string;
  capturedAt: string;
  communityId: string;
  communityName: string;
  ageGroup: string;
  sex: string;
  symptoms: string[];
  duration: string | null;
  progression: string | null;
  riskLevel: RiskLevel | null;
  riskWhy: string[];
  ruleSetId: string | null;
  ruleSetVersion: string | null;
}

export interface InboxItem {
  referral: Referral;
  /** 'seed' items are synthetic background examples; 'live' items came from the CHW app. */
  source: 'seed' | 'live';
  assessment: InboxAssessmentSummary | null;
}

export interface FacilityInbox {
  demo: true;
  notice: string;
  generatedAt: string;
  facilityId: string;
  facilityName: string;
  items: InboxItem[];
}
