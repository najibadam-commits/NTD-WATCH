/**
 * STAGE 1 SCAFFOLD: seeded random generator and demo labels.
 * Synthetic geography, facilities, users and records arrive in Stages 2 and 3.
 * All generated data must stay synthetic and carry `demo: true`.
 */
export const DEMO_STATE_NAME = 'Arewa Demo State';
export const DEMO_LABEL = 'DEMO DATA';

/** Deterministic PRNG (mulberry32) so demo data and tests are reproducible. */
export function createRng(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
