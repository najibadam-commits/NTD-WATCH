export * from './types';
export { parseRuleSet, ruleSetSchema, FORBIDDEN_RULE_TEXT } from './schema';
export { evaluate, deriveFacts } from './evaluate';
export { DEMO_RULE_SET } from './demo-ruleset';

import type { RuleSet } from './types';

export function isDemoOnly(ruleSet: Pick<RuleSet, 'status'>): boolean {
  return ruleSet.status !== 'VALIDATED';
}
