import type { Permission } from '@ntd-watch/domain';

/**
 * The REST boundary of the MOCK API and the permission(s) each route needs.
 * There is no production backend. The handlers (apps/web/src/mock) implement this contract
 * with MSW and IndexedDB. Permission checks there are SIMULATED and are not security controls.
 * This file is the integration-ready seam for a future real backend. DHIS2, facility
 * directories and other systems are not integrated.
 */
export interface RouteSpec {
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  /** The caller needs at least one of these. */
  anyOf: readonly Permission[];
}

export const API_ROUTES = {
  submitAssessment: {
    method: 'POST',
    path: '/api/v1/assessments',
    anyOf: ['assessment:create'],
  },
  myAssessments: {
    method: 'GET',
    path: '/api/v1/assessments/mine',
    anyOf: ['assessment:view_own'],
  },
  createReferral: { method: 'POST', path: '/api/v1/referrals', anyOf: ['referral:initiate'] },
  getReferral: {
    method: 'GET',
    path: '/api/v1/referrals/:id',
    anyOf: ['referral:initiate', 'referral:view_relevant'],
  },
  /** Stage 7: referrals sent to the caller's (simulated) facility scope, with an assessment summary. */
  referralInbox: {
    method: 'GET',
    path: '/api/v1/referrals/inbox',
    anyOf: ['referral:view_relevant'],
  },
  updateReferral: {
    method: 'PATCH',
    path: '/api/v1/referrals/:id',
    anyOf: ['referral:update_status'],
  },
  submitFollowUp: { method: 'POST', path: '/api/v1/follow-ups', anyOf: ['followup:perform'] },
  /** Aggregated programme intelligence. Never returns a person-level record. */
  programmeSummary: {
    method: 'GET',
    path: '/api/v1/intelligence/summary',
    anyOf: ['programme:view_lga', 'programme:view_state'],
  },
  communityDetail: {
    method: 'GET',
    path: '/api/v1/intelligence/communities/:id',
    anyOf: ['programme:view_lga', 'programme:view_state'],
  },
  referralMonitor: {
    method: 'GET',
    path: '/api/v1/intelligence/referrals',
    anyOf: ['programme:monitor_referrals', 'referral:view_relevant'],
  },
  recordReport: { method: 'POST', path: '/api/v1/reports', anyOf: ['reports:generate'] },
  listUsers: { method: 'GET', path: '/api/v1/users', anyOf: ['users:manage'] },
  updateUser: { method: 'PATCH', path: '/api/v1/users/:id', anyOf: ['users:manage'] },
  getConfig: { method: 'GET', path: '/api/v1/config', anyOf: ['config:manage', 'rules:manage'] },
  updateConfig: { method: 'PATCH', path: '/api/v1/config', anyOf: ['config:manage'] },
  resetDemo: { method: 'POST', path: '/api/v1/demo/reset', anyOf: ['config:manage'] },
} as const satisfies Record<string, RouteSpec>;

export type ApiRouteName = keyof typeof API_ROUTES;

/** Which routes the mock actually implements (Stages 2 and 3). The rest are contract only. */
export const IMPLEMENTED_ROUTES: readonly ApiRouteName[] = [
  'submitAssessment',
  'createReferral',
  'getReferral',
  'referralInbox',
  'updateReferral',
  'submitFollowUp',
  'programmeSummary',
  'communityDetail',
  'referralMonitor',
  'recordReport',
  'listUsers',
  'updateUser',
  'getConfig',
  'updateConfig',
  'resetDemo',
];

export const DEMO_ROLE_HEADER = 'X-Demo-Role';
/** SIMULATED data scope of the caller, e.g. `lga:lga-c`. Not a security control. */
export const DEMO_SCOPE_HEADER = 'X-Demo-Scope';
export const IDEMPOTENCY_HEADER = 'Idempotency-Key';
