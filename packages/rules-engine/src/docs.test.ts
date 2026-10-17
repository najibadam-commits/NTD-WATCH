import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEMO_LABEL_TEXT, DEMO_RULE_SET } from './index';

const doc = readFileSync(join(__dirname, '../../../docs/RULES.md'), 'utf8');

describe('docs/RULES.md', () => {
  it('lists every rule in the rule set, so the document cannot drift from the data', () => {
    for (const rule of DEMO_RULE_SET.rules) {
      expect(doc, rule.id).toContain(`\`${rule.id}\``);
      expect(doc, rule.id).toContain(rule.explanation);
    }
  });

  it('carries the demonstration label', () => {
    expect(doc).toContain(DEMO_LABEL_TEXT);
  });
});
