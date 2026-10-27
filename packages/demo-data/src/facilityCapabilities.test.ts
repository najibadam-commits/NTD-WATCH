import { describe, expect, it } from 'vitest';
import { DEMO_FACILITIES } from './reference';
import { FACILITY_CAPABILITIES, matchesNeeds, rankFacilities } from './facilityCapabilities';

describe('synthetic facility capabilities', () => {
  it('covers only facilities that exist and every value is marked synthetic', () => {
    const ids = new Set(DEMO_FACILITIES.map((f) => f.id));
    for (const [id, c] of Object.entries(FACILITY_CAPABILITIES)) {
      expect(ids.has(id)).toBe(true);
      expect(c.synthetic).toBe(true);
    }
  });

  it('ranks a facility that cannot take referrals last but keeps it in the list', () => {
    const ranked = rankFacilities(DEMO_FACILITIES, { femaleClinician: false });
    expect(ranked).toHaveLength(DEMO_FACILITIES.length);
    const none = ranked.filter((r) => r.capability?.referralCapacity === 'NONE');
    expect(none.length).toBeGreaterThan(0);
    const lastScores = ranked.slice(-none.length).map((r) => r.facility.id);
    for (const r of none) expect(lastScores).toContain(r.facility.id);
  });

  it('a female-clinician preference excludes facilities without one from the matching set', () => {
    const needs = { femaleClinician: true };
    const ranked = rankFacilities(DEMO_FACILITIES, needs);
    const matching = ranked.filter((r) => matchesNeeds(r, needs));
    expect(matching.length).toBeGreaterThan(0);
    for (const r of matching) expect(r.capability?.femaleClinician).toBe(true);
    const c1 = ranked.find((r) => r.facility.id === 'fac-c1');
    expect(c1?.gaps).toContain('femaleClinician');
  });

  it('a facility with no capability record never matches', () => {
    const ranked = rankFacilities([{ ...DEMO_FACILITIES[0]!, id: 'fac-unknown' }], {
      femaleClinician: false,
    });
    expect(matchesNeeds(ranked[0]!, { femaleClinician: false })).toBe(false);
  });
});
