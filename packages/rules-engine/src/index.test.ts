import { describe, expect, it } from 'vitest';
import { isDemoOnly } from './index';

describe('rule set status', () => {
  it('treats placeholder rule sets as demonstration-only', () => {
    expect(isDemoOnly({ status: 'DEMO_PLACEHOLDER' })).toBe(true);
  });

  it('only a validated rule set is not demonstration-only', () => {
    expect(isDemoOnly({ status: 'VALIDATED' })).toBe(false);
  });
});
