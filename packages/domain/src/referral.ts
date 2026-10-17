/** Closed-loop referral pathway (specification section 17). */
export const REFERRAL_STAGES = [
  'GENERATED',
  'ACCEPTED',
  'PATIENT_ARRIVED',
  'ASSESSED',
  'FOLLOW_UP',
  'CLOSED',
] as const;
export type ReferralStage = (typeof REFERRAL_STAGES)[number];

export const REFERRAL_STAGE_LABELS: Record<ReferralStage, string> = {
  GENERATED: 'Generated',
  ACCEPTED: 'Accepted',
  PATIENT_ARRIVED: 'Patient arrived',
  ASSESSED: 'Assessed',
  FOLLOW_UP: 'Follow-up',
  CLOSED: 'Closed',
};

export function stageIndex(stage: ReferralStage): number {
  return REFERRAL_STAGES.indexOf(stage);
}

/** Status only moves forward. Every change must be timestamped by the caller. */
export function isValidTransition(from: ReferralStage, to: ReferralStage): boolean {
  return stageIndex(to) > stageIndex(from);
}

export function nextStage(stage: ReferralStage): ReferralStage | null {
  return REFERRAL_STAGES[stageIndex(stage) + 1] ?? null;
}

/** A referral is unresolved if it has not reached ASSESSED within the allowed days. */
export function isUnresolved(
  stage: ReferralStage,
  createdAt: Date,
  now: Date,
  maxDays = 7,
): boolean {
  const ageDays = (now.getTime() - createdAt.getTime()) / 86_400_000;
  return stageIndex(stage) < stageIndex('ASSESSED') && ageDays > maxDays;
}

/** Completion rate = referrals that reached ASSESSED or beyond / referrals generated. */
export function completionRate(stages: readonly ReferralStage[]): number {
  if (stages.length === 0) return 0;
  const done = stages.filter((s) => stageIndex(s) >= stageIndex('ASSESSED')).length;
  return Math.round((done / stages.length) * 100);
}
