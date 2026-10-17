import type { Permission } from '@ntd-watch/domain';

/**
 * STAGE 1 SCAFFOLD: the planned REST boundary and the permission each route needs.
 * Handlers are implemented against a MOCK API (MSW) in Stages 2 and 3.
 * There is no production backend. This file is the integration-ready seam for later
 * (DHIS2, facility directory and other systems are not integrated).
 */
export const API_ROUTES = {
  submitAssessment: {
    method: 'POST',
    path: '/api/v1/assessments',
    permission: 'assessment:create',
  },
  myAssessments: {
    method: 'GET',
    path: '/api/v1/assessments/mine',
    permission: 'assessment:view_own',
  },
  createReferral: { method: 'POST', path: '/api/v1/referrals', permission: 'referral:initiate' },
  referralInbox: {
    method: 'GET',
    path: '/api/v1/referrals/inbox',
    permission: 'referral:view_relevant',
  },
  updateReferral: {
    method: 'PATCH',
    path: '/api/v1/referrals/:id',
    permission: 'referral:update_status',
  },
  submitFollowUp: { method: 'POST', path: '/api/v1/follow-ups', permission: 'followup:perform' },
  stateIntelligence: {
    method: 'GET',
    path: '/api/v1/intelligence/state',
    permission: 'programme:view_state',
  },
  lgaIntelligence: {
    method: 'GET',
    path: '/api/v1/intelligence/lga',
    permission: 'programme:view_lga',
  },
  generateReport: { method: 'POST', path: '/api/v1/reports', permission: 'reports:generate' },
  manageUsers: { method: 'GET', path: '/api/v1/users', permission: 'users:manage' },
  manageRules: { method: 'GET', path: '/api/v1/config/rules', permission: 'rules:manage' },
} as const satisfies Record<string, { method: string; path: string; permission: Permission }>;

export type ApiRouteName = keyof typeof API_ROUTES;
