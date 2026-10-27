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

/**
 * fetch() for the MOCK API, with a safety net for demos. The mock normally answers through a
 * browser service worker. If that worker is not answering (a blocked or stale worker on the
 * presenting machine), the page server replies with its HTML page instead of JSON, and every
 * view fails with "is not valid JSON". In that case, and only that case, the same mock handlers
 * answer in-page. A real network failure is NOT covered: it still throws, so offline and retry
 * behaviour is unchanged.
 */
export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const request = new Request(url, init);
  const response = await fetch(request.clone());
  const type = response.headers.get('content-type') ?? '';
  if (!type.includes('text/html')) return response;
  const [{ getResponse }, { handlers }] = await Promise.all([
    import('msw'),
    import('../mock/handlers'),
  ]);
  const mocked = await getResponse(handlers, request);
  return mocked ?? response;
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
    response = await apiFetch(apiUrl(PATHS[item.kind]), {
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
  const response = await apiFetch(apiUrl(`/api/v1/referrals/${encodeURIComponent(id)}`), {
    headers: { [DEMO_ROLE_HEADER]: role },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return ((await response.json()) as { referral: Referral }).referral;
}

/** DEMO ONLY: acts as a facility worker to move a referral to its next stage. */
export async function simulateFacilityUpdate(id: string, stage: string): Promise<Referral> {
  const response = await apiFetch(apiUrl(`/api/v1/referrals/${encodeURIComponent(id)}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', [DEMO_ROLE_HEADER]: 'facility' },
    // an assessed referral carries a synthetic outcome; the demo facility worker picks a default
    body: JSON.stringify(stage === 'ASSESSED' ? { stage, outcome: 'FOLLOW_UP_NEEDED' } : { stage }),
  });
  if (!response.ok) {
    const p = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(p.message ?? `HTTP ${response.status}`);
  }
  notifyDataChanged();
  return ((await response.json()) as { referral: Referral }).referral;
}
