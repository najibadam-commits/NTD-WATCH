import { describe, expect, it } from 'vitest';
import {
  DEMO_CHWS,
  DEMO_COMMUNITIES,
  DEMO_FACILITIES,
  DEMO_GEOGRAPHY,
  DEMO_LGAS,
  DEMO_STATES,
  DEMO_WARDS,
  GEOGRAPHY_LABEL,
  DEMO_USERS,
  DEMO_SCOPE_FOR_ROLE,
} from './index';

const unique = (xs: string[]) => new Set(xs).size === xs.length;

describe('fictional hierarchy', () => {
  it('uses unique ids at every level', () => {
    for (const level of [DEMO_STATES, DEMO_LGAS, DEMO_WARDS, DEMO_COMMUNITIES, DEMO_FACILITIES]) {
      expect(unique(level.map((x) => x.id))).toBe(true);
    }
    expect(unique(DEMO_CHWS.map((c) => c.id))).toBe(true);
  });
  it('links every child to an existing parent, consistently', () => {
    for (const l of DEMO_LGAS) expect(DEMO_STATES.some((s) => s.id === l.stateId)).toBe(true);
    for (const w of DEMO_WARDS) expect(DEMO_LGAS.some((l) => l.id === w.lgaId)).toBe(true);
    for (const c of DEMO_COMMUNITIES) {
      const ward = DEMO_WARDS.find((w) => w.id === c.wardId)!;
      const lga = DEMO_LGAS.find((l) => l.id === c.lgaId)!;
      expect(ward.lgaId).toBe(c.lgaId);
      expect(lga.stateId).toBe(c.stateId);
    }
    for (const f of DEMO_FACILITIES) {
      const c = DEMO_COMMUNITIES.find((x) => x.id === f.communityId)!;
      expect(c.lgaId).toBe(f.lgaId);
    }
    for (const chw of DEMO_CHWS) {
      expect(DEMO_COMMUNITIES.some((c) => c.id === chw.communityId)).toBe(true);
    }
  });
  it('labels every place and person as fictional', () => {
    const names = [
      ...DEMO_STATES,
      ...DEMO_LGAS,
      ...DEMO_WARDS,
      ...DEMO_COMMUNITIES,
      ...DEMO_FACILITIES,
    ].map((x) => x.name);
    for (const n of names) expect(n).toMatch(/\bDemo\b/);
    expect(DEMO_CHWS.length).toBeGreaterThanOrEqual(8);
    expect(DEMO_CHWS.length).toBeLessThanOrEqual(12);
  });
  it('has one fictional user per CHW and demo-labelled programme users', () => {
    expect(DEMO_USERS.filter((u) => u.role === 'chw')).toHaveLength(DEMO_CHWS.length);
    expect(Object.keys(DEMO_SCOPE_FOR_ROLE).sort()).toEqual([
      'admin',
      'chw',
      'facility',
      'lga',
      'state',
    ]);
  });
});

describe('fictional GeoJSON', () => {
  it('has a polygon for every community and a point for every facility', () => {
    expect(DEMO_GEOGRAPHY.communities.features.map((f) => f.properties.id).sort()).toEqual(
      DEMO_COMMUNITIES.map((c) => c.id).sort(),
    );
    expect(DEMO_GEOGRAPHY.facilities.features).toHaveLength(DEMO_FACILITIES.length);
  });
  it('closes every ring and keeps coordinates finite', () => {
    for (const f of DEMO_GEOGRAPHY.communities.features) {
      const ring = f.geometry.coordinates[0]!;
      expect(ring.length).toBeGreaterThanOrEqual(4);
      expect(ring[0]).toEqual(ring.at(-1));
      for (const [x, y] of ring) {
        expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
      }
    }
  });
  it('flags every feature as synthetic and sits away from real-world coordinates', () => {
    for (const f of DEMO_GEOGRAPHY.communities.features) expect(f.properties.synthetic).toBe(true);
    for (const f of DEMO_GEOGRAPHY.facilities.features) expect(f.properties.synthetic).toBe(true);
    for (const f of DEMO_GEOGRAPHY.communities.features) {
      for (const [x, y] of f.geometry.coordinates[0]!) {
        expect(Math.abs(x)).toBeLessThan(5);
        expect(Math.abs(y)).toBeLessThan(5);
      }
    }
    expect(GEOGRAPHY_LABEL).toMatch(/FICTIONAL/);
    expect(GEOGRAPHY_LABEL).toMatch(/NOT A REAL PLACE/);
  });
  it('is deterministic', () => {
    expect(JSON.stringify(DEMO_GEOGRAPHY)).toBe(JSON.stringify(DEMO_GEOGRAPHY));
  });
  it('has a boundary layer for each administrative level', () => {
    expect(DEMO_GEOGRAPHY.wardBoundaries.features.length).toBeGreaterThan(0);
    expect(DEMO_GEOGRAPHY.lgaBoundaries.features.length).toBeGreaterThan(0);
    expect(DEMO_GEOGRAPHY.stateBoundaries.features.length).toBeGreaterThan(0);
  });
});
