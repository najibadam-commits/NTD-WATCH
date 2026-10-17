import { describe, expect, it } from 'vitest';
import { referralIdFor } from './referral';
import { assessmentSchema, communityAggregateSchema, referralSchema } from './entities';

const validAssessment = {
  demo: true,
  id: 'A-1',
  clientKey: 'key-12345678',
  chwId: 'CHW-0142',
  communityId: 'c1',
  capturedAt: '2026-10-17T10:00:00Z',
  ageGroup: '5-14',
  sex: 'female',
  symptoms: ['rash'],
  duration: '1_4_weeks',
  progression: 'unsure',
  exposure: {
    waterContact: 'yes',
    animalContact: 'no',
    insectBites: 'unknown',
    householdSimilar: 'no',
  },
  wash: {
    waterSource: 'improved',
    sanitation: 'improved',
    handwashing: 'yes',
    standingWater: 'no',
  },
  riskLevel: 'MODERATE',
  riskWhy: ['demo reason'],
  ruleSetId: 'demo-v0',
  ruleSetVersion: '0.1.0',
} as const;

describe('person-level assessment schema', () => {
  it('accepts a minimal synthetic record', () => {
    expect(assessmentSchema.safeParse(validAssessment).success).toBe(true);
  });

  it('rejects records that are not marked as demo data', () => {
    expect(assessmentSchema.safeParse({ ...validAssessment, demo: false }).success).toBe(false);
  });

  it.each(['name', 'phone', 'address', 'nationalId'])(
    'rejects a %s field (minimum necessary data)',
    (field) => {
      expect(assessmentSchema.safeParse({ ...validAssessment, [field]: 'x' }).success).toBe(false);
    },
  );
});

describe('aggregate schema', () => {
  it('has no person-level fields and rejects them', () => {
    const agg = {
      demo: true,
      communityId: 'c1',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
      assessments: 10,
      byRisk: { LOW: 6, MODERATE: 2, HIGH: 1, URGENT: 1 },
      referrals: 2,
    };
    expect(communityAggregateSchema.safeParse(agg).success).toBe(true);
    expect(communityAggregateSchema.safeParse({ ...agg, ageGroup: '5-14' }).success).toBe(false);
  });
});

describe('referral schema', () => {
  it('requires the NTDW-YYYY-NNNNNN identifier format', () => {
    const ref = {
      demo: true,
      id: 'NTDW-2026-000185',
      assessmentId: 'A-1',
      assessmentKey: 'key-12345678',
      chwId: 'CHW-0142',
      communityId: 'c1',
      facilityId: 'f1',
      riskLevel: 'HIGH',
      stage: 'GENERATED',
      stageTimestamps: ['2026-10-17T10:00:00Z'],
    };
    expect(referralSchema.safeParse(ref).success).toBe(true);
    expect(referralSchema.safeParse({ ...ref, id: 'ref-1' }).success).toBe(false);
  });
});

describe('referral identifier', () => {
  it('is deterministic for a client key and matches the NTDW format', () => {
    const a = referralIdFor('key-12345678', 2026);
    expect(a).toMatch(/^NTDW-2026-\d{6}$/);
    expect(referralIdFor('key-12345678', 2026)).toBe(a);
    expect(referralIdFor('key-87654321', 2026)).not.toBe(a);
  });
});
