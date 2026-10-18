import { DEMO_ROLE_HEADER, IDEMPOTENCY_HEADER } from '@ntd-watch/api-contract';
import type { Referral, Role } from '@ntd-watch/domain';
import { notifyDataChanged } from '../programme/dataChannel';
import type { OutboxItem } from './localDb';

export type SendOutcome =
  | { kind: 'ok'; duplicate: boolean }
  | { kind: 'retry'; reason: string }
  | { kind: 'rejected'; reason: string };

export function apiUrl(path: string): string {
  return new URL(path, window.location.origin).toString();
}

const PATHS = {
  assessment: '/api/v1/assessments',
  referral: '/api/v1/referrals',
  followUp: '/api/v1/follow-ups',
} as const;

/** Sends one outbox item to the MOCK API. The Idempotency-Key makes retries safe. */
export async function sendItem(item: OutboxItem, role: Role = 'chw'): Promise<SendOutcome> {
  let response: Response;
  try {
    response = await fetch(apiUrl(PATHS[item.kind]), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [DEMO_ROLE_HEADER]: role,
        [IDEMPOTENCY_HEADER]: item.clientKey,
      },
      body: JSON.stringify(item.payload),
    });
  } catch {
    return { kind: 'retry', reason: 'Network error: the server could not be reached.' };
  }

  if (response.ok) {
    const body = (await response.json().catch(() => ({}))) as { duplicate?: boolean };
    return { kind: 'ok', duplicate: body.duplicate === true };
  }

  const problem = (await response.json().catch(() => ({}))) as {
    code?: string;
    message?: string;
    issues?: string[];
  };
  const text = problem.issues?.join('; ') ?? problem.message ?? `HTTP ${response.status}`;
  const retryable =
    response.status >= 500 ||
    response.status === 408 ||
    response.status === 429 ||
    problem.code === 'PARENT_MISSING';
  return retryable
    ? { kind: 'retry', reason: `${response.status} ${text}` }
    : { kind: 'rejected', reason: `${response.status} ${text}` };
}

/** Reads a referral from the MOCK API (needs a connection). Returns null when it is not there. */
export async function fetchReferral(id: string, role: Role = 'chw'): Promise<Referral | null> {
  const response = await fetch(apiUrl(`/api/v1/referrals/${encodeURIComponent(id)}`), {
    headers: { [DEMO_ROLE_HEADER]: role },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return ((await response.json()) as { referral: Referral }).referral;
}

/** DEMO ONLY: acts as a facility worker to move a referral to its next stage. */
export async function simulateFacilityUpdate(id: string, stage: string): Promise<Referral> {
  const response = await fetch(apiUrl(`/api/v1/referrals/${encodeURIComponent(id)}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', [DEMO_ROLE_HEADER]: 'facility' },
    body: JSON.stringify({ stage }),
  });
  if (!response.ok) {
    const p = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(p.message ?? `HTTP ${response.status}`);
  }
  notifyDataChanged();
  return ((await response.json()) as { referral: Referral }).referral;
}
