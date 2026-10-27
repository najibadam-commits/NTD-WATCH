import { describe, expect, it } from 'vitest';
import { FGS_CONTENT, FGS_RULE_SET, normaliseStatus } from '../index';

/**
 * Gate audit as a regression test: counts by status, and nothing above DEMO without evidence.
 * If review evidence is ever added to the repository, these expectations must be changed on
 * purpose, together with the evidence, never silently.
 */
const tally = (statuses: string[]) =>
  Object.fromEntries(
    ['DEMO', 'DRAFT', 'CLINICALLY_REVIEWED', 'VALIDATED'].map((s) => [
      s,
      statuses.filter((x) => x === s).length,
    ]),
  );

describe('FGS status audit', () => {
  it('counts every content item by status: all DEMO, none reviewed or validated', () => {
    const counts = tally(FGS_CONTENT.items.map((i) => i.provenance.status));
    expect(counts).toEqual({
      DEMO: FGS_CONTENT.items.length,
      DRAFT: 0,
      CLINICALLY_REVIEWED: 0,
      VALIDATED: 0,
    });
    expect(FGS_CONTENT.items.length).toBeGreaterThan(0);
    expect(FGS_CONTENT.items.every((i) => i.provenance.reviewerStatus === 'NOT_REVIEWED')).toBe(
      true,
    );
    expect(FGS_CONTENT.items.every((i) => i.provenance.lastReviewed === null)).toBe(true);
  });

  it('counts every rule by effective status: all DEMO, none reviewed or validated', () => {
    const effective = FGS_RULE_SET.rules.map((r) =>
      normaliseStatus(r.status ?? FGS_RULE_SET.status),
    );
    const counts = tally(effective);
    expect(counts.DEMO).toBe(FGS_RULE_SET.rules.length);
    expect(counts.DEMO).toBeGreaterThan(0);
    expect(counts.DRAFT).toBe(0);
    expect(counts.CLINICALLY_REVIEWED).toBe(0);
    expect(counts.VALIDATED).toBe(0);
    expect(FGS_RULE_SET.validationStatus).toBe('NOT_VALIDATED');
  });

  it('never describes its sources as WHO-validated or nationally validated', () => {
    const text = JSON.stringify([FGS_CONTENT, FGS_RULE_SET]);
    expect(text).not.toMatch(/WHO[- ]validated|nationally validated|validated by WHO/i);
  });
});
