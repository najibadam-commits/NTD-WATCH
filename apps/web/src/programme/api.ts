import { DEMO_ROLE_HEADER, DEMO_SCOPE_HEADER } from '@ntd-watch/api-contract';
import { DEMO_SCOPE_FOR_ROLE } from '@ntd-watch/demo-data';
import { ALL_SCOPE, encodeScope, type DataScope, type Role } from '@ntd-watch/domain';
import type { Referral, ReferralOutcome, ReferralStage } from '@ntd-watch/domain';
import type {
  CommunityDetail,
  FacilityInbox,
  ProgrammeFilters,
  ProgrammeSummary,
  ReferralMonitor,
} from '@ntd-watch/programme';
import { apiFetch, apiUrl } from '../offline/apiClient';

/** The data scope the SIMULATED session gives a role. Not a security control. */
export function scopeForRole(role: Role): DataScope {
  const raw = DEMO_SCOPE_FOR_ROLE[role];
  if (raw === 'all') return ALL_SCOPE;
  if (raw.startsWith('st-')) return { kind: 'state', id: raw };
  if (raw.startsWith('lga-')) return { kind: 'lga', id: raw };
  if (raw.startsWith('fac-')) return { kind: 'facility', id: raw };
  return ALL_SCOPE;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
  }
}

function headers(role: Role, json = false): HeadersInit {
  return {
    [DEMO_ROLE_HEADER]: role,
    [DEMO_SCOPE_HEADER]: encodeScope(scopeForRole(role)),
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

async function call<T>(role: Role, path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await apiFetch(apiUrl(path), {
      ...init,
      headers: { ...headers(role, init.body !== undefined), ...init.headers },
    });
  } catch {
    throw new ApiError('The mock server could not be reached.', 0, 'NETWORK');
  }
  if (!response.ok) {
    const p = (await response.json().catch(() => ({}))) as { message?: string; code?: string };
    throw new ApiError(p.message ?? `HTTP ${response.status}`, response.status, p.code ?? 'ERROR');
  }
  return (await response.json()) as T;
}

export function filterQuery(f: ProgrammeFilters): string {
  const q = new URLSearchParams({ from: f.from, to: f.to });
  for (const k of ['stateId', 'lgaId', 'wardId', 'communityId'] as const) {
    if (f[k]) q.set(k, f[k]!);
  }
  return q.toString();
}

export const fetchSummary = (role: Role, f: ProgrammeFilters) =>
  call<ProgrammeSummary>(role, `/api/v1/intelligence/summary?${filterQuery(f)}`);

export const fetchCommunity = (role: Role, id: string, f: ProgrammeFilters) =>
  call<CommunityDetail>(
    role,
    `/api/v1/intelligence/communities/${encodeURIComponent(id)}?${filterQuery(f)}`,
  );

export const fetchReferralMonitor = (role: Role, f: ProgrammeFilters) =>
  call<ReferralMonitor>(role, `/api/v1/intelligence/referrals?${filterQuery(f)}`);

export const fetchInbox = (role: Role) => call<FacilityInbox>(role, '/api/v1/referrals/inbox');

/** Facility action: move a referral one stage forward (an outcome goes with ASSESSED). */
export const patchReferralStage = (
  role: Role,
  id: string,
  stage: ReferralStage,
  outcome?: ReferralOutcome,
) =>
  call<{ referral: Referral }>(role, `/api/v1/referrals/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(outcome ? { stage, outcome } : { stage }),
  });

export interface UserRow {
  id: string;
  label: string;
  role: Role;
  scopeId: string;
  active: boolean;
}
export interface AuditEntry {
  id: number;
  at: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
}
export const fetchUsers = (role: Role) =>
  call<{ users: UserRow[]; audit: AuditEntry[] }>(role, '/api/v1/users');
export const patchUser = (
  role: Role,
  id: string,
  body: Partial<Pick<UserRow, 'active' | 'role' | 'scopeId'>>,
) =>
  call<{ user: UserRow }>(role, `/api/v1/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

export interface ConfigView {
  maxUnresolvedDays: number;
  ruleSet: {
    id: string;
    version: string;
    status: string;
    demoOnly: boolean;
    ruleCount: number;
    description: string;
  };
  seedAnchor: string | null;
  now: string;
}
export const fetchConfig = (role: Role) => call<ConfigView>(role, '/api/v1/config');
export const patchConfig = (role: Role, maxUnresolvedDays: number) =>
  call<{ maxUnresolvedDays: number }>(role, '/api/v1/config', {
    method: 'PATCH',
    body: JSON.stringify({ maxUnresolvedDays }),
  });
export const postReset = (role: Role) =>
  call<{ ok: true }>(role, '/api/v1/demo/reset', { method: 'POST', body: '{}' });
export const postReport = (role: Role, kind: string) =>
  call<{ ok: true }>(role, '/api/v1/reports', { method: 'POST', body: JSON.stringify({ kind }) });
