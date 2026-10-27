import { z } from 'zod';

/**
 * FemTech (women-and-girls) module: consent, participant model and pseudonymous case ids.
 *
 * PROTOTYPE / DEMO PRIVACY FUNCTIONALITY. These structures show how consent, withdrawal and
 * deletion could be recorded and enforced in the demonstration. They have NOT been through legal,
 * security or data-protection review and make no claim of compliance with Nigerian or any other
 * data-protection requirement.
 */

/** Programme modules an assessment can belong to. Records without a module are GENERAL. */
export const ASSESSMENT_MODULES = ['GENERAL', 'FGS'] as const;
export type AssessmentModule = (typeof ASSESSMENT_MODULES)[number];
export const assessmentModuleSchema = z.enum(ASSESSMENT_MODULES);

/**
 * Configurable age model for the women-and-girls module. It records an age BAND only (never a
 * date of birth) and says nothing about clinical eligibility. `minor` only switches on the
 * safeguarding notice; age-specific wording for these bands is DEMO until clinically and
 * safeguarding reviewed.
 */
export interface AgeBandConfig {
  id: string;
  /** Under 18. Triggers a safeguarding notice, not different clinical logic. */
  minor: boolean;
}

export const AGE_BAND_CONFIG = [
  { id: 'under_10', minor: true },
  { id: '10_14', minor: true },
  { id: '15_17', minor: true },
  { id: '18_49', minor: false },
  { id: '50_plus', minor: false },
] as const satisfies readonly AgeBandConfig[];

export const AGE_BANDS = AGE_BAND_CONFIG.map((b) => b.id) as unknown as readonly [
  (typeof AGE_BAND_CONFIG)[number]['id'],
  ...(typeof AGE_BAND_CONFIG)[number]['id'][],
];
export type AgeBand = (typeof AGE_BAND_CONFIG)[number]['id'];
export const ageBandSchema = z.enum(AGE_BANDS);

export function isMinorBand(band: string): boolean {
  return AGE_BAND_CONFIG.some((b) => b.id === band && b.minor);
}

/** Consent to assessment and data capture. Separate from withdrawal and from deletion. */
export const CONSENT_STATES = ['GIVEN', 'DECLINED', 'WITHDRAWN'] as const;
export type ConsentState = (typeof CONSENT_STATES)[number];

/** Identifies the wording the person saw, so a later wording change is traceable. */
export const CONSENT_TEXT_VERSION = 'demo-consent-0.1';

export const consentSchema = z.strictObject({
  state: z.enum(CONSENT_STATES),
  /** Consent wording version shown to the person. DEMO wording, not legally reviewed. */
  version: z.string().min(1),
  recordedAt: z.iso.datetime(),
  /** What was agreed to. One scope in the prototype. */
  scope: z.literal('ASSESSMENT_AND_REFERRAL'),
  withdrawnAt: z.iso.datetime().optional(),
});
export type Consent = z.infer<typeof consentSchema>;

/** Deletion request lifecycle. Distinct from consent: withdrawing does not by itself delete. */
export const DELETION_STATUSES = ['REQUESTED', 'COMPLETED'] as const;
export type DeletionStatus = (typeof DELETION_STATUSES)[number];
export const deletionSchema = z.strictObject({
  status: z.enum(DELETION_STATUSES),
  requestedAt: z.iso.datetime(),
  completedAt: z.iso.datetime().optional(),
});
export type Deletion = z.infer<typeof deletionSchema>;

/** A consent-related event the device sends to the (mock) server. */
export const CONSENT_EVENT_KINDS = ['CONSENT_WITHDRAWN', 'DELETION_REQUESTED'] as const;
export type ConsentEventKind = (typeof CONSENT_EVENT_KINDS)[number];

export const consentEventSchema = z.strictObject({
  demo: z.literal(true),
  /** Idempotency key for the event itself. */
  clientKey: z.string().min(8),
  assessmentKey: z.string().min(8),
  kind: z.enum(CONSENT_EVENT_KINDS),
  chwId: z.string().min(1),
  at: z.iso.datetime(),
});
export type ConsentEvent = z.infer<typeof consentEventSchema>;

export const CONSENT_AUDIT_ACTIONS = {
  given: 'consent.given',
  declined: 'consent.declined',
  withdrawn: 'consent.withdrawn',
  deletionRequested: 'deletion.requested',
  deletionCompleted: 'deletion.completed',
} as const;

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * Pseudonymous case identifier, e.g. `PC-3F9A-07C2`. Derived from the random client key, so it
 * carries no name, phone number, address or date. It lets a CHW, a facility and the audit trail
 * refer to the same case without identity. It is a prototype scheme; a real system would issue
 * identifiers on the server.
 */
export function caseIdFor(clientKey: string): string {
  const found = UUID.exec(clientKey);
  let hex: string;
  if (found) {
    hex = found[0].replace(/-/g, '').toLowerCase();
  } else {
    let h = 2166136261;
    for (let i = 0; i < clientKey.length; i++) {
      h ^= clientKey.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    hex = h.toString(16).padStart(8, '0');
  }
  const body = hex.slice(0, 8).toUpperCase();
  return `PC-${body.slice(0, 4)}-${body.slice(4, 8)}`;
}

export const CASE_ID_PATTERN = /^PC-[0-9A-F]{4}-[0-9A-F]{4}$/;
