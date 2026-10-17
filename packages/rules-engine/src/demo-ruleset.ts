import { parseRuleSet } from './schema';

/**
 * DEMONSTRATION RULE SET. NOT CLINICALLY VALIDATED.
 *
 * These rules are placeholders written to exercise the product workflow. They were NOT
 * derived from, and must not be compared with, any national or international protocol.
 * They do not diagnose, do not name diseases, and do not recommend any treatment.
 * Every threshold below is arbitrary and exists so the thresholds can be reviewed, changed
 * and replaced by qualified public-health and clinical experts.
 *
 * To review: read docs/RULES.md, then edit this data. No UI code needs to change.
 */
export const DEMO_RULE_SET = parseRuleSet({
  id: 'demo-placeholder',
  version: '0.1.0',
  status: 'DEMO_PLACEHOLDER',
  description:
    'Placeholder rules for demonstrating the assessment workflow. Not reviewed by clinical or public-health experts.',
  actions: {
    LOW: 'Demonstration action: share general prevention information and encourage the person to seek advice if anything changes.',
    MODERATE:
      'Demonstration action: keep watching and consider advising a visit to a health worker.',
    HIGH: 'Demonstration action: arrange a timely referral to a health facility.',
    URGENT:
      'Demonstration action: arrange an immediate referral for assessment by a qualified health professional.',
  },
  rules: [
    {
      id: 'U-DANGER-SIGN',
      level: 'URGENT',
      enabled: true,
      explanation: 'One or more warning signs from the demonstration list were reported.',
      when: [
        {
          fact: 'symptoms',
          op: 'includesAny',
          value: ['eye_pain_vision_loss', 'severe_weakness', 'unable_to_drink'],
        },
      ],
    },
    {
      id: 'H-WORSENING-MULTIPLE',
      level: 'HIGH',
      enabled: true,
      explanation: 'Two or more indicators were reported and they are getting worse.',
      when: [
        { fact: 'progression', op: '=', value: 'yes' },
        { fact: 'symptomCount', op: '>=', value: 2 },
      ],
    },
    {
      id: 'H-LIMB-DURATION',
      level: 'HIGH',
      enabled: true,
      explanation: 'Limb swelling has lasted one month or longer.',
      when: [
        { fact: 'symptoms', op: 'includes', value: 'limb_swelling' },
        { fact: 'durationRank', op: '>=', value: 2 },
      ],
    },
    {
      id: 'H-SKIN-WATER',
      level: 'HIGH',
      enabled: true,
      explanation:
        'A painless skin sore has lasted one month or longer and the person has had contact with open water.',
      when: [
        { fact: 'symptoms', op: 'includes', value: 'skin_sore_painless' },
        { fact: 'durationRank', op: '>=', value: 2 },
        { fact: 'exposureCount', op: '>=', value: 1 },
      ],
    },
    {
      id: 'H-NUMB-PATCH',
      level: 'HIGH',
      enabled: true,
      explanation: 'A skin patch with reduced feeling was reported.',
      when: [{ fact: 'symptoms', op: 'includes', value: 'numb_skin_patch' }],
    },
    {
      id: 'H-MANY-INDICATORS',
      level: 'HIGH',
      enabled: true,
      explanation: 'Three or more indicators were reported together.',
      when: [{ fact: 'symptomCount', op: '>=', value: 3 }],
    },
    {
      id: 'H-HOUSEHOLD',
      level: 'HIGH',
      enabled: true,
      explanation: 'An indicator was reported and others in the household have similar signs.',
      when: [
        { fact: 'householdSimilar', op: '=', value: true },
        { fact: 'symptomCount', op: '>=', value: 1 },
      ],
    },
    {
      id: 'M-DURATION',
      level: 'MODERATE',
      enabled: true,
      explanation: 'An indicator has lasted longer than one week.',
      when: [
        { fact: 'symptomCount', op: '>=', value: 1 },
        { fact: 'durationRank', op: '>=', value: 1 },
      ],
    },
    {
      id: 'M-EXPOSURE',
      level: 'MODERATE',
      enabled: true,
      explanation: 'An indicator was reported together with a relevant exposure.',
      when: [
        { fact: 'symptomCount', op: '>=', value: 1 },
        { fact: 'exposureCount', op: '>=', value: 1 },
      ],
    },
    {
      id: 'M-ENVIRONMENT',
      level: 'MODERATE',
      enabled: true,
      explanation:
        'An indicator was reported in a household with several water or sanitation risks.',
      when: [
        { fact: 'symptomCount', op: '>=', value: 1 },
        { fact: 'washRiskCount', op: '>=', value: 2 },
      ],
    },
  ],
});
