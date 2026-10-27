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

export type RiskCounts = Record<RiskLevel, number>;
export type StageCounts = Record<ReferralStage, number>;

export type VulnerabilityBand = 'LOW' | 'MODERATE' | 'HIGH' | 'INSUFFICIENT_DATA';
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
  assessments: number;
  byRisk: RiskCounts;
  /** Assessments the demonstration rules could not classify. */
  unclassified: number;
  /** HIGH + URGENT demonstration signals. Assessments, not confirmed cases. */
  signals: number;
  signalsRecent: number;
  signalsPrevious: number;
  direction: SignalDirection;
  referrals: number;
  referralsCompleted: number;
  unresolved: number;
  /** Follow-up records for this community's assessments and referrals in the period. */
  followUps: number;
  /** Referrals assessed at the facility (or beyond) that have no CHW follow-up record yet. */
  followUpsDue: number;
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
  assessments: number;
  byRisk: RiskCounts;
  signals: number;
  referrals: number;
  vulnerabilityIndex: number | null;
}

export interface Kpis {
  assessments: number;
  highUrgent: number;
  /** HIGH + URGENT as a share of assessments, 0 to 1. Null when there are none. */
  highUrgentShare: number | null;
  referrals: number;
  /** Percent of referrals that reached ASSESSED or beyond. */
  referralCompletion: number;
  unresolved: number;
  followUps: number;
  /** Sum of the community figures: assessed referrals still waiting for a CHW follow-up. */
  followUpsDue: number;
  followUpsWorse: number;
  activeChws: number;
  communitiesReporting: number;
  communitiesInScope: number;
  unclassified: number;
}

export interface PreviousPeriod {
  from: string;
  to: string;
  assessments: number;
  highUrgent: number;
  referrals: number;
}

export interface DataSources {
  /** Synthetic seed records in the filtered set. */
  seeded: number;
  /** Records entered through the CHW app in this browser and synced to the mock server. */
  live: number;
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
  symptomCounts: Record<string, number>;
  referralStages: StageCounts;
  dataSources: DataSources;
}

export interface CommunityDetail {
  demo: true;
  notice: string;
  generatedAt: string;
  filters: ProgrammeFilters;
  stat: CommunityStat;
  weekly: WeeklyPoint[];
  symptomCounts: Record<string, number>;
  referralStages: StageCounts;
  facilities: { facilityId: string; name: string; referrals: number }[];
}

export interface FacilityStat {
  facilityId: string;
  name: string;
  lgaId: string;
  referrals: number;
  byStage: StageCounts;
  completionRate: number;
  unresolved: number;
}

export interface ReferralMonitor {
  demo: true;
  notice: string;
  generatedAt: string;
  filters: ProgrammeFilters;
  clamped: boolean;
  scope: DataScope;
  maxUnresolvedDays: number;
  total: number;
  /** Referrals whose CURRENT stage is this one. */
  current: StageCounts;
  /** Referrals that reached this stage or beyond. */
  reached: StageCounts;
  completionRate: number;
  unresolved: number;
  ageing: { label: string; count: number }[];
  byFacility: FacilityStat[];
  byLga: {
    lgaId: string;
    name: string;
    referrals: number;
    completionRate: number;
    unresolved: number;
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
