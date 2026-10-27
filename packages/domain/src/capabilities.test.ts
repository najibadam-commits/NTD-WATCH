import { describe, expect, it } from 'vitest';
import { CAPABILITIES, CAPABILITY_STATES } from './capabilities';

describe('capability register', () => {
  it('gives every capability exactly one valid state and a note', () => {
    for (const c of CAPABILITIES) {
      expect(CAPABILITY_STATES).toContain(c.state);
      expect(c.note.length).toBeGreaterThan(10);
    }
  });
  it('has unique ids and uses all three labels', () => {
    expect(new Set(CAPABILITIES.map((c) => c.id)).size).toBe(CAPABILITIES.length);
    for (const s of CAPABILITY_STATES) expect(CAPABILITIES.some((c) => c.state === s)).toBe(true);
  });
  it('never labels an integration, notification, identity provider or clinical rule as REAL', () => {
    for (const id of [
      'dhis2',
      'facility-directory',
      'wash-source',
      'notifications',
      'identity',
      'clinical-rules',
      'outbreak-detection',
    ]) {
      expect(CAPABILITIES.find((c) => c.id === id)!.state).toBe('FUTURE');
    }
    expect(CAPABILITIES.find((c) => c.id === 'auth')!.state).toBe('SIMULATED');
    expect(CAPABILITIES.find((c) => c.id === 'server')!.state).toBe('SIMULATED');
  });
});
