import {
  COMMUNITY_PROFILES,
  DEMO_CHWS,
  DEMO_FACILITIES,
  DEMO_CHW,
  communityById,
  createRng,
  facilitiesForCommunity,
} from '@ntd-watch/demo-data';
import {
  assessmentSchema,
  followUpSchema,
  referralIdFor,
  referralSchema,
  stageIndex,
  type Assessment,
  type FollowUp,
  type Referral,
  type ReferralStage,
} from '@ntd-watch/domain';
import { DEMO_RULE_SET, evaluate, type AssessmentInput } from '@ntd-watch/rules-engine';
import type { ProgrammeRecords } from './types';

/**
 * SYNTHETIC RECORD GENERATOR. Produces fictional assessments, referrals and follow-ups for the
 * fictional CHWs, deterministically from a seed. Risk levels are NOT invented: every assessment
 * is run through the same DEMONSTRATION rules the CHW app uses, so a record here is the record
 * the app would have produced for those answers. All records have `demo: true` and a client
 * key starting `seed-`, which is how programme views tell them apart from records entered in
 * the CHW app.
 *
 * The live demo account (CHW-0142) is deliberately NOT seeded: its records exist only if you
 * enter them in the CHW app.
 */
export interface SeedOptions {
  /** End of the seeded period. Nothing is generated after this instant. */
  anchor: Date;
  seed?: number;
  weeks?: number;
}

const DAY = 86_400_000;
const WEEK = 7 * DAY;
export const SEED_PREFIX = 'seed-';

const SYMPTOM_WEIGHTS: [string, number][] = [
  ['skin_sore_painless', 1.2],
  ['limb_swelling', 1.4],
  ['numb_skin_patch', 0.9],
  ['itching', 2.0],
  ['fever', 1.8],
  ['weight_loss', 0.8],
  ['abdominal_swelling', 0.7],
  ['blood_in_urine', 0.7],
  ['eye_pain_vision_loss', 0.15],
  ['severe_weakness', 0.15],
  ['unable_to_drink', 0.1],
];

type Rng = () => number;

function pickWeighted<T>(rng: Rng, items: readonly (readonly [T, number])[]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let x = rng() * total;
  for (const [item, w] of items) {
    x -= w;
    if (x <= 0) return item;
  }
  return items[items.length - 1]![0];
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const tri = (rng: Rng, yes: number): 'yes' | 'no' | 'unknown' => {
  const x = rng();
  if (x < 0.05) return 'unknown';
  return rng() < yes ? 'yes' : 'no';
};

function signalFactor(
  trend: 'rising' | 'flat' | 'falling',
  base: number,
  w: number,
  weeks: number,
) {
  const f = weeks <= 1 ? 1 : w / (weeks - 1);
  if (trend === 'rising') return clamp01(base * (0.45 + 1.1 * f));
  if (trend === 'falling') return clamp01(base * (1.5 - 1.05 * f));
  return clamp01(base);
}

function makeAssessment(
  rng: Rng,
  chwId: string,
  communityId: string,
  capturedAt: Date,
  signal: number,
  washProb: number,
  n: number,
): Assessment {
  const hasSymptoms = rng() < 0.1 + 0.42 * signal;
  const symptoms: string[] = [];
  if (hasSymptoms) {
    const count = 1 + (rng() < 0.35 ? 1 : 0) + (rng() < 0.12 ? 1 : 0);
    while (symptoms.length < count) {
      const s = pickWeighted(rng, SYMPTOM_WEIGHTS);
      if (!symptoms.includes(s)) symptoms.push(s);
    }
  }
  const duration = hasSymptoms
    ? pickWeighted(rng, [
        ['lt_1_week', 0.32 - 0.15 * signal],
        ['1_4_weeks', 0.3],
        ['1_3_months', 0.22 + 0.08 * signal],
        ['gt_3_months', 0.16 + 0.07 * signal],
      ] as const)
    : null;
  const progression = hasSymptoms
    ? pickWeighted(rng, [
        ['yes', 0.15 + 0.3 * signal],
        ['no', 0.6],
        ['unsure', 0.15],
      ] as const)
    : null;
  const exposure = {
    waterContact: tri(rng, 0.15 + 0.5 * signal),
    animalContact: tri(rng, 0.1 + 0.25 * signal),
    insectBites: tri(rng, 0.15 + 0.3 * signal),
    householdSimilar: tri(rng, 0.03 + 0.2 * signal),
  };
  const wash = {
    waterSource:
      rng() < 0.04
        ? ('unknown' as const)
        : rng() < washProb
          ? ('unimproved' as const)
          : ('improved' as const),
    sanitation:
      rng() < 0.04
        ? ('unknown' as const)
        : rng() < washProb * 0.9
          ? ('none' as const)
          : ('improved' as const),
    handwashing:
      tri(rng, 1 - washProb * 0.85) === 'yes'
        ? ('yes' as const)
        : rng() < 0.05
          ? ('unknown' as const)
          : ('no' as const),
    standingWater: tri(rng, washProb * 0.8),
  };
  const input: AssessmentInput = {
    symptoms,
    noSymptomsReported: !hasSymptoms,
    duration: duration as AssessmentInput['duration'],
    progression: progression as AssessmentInput['progression'],
    exposure,
    wash,
  };
  const result = evaluate(input, DEMO_RULE_SET);
  const clientKey = `${SEED_PREFIX}asm-${chwId}-${String(n).padStart(4, '0')}`;
  return {
    demo: true,
    id: `S-${chwId.slice(-4)}${String(n).padStart(3, '0')}`,
    clientKey,
    chwId,
    communityId,
    capturedAt: capturedAt.toISOString(),
    ageGroup: pickWeighted(rng, [
      ['0-4', 0.12],
      ['5-14', 0.33],
      ['15-49', 0.4],
      ['50+', 0.15],
    ] as const),
    sex: rng() < 0.5 ? 'female' : 'male',
    symptoms,
    duration: duration as Assessment['duration'],
    progression: progression as Assessment['progression'],
    exposure,
    wash,
    riskLevel: result.level,
    riskWhy: [...result.why],
    ruleSetId: result.ruleSetId,
    ruleSetVersion: result.ruleSetVersion,
  };
}

/** Mean days to reach each stage from the previous one, and the chance the case stalls there. */
const PROGRESS: { stage: ReferralStage; meanDays: number; stall: number }[] = [
  { stage: 'ACCEPTED', meanDays: 1.2, stall: 0.08 },
  { stage: 'PATIENT_ARRIVED', meanDays: 2.6, stall: 0.16 },
  { stage: 'ASSESSED', meanDays: 1.2, stall: 0.1 },
  { stage: 'FOLLOW_UP', meanDays: 3.5, stall: 0.1 },
  { stage: 'CLOSED', meanDays: 6, stall: 0.1 },
];

function makeReferral(rng: Rng, a: Assessment, anchor: number): Referral | null {
  if (!a.riskLevel) return null;
  const p =
    a.riskLevel === 'URGENT'
      ? 0.96
      : a.riskLevel === 'HIGH'
        ? 0.86
        : a.riskLevel === 'MODERATE'
          ? 0.07
          : 0;
  if (rng() >= p) return null;
  const facilities = facilitiesForCommunity(a.communityId);
  const facility = facilities[Math.floor(rng() * facilities.length)]!;
  let t = Date.parse(a.capturedAt) + (5 + rng() * 85) * 60_000;
  if (t > anchor) return null;
  const stageTimestamps = [new Date(t).toISOString()];
  let stage: ReferralStage = 'GENERATED';
  for (const step of PROGRESS) {
    if (rng() < step.stall) break;
    t += -Math.log(1 - rng()) * step.meanDays * DAY;
    if (t > anchor) break;
    stage = step.stage;
    stageTimestamps.push(new Date(t).toISOString());
  }
  return {
    demo: true,
    id: referralIdFor(a.clientKey, new Date(stageTimestamps[0]!).getUTCFullYear()),
    assessmentId: a.id,
    assessmentKey: a.clientKey,
    chwId: a.chwId,
    communityId: a.communityId,
    facilityId: facility.id,
    riskLevel: a.riskLevel,
    stage,
    stageTimestamps,
  };
}

function makeFollowUp(rng: Rng, r: Referral, n: number): FollowUp | null {
  const at = stageIndex('FOLLOW_UP');
  if (r.stageTimestamps.length <= at) return null;
  const performed = Date.parse(r.stageTimestamps[at]!) + rng() * DAY;
  const condition = pickWeighted(rng, [
    ['better', 0.45],
    ['same', 0.3],
    ['worse', 0.15],
    ['unknown', 0.1],
  ] as const);
  return {
    demo: true,
    clientKey: `${SEED_PREFIX}fup-${r.chwId}-${String(n).padStart(4, '0')}`,
    assessmentKey: r.assessmentKey,
    referralId: r.id,
    chwId: r.chwId,
    performedAt: new Date(performed).toISOString(),
    personReached: 'yes',
    attendedFacility: 'yes',
    condition,
    needsFurtherReferral: condition === 'worse' && rng() < 0.6,
  };
}

export function generateSeed({
  anchor,
  seed = 20261018,
  weeks = 12,
}: SeedOptions): ProgrammeRecords {
  const rng = createRng(seed);
  const end = anchor.getTime();
  const start = end - weeks * WEEK;
  const assessments: Assessment[] = [];
  const referrals: Referral[] = [];
  const followUps: FollowUp[] = [];

  for (const chw of DEMO_CHWS) {
    if (chw.id === DEMO_CHW.id) continue; // the live account has no seeded history
    const profile = COMMUNITY_PROFILES[chw.communityId]!;
    let n = 0;
    let f = 0;
    for (let w = 0; w < weeks; w++) {
      const signal = signalFactor(profile.trend, profile.signal, w, weeks);
      const count = Math.max(1, Math.round(profile.throughput + (rng() - 0.5) * 4));
      for (let i = 0; i < count; i++) {
        const when = new Date(Math.min(end, start + w * WEEK + rng() * WEEK));
        const a = makeAssessment(rng, chw.id, chw.communityId, when, signal, profile.wash, ++n);
        assessments.push(a);
        const r = makeReferral(rng, a, end);
        if (r) {
          referrals.push(r);
          const fu = makeFollowUp(rng, r, ++f);
          if (fu) followUps.push(fu);
        }
      }
    }
  }
  assessments.sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  return { assessments, referrals, followUps };
}

/**
 * Consistency checks for any set of records. Returns a list of problems (empty when sound).
 * Used by tests and by the mock server before it serves data.
 */
export function checkConsistency(records: ProgrammeRecords, now: Date): string[] {
  const problems: string[] = [];
  const byKey = new Map<string, Assessment>();
  for (const a of records.assessments) {
    if (!assessmentSchema.safeParse(a).success) problems.push(`assessment ${a.clientKey} invalid`);
    if (byKey.has(a.clientKey)) problems.push(`duplicate assessment ${a.clientKey}`);
    byKey.set(a.clientKey, a);
    const chw = DEMO_CHWS.find((c) => c.id === a.chwId);
    if (!chw) problems.push(`assessment ${a.clientKey}: unknown CHW ${a.chwId}`);
    else if (chw.communityId !== a.communityId)
      problems.push(`assessment ${a.clientKey}: CHW ${a.chwId} does not work in ${a.communityId}`);
    if (!communityById(a.communityId))
      problems.push(`assessment ${a.clientKey}: unknown community`);
    if (Date.parse(a.capturedAt) > now.getTime())
      problems.push(`assessment ${a.clientKey}: in the future`);
  }
  const referralByAssessment = new Map<string, Referral>();
  const ids = new Set<string>();
  for (const r of records.referrals) {
    if (!referralSchema.safeParse(r).success) problems.push(`referral ${r.id} invalid`);
    if (ids.has(r.id)) problems.push(`duplicate referral id ${r.id}`);
    ids.add(r.id);
    if (referralByAssessment.has(r.assessmentKey))
      problems.push(`two referrals for assessment ${r.assessmentKey}`);
    referralByAssessment.set(r.assessmentKey, r);
    const a = byKey.get(r.assessmentKey);
    if (!a) {
      problems.push(`referral ${r.id}: assessment missing`);
      continue;
    }
    if (a.communityId !== r.communityId) problems.push(`referral ${r.id}: community differs`);
    if (a.chwId !== r.chwId) problems.push(`referral ${r.id}: CHW differs`);
    if (a.riskLevel !== r.riskLevel) problems.push(`referral ${r.id}: risk level differs`);
    const lga = communityById(r.communityId)?.lgaId;
    const fac = DEMO_FACILITIES.find((f) => f.id === r.facilityId);
    if (!fac || fac.lgaId !== lga) problems.push(`referral ${r.id}: facility outside the LGA`);
    if (r.stageTimestamps.length !== stageIndex(r.stage) + 1)
      problems.push(`referral ${r.id}: stage and timestamps disagree`);
    for (let i = 1; i < r.stageTimestamps.length; i++) {
      if (Date.parse(r.stageTimestamps[i]!) < Date.parse(r.stageTimestamps[i - 1]!))
        problems.push(`referral ${r.id}: timestamps out of order`);
    }
    if (Date.parse(r.stageTimestamps[0]!) < Date.parse(a.capturedAt))
      problems.push(`referral ${r.id}: created before its assessment`);
    if (Date.parse(r.stageTimestamps[r.stageTimestamps.length - 1]!) > now.getTime())
      problems.push(`referral ${r.id}: in the future`);
  }
  const referralById = new Map(records.referrals.map((r) => [r.id, r]));
  const fuKeys = new Set<string>();
  for (const f of records.followUps) {
    if (!followUpSchema.safeParse(f).success) problems.push(`follow-up ${f.clientKey} invalid`);
    if (fuKeys.has(f.clientKey)) problems.push(`duplicate follow-up ${f.clientKey}`);
    fuKeys.add(f.clientKey);
    if (!byKey.has(f.assessmentKey)) problems.push(`follow-up ${f.clientKey}: assessment missing`);
    if (f.referralId) {
      const r = referralById.get(f.referralId);
      if (!r) problems.push(`follow-up ${f.clientKey}: referral missing`);
      else if (r.assessmentKey !== f.assessmentKey)
        problems.push(`follow-up ${f.clientKey}: referral belongs to another assessment`);
    }
  }
  return problems;
}
