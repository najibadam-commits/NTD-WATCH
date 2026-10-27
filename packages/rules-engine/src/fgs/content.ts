import { z } from 'zod';
import { CONTENT_STATUSES, contentStatusSchema, type ContentStatus } from '@ntd-watch/domain';

/**
 * FGS CONTENT LAYER: the configurable catalogue behind the women-and-girls assessment.
 *
 * WHAT THIS IS NOT: clinical content. Nothing here was written or checked by a clinician, and
 * nothing here is a diagnostic criterion or threshold. Every item is a DEMO placeholder that
 * exists so the workflow can be demonstrated and so the content can be REPLACED, in this data,
 * after clinical review against the WHO FGS atlas and national guidance. UI code reads this
 * catalogue and the locale file; it never contains clinical wording itself.
 *
 * Every item carries provenance (source, version, status, reviewer status, last reviewed,
 * notes). A status above DEMO is refused unless review evidence is recorded (see schema below).
 */
export const FGS_GROUPS = ['EXPOSURE', 'HEALTH_SIGNAL', 'CONTEXT'] as const;
export type FgsGroup = (typeof FGS_GROUPS)[number];

export const REVIEWER_STATUSES = ['NOT_REVIEWED', 'IN_REVIEW', 'REVIEWED'] as const;
export type ReviewerStatus = (typeof REVIEWER_STATUSES)[number];

export interface ContentProvenance {
  /** Where the wording or idea comes from, or an honest statement that it is not yet sourced. */
  source: string;
  sourceVersion: string | null;
  sourceDate: string | null;
  status: ContentStatus;
  reviewerStatus: ReviewerStatus;
  /** ISO date of the last clinical review. Null until a review has happened. */
  lastReviewed: string | null;
  notes: string;
}

export interface FgsContentItem {
  id: string;
  group: FgsGroup;
  /** Locale key of the question or option wording. The wording lives in the locale file. */
  textKey: string;
  /** True for the single placeholder that stands for "a warning sign was reported". */
  warningPlaceholder?: boolean;
  provenance: ContentProvenance;
}

export interface FgsContent {
  id: string;
  version: string;
  status: ContentStatus;
  lastModified: string;
  /** What this content must not be used for. Shown in the rules register. */
  boundary: string;
  items: readonly FgsContentItem[];
}

const provenanceSchema = z.strictObject({
  source: z.string().min(10),
  sourceVersion: z.string().nullable(),
  sourceDate: z.iso.date().nullable(),
  status: contentStatusSchema,
  reviewerStatus: z.enum(REVIEWER_STATUSES),
  lastReviewed: z.iso.date().nullable(),
  notes: z.string().min(10),
});

const itemSchema = z.strictObject({
  id: z.string().regex(/^fgs_(exp|sig|ctx)_[a-z0-9_]+$/),
  group: z.enum(FGS_GROUPS),
  textKey: z.string().regex(/^fgs\.[A-Za-z0-9_.]+$/),
  warningPlaceholder: z.boolean().optional(),
  provenance: provenanceSchema,
});

export const fgsContentSchema = z
  .strictObject({
    id: z.string().min(1),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    status: contentStatusSchema,
    lastModified: z.iso.date(),
    boundary: z.string().min(20),
    items: z.array(itemSchema).min(1),
  })
  .superRefine((c, ctx) => {
    const ids = new Set<string>();
    for (const item of c.items) {
      if (ids.has(item.id)) ctx.addIssue({ code: 'custom', message: `Duplicate item ${item.id}` });
      ids.add(item.id);
      const p = item.provenance;
      if (CONTENT_STATUSES.indexOf(p.status) > CONTENT_STATUSES.indexOf(c.status)) {
        ctx.addIssue({
          code: 'custom',
          message: `${item.id} claims ${p.status}, higher than the catalogue (${c.status})`,
        });
      }
      if (p.status === 'CLINICALLY_REVIEWED' || p.status === 'VALIDATED') {
        if (p.reviewerStatus !== 'REVIEWED' || !p.lastReviewed) {
          ctx.addIssue({
            code: 'custom',
            message: `${item.id} is ${p.status} without recorded review evidence`,
          });
        }
      }
      // A DEMO item must not look reviewed.
      if (p.status === 'DEMO' && (p.reviewerStatus === 'REVIEWED' || p.lastReviewed)) {
        ctx.addIssue({
          code: 'custom',
          message: `${item.id} is DEMO but records a review; change its status with the evidence`,
        });
      }
    }
  });

export function parseFgsContent(input: unknown): FgsContent {
  return fgsContentSchema.parse(input) as FgsContent;
}

const PENDING_SOURCE =
  'WHO FGS atlas and national guidance: specific item not yet sourced (placeholder pending clinical review).';

function demo(notes: string, source = PENDING_SOURCE): ContentProvenance {
  return {
    source,
    sourceVersion: null,
    sourceDate: null,
    status: 'DEMO',
    reviewerStatus: 'NOT_REVIEWED',
    lastReviewed: null,
    notes,
  };
}

const WORDING =
  'Wording is a placeholder. A clinician and a safeguarding lead must approve it first.';

export const FGS_CONTENT: FgsContent = parseFgsContent({
  id: 'fgs-content',
  version: '0.1.0',
  status: 'DEMO',
  lastModified: '2026-10-27',
  boundary:
    'Demonstration placeholders. Not diagnostic criteria, not clinical thresholds and not reviewed by clinicians. Replace after clinical review.',
  items: [
    // A. Exposure and context signals (categories only)
    {
      id: 'fgs_exp_freshwater',
      group: 'EXPOSURE',
      textKey: 'fgs.exposure.freshwater',
      provenance: demo('Freshwater contact is an exposure category, not a finding. ' + WORDING),
    },
    {
      id: 'fgs_exp_livelihood',
      group: 'EXPOSURE',
      textKey: 'fgs.exposure.livelihood',
      provenance: demo('Water-related household or livelihood exposure category. ' + WORDING),
    },
    // B. Reported health signals (DEMO placeholders)
    {
      id: 'fgs_sig_pelvic_pain',
      group: 'HEALTH_SIGNAL',
      textKey: 'fgs.signal.pelvicPain',
      provenance: demo(WORDING),
    },
    {
      id: 'fgs_sig_urine_blood',
      group: 'HEALTH_SIGNAL',
      textKey: 'fgs.signal.urineBlood',
      provenance: demo(WORDING),
    },
    {
      id: 'fgs_sig_urine_pain',
      group: 'HEALTH_SIGNAL',
      textKey: 'fgs.signal.urinePain',
      provenance: demo(WORDING),
    },
    {
      id: 'fgs_sig_discharge',
      group: 'HEALTH_SIGNAL',
      textKey: 'fgs.signal.discharge',
      provenance: demo(WORDING),
    },
    {
      id: 'fgs_sig_itching',
      group: 'HEALTH_SIGNAL',
      textKey: 'fgs.signal.itching',
      provenance: demo(WORDING),
    },
    {
      id: 'fgs_sig_unusual_bleeding',
      group: 'HEALTH_SIGNAL',
      textKey: 'fgs.signal.unusualBleeding',
      provenance: demo(WORDING),
    },
    {
      id: 'fgs_sig_warning',
      group: 'HEALTH_SIGNAL',
      textKey: 'fgs.signal.warning',
      warningPlaceholder: true,
      provenance: demo(
        'Stands for "a warning sign was reported". Which signs count as warning signs must come from clinical guidance. ' +
          WORDING,
      ),
    },
    // C. Vulnerability and context (kept apart from health signals)
    {
      id: 'fgs_ctx_far',
      group: 'CONTEXT',
      textKey: 'fgs.context.far',
      provenance: demo(
        'Access barrier. Used for facility choice, not for the signal category.',
        'Project design (access barriers).',
      ),
    },
    {
      id: 'fgs_ctx_prefers_female',
      group: 'CONTEXT',
      textKey: 'fgs.context.prefersFemale',
      provenance: demo(
        'Preference. Used to recommend a facility with a female clinician.',
        'Project design (women-centred care).',
      ),
    },
  ],
});

export function itemsOf(group: FgsGroup, content: FgsContent = FGS_CONTENT): FgsContentItem[] {
  return content.items.filter((i) => i.group === group);
}

export function contentItem(
  id: string,
  content: FgsContent = FGS_CONTENT,
): FgsContentItem | undefined {
  return content.items.find((i) => i.id === id);
}
