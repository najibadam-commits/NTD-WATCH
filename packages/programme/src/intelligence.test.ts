import { describe, expect, it } from 'vitest';
import {
  INTELLIGENCE_LIMITS,
  INTELLIGENCE_THRESHOLD,
  PROGRAMME_PRIORITIES,
  accessBand,
  countByProgrammePriority,
  dataConfidence,
  explain,
  intelligenceRow,
  observationRange,
  overallVulnerability,
  programmePriority,
  rankIntelligence,
  signalActivityOf,
  type CommunityIntelligenceInput,
} from './intelligence';

const input = (patch: Partial<CommunityIntelligenceInput> = {}): CommunityIntelligenceInput => ({
  communityId: 'com-01',
  name: 'Demo Community',
  stateId: 'st-1',
  lgaId: 'lga-1',
  wardId: 'w-1',
  washBand: 'MODERATE',
  observations: 24,
  withSignal: 4,
  withWaterContact: 6,
  withAccessBarrier: 6,
  weeksWithData: 6,
  ...patch,
});

describe('observation ranges (no exact counts are published)', () => {
  it.each([
    [0, 'UNDER_THRESHOLD'],
    [4, 'UNDER_THRESHOLD'],
    [5, '5_9'],
    [9, '5_9'],
    [10, '10_19'],
    [19, '10_19'],
    [20, '20_49'],
    [49, '20_49'],
    [50, '50_PLUS'],
    [400, '50_PLUS'],
  ])('%i observations -> %s', (n, range) => {
    expect(observationRange(n)).toBe(range);
  });
});

describe('signal activity', () => {
  it('is not shown below the threshold', () => {
    expect(signalActivityOf(4, 4)).toBe('NOT_SHOWN');
    expect(signalActivityOf(0, 0)).toBe('NOT_SHOWN');
  });
  it('uses the demonstration limits', () => {
    expect(signalActivityOf(0, 20)).toBe('LOW');
    expect(signalActivityOf(Math.ceil(20 * INTELLIGENCE_LIMITS.signalModerate), 20)).toBe(
      'MODERATE',
    );
    expect(signalActivityOf(Math.ceil(20 * INTELLIGENCE_LIMITS.signalElevated), 20)).toBe(
      'ELEVATED',
    );
  });
});

describe('access and service context', () => {
  it('is not shown below the threshold', () => {
    expect(accessBand(3, 4, 0)).toBe('NOT_SHOWN');
  });
  it('combines the reported barrier with the synthetic service gap', () => {
    expect(accessBand(0, 20, 2)).toBe('LOW');
    expect(accessBand(0, 20, 0)).toBe('MODERATE');
    expect(accessBand(10, 20, 0)).toBe('HIGH');
    expect(accessBand(10, 20, 2)).toBe('MODERATE');
  });
});

describe('vulnerability calculation', () => {
  it('is not shown when no dimension is shown', () => {
    expect(
      overallVulnerability({ wash: 'NOT_SHOWN', waterContact: 'NOT_SHOWN', access: 'NOT_SHOWN' }),
    ).toBe('NOT_SHOWN');
  });
  it('averages only the dimensions that are shown', () => {
    expect(
      overallVulnerability({ wash: 'HIGH', waterContact: 'NOT_SHOWN', access: 'NOT_SHOWN' }),
    ).toBe('HIGH');
    expect(overallVulnerability({ wash: 'LOW', waterContact: 'LOW', access: 'LOW' })).toBe('LOW');
    expect(overallVulnerability({ wash: 'HIGH', waterContact: 'HIGH', access: 'LOW' })).toBe(
      'HIGH',
    );
    expect(overallVulnerability({ wash: 'MODERATE', waterContact: 'LOW', access: 'LOW' })).toBe(
      'LOW',
    );
    expect(
      overallVulnerability({ wash: 'MODERATE', waterContact: 'MODERATE', access: 'LOW' }),
    ).toBe('MODERATE');
  });
});

describe('data confidence', () => {
  it('is insufficient below the threshold', () => {
    expect(dataConfidence(INTELLIGENCE_THRESHOLD - 1, 10, 3)).toBe('INSUFFICIENT');
  });
  it('is low with few observations in a single week', () => {
    expect(dataConfidence(6, 1, 3)).toBe('LOW');
    expect(dataConfidence(6, 1, 2)).toBe('LOW');
  });
  it('is medium with moderate support', () => {
    expect(dataConfidence(12, 2, 3)).toBe('MEDIUM');
  });
  it('is high only with many observations over several weeks', () => {
    expect(dataConfidence(30, 8, 3)).toBe('HIGH');
    expect(dataConfidence(30, 1, 2)).toBe('MEDIUM');
  });
});

describe('priority calculation', () => {
  it('maps the point total to the four programme categories', () => {
    expect(programmePriority('LOW', 'LOW', 'HIGH').priority).toBe('LOW_PRIORITY');
    expect(programmePriority('MODERATE', 'LOW', 'HIGH').priority).toBe('LOW_PRIORITY');
    expect(programmePriority('MODERATE', 'MODERATE', 'HIGH').priority).toBe('MONITOR');
    expect(programmePriority('ELEVATED', 'LOW', 'HIGH').priority).toBe('MONITOR');
    expect(programmePriority('ELEVATED', 'MODERATE', 'HIGH').priority).toBe('PRIORITY_FOR_REVIEW');
    expect(programmePriority('ELEVATED', 'HIGH', 'HIGH').priority).toBe(
      'HIGH_PRIORITY_FOR_ATTENTION',
    );
  });
  it('is insufficient when any input is not shown', () => {
    expect(programmePriority('NOT_SHOWN', 'HIGH', 'HIGH').priority).toBe('INSUFFICIENT_DATA');
    expect(programmePriority('ELEVATED', 'NOT_SHOWN', 'HIGH').priority).toBe('INSUFFICIENT_DATA');
    expect(programmePriority('ELEVATED', 'HIGH', 'INSUFFICIENT').priority).toBe(
      'INSUFFICIENT_DATA',
    );
  });
  it('holds the top category back when data confidence is low', () => {
    expect(programmePriority('ELEVATED', 'HIGH', 'LOW')).toEqual({
      priority: 'PRIORITY_FOR_REVIEW',
      cappedByConfidence: true,
    });
    expect(programmePriority('ELEVATED', 'HIGH', 'MEDIUM').cappedByConfidence).toBe(false);
  });
  it('is deterministic', () => {
    expect(intelligenceRow(input())).toEqual(intelligenceRow(input()));
  });
  it('does not reuse the case-level Low/Moderate/High/Urgent wording as categories', () => {
    for (const p of PROGRAMME_PRIORITIES) expect(p).not.toMatch(/^(LOW|MODERATE|HIGH|URGENT)$/);
  });
});

describe('explanations', () => {
  it('explain every category from bands only', () => {
    for (const row of [
      intelligenceRow(input()),
      intelligenceRow(input({ observations: 3, withSignal: 3 })),
      intelligenceRow(
        input({ observations: 8, withSignal: 8, washBand: 'HIGH', weeksWithData: 1 }),
      ),
    ]) {
      expect(row.why.length).toBeGreaterThan(0);
      expect(row.why.join(' ')).not.toMatch(/\d{2,}/);
    }
  });
  it('says more information is needed when data is insufficient', () => {
    const row = intelligenceRow(input({ observations: 2, withSignal: 2 }));
    expect(row.priority).toBe('INSUFFICIENT_DATA');
    expect(row.observations).toBe('UNDER_THRESHOLD');
    expect(row.signalActivity).toBe('NOT_SHOWN');
    expect(row.why.join(' ')).toMatch(/more information is needed/i);
  });
  it('states the confidence cap in words', () => {
    const row = intelligenceRow(
      input({
        observations: 8,
        withSignal: 8,
        washBand: 'HIGH',
        withWaterContact: 8,
        weeksWithData: 1,
        withAccessBarrier: 8,
      }),
    );
    expect(row.confidence).toBe('LOW');
    expect(row.cappedByConfidence).toBe(true);
    expect(row.why.join(' ')).toMatch(/held at "priority for review"/);
  });
  it('mentions data confidence in the lead sentence', () => {
    const row = intelligenceRow(input());
    expect(row.why[0]).toMatch(/data confidence/);
  });
  it('never claims disease, diagnosis or prevalence', () => {
    const text = [
      ...PROGRAMME_PRIORITIES.flatMap((p) =>
        explain({
          priority: p,
          signalActivity: 'ELEVATED',
          vulnerability: 'HIGH',
          confidence: 'MEDIUM',
          cappedByConfidence: false,
          dimensions: { wash: 'HIGH', waterContact: 'HIGH', access: 'HIGH' },
        }),
      ),
    ].join(' ');
    expect(text).not.toMatch(
      /\bhas FGS\b|high risk|prevalence is|diagnos(is|tic)(?! )|treatment|hotspot/i,
    );
  });
});

describe('community aggregation helpers', () => {
  it('ranks most attention first, then higher confidence, then name', () => {
    const rows = [
      intelligenceRow(input({ communityId: 'a', name: 'B', withSignal: 0 })),
      intelligenceRow(
        input({
          communityId: 'b',
          name: 'A',
          withSignal: 12,
          washBand: 'HIGH',
          withWaterContact: 20,
          withAccessBarrier: 20,
        }),
      ),
      intelligenceRow(input({ communityId: 'c', name: 'C', observations: 2, withSignal: 2 })),
    ];
    const ranked = rankIntelligence(rows);
    expect(ranked[0]!.communityId).toBe('b');
    expect(ranked[ranked.length - 1]!.priority).toBe('INSUFFICIENT_DATA');
  });
  it('counts every priority, including those with zero communities', () => {
    const counts = countByProgrammePriority([intelligenceRow(input())]);
    expect(Object.keys(counts).sort()).toEqual([...PROGRAMME_PRIORITIES].sort());
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(1);
  });
  it('outputs only community-level, synthetic-marked fields', () => {
    const row = intelligenceRow(input());
    expect(row.synthetic).toBe(true);
    expect(Object.keys(row).sort()).toEqual(
      [
        'synthetic',
        'communityId',
        'name',
        'stateId',
        'lgaId',
        'wardId',
        'observations',
        'signalActivity',
        'dimensions',
        'vulnerability',
        'confidence',
        'priority',
        'cappedByConfidence',
        'why',
      ].sort(),
    );
  });
});
