import { describe, expect, it } from 'vitest';
import {
  DEMO_LABEL_TEXT,
  DEMO_RULE_SET,
  evaluate,
  isDemoOnly,
  parseRuleSet,
  type AssessmentInput,
  type RuleSet,
} from './index';

const clean: AssessmentInput = {
  symptoms: ['fever'],
  duration: 'lt_1_week',
  progression: 'no',
  exposure: {
    waterContact: 'no',
    animalContact: 'no',
    insectBites: 'no',
    householdSimilar: 'no',
  },
  wash: {
    waterSource: 'improved',
    sanitation: 'improved',
    handwashing: 'yes',
    standingWater: 'no',
  },
};

const run = (patch: Partial<AssessmentInput>) => evaluate({ ...clean, ...patch }, DEMO_RULE_SET);

describe('rule set status', () => {
  it('treats placeholder rule sets as demonstration-only', () => {
    expect(isDemoOnly({ status: 'DEMO_PLACEHOLDER' })).toBe(true);
    expect(isDemoOnly({ status: 'VALIDATED' })).toBe(false);
  });

  it('ships a rule set that is demonstration-only and labelled as such', () => {
    expect(DEMO_RULE_SET.status).toBe('DEMO_PLACEHOLDER');
    expect(DEMO_RULE_SET.id.startsWith('demo-')).toBe(true);
    const result = run({});
    expect(result.demoOnly).toBe(true);
    expect(result.label).toBe(DEMO_LABEL_TEXT);
    expect(DEMO_LABEL_TEXT).toBe('DEMONSTRATION ONLY — NOT CLINICALLY VALIDATED');
  });
});

describe('expected outputs', () => {
  it('returns LOW when an indicator is reported with no other pattern', () => {
    const r = run({});
    expect(r.status).toBe('ASSESSED');
    expect(r.level).toBe('LOW');
    expect(r.firedRuleIds).toEqual([]);
    expect(r.dataQuality).toBe('COMPLETE');
    expect(r.recommendedAction).toBe(DEMO_RULE_SET.actions.LOW);
  });

  it('returns LOW for a person who reports no symptoms', () => {
    const r = evaluate(
      { ...clean, symptoms: [], noSymptomsReported: true, duration: null, progression: null },
      DEMO_RULE_SET,
    );
    expect(r.level).toBe('LOW');
  });

  it('returns MODERATE for an indicator lasting more than a week', () => {
    const r = run({ duration: '1_4_weeks' });
    expect(r.level).toBe('MODERATE');
    expect(r.firedRuleIds).toEqual(['M-DURATION']);
  });

  it('returns HIGH for limb swelling lasting a month or more', () => {
    const r = run({ symptoms: ['limb_swelling'], duration: '1_3_months' });
    expect(r.level).toBe('HIGH');
    expect(r.firedRuleIds).toContain('H-LIMB-DURATION');
  });

  it('returns URGENT for any warning sign, regardless of everything else', () => {
    const r = run({ symptoms: ['unable_to_drink'] });
    expect(r.level).toBe('URGENT');
    expect(r.firedRuleIds[0]).toBe('U-DANGER-SIGN');
  });

  it('lists reasons highest level first', () => {
    const r = run({
      symptoms: ['eye_pain_vision_loss', 'fever', 'itching'],
      duration: '1_4_weeks',
    });
    expect(r.why[0]).toMatch(/warning signs/);
    expect(r.why.length).toBeGreaterThan(1);
  });

  it('is deterministic: same input, same output', () => {
    expect(run({ duration: '1_3_months' })).toEqual(run({ duration: '1_3_months' }));
  });
});

describe('boundary cases', () => {
  it('two indicators are not enough for the "many indicators" rule, three are', () => {
    expect(run({ symptoms: ['fever', 'itching'] }).firedRuleIds).not.toContain('H-MANY-INDICATORS');
    expect(run({ symptoms: ['fever', 'itching', 'weight_loss'] }).level).toBe('HIGH');
  });

  it('duration of exactly one week to four weeks crosses the MODERATE threshold', () => {
    expect(run({ duration: 'lt_1_week' }).level).toBe('LOW');
    expect(run({ duration: '1_4_weeks' }).level).toBe('MODERATE');
  });

  it('one to three months crosses the limb-swelling HIGH threshold; one to four weeks does not', () => {
    expect(run({ symptoms: ['limb_swelling'], duration: '1_4_weeks' }).level).toBe('MODERATE');
    expect(run({ symptoms: ['limb_swelling'], duration: '1_3_months' }).level).toBe('HIGH');
  });

  it('worsening needs two indicators; one worsening indicator alone stays below HIGH', () => {
    expect(run({ progression: 'yes' }).firedRuleIds).not.toContain('H-WORSENING-MULTIPLE');
    expect(run({ symptoms: ['fever', 'itching'], progression: 'yes' }).level).toBe('HIGH');
  });

  it('two water or sanitation risks cross the environment threshold; one does not', () => {
    const one = run({ wash: { ...clean.wash, standingWater: 'yes' } });
    const two = run({ wash: { ...clean.wash, standingWater: 'yes', sanitation: 'none' } });
    expect(one.level).toBe('LOW');
    expect(two.level).toBe('MODERATE');
    expect(two.firedRuleIds).toEqual(['M-ENVIRONMENT']);
  });

  it('the household rule needs at least one indicator', () => {
    const none = evaluate(
      {
        ...clean,
        symptoms: [],
        noSymptomsReported: true,
        exposure: { ...clean.exposure, householdSimilar: 'yes' },
      },
      DEMO_RULE_SET,
    );
    expect(none.level).toBe('LOW');
    expect(run({ exposure: { ...clean.exposure, householdSimilar: 'yes' } }).level).toBe('HIGH');
  });

  it('ignores duplicate symptoms when counting', () => {
    expect(run({ symptoms: ['fever', 'fever', 'fever'] }).level).toBe('LOW');
  });
});

describe('missing data', () => {
  it('refuses to classify when nothing is known about symptoms', () => {
    const r = evaluate({}, DEMO_RULE_SET);
    expect(r.status).toBe('INSUFFICIENT_DATA');
    expect(r.level).toBeNull();
    expect(r.label).toBe(DEMO_LABEL_TEXT);
    expect(r.recommendedAction).toMatch(/Collect the symptom information/);
  });

  it('does not fire a rule that depends on a missing fact, and says so', () => {
    const r = evaluate({ symptoms: ['limb_swelling'] }, DEMO_RULE_SET);
    expect(r.firedRuleIds).not.toContain('H-LIMB-DURATION');
    expect(r.dataQuality).toBe('PARTIAL');
    expect(r.incompleteInputs).toEqual(expect.arrayContaining(['duration', 'progression']));
    expect(r.notes.join(' ')).toMatch(/understate/);
  });

  it('treats "unknown" and "unsure" answers as incomplete, not as "no"', () => {
    const r = run({
      progression: 'unsure',
      exposure: {
        waterContact: 'unknown',
        animalContact: 'no',
        insectBites: 'no',
        householdSimilar: 'unknown',
      },
    });
    expect(r.incompleteInputs).toEqual(
      expect.arrayContaining(['progression', 'waterContact', 'householdSimilar']),
    );
    expect(r.level).toBe('LOW');
    expect(r.dataQuality).toBe('PARTIAL');
  });

  it('never lets missing information raise or lower the level on its own', () => {
    const full = run({ symptoms: ['limb_swelling'], duration: '1_3_months' });
    const partial = evaluate(
      { symptoms: ['limb_swelling'], duration: '1_3_months' },
      DEMO_RULE_SET,
    );
    expect(partial.level).toBe(full.level);
  });
});

describe('conflicting inputs', () => {
  it('uses the listed symptoms when "none" is also recorded, and flags the conflict', () => {
    const r = run({ symptoms: ['none', 'limb_swelling'], duration: '1_3_months' });
    expect(r.conflicts).toContain('NONE_WITH_SYMPTOMS');
    expect(r.level).toBe('HIGH');
    expect(r.notes.join(' ')).toMatch(/listed symptoms were used/);
  });

  it('flags "no symptoms" recorded together with symptoms', () => {
    const r = run({ noSymptomsReported: true, symptoms: ['unable_to_drink'] });
    expect(r.conflicts).toContain('NONE_WITH_SYMPTOMS');
    expect(r.level).toBe('URGENT');
  });

  it('flags duration given without any symptom and ignores it', () => {
    const r = evaluate(
      {
        symptoms: [],
        noSymptomsReported: true,
        duration: 'gt_3_months',
        progression: 'yes',
        exposure: clean.exposure,
        wash: clean.wash,
      },
      DEMO_RULE_SET,
    );
    expect(r.conflicts).toContain('DURATION_WITHOUT_SYMPTOMS');
    expect(r.level).toBe('LOW');
  });

  it('a conflict can never lower the result', () => {
    const without = run({ symptoms: ['limb_swelling'], duration: '1_3_months' });
    const withConflict = run({
      symptoms: ['none', 'limb_swelling'],
      noSymptomsReported: true,
      duration: '1_3_months',
    });
    expect(withConflict.level).toBe(without.level);
  });

  it('the highest level always wins when several rules disagree', () => {
    const r = run({ symptoms: ['unable_to_drink', 'fever'], duration: 'lt_1_week' });
    expect(r.level).toBe('URGENT');
    expect(r.firedRuleIds.length).toBeGreaterThan(0);
  });

  it('disabled rules never fire', () => {
    const rs = parseRuleSet({
      ...DEMO_RULE_SET,
      rules: DEMO_RULE_SET.rules.map((r) =>
        r.id === 'U-DANGER-SIGN' ? { ...r, enabled: false } : r,
      ),
    });
    const r = evaluate({ ...clean, symptoms: ['unable_to_drink'] }, rs);
    expect(r.level).not.toBe('URGENT');
  });
});

describe('guards against a demonstration rule being mistaken for a protocol', () => {
  const text = [
    ...Object.values(DEMO_RULE_SET.actions),
    ...DEMO_RULE_SET.rules.map((r) => r.explanation),
  ].join('\n');

  it('rule text never diagnoses, prescribes, doses or names a treatment', () => {
    expect(text).not.toMatch(
      /\b(diagnos\w*|prescrib\w*|dose|dosage|mg|tablets?|drugs?|medicat\w*|treat\w*)\b/i,
    );
  });

  it('every action is worded as a demonstration action', () => {
    for (const a of Object.values(DEMO_RULE_SET.actions))
      expect(a).toMatch(/^Demonstration action:/);
  });

  it('rejects a rule that tries to name a treatment', () => {
    const bad = {
      ...DEMO_RULE_SET,
      rules: [{ ...DEMO_RULE_SET.rules[0], explanation: 'Give the person a tablet right away.' }],
    };
    expect(() => parseRuleSet(bad)).toThrow();
  });

  it('rejects a VALIDATED rule set that records no reviewers', () => {
    expect(() => parseRuleSet({ ...DEMO_RULE_SET, status: 'VALIDATED' })).toThrow(/reviewers/);
  });

  it('rejects a placeholder whose id does not start with demo-', () => {
    expect(() => parseRuleSet({ ...DEMO_RULE_SET, id: 'national-protocol' })).toThrow(/demo-/);
  });

  it('rejects duplicate rule ids and unknown facts', () => {
    const dup = { ...DEMO_RULE_SET, rules: [DEMO_RULE_SET.rules[0], DEMO_RULE_SET.rules[0]] };
    expect(() => parseRuleSet(dup)).toThrow(/Duplicate/);
    const unknown = {
      ...DEMO_RULE_SET,
      rules: [{ ...DEMO_RULE_SET.rules[0], when: [{ fact: 'bloodTest', op: '=', value: 'x' }] }],
    };
    expect(() => parseRuleSet(unknown)).toThrow();
  });

  it('a validated rule set carries no demonstration label (so the label is the only marker)', () => {
    const validated: RuleSet = {
      ...DEMO_RULE_SET,
      id: 'reviewed-set',
      status: 'VALIDATED',
      review: { reviewedBy: ['Reviewer A', 'Reviewer B'], approvedOn: '2027-01-01' },
    };
    expect(parseRuleSet(validated).status).toBe('VALIDATED');
    expect(evaluate(clean, validated).label).toBeNull();
  });
});
