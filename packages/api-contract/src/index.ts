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
  stateIntelligence: {
    method: 'GET',
    path: '/api/v1/intelligence/state',
    anyOf: ['programme:view_state'],
  },
  lgaIntelligence: {
    method: 'GET',
    path: '/api/v1/intelligence/lga',
    anyOf: ['programme:view_lga'],
  },
  generateReport: { method: 'POST', path: '/api/v1/reports', anyOf: ['reports:generate'] },
  manageUsers: { method: 'GET', path: '/api/v1/users', anyOf: ['users:manage'] },
  manageRules: { method: 'GET', path: '/api/v1/config/rules', anyOf: ['rules:manage'] },
} as const satisfies Record<string, RouteSpec>;

export type ApiRouteName = keyof typeof API_ROUTES;

/** Which routes the Stage 2 mock actually implements. The rest are contract only. */
export const IMPLEMENTED_ROUTES: readonly ApiRouteName[] = [
  'submitAssessment',
  'createReferral',
  'getReferral',
  'updateReferral',
  'submitFollowUp',
];

export const DEMO_ROLE_HEADER = 'X-Demo-Role';
export const IDEMPOTENCY_HEADER = 'Idempotency-Key';
