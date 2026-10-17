import { durationSchema, progressionSchema, ageGroupSchema, sexSchema } from '@ntd-watch/domain';

/** Values only. Labels live in the locale file under `options.*`. */
export const AGE_GROUPS = ageGroupSchema.options;
export const SEXES = sexSchema.options;
export const DURATIONS = durationSchema.options;
export const PROGRESSIONS = progressionSchema.options;
export const TRI = ['yes', 'no', 'unknown'] as const;
export const WATER_SOURCES = ['improved', 'unimproved', 'unknown'] as const;
export const SANITATION = ['improved', 'none', 'unknown'] as const;
export const CONDITIONS = ['better', 'same', 'worse', 'unknown'] as const;

/** Symptom ids the demonstration rule set understands. */
export const SYMPTOMS = [
  'skin_sore_painless',
  'limb_swelling',
  'numb_skin_patch',
  'itching',
  'fever',
  'weight_loss',
  'abdominal_swelling',
  'blood_in_urine',
  'eye_pain_vision_loss',
  'severe_weakness',
  'unable_to_drink',
] as const;
export const NO_SYMPTOMS = 'none';
