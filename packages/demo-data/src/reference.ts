/**
 * FICTIONAL reference data for the demonstration. No name, boundary, location or capacity
 * here describes a real place, facility or health worker. Coordinates arrive in Stage 3 with
 * clearly labelled fictional geometry.
 */
export interface DemoLga {
  id: string;
  name: string;
}
export interface DemoCommunity {
  id: string;
  name: string;
  lgaId: string;
}
export interface DemoFacility {
  id: string;
  name: string;
  lgaId: string;
  kind: 'Primary health centre' | 'Health post' | 'General hospital';
}
export interface DemoChw {
  id: string;
  label: string;
  communityId: string;
}

export const DEMO_LGAS: readonly DemoLga[] = [
  { id: 'lga-n', name: 'Demo North LGA' },
  { id: 'lga-c', name: 'Demo Central LGA' },
  { id: 'lga-s', name: 'Demo South LGA' },
];

export const DEMO_COMMUNITIES: readonly DemoCommunity[] = [
  { id: 'com-01', name: 'Demo Riverside', lgaId: 'lga-n' },
  { id: 'com-02', name: 'Demo Hillview', lgaId: 'lga-n' },
  { id: 'com-03', name: 'Demo Marketfield', lgaId: 'lga-n' },
  { id: 'com-04', name: 'Demo Lakeside', lgaId: 'lga-c' },
  { id: 'com-05', name: 'Demo Crossroads', lgaId: 'lga-c' },
  { id: 'com-06', name: 'Demo Greenbelt', lgaId: 'lga-c' },
  { id: 'com-07', name: 'Demo Palmgrove', lgaId: 'lga-s' },
  { id: 'com-08', name: 'Demo Dryfield', lgaId: 'lga-s' },
  { id: 'com-09', name: 'Demo Streamside', lgaId: 'lga-s' },
];

export const DEMO_FACILITIES: readonly DemoFacility[] = [
  {
    id: 'fac-n1',
    name: 'Demo North Primary Health Centre',
    lgaId: 'lga-n',
    kind: 'Primary health centre',
  },
  { id: 'fac-n2', name: 'Demo Hillview Health Post', lgaId: 'lga-n', kind: 'Health post' },
  { id: 'fac-c1', name: 'Demo Central General Hospital', lgaId: 'lga-c', kind: 'General hospital' },
  {
    id: 'fac-c2',
    name: 'Demo Lakeside Primary Health Centre',
    lgaId: 'lga-c',
    kind: 'Primary health centre',
  },
  {
    id: 'fac-s1',
    name: 'Demo South Primary Health Centre',
    lgaId: 'lga-s',
    kind: 'Primary health centre',
  },
  { id: 'fac-s2', name: 'Demo Streamside Health Post', lgaId: 'lga-s', kind: 'Health post' },
];

/** The single synthetic CHW used by the simulated login. It is a label, not a person. */
export const DEMO_CHW: DemoChw = { id: 'CHW-0142', label: 'Demo CHW 0142', communityId: 'com-01' };

export function communityName(id: string): string {
  return DEMO_COMMUNITIES.find((c) => c.id === id)?.name ?? id;
}

export function facilityName(id: string): string {
  return DEMO_FACILITIES.find((f) => f.id === id)?.name ?? id;
}

/** Facilities in the same LGA as the community, nearest-first is not modelled (no geography yet). */
export function facilitiesForCommunity(communityId: string): readonly DemoFacility[] {
  const lga = DEMO_COMMUNITIES.find((c) => c.id === communityId)?.lgaId;
  const same = DEMO_FACILITIES.filter((f) => f.lgaId === lga);
  return same.length > 0 ? same : DEMO_FACILITIES;
}
