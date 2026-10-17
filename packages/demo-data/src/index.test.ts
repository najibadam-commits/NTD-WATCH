import { describe, expect, it } from 'vitest';
import { createRng } from './index';

describe('createRng', () => {
  it('is deterministic for a given seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('differs between seeds and stays in [0, 1)', () => {
    const a = createRng(1)();
    const b = createRng(2)();
    expect(a).not.toBe(b);
    for (let i = 0, r = createRng(7); i < 200; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

import {
  DEMO_CHW,
  DEMO_COMMUNITIES,
  DEMO_FACILITIES,
  DEMO_LGAS,
  facilitiesForCommunity,
} from './index';

describe('reference data', () => {
  it('is entirely fictional: every name is labelled Demo', () => {
    for (const x of [...DEMO_LGAS, ...DEMO_COMMUNITIES, ...DEMO_FACILITIES]) {
      expect(x.name).toMatch(/^Demo /);
    }
    expect(DEMO_CHW.label).toMatch(/^Demo /);
  });

  it('links every community and facility to a known LGA', () => {
    const lgas = new Set(DEMO_LGAS.map((l) => l.id));
    for (const c of DEMO_COMMUNITIES) expect(lgas.has(c.lgaId)).toBe(true);
    for (const f of DEMO_FACILITIES) expect(lgas.has(f.lgaId)).toBe(true);
  });

  it('offers facilities in the community LGA first', () => {
    const list = facilitiesForCommunity('com-01');
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((f) => f.lgaId === 'lga-n')).toBe(true);
  });
});
