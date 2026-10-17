import { evaluate, DEMO_RULE_SET, type AssessmentInput } from '@ntd-watch/rules-engine';
import { DEMO_CHW } from '@ntd-watch/demo-data';
import type { Assessment, Exposure, Wash } from '@ntd-watch/domain';
import { NO_SYMPTOMS } from './options';
import type { Draft } from './draft';

const tri = (v: string | undefined): 'yes' | 'no' | 'unknown' =>
  v === 'yes' || v === 'no' ? v : 'unknown';

/** Turns the form into the rule engine's input. */
export function toRuleInput(d: Draft): AssessmentInput {
  const real = d.symptoms.filter((s) => s !== NO_SYMPTOMS);
  const none = d.symptoms.includes(NO_SYMPTOMS);
  return {
    symptoms: real,
    noSymptomsReported: none,
    duration: real.length > 0 ? (d.duration ?? null) : null,
    progression: real.length > 0 ? (d.progression ?? null) : null,
    exposure: d.exposure,
    wash: d.wash,
  };
}

/** Runs the DEMONSTRATION rules and builds the record to save. Throws if the draft is incomplete. */
export function buildAssessment(d: Draft, now = new Date()): Assessment {
  if (!d.ageGroup || !d.sex) throw new Error('Draft is incomplete');
  const input = toRuleInput(d);
  const result = evaluate(input, DEMO_RULE_SET);
  const exposure: Exposure = {
    waterContact: tri(d.exposure.waterContact),
    animalContact: tri(d.exposure.animalContact),
    insectBites: tri(d.exposure.insectBites),
    householdSimilar: tri(d.exposure.householdSimilar),
  };
  const wash: Wash = {
    waterSource: d.wash.waterSource ?? 'unknown',
    sanitation: d.wash.sanitation ?? 'unknown',
    handwashing: tri(d.wash.handwashing),
    standingWater: tri(d.wash.standingWater),
  };
  return {
    demo: true,
    id: d.code,
    clientKey: d.clientKey,
    chwId: DEMO_CHW.id,
    communityId: d.communityId,
    capturedAt: now.toISOString(),
    ageGroup: d.ageGroup,
    sex: d.sex,
    symptoms: input.symptoms ? [...input.symptoms] : [],
    duration: input.duration ?? null,
    progression: input.progression ?? null,
    exposure,
    wash,
    riskLevel: result.level,
    riskWhy: [...result.why],
    ruleSetId: result.ruleSetId,
    ruleSetVersion: result.ruleSetVersion,
  };
}

/** Rebuilds rule input from a saved assessment, to show data-quality notes on the result screen. */
export function inputFromAssessment(a: Assessment): AssessmentInput {
  return {
    symptoms: a.symptoms,
    noSymptomsReported: a.symptoms.length === 0,
    duration: a.duration,
    progression: a.progression,
    exposure: a.exposure,
    wash: a.wash,
  };
}
