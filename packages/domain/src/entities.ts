import { z } from 'zod';
import { RISK_LEVELS } from './risk';
import { REFERRAL_ID_PATTERN, REFERRAL_OUTCOMES, REFERRAL_STAGES } from './referral';
import {
  CASE_ID_PATTERN,
  ageBandSchema,
  assessmentModuleSchema,
  consentSchema,
  deletionSchema,
} from './femtech';

/**
 * PERSON-LEVEL records and AGGREGATED programme records are deliberately
 * different schemas (specification section 37). Programme dashboards read only
 * the aggregate shape. Person-level schemas are strict so that names, phone
 * numbers or addresses cannot be added without changing this file (minimum
 * necessary data collection). There are no free-text fields on person-level records.
 *
 * Every demo record carries `demo: true`.
 */
export const ageGroupSchema = z.enum(['0-4', '5-14', '15-49', '50+']);
export const sexSchema = z.enum(['female', 'male']);
export const durationSchema = z.enum(['lt_1_week', '1_4_weeks', '1_3_months', 'gt_3_months']);
export const progressionSchema = z.enum(['yes', 'no', 'unsure']);
export const triStateSchema = z.enum(['yes', 'no', 'unknown']);
export const riskLevelSchema = z.enum(RISK_LEVELS);
export const referralStageSchema = z.enum(REFERRAL_STAGES);
export const referralOutcomeSchema = z.enum(REFERRAL_OUTCOMES);

export const exposureSchema = z.strictObject({
  waterContact: triStateSchema,
  animalContact: triStateSchema,
  insectBites: triStateSchema,
  householdSimilar: triStateSchema,
});
export type Exposure = z.infer<typeof exposureSchema>;

/**
 * Lifecycle of clinical content and rules. DEMO is the only status this prototype uses for FGS
 * content. A status above DEMO needs recorded review evidence (see the rules-engine schema).
 */
export const CONTENT_STATUSES = ['DEMO', 'DRAFT', 'CLINICALLY_REVIEWED', 'VALIDATED'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];
export const contentStatusSchema = z.enum(CONTENT_STATUSES);

/**
 * FGS module answers. Ids refer to the configurable FGS content catalogue (rules-engine package);
 * they are strings here so the content can change without a schema change. Nothing here is a
 * diagnosis. There are no free-text fields and no household location.
 */
export const fgsAssessmentSchema = z.strictObject({
  /** Version of the FGS content catalogue the CHW saw. */
  contentVersion: z.string().min(1),
  /** A. Exposure and context signals answered "yes" (for example freshwater contact). */
  exposure: z.array(z.string().min(1)),
  /** B. Reported health signals (DEMO placeholders until clinically reviewed). */
  signals: z.array(z.string().min(1)),
  /** C. Vulnerability and context answers, kept apart from health signals. */
  context: z.array(z.string().min(1)),
  /** D. Distress or worry reported. Leads to a supportive pathway, never a mental-health label. */
  distress: triStateSchema,
  /** Whether a supportive conversation or counselling contact was offered. */
  supportOffered: z.boolean(),
  /** Is it safe to contact her at home about this? Asked only because reminders depend on it. */
  safeContact: triStateSchema,
});
export type FgsAssessment = z.infer<typeof fgsAssessmentSchema>;

export const washSchema = z.strictObject({
  waterSource: z.enum(['improved', 'unimproved', 'unknown']),
  sanitation: z.enum(['improved', 'none', 'unknown']),
  handwashing: triStateSchema,
  standingWater: triStateSchema,
});
export type Wash = z.infer<typeof washSchema>;

/** Person-level. Visible to CHWs (own records) and facility workers (relevant referrals) only. */
export const assessmentSchema = z
  .strictObject({
    demo: z.literal(true),
    /** Short code the CHW uses to find the person in their own records. Not an identity. */
    id: z.string().min(1),
    /** Client-generated idempotency key so a retry never creates a duplicate. */
    clientKey: z.string().min(8),
    chwId: z.string().min(1),
    communityId: z.string().min(1),
    capturedAt: z.iso.datetime(),
    /** Legacy generic bands, or the women-and-girls bands used by the FGS module. */
    ageGroup: z.union([ageGroupSchema, ageBandSchema]),
    sex: sexSchema,
    symptoms: z.array(z.string().min(1)),
    duration: durationSchema.nullable(),
    progression: progressionSchema.nullable(),
    exposure: exposureSchema,
    wash: washSchema,
    /** Demonstration result. Null when the rule set could not classify (insufficient data). */
    riskLevel: riskLevelSchema.nullable(),
    riskWhy: z.array(z.string()),
    /** Id and version of the demonstration rule set that produced the level. Never validated in the prototype. */
    ruleSetId: z.string().min(1).nullable(),
    ruleSetVersion: z.string().min(1).nullable(),
    /** Absent means the general NTD module (records from before the FemTech work). */
    module: assessmentModuleSchema.optional(),
    /** Pseudonymous case identifier (FemTech module). Carries no identity. */
    caseId: z.string().regex(CASE_ID_PATTERN).optional(),
    /** Consent state. A DECLINED consent never produces a stored record. */
    consent: consentSchema.optional(),
    /** Set when the person asked for deletion. Distinct from withdrawing consent. */
    deletion: deletionSchema.optional(),
    /** Status of the rule set that produced the signal category, recorded with the result. */
    ruleSetStatus: contentStatusSchema.optional(),
    fgs: fgsAssessmentSchema.optional(),
  })
  .superRefine((a, ctx) => {
    if (a.consent?.state === 'DECLINED') {
      ctx.addIssue({
        code: 'custom',
        path: ['consent'],
        message: 'No consent, no record: a declined consent must not be stored',
      });
    }
    if (a.module === 'FGS') {
      if (!a.consent) {
        ctx.addIssue({ code: 'custom', path: ['consent'], message: 'FGS module needs consent' });
      }
      if (!a.caseId) {
        ctx.addIssue({ code: 'custom', path: ['caseId'], message: 'FGS module needs a case id' });
      }
      if (!a.fgs) {
        ctx.addIssue({ code: 'custom', path: ['fgs'], message: 'FGS module needs its answers' });
      }
      if (!a.ruleSetStatus) {
        ctx.addIssue({
          code: 'custom',
          path: ['ruleSetStatus'],
          message: 'FGS module records the rule set status with the result',
        });
      }
      if (a.sex !== 'female') {
        ctx.addIssue({
          code: 'custom',
          path: ['sex'],
          message: 'FGS module serves women and girls',
        });
      }
    }
  });
export type Assessment = z.infer<typeof assessmentSchema>;

export const referralSchema = z.strictObject({
  demo: z.literal(true),
  id: z.string().regex(REFERRAL_ID_PATTERN),
  assessmentId: z.string().min(1),
  /** The assessment's idempotency key, so a referral can be matched to its assessment. */
  assessmentKey: z.string().min(8),
  chwId: z.string().min(1),
  communityId: z.string().min(1),
  facilityId: z.string().min(1),
  riskLevel: riskLevelSchema,
  stage: referralStageSchema,
  /** One ISO timestamp per stage reached, in order. */
  stageTimestamps: z.array(z.iso.datetime()).min(1),
  /** Synthetic facility outcome category, set when the facility records the assessment (Stage 7). */
  outcome: referralOutcomeSchema.optional(),
});
export type Referral = z.infer<typeof referralSchema>;

export const followUpSchema = z.strictObject({
  demo: z.literal(true),
  clientKey: z.string().min(8),
  assessmentKey: z.string().min(8),
  referralId: z.string().nullable(),
  chwId: z.string().min(1),
  performedAt: z.iso.datetime(),
  personReached: triStateSchema,
  attendedFacility: triStateSchema,
  condition: z.enum(['better', 'same', 'worse', 'unknown']),
  needsFurtherReferral: z.boolean(),
});
export type FollowUp = z.infer<typeof followUpSchema>;

/** Aggregated. This is what programme dashboards and the map consume. No person fields. */
export const communityAggregateSchema = z.strictObject({
  demo: z.literal(true),
  communityId: z.string().min(1),
  periodStart: z.iso.date(),
  periodEnd: z.iso.date(),
  assessments: z.number().int().nonnegative(),
  byRisk: z.strictObject({
    LOW: z.number().int().nonnegative(),
    MODERATE: z.number().int().nonnegative(),
    HIGH: z.number().int().nonnegative(),
    URGENT: z.number().int().nonnegative(),
  }),
  referrals: z.number().int().nonnegative(),
});
export type CommunityAggregate = z.infer<typeof communityAggregateSchema>;
