import { describe, expect, it } from 'vitest';
import { SIGNAL_CATEGORIES } from '@ntd-watch/domain';
import { FGS_CONTENT } from '@ntd-watch/rules-engine';
import enFgs from '../i18n/locales/en.fgs.json';

function lookup(key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], enFgs);
}

describe('FGS content is data, not hardcoded UI text', () => {
  it('has wording in the locale file for every catalogue item', () => {
    for (const item of FGS_CONTENT.items) {
      expect(lookup(item.textKey), item.id).toBeTypeOf('string');
    }
  });

  it('has a non-diagnostic label for every signal category, and says it is not a diagnosis', () => {
    for (const c of SIGNAL_CATEGORIES) expect(lookup(`fgs.category.${c}`), c).toBeTypeOf('string');
    expect(lookup('fgs.categoryNote')).toMatch(/not a diagnosis/i);
  });

  it('never shows a diagnostic label to the CHW', () => {
    const all = JSON.stringify(enFgs);
    expect(all).not.toMatch(
      /FGS confirmed|confirmed (case|FGS)|you have|she has (FGS|schisto)|positive for/i,
    );
    for (const c of SIGNAL_CATEGORIES) {
      expect(String(lookup(`fgs.category.${c}`))).not.toMatch(
        /confirm|diagnos|positive|infected|disease/i,
      );
    }
  });

  it('does not name a disease or treatment in item wording', () => {
    for (const item of FGS_CONTENT.items) {
      expect(String(lookup(item.textKey))).not.toMatch(
        /schistosom|bilharz|\bsti\b|\bhiv\b|hpv|cancer|praziquantel|treat|diagnos/i,
      );
    }
  });
});
