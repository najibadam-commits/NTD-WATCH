import { describe, expect, it } from 'vitest';
import { INTELLIGENCE_NOTE } from '@ntd-watch/programme';
import intel from './locales/en.intelligence.json';

function strings(o: unknown): string[] {
  if (typeof o === 'string') return [o];
  if (o && typeof o === 'object') return Object.values(o).flatMap(strings);
  return [];
}

const all = [...strings(intel), INTELLIGENCE_NOTE];

describe('P2 user-facing wording', () => {
  it.each([
    ['diagnosis', /\bdiagnosis\b/i],
    ['diagnostic', /\bdiagnostic\b/i],
    ['disease prevalence', /disease prevalence/i],
    ['hotspot', /hot[- ]?spot/i],
    ['treatment', /\btreatment\b/i],
    ['mass treatment', /mass[- ]treatment/i],
    ['FGS risk', /\bFGS risk\b/i],
    ['clinical risk', /\bclinical risk\b/i],
    ['patient identification', /patient identification/i],
    ['has FGS', /\b(has|have) FGS\b/i],
    ['high risk', /\bhigh[- ]risk\b/i],
    ['prevalence is', /prevalence is/i],
  ])('does not use "%s"', (_name, pattern) => {
    const hits = all.filter((s) => pattern.test(s));
    expect(hits).toEqual([]);
  });
  it('states what the layer is not, and that the data is demonstration data', () => {
    const text = all.join(' ');
    expect(text).toMatch(/DEMONSTRATION DATA/);
    expect(text).toMatch(/not a validated epidemiological model/i);
    expect(text).toMatch(/does not diagnose disease/i);
    expect(text).toMatch(/does not estimate prevalence/i);
  });
  it('does not name programme priority with the case-level Low/Moderate/High/Urgent words', () => {
    const labels = Object.values(intel.intel.priority);
    for (const l of labels) expect(l).not.toMatch(/^(Low|Moderate|High|Urgent)$/);
  });
  it('uses the preferred vocabulary', () => {
    const text = all.join(' ').toLowerCase();
    for (const term of [
      'community signal',
      'contextual vulnerability',
      'programme priority',
      'priority for review',
      'outreach',
      'further assessment',
      'referral strengthening',
      'programme attention',
      'data confidence',
    ]) {
      expect(text, term).toContain(term);
    }
  });
});
