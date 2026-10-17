import { describe, expect, it } from 'vitest';
import { completionRate, isUnresolved, isValidTransition, nextStage } from './referral';
import { compareRisk, isHigherRisk, maxRisk } from './risk';

describe('referral pathway', () => {
  it('only moves forward', () => {
    expect(isValidTransition('GENERATED', 'ACCEPTED')).toBe(true);
    expect(isValidTransition('ASSESSED', 'GENERATED')).toBe(false);
    expect(isValidTransition('CLOSED', 'CLOSED')).toBe(false);
  });

  it('knows the next stage', () => {
    expect(nextStage('GENERATED')).toBe('ACCEPTED');
    expect(nextStage('CLOSED')).toBeNull();
  });

  it('flags unresolved referrals only when old and not yet assessed', () => {
    const now = new Date('2026-10-17T00:00:00Z');
    const old = new Date('2026-10-01T00:00:00Z');
    const recent = new Date('2026-10-15T00:00:00Z');
    expect(isUnresolved('ACCEPTED', old, now)).toBe(true);
    expect(isUnresolved('ACCEPTED', recent, now)).toBe(false);
    expect(isUnresolved('ASSESSED', old, now)).toBe(false);
  });

  it('computes the completion rate as assessed or beyond over generated', () => {
    expect(completionRate([])).toBe(0);
    expect(completionRate(['GENERATED', 'ACCEPTED', 'ASSESSED', 'CLOSED'])).toBe(50);
  });
});

describe('risk helpers', () => {
  it('orders levels', () => {
    expect(compareRisk('LOW', 'URGENT')).toBeLessThan(0);
    expect(maxRisk(['LOW', 'HIGH', 'MODERATE'])).toBe('HIGH');
    expect(maxRisk([])).toBe('LOW');
  });

  it('identifies higher-risk levels', () => {
    expect(isHigherRisk('HIGH')).toBe(true);
    expect(isHigherRisk('URGENT')).toBe(true);
    expect(isHigherRisk('MODERATE')).toBe(false);
  });
});
