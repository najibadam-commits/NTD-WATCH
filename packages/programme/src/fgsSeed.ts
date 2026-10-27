import { DEMO_CHWS, createRng } from '@ntd-watch/demo-data';
import { CONSENT_TEXT_VERSION, caseIdFor, type Assessment } from '@ntd-watch/domain';
import { FGS_CONTENT, FGS_RULE_SET, evaluate } from '@ntd-watch/rules-engine';
import { SEED_PREFIX } from './seed';

/**
 * SYNTHETIC women-and-girls (FGS) records, for demonstrating community-level programme
 * intelligence. Invented from a fixed seed. They describe no real person, place or disease and
 * the community patterns below are arbitrary demonstration settings, not epidemiology.
 *
 * Every record is passed through the same DEMO FGS rules the CHW app uses and has a client key
 * starting `seed-`, so programme views can tell it from records entered in the CHW app.
 * Communities are deliberately varied (many observations, few, none) so the demonstration shows
 * suppression, low confidence and different priorities.
 */
interface FgsCommunitySeed {
  /** Observations in the period. */
  n: number;
  /** Weeks (of the period) that have any observations. */
  weeks: number;
  /** Chance an observation reports at least one signal. */
  signal: number;
  /** Chance of freshwater contact. */
  water: number;
  /** Chance of reporting that a facility visit is hard. */
  far: number;
}

export const FGS_COMMUNITY_SEEDS: Record<string, FgsCommunitySeed> = {
  'com-01': { n: 30, weeks: 10, signal: 0.45, water: 0.6, far: 0.5 },
  'com-02': { n: 18, weeks: 7, signal: 0.1, water: 0.5, far: 0.6 },
  'com-03': { n: 14, weeks: 5, signal: 0.5, water: 0.2, far: 0.1 },
  'com-04': { n: 3, weeks: 2, signal: 0.3, water: 0.4, far: 0.3 },
  'com-06': { n: 9, weeks: 1, signal: 0.3, water: 0.3, far: 0.2 },
  'com-07': { n: 26, weeks: 8, signal: 0.3, water: 0.45, far: 0.35 },
  'com-09': { n: 36, weeks: 11, signal: 0.45, water: 0.7, far: 0.4 },
  'com-10': { n: 6, weeks: 3, signal: 0.15, water: 0.2, far: 0.2 },
  'com-13': { n: 12, weeks: 4, signal: 0.2, water: 0.4, far: 0.3 },
  'com-15': { n: 22, weeks: 6, signal: 0.25, water: 0.6, far: 0.55 },
};

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const SIGNAL_IDS = [
  'fgs_sig_pelvic_pain',
  'fgs_sig_urine_blood',
  'fgs_sig_urine_pain',
  'fgs_sig_discharge',
  'fgs_sig_itching',
  'fgs_sig_unusual_bleeding',
];

const AGE_BANDS = ['15_17', '18_49', '18_49', '18_49', '50_plus'] as const;

export function generateFgsSeed({
  anchor,
  seed = 20261027,
  weeks = 12,
}: {
  anchor: Date;
  seed?: number;
  weeks?: number;
}): Assessment[] {
  const end = anchor.getTime();
  const start = end - weeks * WEEK;
  const out: Assessment[] = [];
  for (const [communityId, p] of Object.entries(FGS_COMMUNITY_SEEDS)) {
    const chw = DEMO_CHWS.find((c) => c.communityId === communityId && c.id !== 'CHW-0142');
    // The live demo account (CHW-0142, com-01) is not seeded; com-01 uses its second CHW.
    const owner = chw ?? DEMO_CHWS.find((c) => c.communityId === communityId);
    if (!owner) continue;
    const rng = createRng(
      (seed ^ communityId.split('').reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)) >>> 0,
    );
    const activeWeeks = Array.from({ length: weeks }, (_, i) => i)
      .sort(() => rng() - 0.5)
      .slice(0, Math.min(p.weeks, weeks));
    for (let i = 0; i < p.n; i++) {
      const w = activeWeeks[i % activeWeeks.length]!;
      const when = new Date(Math.min(end, start + w * WEEK + rng() * WEEK));
      const hasSignal = rng() < p.signal;
      const signals: string[] = [];
      if (hasSignal) {
        const count = 1 + (rng() < 0.3 ? 1 : 0) + (rng() < 0.1 ? 1 : 0);
        while (signals.length < count) {
          const id = SIGNAL_IDS[Math.floor(rng() * SIGNAL_IDS.length)]!;
          if (!signals.includes(id)) signals.push(id);
        }
        if (rng() < 0.05) signals.push('fgs_sig_warning');
      }
      const exposure: string[] = [];
      if (rng() < p.water) exposure.push('fgs_exp_freshwater');
      if (rng() < p.water * 0.5) exposure.push('fgs_exp_livelihood');
      const context: string[] = [];
      if (rng() < p.far) context.push('fgs_ctx_far');
      if (rng() < 0.4) context.push('fgs_ctx_prefers_female');
      const distress = hasSignal && rng() < 0.3 ? 'yes' : 'no';
      const result = evaluate(
        {
          module: 'FGS',
          symptoms: signals,
          noSymptomsReported: signals.length === 0,
          exposureSignals: exposure,
          contextSignals: context,
        },
        FGS_RULE_SET,
      );
      const clientKey = `${SEED_PREFIX}fgs-${communityId}-${String(i + 1).padStart(3, '0')}`;
      out.push({
        demo: true,
        id: `SF-${communityId.slice(-2)}${String(i + 1).padStart(3, '0')}`,
        clientKey,
        chwId: owner.id,
        communityId,
        capturedAt: when.toISOString(),
        ageGroup: AGE_BANDS[Math.floor(rng() * AGE_BANDS.length)]!,
        sex: 'female',
        symptoms: signals,
        duration: null,
        progression: null,
        exposure: {
          waterContact: exposure.includes('fgs_exp_freshwater') ? 'yes' : 'no',
          animalContact: 'unknown',
          insectBites: 'unknown',
          householdSimilar: 'unknown',
        },
        wash: {
          waterSource: 'unknown',
          sanitation: 'unknown',
          handwashing: 'unknown',
          standingWater: 'unknown',
        },
        riskLevel: result.level,
        riskWhy: [...result.why],
        ruleSetId: result.ruleSetId,
        ruleSetVersion: result.ruleSetVersion,
        ruleSetStatus: result.ruleStatus,
        module: 'FGS',
        caseId: caseIdFor(clientKey),
        consent: {
          state: 'GIVEN',
          version: CONSENT_TEXT_VERSION,
          recordedAt: when.toISOString(),
          scope: 'ASSESSMENT_AND_REFERRAL',
        },
        fgs: {
          contentVersion: FGS_CONTENT.version,
          exposure,
          signals,
          context,
          distress,
          supportOffered: distress === 'yes',
          safeContact: 'yes',
        },
      });
    }
  }
  return out.sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
}
