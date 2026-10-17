import type { FormError } from '@ntd-watch/design-system';
import { DEMO_COMMUNITIES } from '@ntd-watch/demo-data';
import i18n from '../i18n';
import { NO_SYMPTOMS } from './options';
import type { Draft } from './draft';

export const STEPS = ['person', 'symptoms', 'context', 'wash'] as const;
export type Step = (typeof STEPS)[number];

const msg = (key: string) => i18n.t(`validation.${key}`);
const err = (field: string): FormError => ({ field, message: msg(field) });

/** Required-field rules for each step of the assessment. */
export function validateStep(step: Step, d: Draft): FormError[] {
  const errors: FormError[] = [];
  switch (step) {
    case 'person':
      if (!d.ageGroup) errors.push(err('ageGroup'));
      if (!d.sex) errors.push(err('sex'));
      if (!DEMO_COMMUNITIES.some((c) => c.id === d.communityId)) errors.push(err('community'));
      break;
    case 'symptoms': {
      const none = d.symptoms.includes(NO_SYMPTOMS);
      const real = d.symptoms.filter((s) => s !== NO_SYMPTOMS);
      if (d.symptoms.length === 0) errors.push(err('symptoms'));
      if (real.length > 0 && !none) {
        if (!d.duration) errors.push(err('duration'));
        if (!d.progression) errors.push(err('progression'));
      }
      break;
    }
    case 'context':
      for (const k of [
        'waterContact',
        'animalContact',
        'insectBites',
        'householdSimilar',
      ] as const) {
        if (!d.exposure[k]) errors.push(err(k));
      }
      break;
    case 'wash':
      for (const k of ['waterSource', 'sanitation', 'handwashing', 'standingWater'] as const) {
        if (!d.wash[k]) errors.push(err(k));
      }
      break;
  }
  return errors;
}

/** Every step at once, with the step each problem belongs to. */
export function validateAll(d: Draft): { step: Step; error: FormError }[] {
  return STEPS.flatMap((step) => validateStep(step, d).map((error) => ({ step, error })));
}
