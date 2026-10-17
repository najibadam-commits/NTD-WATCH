import { describe, expect, it } from 'vitest';
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
  riskLevel: 'MODERATE',
  ruleSetId: 'demo-v0',
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
      facilityId: 'f1',
      stage: 'GENERATED',
      stageTimestamps: ['2026-10-17T10:00:00Z'],
    };
    expect(referralSchema.safeParse(ref).success).toBe(true);
    expect(referralSchema.safeParse({ ...ref, id: 'ref-1' }).success).toBe(false);
  });
});
