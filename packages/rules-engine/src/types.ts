import type { Exposure, RiskLevel, Wash } from '@ntd-watch/domain';

/**
 * THE RULES ARE DATA. This file defines the shape of a rule set. The rule content lives in
 * `demo-ruleset.ts` (or, later, a reviewed configuration file), never in UI code.
 *
 * NOTHING IN THIS PACKAGE IS CLINICALLY VALIDATED. A rule set is `DEMO_PLACEHOLDER` unless
 * qualified clinical and public-health experts have reviewed it and the review is recorded
 * in the rule set itself (see `schema.ts`). Adopting a validated rule set requires explicit
 * approval from the programme owners.
 */
export const DEMO_LABEL_TEXT = 'DEMONSTRATION ONLY — NOT CLINICALLY VALIDATED';

/**
 * Lifecycle of a rule set or content item: DEMO, DRAFT, CLINICALLY_REVIEWED, VALIDATED.
 * `DEMO_PLACEHOLDER` is the original name of DEMO, kept so existing rule data stays valid; it is
 * treated as DEMO everywhere. Anything above DEMO needs recorded review evidence (see schema.ts).
 */
export type RuleSetStatus =
  'DEMO' | 'DEMO_PLACEHOLDER' | 'DRAFT' | 'CLINICALLY_REVIEWED' | 'VALIDATED';

export type NormalisedStatus = 'DEMO' | 'DRAFT' | 'CLINICALLY_REVIEWED' | 'VALIDATED';

export function normaliseStatus(status: RuleSetStatus): NormalisedStatus {
  return status === 'DEMO_PLACEHOLDER' ? 'DEMO' : status;
}

const STATUS_RANK: Record<NormalisedStatus, number> = {
  DEMO: 0,
  DRAFT: 1,
  CLINICALLY_REVIEWED: 2,
  VALIDATED: 3,
};
export function statusRank(status: RuleSetStatus): number {
  return STATUS_RANK[normaliseStatus(status)];
}

/** Text shown next to a result so the status of the logic behind it is never hidden. */
export const STATUS_LABELS: Record<NormalisedStatus, string> = {
  DEMO: 'DEMO — clinical validation pending',
  DRAFT: 'DRAFT — clinical review pending',
  CLINICALLY_REVIEWED: 'CLINICALLY REVIEWED — validation pending',
  VALIDATED: 'VALIDATED',
};

/** Where a rule set stands in validation, separately from its lifecycle status. */
export const VALIDATION_STATUSES = ['NOT_VALIDATED', 'IN_REVIEW', 'REVIEWED', 'VALIDATED'] as const;
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export const FACT_NAMES = [
  'symptoms',
  'symptomCount',
  'durationRank',
  'progression',
  'exposureCount',
  'householdSimilar',
  'washRiskCount',
  'exposureSignals',
  'exposureSignalCount',
  'contextSignalCount',
] as const;
export type FactName = (typeof FACT_NAMES)[number];

export const OPERATORS = ['=', '!=', '>=', '<=', 'includes', 'includesAny'] as const;
export type Operator = (typeof OPERATORS)[number];

export type FactValue = string | number | boolean | readonly string[];

export interface RuleCondition {
  fact: FactName;
  op: Operator;
  value: string | number | boolean | readonly string[];
}

export interface DecisionRule {
  id: string;
  level: RiskLevel;
  enabled: boolean;
  /** Plain-language reason shown to the CHW when this rule fires. Must not name a disease or treatment. */
  explanation: string;
  /** All conditions must hold. A condition on a missing fact does not hold. */
  when: readonly RuleCondition[];
  /** Governance metadata (optional per rule; defaults come from the rule set). */
  name?: string;
  source?: string;
  version?: string;
  status?: RuleSetStatus;
  validationStatus?: ValidationStatus;
  lastModified?: string;
  notes?: string;
}

export interface RuleSetReview {
  reviewedBy: readonly string[];
  approvedOn: string;
}

export interface RuleSet {
  id: string;
  version: string;
  status: RuleSetStatus;
  description: string;
  /** What the CHW is shown for each level. Demonstration wording only. */
  actions: Record<RiskLevel, string>;
  rules: readonly DecisionRule[];
  review?: RuleSetReview;
  /** Where the logic comes from (guidance reference, or an honest statement that there is none). */
  source?: string;
  validationStatus?: ValidationStatus;
  /** ISO date of the last change to the rule data. */
  lastModified?: string;
  notes?: string;
}

/** The governance record of one rule: what the rules register shows. */
export interface RuleMetadata {
  id: string;
  name: string;
  inputs: readonly FactName[];
  output: RiskLevel;
  source: string;
  version: string;
  status: NormalisedStatus;
  validationStatus: ValidationStatus;
  lastModified: string;
  notes: string;
}

/** Inputs as captured by the CHW form. Everything may be missing. */
export interface AssessmentInput {
  /** Which module's inputs these are. Decides which answers count as missing. Default GENERAL. */
  module?: 'GENERAL' | 'FGS';
  /** FGS module: exposure and context signal ids answered "yes". Undefined means not asked. */
  exposureSignals?: readonly string[];
  contextSignals?: readonly string[];
  symptoms?: readonly string[];
  noSymptomsReported?: boolean;
  duration?: 'lt_1_week' | '1_4_weeks' | '1_3_months' | 'gt_3_months' | null;
  progression?: 'yes' | 'no' | 'unsure' | null;
  exposure?: Partial<Exposure>;
  wash?: Partial<Wash>;
}

export type ConflictCode = 'NONE_WITH_SYMPTOMS' | 'DURATION_WITHOUT_SYMPTOMS';

export interface AssessmentResult {
  status: 'ASSESSED' | 'INSUFFICIENT_DATA';
  /** Null only when status is INSUFFICIENT_DATA. */
  level: RiskLevel | null;
  /** Reasons, one per rule that fired, highest level first. */
  why: readonly string[];
  recommendedAction: string;
  firedRuleIds: readonly string[];
  /** Inputs that were missing or "unknown" and may have understated the result. */
  incompleteInputs: readonly string[];
  dataQuality: 'COMPLETE' | 'PARTIAL';
  /** Inputs that contradicted each other. Conflicts never lower a result. */
  conflicts: readonly ConflictCode[];
  notes: readonly string[];
  ruleSetId: string;
  ruleSetVersion: string;
  /** True whenever the rule set is not validated. */
  demoOnly: boolean;
  /** Lifecycle status of the rule set that produced this result. Always shown with the result. */
  ruleStatus: NormalisedStatus;
  ruleStatusLabel: string;
  /** Present on every result from a non-validated rule set. The UI must display it with the result, the reasons and the action. */
  label: typeof DEMO_LABEL_TEXT | null;
}
