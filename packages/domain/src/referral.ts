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

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** NTDW-YYYY-<uuid>. Older prototype records use NTDW-YYYY-NNNNNN and stay valid. */
export const REFERRAL_ID_PATTERN =
  /^NTDW-\d{4}-(?:\d{6}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

export function isLegacyReferralId(id: string): boolean {
  return /^NTDW-\d{4}-\d{6}$/.test(id);
}

function mix(seed: number, text: string): number {
  let h = seed >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Referral identifier (NTDW-YYYY-<uuid>), derived from the assessment's client key so the
 * device and the mock API always agree on it and a retried submission can never create a second
 * referral.
 *
 * Every client key the app creates contains a random version 4 UUID (crypto.randomUUID), and
 * that UUID is reused as the referral's UUID, so identifiers are exactly as collision-resistant
 * as UUIDs. A key without a UUID (only the fixed keys used in tests and legacy data) is mapped
 * to a UUID-shaped value by a 128-bit non-cryptographic hash; that fallback is not a security
 * feature.
 *
 * PRODUCTION NOTE: identifiers in a real system must be designed with the backend (server-issued
 * or signed, with an agreed format, ownership and retention). This is a prototype scheme only.
 */
export function referralIdFor(clientKey: string, year: number): string {
  const found = UUID.exec(clientKey);
  if (found) return `NTDW-${year}-${found[0].toLowerCase()}`;
  const words = [0x811c9dc5, 0x9e3779b1, 0x85ebca6b, 0xc2b2ae35].map((seed, n) =>
    mix(seed + n, `${n}|${clientKey}|${clientKey.length}`)
      .toString(16)
      .padStart(8, '0'),
  );
  const hex = words.join('');
  const variant = '89ab'[parseInt(hex[16]!, 16) % 4];
  return `NTDW-${year}-${hex.slice(0, 8)}-${hex.slice(8, 12)}-8${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/** The identifier format used before Stage 3, kept so existing records still validate. */
export function legacyReferralIdFor(clientKey: string, year: number): string {
  let h = 2166136261;
  for (let i = 0; i < clientKey.length; i++) {
    h ^= clientKey.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return `NTDW-${year}-${String(h % 1_000_000).padStart(6, '0')}`;
}

/** Short form for lists, e.g. NTDW-2026-6F1C2A9B. Not unique on its own: use the full id as the key. */
export function shortReferralCode(id: string): string {
  const m = /^NTDW-(\d{4})-([0-9a-f]{8})-/i.exec(id);
  return m ? `NTDW-${m[1]}-${m[2]!.toUpperCase()}` : id;
}
