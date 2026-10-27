import { parseRuleSet } from '../schema';

/**
 * FGS DEMONSTRATION RULE SET. NOT CLINICALLY VALIDATED. STATUS: DEMO.
 *
 * Rules decide a NON-DIAGNOSTIC programme/referral category (Low, Moderate, High, Urgent are
 * product categories, not clinical severity). The counts below are arbitrary placeholders that
 * exist so the workflow can be demonstrated and the rules reviewed and replaced. They are not
 * derived from WHO or national guidance and no symptom combination here establishes any
 * condition. Vulnerability and context answers never change the category.
 */
export const FGS_RULE_SET = parseRuleSet({
  id: 'demo-fgs',
  version: '0.1.0',
  status: 'DEMO',
  description:
    'Placeholder rules for demonstrating the women-and-girls signal and referral workflow. Not reviewed by clinical experts.',
  source:
    'No external source. Project placeholder logic. WHO FGS atlas and national guidance to be applied after clinical review.',
  validationStatus: 'NOT_VALIDATED',
  lastModified: '2026-10-27',
  notes: 'Counts are arbitrary. Categories are non-diagnostic programme and referral categories.',
  actions: {
    LOW: 'Demonstration action: no priority signal. Share general prevention information and invite her to ask for advice if anything changes.',
    MODERATE:
      'Demonstration action: offer a private conversation about a visit for further assessment.',
    HIGH: 'Demonstration action: recommend a visit to a facility that can examine her, and help arrange it.',
    URGENT:
      'Demonstration action: arrange urgent review by a qualified health professional without delay.',
  },
  rules: [
    {
      id: 'FGS-U-WARNING',
      name: 'Warning sign placeholder reported',
      level: 'URGENT',
      enabled: true,
      explanation: 'A warning sign from the demonstration list was reported.',
      when: [{ fact: 'symptoms', op: 'includes', value: 'fgs_sig_warning' }],
      notes: 'Which signs are warning signs must come from clinical guidance.',
    },
    {
      id: 'FGS-H-SIGNALS-MANY',
      name: 'Three or more signals',
      level: 'HIGH',
      enabled: true,
      explanation: 'Three or more signals were reported together.',
      when: [{ fact: 'symptomCount', op: '>=', value: 3 }],
    },
    {
      id: 'FGS-H-SIGNAL-EXPOSURE',
      name: 'Signal with water exposure',
      level: 'HIGH',
      enabled: true,
      explanation: 'A signal was reported together with water-related exposure.',
      when: [
        { fact: 'symptomCount', op: '>=', value: 1 },
        { fact: 'exposureSignalCount', op: '>=', value: 1 },
      ],
    },
    {
      id: 'FGS-M-SIGNAL',
      name: 'Any reported signal',
      level: 'MODERATE',
      enabled: true,
      explanation: 'At least one signal from the demonstration list was reported.',
      when: [{ fact: 'symptomCount', op: '>=', value: 1 }],
    },
  ],
});
