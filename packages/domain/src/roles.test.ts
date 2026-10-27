import { describe, expect, it } from 'vitest';
import {
  ROLES,
  PERSON_LEVEL_PERMISSIONS,
  ROLE_PERMISSIONS,
  can,
  canAccessArea,
  canViewProgrammePage,
  homePathFor,
  programmePagesFor,
} from './roles';

describe('permissions (specification section 30)', () => {
  it('lets a CHW register assessments, refer and follow up, but not manage users or rules', () => {
    expect(can('chw', 'assessment:create')).toBe(true);
    expect(can('chw', 'referral:initiate')).toBe(true);
    expect(can('chw', 'followup:perform')).toBe(true);
    expect(can('chw', 'users:manage')).toBe(false);
    expect(can('chw', 'rules:manage')).toBe(false);
    expect(can('chw', 'programme:view_state')).toBe(false);
  });

  it('lets a facility worker update referrals but not create assessments', () => {
    expect(can('facility', 'referral:update_status')).toBe(true);
    expect(can('facility', 'assessment:create')).toBe(false);
    expect(can('facility', 'reports:generate')).toBe(false);
  });

  it('limits user and configuration management to the administrator', () => {
    for (const role of ROLES) {
      expect(can(role, 'users:manage')).toBe(role === 'admin');
      expect(can(role, 'config:manage')).toBe(role === 'admin');
      expect(can(role, 'rules:manage')).toBe(role === 'admin');
    }
  });

  it('lets LGA and State roles generate reports', () => {
    expect(can('lga', 'reports:generate')).toBe(true);
    expect(can('state', 'reports:generate')).toBe(true);
  });
});

describe('area and page access', () => {
  it('keeps the CHW app and programme dashboard separate', () => {
    expect(canAccessArea('chw', 'chw')).toBe(true);
    expect(canAccessArea('chw', 'programme')).toBe(false);
    expect(canAccessArea('state', 'chw')).toBe(false);
    expect(canAccessArea('state', 'programme')).toBe(true);
  });

  it('shows a facility worker only the inbox and referral monitoring', () => {
    expect(programmePagesFor('facility')).toEqual(['inbox', 'referrals']);
  });

  it('hides user management and settings from non-administrators', () => {
    expect(canViewProgrammePage('state', 'users')).toBe(false);
    expect(canViewProgrammePage('lga', 'settings')).toBe(false);
    expect(canViewProgrammePage('admin', 'users')).toBe(true);
    expect(canViewProgrammePage('admin', 'settings')).toBe(true);
  });

  it('chooses a sensible landing path for every role', () => {
    expect(homePathFor('chw')).toBe('/chw');
    expect(homePathFor('facility')).toBe('/programme/inbox');
    expect(homePathFor('state')).toBe('/programme/overview');
  });
});

describe('Super Administrator (decided in Stage 2)', () => {
  it('sees every programme page, including users and settings', () => {
    expect(programmePagesFor('admin')).toEqual([
      'overview',
      'gis',
      'signals',
      'vulnerability',
      'priority',
      'referrals',
      'trends',
      'reports',
      'users',
      'settings',
    ]);
  });

  it('can monitor referrals and generate reports', () => {
    expect(can('admin', 'programme:monitor_referrals')).toBe(true);
    expect(can('admin', 'reports:generate')).toBe(true);
  });
});

describe('person-level data separation', () => {
  it.each(['lga', 'state', 'admin'] as const)('%s holds no person-level permission', (role) => {
    for (const p of PERSON_LEVEL_PERMISSIONS) {
      expect(ROLE_PERMISSIONS[role]).not.toContain(p);
    }
  });
});
