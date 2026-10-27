import {
  normaliseStatus,
  type DecisionRule,
  type FactName,
  type RuleMetadata,
  type RuleSet,
} from './types';

/** Source text used when a rule set states none. It says plainly that there is no source. */
export const NO_SOURCE = 'No external source. Project placeholder logic.';

/**
 * The governance record of one rule (what a rules register shows): id, name, inputs, output,
 * source, version, status, validation status, last modified and notes. Rule-level values win;
 * otherwise the rule set's values apply, so every rule always has a complete record.
 */
export function describeRule(rule: DecisionRule, ruleSet: RuleSet): RuleMetadata {
  const inputs = [...new Set(rule.when.map((c) => c.fact))] as FactName[];
  return {
    id: rule.id,
    name: rule.name ?? rule.id,
    inputs,
    output: rule.level,
    source: rule.source ?? ruleSet.source ?? NO_SOURCE,
    version: rule.version ?? ruleSet.version,
    status: normaliseStatus(rule.status ?? ruleSet.status),
    validationStatus: rule.validationStatus ?? ruleSet.validationStatus ?? 'NOT_VALIDATED',
    lastModified: rule.lastModified ?? ruleSet.lastModified ?? 'unknown',
    notes: rule.notes ?? ruleSet.notes ?? '',
  };
}

export function describeRuleSet(ruleSet: RuleSet): RuleMetadata[] {
  return ruleSet.rules.map((r) => describeRule(r, ruleSet));
}
