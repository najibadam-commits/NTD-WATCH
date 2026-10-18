import type { Role } from '@ntd-watch/domain';
import { DEMO_CHWS } from './reference';

/**
 * SYNTHETIC user directory for the user-management demonstration. These are labels for roles,
 * not people, and nothing here can sign in anywhere. Sign-in in this prototype is simulated.
 */
export interface DemoUser {
  id: string;
  label: string;
  role: Role;
  /** What the user may see: 'all', or a state, LGA, facility or community id. */
  scopeId: string;
  active: boolean;
}

const programmeUsers: DemoUser[] = [
  {
    id: 'U-ADM-01',
    label: 'Demo Super Administrator',
    role: 'admin',
    scopeId: 'all',
    active: true,
  },
  {
    id: 'U-STA-01',
    label: 'Demo State Manager (Arewa)',
    role: 'state',
    scopeId: 'st-arewa',
    active: true,
  },
  {
    id: 'U-STA-02',
    label: 'Demo State Manager (Savanna)',
    role: 'state',
    scopeId: 'st-savanna',
    active: true,
  },
  {
    id: 'U-LGA-01',
    label: 'Demo LGA Officer (Central)',
    role: 'lga',
    scopeId: 'lga-c',
    active: true,
  },
  {
    id: 'U-LGA-02',
    label: 'Demo LGA Officer (North)',
    role: 'lga',
    scopeId: 'lga-n',
    active: true,
  },
  {
    id: 'U-LGA-03',
    label: 'Demo LGA Officer (East)',
    role: 'lga',
    scopeId: 'lga-e',
    active: false,
  },
  {
    id: 'U-FAC-01',
    label: 'Demo Facility Worker (Central General)',
    role: 'facility',
    scopeId: 'fac-c1',
    active: true,
  },
  {
    id: 'U-FAC-02',
    label: 'Demo Facility Worker (North PHC)',
    role: 'facility',
    scopeId: 'fac-n1',
    active: true,
  },
];

export const DEMO_USERS: readonly DemoUser[] = [
  ...programmeUsers,
  ...DEMO_CHWS.map<DemoUser>((c) => ({
    id: `U-${c.id}`,
    label: c.label,
    role: 'chw',
    scopeId: c.communityId,
    active: true,
  })),
];

/** The scope the simulated session gets for each role. */
export const DEMO_SCOPE_FOR_ROLE: Record<Role, string> = {
  chw: 'com-01',
  facility: 'fac-c1',
  lga: 'lga-c',
  state: 'st-arewa',
  admin: 'all',
};
