import type { FormError } from '@ntd-watch/design-system';
import { DEMO_COMMUNITIES } from '@ntd-watch/demo-data';
import i18n from '../../i18n';
import { NONE, type FgsDraft } from './draft';

export const FGS_STEPS = ['consent', 'participant', 'exposure', 'signals', 'context'] as const;
export type FgsStep = (typeof FGS_STEPS)[number];

const err = (field: string): FormError => ({ field, message: i18n.t(`fgs.validation.${field}`) });

/** Required-field rules for each step. Nothing is collected before consent is given. */
export function validateFgsStep(step: FgsStep, d: FgsDraft): FormError[] {
  const errors: FormError[] = [];
  switch (step) {
    case 'consent':
      if (d.consent !== 'GIVEN') errors.push(err('consent'));
      break;
    case 'participant':
      if (!d.ageBand) errors.push(err('ageBand'));
      if (!DEMO_COMMUNITIES.some((c) => c.id === d.communityId)) errors.push(err('community'));
      break;
    case 'exposure':
      if (d.exposure.length === 0) errors.push(err('exposure'));
      break;
    case 'signals':
      if (d.signals.length === 0) errors.push(err('signals'));
      break;
    case 'context':
      if (!d.distress) errors.push(err('distress'));
      if (!d.safeContact) errors.push(err('safeContact'));
      break;
  }
  return errors;
}

export function validateFgsAll(d: FgsDraft): { step: FgsStep; error: FormError }[] {
  return FGS_STEPS.flatMap((step) => validateFgsStep(step, d).map((error) => ({ step, error })));
}

/** Real choices only (without the "none of these" marker). */
export const realChoices = (values: readonly string[]): string[] =>
  values.filter((v) => v !== NONE);
