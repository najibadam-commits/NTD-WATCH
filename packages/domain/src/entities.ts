import { z } from 'zod';
import { RISK_LEVELS } from './risk';
import { REFERRAL_STAGES } from './referral';

/**
 * PERSON-LEVEL records and AGGREGATED programme records are deliberately
 * different schemas (specification section 37). Programme dashboards read only
 * the aggregate shape. Person-level schemas are strict so that names, phone
 * numbers or addresses cannot be added without changing this file (minimum
 * necessary data collection).
 *
 * Every demo record carries `demo: true`.
 */
export const ageGroupSchema = z.enum(['0-4', '5-14', '15-49', '50+']);
export const sexSchema = z.enum(['female', 'male']);
export const durationSchema = z.enum(['lt_1_week', '1_4_weeks', '1_3_months', 'gt_3_months']);
export const progressionSchema = z.enum(['yes', 'no', 'unsure']);
export const riskLevelSchema = z.enum(RISK_LEVELS);
export const referralStageSchema = z.enum(REFERRAL_STAGES);

/** Person-level. Visible to CHWs (own records) and facility workers (relevant referrals) only. */
export const assessmentSchema = z.strictObject({
  demo: z.literal(true),
  id: z.string().min(1),
  /** Client-generated idempotency key so a retry never creates a duplicate. */
  clientKey: z.string().min(8),
  chwId: z.string().min(1),
  communityId: z.string().min(1),
  capturedAt: z.iso.datetime(),
  ageGroup: ageGroupSchema,
  sex: sexSchema,
  symptoms: z.array(z.string().min(1)),
  duration: durationSchema,
  progression: progressionSchema,
  riskLevel: riskLevelSchema.nullable(),
  /** Id of the demonstration rule set that produced the level. Never a validated set in the prototype. */
  ruleSetId: z.string().min(1).nullable(),
});
export type Assessment = z.infer<typeof assessmentSchema>;

export const referralSchema = z.strictObject({
  demo: z.literal(true),
  id: z.string().regex(/^NTDW-\d{4}-\d{6}$/),
  assessmentId: z.string().min(1),
  facilityId: z.string().min(1),
  stage: referralStageSchema,
  /** One ISO timestamp per stage reached, in order. */
  stageTimestamps: z.array(z.iso.datetime()).min(1),
});
export type Referral = z.infer<typeof referralSchema>;

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
