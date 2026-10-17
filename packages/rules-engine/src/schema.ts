import { z } from 'zod';
import { RISK_LEVELS } from '@ntd-watch/domain';
import { FACT_NAMES, OPERATORS, type RuleSet } from './types';

/**
 * Words that must never appear in rule text (explanations or actions): the prototype does not
 * diagnose, name diseases, or recommend medicines or doses.
 */
export const FORBIDDEN_RULE_TEXT =
  /\b(diagnos\w*|prescrib\w*|dose|dosage|mg|tablets?|drugs?|medicat\w*|treat\w*|cure[sd]?)\b/i;

const conditionSchema = z.strictObject({
  fact: z.enum(FACT_NAMES),
  op: z.enum(OPERATORS),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
});

const ruleSchema = z.strictObject({
  id: z.string().regex(/^[A-Z]+-[A-Z0-9-]+$/, 'Rule id must look like H-LIMB-DURATION'),
  level: z.enum(RISK_LEVELS),
  enabled: z.boolean(),
  explanation: z
    .string()
    .min(10)
    .refine(
      (t) => !FORBIDDEN_RULE_TEXT.test(t),
      'Rule text must not diagnose, prescribe or name treatments',
    ),
  when: z.array(conditionSchema).min(1),
});

export const ruleSetSchema = z
  .strictObject({
    id: z.string().min(1),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    status: z.enum(['DEMO_PLACEHOLDER', 'VALIDATED']),
    description: z.string().min(10),
    actions: z.strictObject({
      LOW: z.string().min(5),
      MODERATE: z.string().min(5),
      HIGH: z.string().min(5),
      URGENT: z.string().min(5),
    }),
    rules: z.array(ruleSchema).min(1),
    review: z
      .strictObject({
        reviewedBy: z.array(z.string().min(1)).min(2),
        approvedOn: z.iso.date(),
      })
      .optional(),
  })
  .superRefine((rs, ctx) => {
    const ids = new Set<string>();
    for (const r of rs.rules) {
      if (ids.has(r.id)) ctx.addIssue({ code: 'custom', message: `Duplicate rule id ${r.id}` });
      ids.add(r.id);
    }
    if (rs.status === 'DEMO_PLACEHOLDER' && !rs.id.startsWith('demo-')) {
      ctx.addIssue({
        code: 'custom',
        message: 'A demonstration rule set id must start with "demo-"',
      });
    }
    if (rs.status === 'VALIDATED' && !rs.review) {
      ctx.addIssue({
        code: 'custom',
        message: 'A VALIDATED rule set must record at least two reviewers and an approval date',
      });
    }
    for (const level of RISK_LEVELS) {
      if (FORBIDDEN_RULE_TEXT.test(rs.actions[level])) {
        ctx.addIssue({
          code: 'custom',
          message: `Action text for ${level} must not diagnose, prescribe or name treatments`,
        });
      }
    }
  });

/** Validates untrusted rule configuration. Throws a readable error when invalid. */
export function parseRuleSet(input: unknown): RuleSet {
  return ruleSetSchema.parse(input) as RuleSet;
}
