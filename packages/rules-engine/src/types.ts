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

export type RuleSetStatus = 'DEMO_PLACEHOLDER' | 'VALIDATED';

export const FACT_NAMES = [
  'symptoms',
  'symptomCount',
  'durationRank',
  'progression',
  'exposureCount',
  'householdSimilar',
  'washRiskCount',
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
}

/** Inputs as captured by the CHW form. Everything may be missing. */
export interface AssessmentInput {
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
  /** Present on every result from a non-validated rule set. The UI must display it with the result, the reasons and the action. */
  label: typeof DEMO_LABEL_TEXT | null;
}
