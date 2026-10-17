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
