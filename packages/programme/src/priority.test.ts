import { describe, expect, it } from 'vitest';
import { ALL_SCOPE } from '@ntd-watch/domain';
import {
  PRIORITY_LABELS,
  countByCategory,
  generateSeed,
  priorityCategory,
  rankPriorities,
  signalBand,
  summarise,
} from './index';

const ANCHOR = new Date('2026-10-18T12:00:00Z');
const range = { from: '2026-07-27', to: '2026-10-18' };
const summary = summarise(generateSeed({ anchor: ANCHOR }), range, ALL_SCOPE, {
  now: ANCHOR,
  maxUnresolvedDays: 7,
});
const rows = rankPriorities(summary.communities);
const row = (id: string) => rows.find((r) => r.communityId === id)!;

describe('priority matrix (demonstration categories)', () => {
  it('maps the four cells exactly as the brief defines them', () => {
    expect(priorityCategory('HIGH', 'HIGH')).toBe('PRIORITY_INTERVENTION');
    expect(priorityCategory('HIGH', 'LOW')).toBe('INVESTIGATE_SIGNAL');
    expect(priorityCategory('LOW', 'HIGH')).toBe('PREVENTION_SURVEILLANCE');
    expect(priorityCategory('LOW', 'LOW')).toBe('LOWER_PRIORITY');
  });
  it('counts MODERATE as lower on either layer', () => {
    expect(priorityCategory('MODERATE', 'HIGH')).toBe('PREVENTION_SURVEILLANCE');
    expect(priorityCategory('HIGH', 'MODERATE')).toBe('INVESTIGATE_SIGNAL');
  });
  it('refuses to place a community with too few assessments', () => {
    expect(signalBand(3, 4)).toBe('INSUFFICIENT_DATA');
    expect(priorityCategory('INSUFFICIENT_DATA', 'HIGH')).toBe('INSUFFICIENT_DATA');
    expect(priorityCategory('HIGH', 'INSUFFICIENT_DATA')).toBe('INSUFFICIENT_DATA');
  });
  it('bands the signal share at the demonstration limits', () => {
    expect(signalBand(8, 100)).toBe('MODERATE');
    expect(signalBand(7, 100)).toBe('LOW');
    expect(signalBand(15, 100)).toBe('HIGH');
  });
});

describe('seeded demo scenarios', () => {
  it('scenario A: com-09 is high signal, high vulnerability, rising, with follow-up still open', () => {
    const r = row('com-09');
    expect(r.category).toBe('PRIORITY_INTERVENTION');
    expect(r.direction).toBe('rising');
    expect(r.unresolved + r.followUpsDue).toBeGreaterThanOrEqual(3);
  });
  it('scenario B: com-03 has a high signal but lower vulnerability', () => {
    const r = row('com-03');
    expect(r.signalBand).toBe('HIGH');
    expect(r.vulnerabilityBand).toBe('LOW');
    expect(r.category).toBe('INVESTIGATE_SIGNAL');
  });
  it('scenario C: com-02 has high vulnerability but a low signal', () => {
    const r = row('com-02');
    expect(r.signalBand).toBe('LOW');
    expect(r.vulnerabilityBand).toBe('HIGH');
    expect(r.category).toBe('PREVENTION_SURVEILLANCE');
  });
  it('every category in the matrix is populated by at least one community', () => {
    const c = countByCategory(rows);
    expect(c.PRIORITY_INTERVENTION).toBeGreaterThan(0);
    expect(c.INVESTIGATE_SIGNAL).toBeGreaterThan(0);
    expect(c.PREVENTION_SURVEILLANCE).toBeGreaterThan(0);
    expect(c.LOWER_PRIORITY).toBeGreaterThan(0);
  });
});

describe('ranking and explanation', () => {
  it('ranks priority interventions first and unplaced communities last', () => {
    expect(rows[0]!.category).toBe('PRIORITY_INTERVENTION');
    expect(rows.at(-1)!.category).toBe('INSUFFICIENT_DATA');
  });
  it('is stable: the same input gives the same order', () => {
    expect(rankPriorities(summary.communities).map((r) => r.communityId)).toEqual(
      rows.map((r) => r.communityId),
    );
  });
  it('agrees with the shared summary figures, never contradicting them', () => {
    for (const r of rows) {
      const c = summary.communities.find((x) => x.communityId === r.communityId)!;
      expect(r.assessments).toBe(c.assessments);
      expect(r.signals).toBe(c.signals);
      expect(r.unresolved).toBe(c.unresolved);
      expect(r.followUpsDue).toBe(c.followUpsDue);
    }
    expect(summary.kpis.followUpsDue).toBe(
      summary.communities.reduce((n, c) => n + c.followUpsDue, 0),
    );
  });
  it('explains each placement from figures and never declares an outbreak', () => {
    for (const r of rows) {
      expect(r.why.length).toBeGreaterThan(0);
      expect(r.why.join(' ')).not.toMatch(/outbreak|epidemic|confirmed case|diagnos/i);
    }
    for (const label of Object.values(PRIORITY_LABELS)) {
      expect(label).not.toMatch(/outbreak|epidemic|diagnos/i);
    }
  });
});
