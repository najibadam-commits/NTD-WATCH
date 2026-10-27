import { IDEMPOTENCY_HEADER } from '@ntd-watch/api-contract';
import {
  CONSENT_AUDIT_ACTIONS,
  assessmentSchema,
  consentEventSchema,
  followUpSchema,
  isLegacyReferralId,
  isValidTransition,
  legacyReferralIdFor,
  nextStage,
  referralIdFor,
  referralSchema,
  referralOutcomeSchema,
  referralStageSchema,
} from '@ntd-watch/domain';
import { inboxHandler, programmeHandlers } from './programmeHandlers';
import { mockNow, seededReferral, writeAudit } from './programmeStore';
import { json, problem, readJson, route, validationProblem } from './routing';
import { serverDb } from './serverDb';

export const handlers = [
  inboxHandler,
  route('submitAssessment', async ({ request }) => {
    const parsed = assessmentSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationProblem(parsed.error);
    const key = request.headers.get(IDEMPOTENCY_HEADER);
    if (key !== parsed.data.clientKey) {
      return problem(400, 'IDEMPOTENCY_MISMATCH', 'Idempotency-Key must equal clientKey.');
    }
    const existing = await serverDb.assessments.get(key);
    if (existing) return json({ duplicate: true, assessment: existing }, 200);
    // A record the person asked to delete must not come back from a late-arriving queued item.
    if (await isDeleted(key)) {
      return problem(410, 'DELETED', 'This record was deleted at the person’s request.');
    }
    await serverDb.assessments.put(parsed.data);
    if (parsed.data.consent) {
      await writeAudit({
        actor: parsed.data.chwId,
        action: CONSENT_AUDIT_ACTIONS.given,
        target: parsed.data.caseId ?? parsed.data.id,
        detail: `Consent wording ${parsed.data.consent.version}`,
      });
    }
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
    const parent = await serverDb.assessments.get(referral.assessmentKey);
    if (!parent) {
      return problem(409, 'PARENT_MISSING', 'The assessment has not reached the server yet.');
    }
    if (parent.consent?.state === 'WITHDRAWN') {
      return problem(409, 'CONSENT_WITHDRAWN', 'Consent was withdrawn for this assessment.');
    }
    await serverDb.referrals.put(referral);
    return json({ duplicate: false, referral }, 201);
  }),

  route('getReferral', async ({ params }) => {
    const referral =
      (await serverDb.referrals.get(String(params.id))) ??
      (await seededReferral(String(params.id)));
    return referral ? json({ referral }) : problem(404, 'NOT_FOUND', 'No such referral.');
  }),

  route('updateReferral', async ({ request, params }) => {
    const body = (await readJson(request)) as { stage?: unknown; outcome?: unknown } | undefined;
    const stage = referralStageSchema.safeParse(body?.stage);
    if (!stage.success) return problem(422, 'VALIDATION', 'A valid stage is required.');
    // Stage 7: a facility may record a SYNTHETIC outcome category, only when the referral
    // is being marked as assessed.
    const outcome =
      body?.outcome === undefined ? undefined : referralOutcomeSchema.safeParse(body.outcome);
    if (outcome && !outcome.success) return problem(422, 'VALIDATION', 'Unknown outcome category.');
    if (outcome && stage.data !== 'ASSESSED') {
      return problem(
        422,
        'VALIDATION',
        'An outcome can only be recorded when the referral is assessed.',
      );
    }
    // A seeded referral is copied into the mock server's own store the first time it changes.
    const referral =
      (await serverDb.referrals.get(String(params.id))) ??
      (await seededReferral(String(params.id)));
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
      ...(outcome?.success ? { outcome: outcome.data } : {}),
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
    const parent = await serverDb.assessments.get(followUp.assessmentKey);
    if (!parent) {
      return problem(409, 'PARENT_MISSING', 'The assessment has not reached the server yet.');
    }
    if (parent.consent?.state === 'WITHDRAWN') {
      return problem(409, 'CONSENT_WITHDRAWN', 'Consent was withdrawn for this assessment.');
    }
    await serverDb.followUps.put(followUp);
    return json({ duplicate: false, followUp }, 201);
  }),

  route('submitConsentEvent', async ({ request }) => {
    const parsed = consentEventSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationProblem(parsed.error);
    const event = parsed.data;
    const key = request.headers.get(IDEMPOTENCY_HEADER);
    if (key !== event.clientKey) {
      return problem(400, 'IDEMPOTENCY_MISMATCH', 'Idempotency-Key must equal clientKey.');
    }
    // The same event twice is acknowledged, never applied twice (no duplicate audit rows).
    if (await serverDb.meta.get(`consent-event:${event.clientKey}`)) {
      return json({ duplicate: true }, 200);
    }
    const assessment = await serverDb.assessments.get(event.assessmentKey);
    if (!assessment) {
      // already deleted, or not arrived yet: a deleted one is a completed request
      if (await isDeleted(event.assessmentKey)) return json({ duplicate: true }, 200);
      return problem(409, 'PARENT_MISSING', 'The assessment has not reached the server yet.');
    }
    const at = mockNow().toISOString();
    const target = assessment.caseId ?? assessment.id;
    if (event.kind === 'CONSENT_WITHDRAWN') {
      if (assessment.consent && assessment.consent.state !== 'WITHDRAWN') {
        await serverDb.assessments.put({
          ...assessment,
          consent: { ...assessment.consent, state: 'WITHDRAWN', withdrawnAt: event.at },
        });
        await writeAudit({
          actor: event.chwId,
          action: CONSENT_AUDIT_ACTIONS.withdrawn,
          target,
          detail: 'Consent withdrawn. Record kept but excluded from programme views.',
        });
      }
    } else {
      // Deletion removes the person-level record and everything attached to it, and leaves
      // only a marker that it was deleted (so a late queued copy cannot reappear).
      await writeAudit({
        actor: event.chwId,
        action: CONSENT_AUDIT_ACTIONS.deletionRequested,
        target,
        detail: 'Deletion requested by the person.',
      });
      await serverDb.referrals.where('assessmentKey').equals(event.assessmentKey).delete();
      await serverDb.followUps.where('assessmentKey').equals(event.assessmentKey).delete();
      await serverDb.assessments.delete(event.assessmentKey);
      await serverDb.meta.put({ key: `deleted:${event.assessmentKey}`, value: at });
      await writeAudit({
        actor: 'system',
        action: CONSENT_AUDIT_ACTIONS.deletionCompleted,
        target,
        detail: 'Person-level record, referral and follow-up removed from the mock server.',
      });
    }
    await serverDb.meta.put({ key: `consent-event:${event.clientKey}`, value: at });
    return json({ duplicate: false }, 201);
  }),

  ...programmeHandlers,
];

async function isDeleted(assessmentKey: string): Promise<boolean> {
  return (await serverDb.meta.get(`deleted:${assessmentKey}`)) !== undefined;
}
