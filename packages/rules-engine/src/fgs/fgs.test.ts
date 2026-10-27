import { describe, expect, it } from 'vitest';
import { SIGNAL_CATEGORIES, SIGNAL_CATEGORY_BY_LEVEL } from '@ntd-watch/domain';
import {
  DEMO_LABEL_TEXT,
  DEMO_RULE_SET,
  FGS_CONTENT,
  FGS_RULE_SET,
  describeRuleSet,
  evaluate,
  itemsOf,
  parseFgsContent,
  parseRuleSet,
  type AssessmentInput,
} from '../index';

const fgsInput = (patch: Partial<AssessmentInput> = {}): AssessmentInput => ({
  module: 'FGS',
  symptoms: [],
  noSymptomsReported: true,
  exposureSignals: [],
  contextSignals: [],
  ...patch,
});

describe('FGS content catalogue', () => {
  it('has the three groups and every item is a DEMO placeholder with full provenance', () => {
    expect(itemsOf('EXPOSURE').length).toBeGreaterThan(0);
    expect(itemsOf('HEALTH_SIGNAL').length).toBeGreaterThan(0);
    expect(itemsOf('CONTEXT').length).toBeGreaterThan(0);
    expect(FGS_CONTENT.status).toBe('DEMO');
    for (const item of FGS_CONTENT.items) {
      const p = item.provenance;
      expect(p.status, item.id).toBe('DEMO');
      expect(p.reviewerStatus, item.id).toBe('NOT_REVIEWED');
      expect(p.lastReviewed, item.id).toBeNull();
      expect(p.source.length, item.id).toBeGreaterThan(9);
      expect(p.notes.length, item.id).toBeGreaterThan(9);
      expect(item.textKey, item.id).toMatch(/^fgs\./);
    }
  });

  it('keeps the health-signal list short (no giant questionnaire)', () => {
    const total = FGS_CONTENT.items.length;
    expect(total).toBeLessThanOrEqual(15);
  });

  it('refuses an item that claims review without evidence, or a DEMO item that records a review', () => {
    const item = FGS_CONTENT.items[0]!;
    const withStatus = (provenance: Record<string, unknown>) => ({
      ...FGS_CONTENT,
      status: 'VALIDATED',
      items: [{ ...item, provenance: { ...item.provenance, ...provenance } }],
    });
    expect(() => parseFgsContent(withStatus({ status: 'VALIDATED' }))).toThrow();
    expect(() => parseFgsContent(withStatus({ status: 'CLINICALLY_REVIEWED' }))).toThrow();
    expect(() =>
      parseFgsContent(withStatus({ status: 'DEMO', lastReviewed: '2026-11-01' })),
    ).toThrow();
    expect(() =>
      parseFgsContent(
        withStatus({
          status: 'CLINICALLY_REVIEWED',
          reviewerStatus: 'REVIEWED',
          lastReviewed: '2026-11-01',
        }),
      ),
    ).not.toThrow();
  });

  it('refuses an item with a higher status than the catalogue', () => {
    const item = FGS_CONTENT.items[0]!;
    expect(() =>
      parseFgsContent({
        ...FGS_CONTENT,
        items: [
          {
            ...item,
            provenance: {
              ...item.provenance,
              status: 'CLINICALLY_REVIEWED',
              reviewerStatus: 'REVIEWED',
              lastReviewed: '2026-11-01',
            },
          },
        ],
      }),
    ).toThrow();
  });

  it('has exactly one warning placeholder and unique ids', () => {
    expect(FGS_CONTENT.items.filter((i) => i.warningPlaceholder)).toHaveLength(1);
    expect(new Set(FGS_CONTENT.items.map((i) => i.id)).size).toBe(FGS_CONTENT.items.length);
  });
});

describe('rule status model', () => {
  it('keeps the FGS rule set at DEMO and never as validated', () => {
    expect(FGS_RULE_SET.status).toBe('DEMO');
    expect(FGS_RULE_SET.review).toBeUndefined();
    expect(FGS_RULE_SET.validationStatus).toBe('NOT_VALIDATED');
  });

  it('refuses CLINICALLY_REVIEWED and VALIDATED without recorded review evidence', () => {
    const base = { ...FGS_RULE_SET, id: 'fgs-reviewed' };
    expect(() => parseRuleSet({ ...base, status: 'CLINICALLY_REVIEWED' })).toThrow(/reviewers/);
    expect(() => parseRuleSet({ ...base, status: 'VALIDATED' })).toThrow(/reviewers/);
    const review = { reviewedBy: ['Reviewer A', 'Reviewer B'], approvedOn: '2026-11-20' };
    expect(() => parseRuleSet({ ...base, status: 'CLINICALLY_REVIEWED', review })).not.toThrow();
  });

  it('refuses a DEMO or DRAFT rule set that claims to be reviewed or validated', () => {
    for (const status of ['DEMO', 'DRAFT'] as const) {
      expect(() =>
        parseRuleSet({ ...FGS_RULE_SET, id: 'demo-x', status, validationStatus: 'VALIDATED' }),
      ).toThrow(/cannot claim/);
    }
  });

  it('refuses a rule that claims a higher status than its rule set', () => {
    const rules = FGS_RULE_SET.rules.map((r, i) => (i === 0 ? { ...r, status: 'VALIDATED' } : r));
    expect(() => parseRuleSet({ ...FGS_RULE_SET, rules })).toThrow(/higher than its rule set/);
  });

  it('requires a demo- id for DEMO rule sets', () => {
    expect(() => parseRuleSet({ ...FGS_RULE_SET, id: 'fgs-live' })).toThrow(/demo-/);
  });

  it('accepts the original DEMO_PLACEHOLDER name as DEMO', () => {
    expect(DEMO_RULE_SET.status).toBe('DEMO_PLACEHOLDER');
    expect(evaluate({ symptoms: [] }, DEMO_RULE_SET).ruleStatus).toBe('DEMO');
  });
});

describe('rule metadata register', () => {
  for (const [name, set] of [
    ['general demo rule set', DEMO_RULE_SET],
    ['FGS demo rule set', FGS_RULE_SET],
  ] as const) {
    it(`gives every rule in the ${name} a complete governance record`, () => {
      for (const m of describeRuleSet(set)) {
        expect(m.id).toBeTruthy();
        expect(m.name).toBeTruthy();
        expect(m.inputs.length).toBeGreaterThan(0);
        expect(['LOW', 'MODERATE', 'HIGH', 'URGENT']).toContain(m.output);
        expect(m.source.length).toBeGreaterThan(5);
        expect(m.version).toMatch(/^\d+\.\d+\.\d+$/);
        expect(m.status).toBe('DEMO');
        expect(m.validationStatus).toBe('NOT_VALIDATED');
        expect(m.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(m.notes).toBeDefined();
      }
    });
  }

  it('states honestly that the FGS logic has no external source yet', () => {
    for (const m of describeRuleSet(FGS_RULE_SET)) expect(m.source).toMatch(/No external source/);
  });
});

describe('FGS evaluation (non-diagnostic, DEMO)', () => {
  it('returns no priority signal when nothing is reported', () => {
    const r = evaluate(fgsInput(), FGS_RULE_SET);
    expect(r.level).toBe('LOW');
    expect(SIGNAL_CATEGORY_BY_LEVEL[r.level!]).toBe('NO_PRIORITY_SIGNAL');
  });

  it('exposes the rule status and the demonstration label with every result', () => {
    for (const input of [
      fgsInput(),
      fgsInput({ symptoms: ['fgs_sig_discharge'], noSymptomsReported: false }),
      fgsInput({ symptoms: ['fgs_sig_warning'], noSymptomsReported: false }),
    ]) {
      const r = evaluate(input, FGS_RULE_SET);
      expect(r.ruleStatus).toBe('DEMO');
      expect(r.ruleStatusLabel).toBe('DEMO — clinical validation pending');
      expect(r.label).toBe(DEMO_LABEL_TEXT);
      expect(r.demoOnly).toBe(true);
    }
  });

  it('raises the category with the number of signals and with water exposure', () => {
    const level = (patch: Partial<AssessmentInput>) =>
      evaluate(fgsInput({ noSymptomsReported: false, ...patch }), FGS_RULE_SET).level;
    expect(level({ symptoms: ['fgs_sig_discharge'] })).toBe('MODERATE');
    expect(
      level({ symptoms: ['fgs_sig_discharge'], exposureSignals: ['fgs_exp_freshwater'] }),
    ).toBe('HIGH');
    expect(
      level({ symptoms: ['fgs_sig_discharge', 'fgs_sig_itching', 'fgs_sig_urine_pain'] }),
    ).toBe('HIGH');
    expect(level({ symptoms: ['fgs_sig_warning'] })).toBe('URGENT');
  });

  it('never lets exposure alone raise the category above no priority signal', () => {
    const r = evaluate(fgsInput({ exposureSignals: ['fgs_exp_freshwater'] }), FGS_RULE_SET);
    expect(r.level).toBe('LOW');
  });

  it('keeps vulnerability and context separate: it never changes the category', () => {
    const base = fgsInput({ symptoms: ['fgs_sig_discharge'], noSymptomsReported: false });
    const without = evaluate(base, FGS_RULE_SET);
    const withContext = evaluate(
      { ...base, contextSignals: ['fgs_ctx_far', 'fgs_ctx_prefers_female'] },
      FGS_RULE_SET,
    );
    expect(withContext.level).toBe(without.level);
    expect(withContext.firedRuleIds).toEqual(without.firedRuleIds);
  });

  it('does not use the skin/limb inputs: unanswered general questions are not reported missing', () => {
    const r = evaluate(fgsInput(), FGS_RULE_SET);
    expect(r.incompleteInputs).toEqual([]);
    expect(r.dataQuality).toBe('COMPLETE');
    const missing = evaluate(
      { module: 'FGS', symptoms: [], noSymptomsReported: true },
      FGS_RULE_SET,
    );
    expect(missing.incompleteInputs).toEqual(['exposureSignals']);
  });

  it('cannot classify without symptom information', () => {
    const r = evaluate({ module: 'FGS', exposureSignals: [] }, FGS_RULE_SET);
    expect(r.status).toBe('INSUFFICIENT_DATA');
    expect(r.level).toBeNull();
  });

  it('is deterministic', () => {
    const input = fgsInput({ symptoms: ['fgs_sig_itching'], noSymptomsReported: false });
    expect(evaluate(input, FGS_RULE_SET)).toEqual(evaluate(input, FGS_RULE_SET));
  });

  it('maps every product level to one non-diagnostic category', () => {
    expect(Object.values(SIGNAL_CATEGORY_BY_LEVEL).sort()).toEqual([...SIGNAL_CATEGORIES].sort());
  });
});

describe('FGS rule wording', () => {
  it('never names a disease, a diagnosis, a drug or a treatment', () => {
    const texts = [
      ...FGS_RULE_SET.rules.map((r) => r.explanation),
      ...Object.values(FGS_RULE_SET.actions),
    ];
    for (const t of texts) {
      expect(t).not.toMatch(
        /schistosom|fgs|bilharz|\bsti\b|\bhiv\b|hpv|cancer|praziquantel|diagnos|treat|prescri|\bmg\b|confirmed/i,
      );
    }
  });
});
