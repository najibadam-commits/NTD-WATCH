import { referralIdFor, type Assessment, type FollowUp, type Referral } from '@ntd-watch/domain';

/** Synthetic records for tests. Everything is fictional. */
export function makeAssessment(
  key = 'key-assess-0001',
  patch: Partial<Assessment> = {},
): Assessment {
  return {
    demo: true,
    id: 'A-0001',
    clientKey: key,
    chwId: 'CHW-0142',
    communityId: 'com-01',
    capturedAt: '2026-10-17T10:00:00.000Z',
    ageGroup: '5-14',
    sex: 'female',
    symptoms: ['limb_swelling'],
    duration: '1_3_months',
    progression: 'no',
    exposure: {
      waterContact: 'yes',
      animalContact: 'no',
      insectBites: 'no',
      householdSimilar: 'no',
    },
    wash: {
      waterSource: 'improved',
      sanitation: 'improved',
      handwashing: 'yes',
      standingWater: 'no',
    },
    riskLevel: 'HIGH',
    riskWhy: ['Limb swelling has lasted one month or longer.'],
    ruleSetId: 'demo-placeholder',
    ruleSetVersion: '0.1.0',
    ...patch,
  };
}

export function makeReferral(
  assessmentKey = 'key-assess-0001',
  patch: Partial<Referral> = {},
): Referral {
  return {
    demo: true,
    id: referralIdFor(assessmentKey, 2026),
    assessmentId: 'A-0001',
    assessmentKey,
    chwId: 'CHW-0142',
    communityId: 'com-01',
    facilityId: 'fac-n1',
    riskLevel: 'HIGH',
    stage: 'GENERATED',
    stageTimestamps: ['2026-10-17T10:05:00.000Z'],
    ...patch,
  };
}

export function makeFollowUp(key = 'key-follow-0001', assessmentKey = 'key-assess-0001'): FollowUp {
  return {
    demo: true,
    clientKey: key,
    assessmentKey,
    referralId: referralIdFor(assessmentKey, 2026),
    chwId: 'CHW-0142',
    performedAt: '2026-10-20T09:00:00.000Z',
    personReached: 'yes',
    attendedFacility: 'yes',
    condition: 'same',
    needsFurtherReferral: false,
  };
}
