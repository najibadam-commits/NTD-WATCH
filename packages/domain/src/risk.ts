/**
 * Risk levels are PRODUCT DESIGN CATEGORIES (specification section 15).
 * They are not clinical thresholds. Any rule that produces them must be
 * labelled demonstration-only until validated by qualified experts.
 */
export const RISK_LEVELS = ['LOW', 'MODERATE', 'HIGH', 'URGENT'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const RISK_MEANING: Record<RiskLevel, string> = {
  LOW: 'No significant warning pattern identified.',
  MODERATE: 'Some relevant indicators identified.',
  HIGH: 'Multiple concerning indicators.',
  URGENT: 'Potential serious warning signs.',
};

export const RISK_ACTION: Record<RiskLevel, string> = {
  LOW: 'Education and prevention.',
  MODERATE: 'Monitor and consider consultation.',
  HIGH: 'Timely referral.',
  URGENT: 'Immediate professional assessment.',
};

/** Non-colour cue so risk is never conveyed by colour alone. */
export const RISK_SYMBOL: Record<RiskLevel, string> = {
  LOW: '●',
  MODERATE: '◆',
  HIGH: '▲',
  URGENT: '!',
};

export function compareRisk(a: RiskLevel, b: RiskLevel): number {
  return RISK_LEVELS.indexOf(a) - RISK_LEVELS.indexOf(b);
}

export function maxRisk(levels: readonly RiskLevel[]): RiskLevel {
  return levels.reduce<RiskLevel>((m, l) => (compareRisk(l, m) > 0 ? l : m), 'LOW');
}

export function isHigherRisk(level: RiskLevel): boolean {
  return level === 'HIGH' || level === 'URGENT';
}
