import { describe, expect, it } from 'vitest';
import {
  REFERRAL_ID_PATTERN,
  isLegacyReferralId,
  legacyReferralIdFor,
  referralIdFor,
  shortReferralCode,
} from './referral';
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
  const NEW = /^NTDW-2026-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

  it('is deterministic for a client key and matches the NTDW-year-UUID format', () => {
    const a = referralIdFor('key-12345678', 2026);
    expect(a).toMatch(NEW);
    expect(referralIdFor('key-12345678', 2026)).toBe(a);
    expect(referralIdFor('key-87654321', 2026)).not.toBe(a);
    expect(referralSchema.shape.id.safeParse(a).success).toBe(true);
  });

  it('reuses the random UUID inside a client key the app created', () => {
    const uuid = '6f1c2a9b-3d4e-4f50-8a61-7b8c9d0e1f23';
    expect(referralIdFor(`asm-${uuid}`, 2026)).toBe(`NTDW-2026-${uuid}`);
    expect(referralIdFor(`asm-${uuid.toUpperCase()}`, 2026)).toBe(`NTDW-2026-${uuid}`);
  });

  it('never collides across many generated client keys (uniqueness test)', () => {
    const seen = new Set<string>();
    const total = 60_000;
    for (let i = 0; i < total; i++) {
      // app-created keys carry a random UUID
      seen.add(referralIdFor(`asm-${crypto.randomUUID()}`, 2026));
      // fixed-format keys (tests and legacy data) fall back to the 128-bit hash
      seen.add(referralIdFor(`key-${String(i).padStart(8, '0')}`, 2026));
    }
    expect(seen.size).toBe(total * 2);
    for (const id of [...seen].slice(0, 200)) expect(id).toMatch(NEW);
  });

  it('keeps identifiers from before Stage 3 valid, and shortens ids for lists', () => {
    const legacy = legacyReferralIdFor('key-12345678', 2026);
    expect(legacy).toMatch(/^NTDW-2026-\d{6}$/);
    expect(isLegacyReferralId(legacy)).toBe(true);
    expect(isLegacyReferralId(referralIdFor('key-12345678', 2026))).toBe(false);
    expect(REFERRAL_ID_PATTERN.test(legacy)).toBe(true);
    expect(shortReferralCode('NTDW-2026-6f1c2a9b-3d4e-4f50-8a61-7b8c9d0e1f23')).toBe(
      'NTDW-2026-6F1C2A9B',
    );
    expect(shortReferralCode(legacy)).toBe(legacy);
  });
});
