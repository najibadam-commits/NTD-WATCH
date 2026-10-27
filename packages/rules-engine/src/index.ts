export * from './types';
export { parseRuleSet, ruleSetSchema, FORBIDDEN_RULE_TEXT } from './schema';
export { evaluate, deriveFacts } from './evaluate';
export { DEMO_RULE_SET } from './demo-ruleset';

import type { RuleSet } from './types';

export function isDemoOnly(ruleSet: Pick<RuleSet, 'status'>): boolean {
  return ruleSet.status !== 'VALIDATED';
}

export { describeRule, describeRuleSet, NO_SOURCE } from './metadata';
export {
  FGS_CONTENT,
  FGS_GROUPS,
  REVIEWER_STATUSES,
  contentItem,
  fgsContentSchema,
  itemsOf,
  parseFgsContent,
  type ContentProvenance,
  type FgsContent,
  type FgsContentItem,
  type FgsGroup,
  type ReviewerStatus,
} from './fgs/content';
export { FGS_RULE_SET } from './fgs/ruleset';
