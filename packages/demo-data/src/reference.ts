/**
 * FICTIONAL reference data for the demonstration. No name, boundary, location, capacity or
 * person here describes a real place, facility or health worker. The hierarchy imitates the
 * shape of a Nigerian administrative structure (state > LGA > ward > community, with health
 * facilities attached to LGAs) so that programme screens can be demonstrated. It does not
 * reproduce any real state, LGA, ward, community or facility.
 */
export interface DemoState {
  id: string;
  name: string;
}
export interface DemoLga {
  id: string;
  name: string;
  stateId: string;
}
export interface DemoWard {
  id: string;
  name: string;
  lgaId: string;
}
export interface DemoCommunity {
  id: string;
  name: string;
  lgaId: string;
  wardId: string;
  stateId: string;
}
export interface DemoFacility {
  id: string;
  name: string;
  lgaId: string;
  /** The fictional community the facility sits in (used to place it on the fictional map). */
  communityId: string;
  kind: 'Primary health centre' | 'Health post' | 'General hospital';
}
export interface DemoChw {
  id: string;
  label: string;
  communityId: string;
}

export const DEMO_STATES: readonly DemoState[] = [
  { id: 'st-arewa', name: 'Arewa Demo State' },
  { id: 'st-savanna', name: 'Savanna Demo State' },
];

export const DEMO_LGAS: readonly DemoLga[] = [
  { id: 'lga-n', name: 'Demo North LGA', stateId: 'st-arewa' },
  { id: 'lga-c', name: 'Demo Central LGA', stateId: 'st-arewa' },
  { id: 'lga-s', name: 'Demo South LGA', stateId: 'st-arewa' },
  { id: 'lga-e', name: 'Demo East LGA', stateId: 'st-savanna' },
  { id: 'lga-w', name: 'Demo West LGA', stateId: 'st-savanna' },
];

export const DEMO_WARDS: readonly DemoWard[] = [
  { id: 'ward-n1', name: 'Demo North Ward 1', lgaId: 'lga-n' },
  { id: 'ward-n2', name: 'Demo North Ward 2', lgaId: 'lga-n' },
  { id: 'ward-c1', name: 'Demo Central Ward 1', lgaId: 'lga-c' },
  { id: 'ward-c2', name: 'Demo Central Ward 2', lgaId: 'lga-c' },
  { id: 'ward-s1', name: 'Demo South Ward 1', lgaId: 'lga-s' },
  { id: 'ward-s2', name: 'Demo South Ward 2', lgaId: 'lga-s' },
  { id: 'ward-e1', name: 'Demo East Ward 1', lgaId: 'lga-e' },
  { id: 'ward-e2', name: 'Demo East Ward 2', lgaId: 'lga-e' },
  { id: 'ward-w1', name: 'Demo West Ward 1', lgaId: 'lga-w' },
  { id: 'ward-w2', name: 'Demo West Ward 2', lgaId: 'lga-w' },
];

function community(id: string, name: string, wardId: string): DemoCommunity {
  const ward = DEMO_WARDS.find((w) => w.id === wardId)!;
  const lga = DEMO_LGAS.find((l) => l.id === ward.lgaId)!;
  return { id, name, lgaId: lga.id, wardId, stateId: lga.stateId };
}

export const DEMO_COMMUNITIES: readonly DemoCommunity[] = [
  community('com-01', 'Demo Riverside', 'ward-n1'),
  community('com-02', 'Demo Hillview', 'ward-n1'),
  community('com-03', 'Demo Marketfield', 'ward-n2'),
  community('com-04', 'Demo Lakeside', 'ward-c1'),
  community('com-05', 'Demo Crossroads', 'ward-c1'),
  community('com-06', 'Demo Greenbelt', 'ward-c2'),
  community('com-07', 'Demo Palmgrove', 'ward-s1'),
  community('com-08', 'Demo Dryfield', 'ward-s2'),
  community('com-09', 'Demo Streamside', 'ward-s2'),
  community('com-10', 'Demo Baobab Flats', 'ward-e1'),
  community('com-11', 'Demo Salt Pan', 'ward-e1'),
  community('com-12', 'Demo Kiln Road', 'ward-e2'),
  community('com-13', 'Demo Wadi Bend', 'ward-w1'),
  community('com-14', 'Demo Acacia Row', 'ward-w2'),
  community('com-15', 'Demo Reedbed', 'ward-w2'),
];

export const DEMO_FACILITIES: readonly DemoFacility[] = [
  {
    id: 'fac-n1',
    name: 'Demo North Primary Health Centre',
    lgaId: 'lga-n',
    communityId: 'com-03',
    kind: 'Primary health centre',
  },
  {
    id: 'fac-n2',
    name: 'Demo Hillview Health Post',
    lgaId: 'lga-n',
    communityId: 'com-02',
    kind: 'Health post',
  },
  {
    id: 'fac-c1',
    name: 'Demo Central General Hospital',
    lgaId: 'lga-c',
    communityId: 'com-05',
    kind: 'General hospital',
  },
  {
    id: 'fac-c2',
    name: 'Demo Lakeside Primary Health Centre',
    lgaId: 'lga-c',
    communityId: 'com-04',
    kind: 'Primary health centre',
  },
  {
    id: 'fac-s1',
    name: 'Demo South Primary Health Centre',
    lgaId: 'lga-s',
    communityId: 'com-08',
    kind: 'Primary health centre',
  },
  {
    id: 'fac-s2',
    name: 'Demo Streamside Health Post',
    lgaId: 'lga-s',
    communityId: 'com-09',
    kind: 'Health post',
  },
  {
    id: 'fac-e1',
    name: 'Demo East Primary Health Centre',
    lgaId: 'lga-e',
    communityId: 'com-11',
    kind: 'Primary health centre',
  },
  {
    id: 'fac-w1',
    name: 'Demo West General Hospital',
    lgaId: 'lga-w',
    communityId: 'com-14',
    kind: 'General hospital',
  },
  {
    id: 'fac-w2',
    name: 'Demo Wadi Health Post',
    lgaId: 'lga-w',
    communityId: 'com-13',
    kind: 'Health post',
  },
];

/**
 * Fictional community health workers. They are labels, not people. CHW-0142 is the account
 * the simulated CHW sign-in uses, so its records come only from what is entered in the app.
 * Communities without a CHW (com-05, com-08, com-11, com-12, com-14) are deliberate: they show
 * a coverage gap in programme views.
 */
export const DEMO_CHWS: readonly DemoChw[] = [
  { id: 'CHW-0142', label: 'Demo CHW 0142', communityId: 'com-01' },
  { id: 'CHW-0143', label: 'Demo CHW 0143', communityId: 'com-01' },
  { id: 'CHW-0157', label: 'Demo CHW 0157', communityId: 'com-02' },
  { id: 'CHW-0168', label: 'Demo CHW 0168', communityId: 'com-03' },
  { id: 'CHW-0204', label: 'Demo CHW 0204', communityId: 'com-04' },
  { id: 'CHW-0219', label: 'Demo CHW 0219', communityId: 'com-06' },
  { id: 'CHW-0231', label: 'Demo CHW 0231', communityId: 'com-07' },
  { id: 'CHW-0246', label: 'Demo CHW 0246', communityId: 'com-09' },
  { id: 'CHW-0310', label: 'Demo CHW 0310', communityId: 'com-10' },
  { id: 'CHW-0325', label: 'Demo CHW 0325', communityId: 'com-13' },
  { id: 'CHW-0338', label: 'Demo CHW 0338', communityId: 'com-15' },
];

/** The single synthetic CHW used by the simulated login. It is a label, not a person. */
export const DEMO_CHW: DemoChw = DEMO_CHWS[0]!;

export function stateName(id: string): string {
  return DEMO_STATES.find((s) => s.id === id)?.name ?? id;
}

export function lgaName(id: string): string {
  return DEMO_LGAS.find((l) => l.id === id)?.name ?? id;
}

export function wardName(id: string): string {
  return DEMO_WARDS.find((w) => w.id === id)?.name ?? id;
}

export function communityName(id: string): string {
  return DEMO_COMMUNITIES.find((c) => c.id === id)?.name ?? id;
}

export function facilityName(id: string): string {
  return DEMO_FACILITIES.find((f) => f.id === id)?.name ?? id;
}

export function communityById(id: string): DemoCommunity | undefined {
  return DEMO_COMMUNITIES.find((c) => c.id === id);
}

/** Facilities in the same LGA as the community; all facilities if the LGA has none. */
export function facilitiesForCommunity(communityId: string): readonly DemoFacility[] {
  const lga = communityById(communityId)?.lgaId;
  const same = DEMO_FACILITIES.filter((f) => f.lgaId === lga);
  return same.length > 0 ? same : DEMO_FACILITIES;
}
