/**
 * Roles, permissions and route access (specification sections 3 and 30).
 *
 * IMPORTANT: in this prototype these checks run in the browser against a
 * simulated session. They shape the interface only. They are NOT security
 * controls. A production system must enforce access on the server.
 */
export const ROLES = ['chw', 'facility', 'lga', 'state', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  chw: 'Community Health Worker',
  facility: 'Health Facility Worker',
  lga: 'LGA Programme Officer',
  state: 'State Programme Manager',
  admin: 'Super Administrator',
};

export const PERMISSIONS = [
  'assessment:create',
  'assessment:view_own',
  'referral:initiate',
  'referral:view_relevant',
  'referral:update_status',
  'referral:record_outcome',
  'followup:perform',
  'programme:view_lga',
  'programme:view_state',
  'programme:monitor_referrals',
  'reports:generate',
  'users:manage',
  'config:manage',
  'rules:manage',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  chw: ['assessment:create', 'assessment:view_own', 'referral:initiate', 'followup:perform'],
  facility: ['referral:view_relevant', 'referral:update_status', 'referral:record_outcome'],
  lga: ['programme:view_lga', 'programme:monitor_referrals', 'reports:generate'],
  state: ['programme:view_state', 'programme:monitor_referrals', 'reports:generate'],
  // OPEN QUESTION (docs/DECISIONS.md): should the Super Administrator also see
  // programme intelligence? The prototype allows it so the whole product can be demonstrated.
  admin: ['users:manage', 'config:manage', 'rules:manage', 'programme:view_state'],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export type Area = 'chw' | 'programme';

export const AREA_ROLES: Record<Area, readonly Role[]> = {
  chw: ['chw'],
  programme: ['facility', 'lga', 'state', 'admin'],
};

export function canAccessArea(role: Role, area: Area): boolean {
  return AREA_ROLES[area].includes(role);
}

export const PROGRAMME_PAGES = [
  'overview',
  'gis',
  'signals',
  'vulnerability',
  'referrals',
  'trends',
  'reports',
  'users',
  'settings',
] as const;
export type ProgrammePage = (typeof PROGRAMME_PAGES)[number];

const ANALYTICS: readonly Role[] = ['lga', 'state', 'admin'];

export const PROGRAMME_PAGE_ROLES: Record<ProgrammePage, readonly Role[]> = {
  overview: ANALYTICS,
  gis: ANALYTICS,
  signals: ANALYTICS,
  vulnerability: ANALYTICS,
  referrals: ['facility', 'lga', 'state', 'admin'],
  trends: ANALYTICS,
  reports: ANALYTICS,
  users: ['admin'],
  settings: ['admin'],
};

export function canViewProgrammePage(role: Role, page: ProgrammePage): boolean {
  return PROGRAMME_PAGE_ROLES[page].includes(role);
}

export function programmePagesFor(role: Role): ProgrammePage[] {
  return PROGRAMME_PAGES.filter((p) => canViewProgrammePage(role, p));
}

/** Where a role lands after choosing it. */
export function homePathFor(role: Role): string {
  if (role === 'chw') return '/chw';
  const first = programmePagesFor(role)[0];
  return first ? `/programme/${first}` : '/';
}
