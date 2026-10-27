import { evaluate, FGS_CONTENT, FGS_RULE_SET, type AssessmentInput } from '@ntd-watch/rules-engine';
import { DEMO_CHW } from '@ntd-watch/demo-data';
import { CONSENT_TEXT_VERSION, type Assessment } from '@ntd-watch/domain';
import { NONE, type FgsDraft } from './draft';
import { realChoices } from './validation';

/** Turns the FGS form into the rule engine's input. */
export function toFgsRuleInput(
  d: Pick<FgsDraft, 'exposure' | 'signals' | 'context'>,
): AssessmentInput {
  const signals = realChoices(d.signals);
  return {
    module: 'FGS',
    symptoms: signals,
    noSymptomsReported: d.signals.includes(NONE),
    exposureSignals: realChoices(d.exposure),
    contextSignals: realChoices(d.context),
  };
}

/** Rebuilds rule input from a saved FGS assessment, for data-quality notes on the result screen. */
export function inputFromFgsAssessment(a: Assessment): AssessmentInput {
  return {
    module: 'FGS',
    symptoms: a.fgs?.signals ?? [],
    noSymptomsReported: (a.fgs?.signals ?? []).length === 0,
    exposureSignals: a.fgs?.exposure ?? [],
    contextSignals: a.fgs?.context ?? [],
  };
}

/**
 * Runs the DEMO FGS rules and builds the record to save. Throws without consent or when the
 * draft is incomplete: there is no way to build a person-level record without consent.
 */
export function buildFgsAssessment(d: FgsDraft, now = new Date()): Assessment {
  if (d.consent !== 'GIVEN' || !d.consentAt) throw new Error('Consent has not been given');
  if (!d.ageBand || !d.distress || !d.safeContact) throw new Error('Draft is incomplete');
  const input = toFgsRuleInput(d);
  const result = evaluate(input, FGS_RULE_SET);
  const exposure = realChoices(d.exposure);
  return {
    demo: true,
    id: d.code,
    clientKey: d.clientKey,
    chwId: DEMO_CHW.id,
    communityId: d.communityId,
    capturedAt: now.toISOString(),
    ageGroup: d.ageBand,
    sex: 'female',
    symptoms: [...(input.symptoms ?? [])],
    duration: null,
    progression: null,
    // The general exposure block is filled only from what this module asked; the rest is unknown.
    exposure: {
      waterContact: exposure.includes('fgs_exp_freshwater') ? 'yes' : 'no',
      animalContact: 'unknown',
      insectBites: 'unknown',
      householdSimilar: 'unknown',
    },
    wash: {
      waterSource: 'unknown',
      sanitation: 'unknown',
      handwashing: 'unknown',
      standingWater: 'unknown',
    },
    riskLevel: result.level,
    riskWhy: [...result.why],
    ruleSetId: result.ruleSetId,
    ruleSetVersion: result.ruleSetVersion,
    ruleSetStatus: result.ruleStatus,
    module: 'FGS',
    caseId: d.caseId,
    consent: {
      state: 'GIVEN',
      version: CONSENT_TEXT_VERSION,
      recordedAt: d.consentAt,
      scope: 'ASSESSMENT_AND_REFERRAL',
    },
    fgs: {
      contentVersion: FGS_CONTENT.version,
      exposure,
      signals: realChoices(d.signals),
      context: realChoices(d.context),
      distress: d.distress,
      supportOffered: d.distress === 'yes',
      safeContact: d.safeContact,
    },
  };
}
