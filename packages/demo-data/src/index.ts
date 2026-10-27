/**
 * Synthetic data for the NTD-WATCH demonstration: a seeded random generator, a fictional
 * administrative hierarchy, fictional map geometry and a synthetic user directory.
 * Everything exported from here is fictional and must stay labelled as demonstration data.
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

export * from './reference';
export * from './profiles';
export * from './users';
export * from './geography';
export * from './facilityCapabilities';
