import type { RiskLevel } from '@ntd-watch/domain';

/**
 * STAGE 1 SCAFFOLD: types and the demonstration-only guard.
 * The evaluator is implemented in Stage 2. It will be a pure function:
 * inputs -> configurable rules -> risk level -> explanation -> recommended action.
 *
 * No rule set in this repository is clinically validated. A rule set may only
 * claim `status: 'VALIDATED'` after review by qualified clinical and public-health
 * experts, and adopting one is a decision that requires explicit approval.
 */
export type RuleSetStatus = 'DEMO_PLACEHOLDER' | 'VALIDATED';

export interface RuleCondition {
  fact: string;
  op: '=' | '>=';
  value: string | number | boolean;
}

export interface DecisionRule {
  id: string;
  level: RiskLevel;
  enabled: boolean;
  /** All conditions must hold. */
  when: readonly RuleCondition[];
}

export interface RuleSet {
  id: string;
  version: string;
  status: RuleSetStatus;
  rules: readonly DecisionRule[];
}

export interface AssessmentResult {
  level: RiskLevel;
  why: readonly string[];
  recommendedAction: string;
  firedRuleIds: readonly string[];
  ruleSetId: string;
  /** True whenever the rule set is not validated. The UI must show the demonstration notice. */
  demoOnly: boolean;
}

export function isDemoOnly(ruleSet: Pick<RuleSet, 'status'>): boolean {
  return ruleSet.status !== 'VALIDATED';
}
