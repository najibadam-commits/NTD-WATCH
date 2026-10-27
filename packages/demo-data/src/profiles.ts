/**
 * Latent parameters the SYNTHETIC record generator uses to give each fictional community a
 * recognisable character. They are inputs to the generator only. Every figure shown in a
 * programme view is computed from the generated records, never read from this table.
 * Nothing here describes a real place.
 */
export type SignalTrend = 'rising' | 'flat' | 'falling';

export interface CommunityProfile {
  /** 0 to 1: chance that a household lacks improved water, sanitation or handwashing. */
  wash: number;
  /** 0 to 1: how often assessed people report concerning symptoms and exposures. */
  signal: number;
  /** Typical assessments per CHW per week. */
  throughput: number;
  trend: SignalTrend;
}

export const COMMUNITY_PROFILES: Record<string, CommunityProfile> = {
  'com-01': { wash: 0.55, signal: 0.55, throughput: 6, trend: 'rising' },
  // Stage 7 scenario C (low signal, high vulnerability): prevention or active surveillance.
  'com-02': { wash: 0.7, signal: 0.15, throughput: 5, trend: 'flat' },
  // Stage 7 scenario B (high signal, lower vulnerability): see docs/stage7/DEMO_SCENARIOS.md
  'com-03': { wash: 0.15, signal: 0.85, throughput: 7, trend: 'rising' },
  'com-04': { wash: 0.4, signal: 0.4, throughput: 6, trend: 'flat' },
  'com-05': { wash: 0.35, signal: 0.3, throughput: 5, trend: 'flat' },
  'com-06': { wash: 0.25, signal: 0.2, throughput: 5, trend: 'falling' },
  'com-07': { wash: 0.5, signal: 0.45, throughput: 6, trend: 'rising' },
  'com-08': { wash: 0.7, signal: 0.5, throughput: 4, trend: 'flat' },
  'com-09': { wash: 0.65, signal: 0.6, throughput: 6, trend: 'rising' },
  'com-10': { wash: 0.45, signal: 0.35, throughput: 5, trend: 'flat' },
  'com-11': { wash: 0.5, signal: 0.3, throughput: 4, trend: 'flat' },
  'com-12': { wash: 0.3, signal: 0.2, throughput: 4, trend: 'falling' },
  'com-13': { wash: 0.6, signal: 0.5, throughput: 5, trend: 'rising' },
  'com-14': { wash: 0.35, signal: 0.25, throughput: 4, trend: 'flat' },
  'com-15': { wash: 0.75, signal: 0.55, throughput: 5, trend: 'flat' },
};
