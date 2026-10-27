import { describe, expect, it } from 'vitest';
import { REFERRAL_OUTCOME_LABELS } from '@ntd-watch/domain';
import { PRIORITY_LABELS } from '@ntd-watch/programme';
import { DEMO_RULE_SET } from '@ntd-watch/rules-engine';
import en from './i18n/locales/en.json';

/**
 * Stage 7 safety: the prototype must never diagnose, prescribe, declare an outbreak or claim
 * clinical validation. A phrase is allowed only inside an explicit negation ("not a diagnosis").
 */
const flatten = (v: unknown, path = ''): [string, string][] =>
  typeof v === 'string'
    ? [[path, v]]
    : v && typeof v === 'object'
      ? Object.entries(v).flatMap(([k, x]) => flatten(x, path ? `${path}.${k}` : k))
      : [];

const BANNED: RegExp[] = [
  /\byou (have|may have|probably have) (an? )?(infection|disease|illness|condition)\b/i,
  /\bdiagnosed (with|as)\b/i,
  /\bconfirmed (outbreak|case)\b/i,
  /\boutbreak (declared|confirmed|detected)\b/i,
  /\bprescri(be|ption)\b/i,
  /\btake \d+\s?(mg|ml|tablets?)\b/i,
  /\bclinically validated\b/i,
  /\bproduction[- ]ready\b/i,
  /\bofficial (government|ministry)\b/i,
];
const NEGATION = /\b(not|no|never|nothing|without|does not|do not|cannot)\b/i;

describe('wording safety', () => {
  // `limits.*` is the explicit list of things the product does NOT do, so it names them on purpose
  const strings = flatten(en).filter(([k]) => !k.startsWith('limits.'));
  it('has no banned clinical or authority claim outside a negation', () => {
    const offenders = strings.filter(
      ([, s]) => BANNED.some((re) => re.test(s)) && !NEGATION.test(s),
    );
    expect(offenders).toEqual([]);
  });
  it('keeps priority categories and outcomes free of diagnosis or outbreak language', () => {
    const labels = [...Object.values(PRIORITY_LABELS), ...Object.values(REFERRAL_OUTCOME_LABELS)];
    for (const l of labels) expect(l).not.toMatch(/outbreak|epidemic|diagnos|treat|prescri|drug/i);
  });
  it('keeps every demonstration rule explanation and action free of disease and treatment names', () => {
    const texts = [
      ...DEMO_RULE_SET.rules.map((r) => r.explanation),
      ...Object.values(DEMO_RULE_SET.actions),
    ];
    for (const t of texts) {
      expect(t).not.toMatch(
        /schistosom|filaria|leishman|onchocerc|trachoma|buruli|leprosy|yaws|praziquantel|ivermectin|albendazole|\bmg\b/i,
      );
    }
  });
  it('states the demonstration status on the pages that rank or recommend', () => {
    expect(en.programme.priority.notOutbreak).toMatch(/does not declare an outbreak/i);
    expect(en.programme.inbox.notClinical).toMatch(/not clinically validated/i);
    expect(en.programme.settings.governanceNote).toMatch(/placeholders/i);
    expect(en.banner.mode).toBe('NTD-WATCH DEMO MODE');
  });
});
