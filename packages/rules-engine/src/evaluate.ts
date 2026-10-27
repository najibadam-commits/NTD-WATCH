import { compareRisk, type RiskLevel } from '@ntd-watch/domain';
import { DEMO_LABEL_TEXT, STATUS_LABELS, normaliseStatus } from './types';
import type {
  AssessmentInput,
  AssessmentResult,
  ConflictCode,
  DecisionRule,
  FactName,
  FactValue,
  RuleCondition,
  RuleSet,
} from './types';

const DURATION_RANK = { lt_1_week: 0, '1_4_weeks': 1, '1_3_months': 2, gt_3_months: 3 } as const;
const NONE = 'none';

type Facts = Partial<Record<FactName, FactValue>>;

interface Derived {
  facts: Facts;
  symptomsKnown: boolean;
  conflicts: ConflictCode[];
  incompleteInputs: string[];
}

/** Turns raw form input into the facts rules are written against. Pure. */
export function deriveFacts(input: AssessmentInput): Derived {
  const conflicts: ConflictCode[] = [];
  const listed = (input.symptoms ?? []).filter((s) => s !== NONE);
  const symptoms = [...new Set(listed)];
  const saidNone = input.noSymptomsReported === true || (input.symptoms ?? []).includes(NONE);
  const symptomsKnown = input.symptoms !== undefined || input.noSymptomsReported === true;

  if (saidNone && symptoms.length > 0) conflicts.push('NONE_WITH_SYMPTOMS');
  if (symptomsKnown && symptoms.length === 0 && (input.duration || input.progression)) {
    conflicts.push('DURATION_WITHOUT_SYMPTOMS');
  }

  const fgs = input.module === 'FGS';
  const facts: Facts = { symptoms, symptomCount: symptoms.length };
  if (input.exposureSignals !== undefined) {
    const ids = [...new Set(input.exposureSignals)];
    facts.exposureSignals = ids;
    facts.exposureSignalCount = ids.length;
  }
  if (input.contextSignals !== undefined) {
    facts.contextSignalCount = new Set(input.contextSignals).size;
  }
  if (input.duration) facts.durationRank = DURATION_RANK[input.duration];
  if (input.progression) facts.progression = input.progression;

  const e = input.exposure ?? {};
  facts.exposureCount = [e.waterContact, e.animalContact, e.insectBites].filter(
    (v) => v === 'yes',
  ).length;
  if (e.householdSimilar && e.householdSimilar !== 'unknown') {
    facts.householdSimilar = e.householdSimilar === 'yes';
  }

  const w = input.wash ?? {};
  facts.washRiskCount =
    (w.waterSource === 'unimproved' ? 1 : 0) +
    (w.sanitation === 'none' ? 1 : 0) +
    (w.handwashing === 'no' ? 1 : 0) +
    (w.standingWater === 'yes' ? 1 : 0);

  const incompleteInputs: string[] = [];
  const unknown = (v: unknown) => v === undefined || v === 'unknown';
  if (fgs) {
    // FGS module: only its own answers count as missing (no skin/limb duration, no WASH block)
    if (input.exposureSignals === undefined) incompleteInputs.push('exposureSignals');
    return { facts, symptomsKnown, conflicts, incompleteInputs };
  }
  if (symptoms.length > 0) {
    if (!input.duration) incompleteInputs.push('duration');
    if (!input.progression || input.progression === 'unsure') incompleteInputs.push('progression');
  }
  (['waterContact', 'animalContact', 'insectBites', 'householdSimilar'] as const).forEach((k) => {
    if (unknown(e[k])) incompleteInputs.push(k);
  });
  (['waterSource', 'sanitation', 'handwashing', 'standingWater'] as const).forEach((k) => {
    if (unknown(w[k])) incompleteInputs.push(k);
  });

  return { facts, symptomsKnown, conflicts, incompleteInputs };
}

function holds(cond: RuleCondition, facts: Facts): boolean {
  const actual = facts[cond.fact];
  if (actual === undefined) return false; // missing data never satisfies a condition
  const { op, value } = cond;
  switch (op) {
    case '=':
      return actual === value;
    case '!=':
      return actual !== value;
    case '>=':
      return typeof actual === 'number' && typeof value === 'number' && actual >= value;
    case '<=':
      return typeof actual === 'number' && typeof value === 'number' && actual <= value;
    case 'includes':
      return Array.isArray(actual) && typeof value === 'string' && actual.includes(value);
    case 'includesAny':
      return (
        Array.isArray(actual) &&
        Array.isArray(value) &&
        value.some((v: string) => (actual as readonly string[]).includes(v))
      );
  }
}

function ruleFires(rule: DecisionRule, facts: Facts): boolean {
  return rule.enabled && rule.when.every((c) => holds(c, facts));
}

/**
 * Pure evaluation: same input and rule set always give the same output. The highest level of
 * any rule that fires wins, so a lower-level rule or conflicting input can never downgrade a
 * result. Missing data never fires a rule; it is reported through `incompleteInputs` instead.
 */
export function evaluate(input: AssessmentInput, ruleSet: RuleSet): AssessmentResult {
  const demoOnly = ruleSet.status !== 'VALIDATED';
  const label = demoOnly ? DEMO_LABEL_TEXT : null;
  const ruleStatus = normaliseStatus(ruleSet.status);
  const base = {
    ruleSetId: ruleSet.id,
    ruleSetVersion: ruleSet.version,
    demoOnly,
    label,
    ruleStatus,
    ruleStatusLabel: STATUS_LABELS[ruleStatus],
  } as const;

  const { facts, symptomsKnown, conflicts, incompleteInputs } = deriveFacts(input);

  if (!symptomsKnown) {
    return {
      ...base,
      status: 'INSUFFICIENT_DATA',
      level: null,
      why: ['Symptom information was not provided, so no result can be shown.'],
      recommendedAction: 'Collect the symptom information, then run the assessment again.',
      firedRuleIds: [],
      incompleteInputs: ['symptoms', ...incompleteInputs],
      dataQuality: 'PARTIAL',
      conflicts,
      notes: [],
    };
  }

  const fired = ruleSet.rules
    .filter((r) => ruleFires(r, facts))
    .sort((a, b) => compareRisk(b.level, a.level) || a.id.localeCompare(b.id));
  const level: RiskLevel = fired[0]?.level ?? 'LOW';

  const notes: string[] = [];
  if (conflicts.includes('NONE_WITH_SYMPTOMS')) {
    notes.push(
      '"No symptoms" was recorded together with listed symptoms. The listed symptoms were used.',
    );
  }
  if (conflicts.includes('DURATION_WITHOUT_SYMPTOMS')) {
    notes.push('Duration or progression was given without any symptom. These were ignored.');
  }
  if (incompleteInputs.length > 0) {
    notes.push(
      'Some information was missing or unknown. The result may understate the level of concern.',
    );
  }

  return {
    ...base,
    status: 'ASSESSED',
    level,
    why:
      fired.length > 0
        ? fired.map((r) => r.explanation)
        : ['None of the demonstration rules was triggered by the information provided.'],
    recommendedAction: ruleSet.actions[level],
    firedRuleIds: fired.map((r) => r.id),
    incompleteInputs,
    dataQuality: incompleteInputs.length === 0 ? 'COMPLETE' : 'PARTIAL',
    conflicts,
    notes,
  };
}
