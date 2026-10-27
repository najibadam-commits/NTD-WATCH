import { describe, expect, it } from 'vitest';
import {
  AGE_BANDS,
  CASE_ID_PATTERN,
  assessmentSchema,
  caseIdFor,
  consentEventSchema,
  isMinorBand,
} from './index';

const base = {
  demo: true,
  id: 'A-FGS01',
  clientKey: 'asm-3f9a07c2-aaaa-4bbb-8ccc-0123456789ab',
  chwId: 'CHW-0142',
  communityId: 'com-01',
  capturedAt: '2026-10-17T10:00:00.000Z',
  ageGroup: '18_49',
  sex: 'female',
  symptoms: [],
  duration: null,
  progression: null,
  exposure: {
    waterContact: 'yes',
    animalContact: 'unknown',
    insectBites: 'unknown',
    householdSimilar: 'unknown',
  },
  wash: {
    waterSource: 'unknown',
    sanitation: 'unknown',
    handwashing: 'unknown',
    standingWater: 'unknown',
  },
  riskLevel: 'LOW',
  riskWhy: [],
  ruleSetId: 'demo-fgs',
  ruleSetVersion: '0.1.0',
  ruleSetStatus: 'DEMO',
  module: 'FGS',
  caseId: 'PC-3F9A-07C2',
  consent: {
    state: 'GIVEN',
    version: 'demo-consent-0.1',
    recordedAt: '2026-10-17T09:58:00.000Z',
    scope: 'ASSESSMENT_AND_REFERRAL',
  },
  fgs: {
    contentVersion: '0.1.0',
    exposure: [],
    signals: [],
    context: [],
    distress: 'no',
    supportOffered: false,
    safeContact: 'yes',
  },
};

describe('women-and-girls participant model', () => {
  it('uses age bands, never a date of birth, and marks under-18 bands as minors', () => {
    expect(AGE_BANDS).toEqual(['under_10', '10_14', '15_17', '18_49', '50_plus']);
    expect(isMinorBand('15_17')).toBe(true);
    expect(isMinorBand('18_49')).toBe(false);
    expect(assessmentSchema.safeParse({ ...base, dateOfBirth: '2010-01-01' }).success).toBe(false);
  });

  it('keeps accepting the legacy generic age groups for general assessments', () => {
    const general: Record<string, unknown> = { ...base };
    for (const f of ['module', 'caseId', 'consent', 'fgs', 'ruleSetStatus']) delete general[f];
    expect(assessmentSchema.safeParse({ ...general, ageGroup: '15-49' }).success).toBe(true);
  });
});

describe('pseudonymous case id', () => {
  it('is stable for a key, shaped PC-XXXX-XXXX and carries no key text', () => {
    const id = caseIdFor(base.clientKey);
    expect(id).toBe(caseIdFor(base.clientKey));
    expect(id).toMatch(CASE_ID_PATTERN);
    expect(caseIdFor('another-key-9d3c6e1a-0000-4000-8000-aaaaaaaaaaaa')).not.toBe(id);
  });
  it('works for keys without a uuid', () => {
    expect(caseIdFor('key-fgs-0001')).toMatch(CASE_ID_PATTERN);
  });
});

describe('consent in the assessment record', () => {
  it('accepts an FGS record with consent given', () => {
    expect(assessmentSchema.safeParse(base).success).toBe(true);
  });
  it('does not store a record when consent was declined (no consent, no record)', () => {
    const r = assessmentSchema.safeParse({
      ...base,
      consent: { ...base.consent, state: 'DECLINED' },
    });
    expect(r.success).toBe(false);
  });
  it('requires consent, a case id, the FGS answers and the rule status for the FGS module', () => {
    for (const field of ['consent', 'caseId', 'fgs', 'ruleSetStatus'] as const) {
      const copy: Record<string, unknown> = { ...base };
      delete copy[field];
      expect(assessmentSchema.safeParse(copy).success, field).toBe(false);
    }
  });
  it('records withdrawal as a state of consent, separate from deletion', () => {
    const withdrawn = {
      ...base,
      consent: { ...base.consent, state: 'WITHDRAWN', withdrawnAt: '2026-10-18T08:00:00.000Z' },
    };
    expect(assessmentSchema.safeParse(withdrawn).success).toBe(true);
    const deleting = {
      ...withdrawn,
      deletion: { status: 'REQUESTED', requestedAt: '2026-10-19T08:00:00.000Z' },
    };
    expect(assessmentSchema.safeParse(deleting).success).toBe(true);
  });
  it('rejects names, phone numbers and household coordinates (strict schema)', () => {
    for (const extra of [{ name: 'x' }, { phone: '0800' }, { latitude: 1, longitude: 2 }]) {
      expect(assessmentSchema.safeParse({ ...base, ...extra }).success).toBe(false);
    }
    expect(
      assessmentSchema.safeParse({ ...base, fgs: { ...base.fgs, address: 'x' } }).success,
    ).toBe(false);
  });
  it('limits the FGS module to women and girls', () => {
    expect(assessmentSchema.safeParse({ ...base, sex: 'male' }).success).toBe(false);
  });
});

describe('consent events', () => {
  it('accepts withdrawal and deletion requests and nothing else', () => {
    const e = {
      demo: true,
      clientKey: 'cev-wd-12345678',
      assessmentKey: 'asm-12345678',
      chwId: 'CHW-0142',
      at: '2026-10-18T08:00:00.000Z',
    };
    expect(consentEventSchema.safeParse({ ...e, kind: 'CONSENT_WITHDRAWN' }).success).toBe(true);
    expect(consentEventSchema.safeParse({ ...e, kind: 'DELETION_REQUESTED' }).success).toBe(true);
    expect(consentEventSchema.safeParse({ ...e, kind: 'SOMETHING_ELSE' }).success).toBe(false);
  });
});
