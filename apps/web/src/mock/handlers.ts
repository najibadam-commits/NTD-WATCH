import { IDEMPOTENCY_HEADER } from '@ntd-watch/api-contract';
import {
  assessmentSchema,
  followUpSchema,
  isLegacyReferralId,
  isValidTransition,
  legacyReferralIdFor,
  nextStage,
  referralIdFor,
  referralSchema,
  referralStageSchema,
} from '@ntd-watch/domain';
import { programmeHandlers } from './programmeHandlers';
import { json, problem, readJson, route, validationProblem } from './routing';
import { serverDb } from './serverDb';

export const handlers = [
  route('submitAssessment', async ({ request }) => {
    const parsed = assessmentSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationProblem(parsed.error);
    const key = request.headers.get(IDEMPOTENCY_HEADER);
    if (key !== parsed.data.clientKey) {
      return problem(400, 'IDEMPOTENCY_MISMATCH', 'Idempotency-Key must equal clientKey.');
    }
    const existing = await serverDb.assessments.get(key);
    if (existing) return json({ duplicate: true, assessment: existing }, 200);
    await serverDb.assessments.put(parsed.data);
    return json({ duplicate: false, assessment: parsed.data }, 201);
  }),

  route('createReferral', async ({ request }) => {
    const parsed = referralSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationProblem(parsed.error);
    const referral = parsed.data;
    const year = Number(referral.id.slice(5, 9));
    // New identifiers are derived from the assessment key. Identifiers from before Stage 3
    // (six digits) are still accepted when they match their assessment, so existing records
    // and their relationships keep working.
    const expected = isLegacyReferralId(referral.id)
      ? legacyReferralIdFor(referral.assessmentKey, year)
      : referralIdFor(referral.assessmentKey, year);
    if (referral.id !== expected) {
      return problem(422, 'BAD_REFERRAL_ID', 'Referral id does not match its assessment.');
    }
    const existing = await serverDb.referrals.get(referral.id);
    if (existing) return json({ duplicate: true, referral: existing }, 200);
    const sameAssessment = await serverDb.referrals
      .where('assessmentKey')
      .equals(referral.assessmentKey)
      .first();
    if (sameAssessment) {
      return problem(409, 'REFERRAL_EXISTS', 'This assessment already has a referral.', {
        referralId: sameAssessment.id,
      });
    }
    if (!(await serverDb.assessments.get(referral.assessmentKey))) {
      return problem(409, 'PARENT_MISSING', 'The assessment has not reached the server yet.');
    }
    await serverDb.referrals.put(referral);
    return json({ duplicate: false, referral }, 201);
  }),

  route('getReferral', async ({ params }) => {
    const referral = await serverDb.referrals.get(String(params.id));
    return referral ? json({ referral }) : problem(404, 'NOT_FOUND', 'No such referral.');
  }),

  route('updateReferral', async ({ request, params }) => {
    const body = (await readJson(request)) as { stage?: unknown } | undefined;
    const stage = referralStageSchema.safeParse(body?.stage);
    if (!stage.success) return problem(422, 'VALIDATION', 'A valid stage is required.');
    const referral = await serverDb.referrals.get(String(params.id));
    if (!referral) return problem(404, 'NOT_FOUND', 'No such referral.');
    if (!isValidTransition(referral.stage, stage.data)) {
      return problem(409, 'INVALID_TRANSITION', 'Referral status can only move forward.');
    }
    if (nextStage(referral.stage) !== stage.data) {
      return problem(409, 'SKIPPED_STAGE', 'Referral status must move one stage at a time.');
    }
    const updated = {
      ...referral,
      stage: stage.data,
      stageTimestamps: [...referral.stageTimestamps, new Date().toISOString()],
    };
    await serverDb.referrals.put(updated);
    return json({ referral: updated });
  }),

  route('submitFollowUp', async ({ request }) => {
    const parsed = followUpSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationProblem(parsed.error);
    const followUp = parsed.data;
    const existing = await serverDb.followUps.get(followUp.clientKey);
    if (existing) return json({ duplicate: true, followUp: existing }, 200);
    if (!(await serverDb.assessments.get(followUp.assessmentKey))) {
      return problem(409, 'PARENT_MISSING', 'The assessment has not reached the server yet.');
    }
    await serverDb.followUps.put(followUp);
    return json({ duplicate: false, followUp }, 201);
  }),

  ...programmeHandlers,
];
