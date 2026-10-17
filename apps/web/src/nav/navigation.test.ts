import { describe, expect, it } from 'vitest';
import { matchRoutes } from 'react-router-dom';
import { routes } from '../routes';
import { CHW_SCREENS } from './navigation';

describe('CHW screens', () => {
  it('lists the 13 milestone screens plus referral list, follow-up list and profile', () => {
    expect(CHW_SCREENS).toHaveLength(16);
    for (const id of [
      'login',
      'dashboard',
      'new',
      'person',
      'symptoms',
      'context',
      'wash',
      'summary',
      'result',
      'referral',
      'referralStatus',
      'followUp',
      'history',
    ]) {
      expect(CHW_SCREENS.map((s) => s.id)).toContain(id);
    }
  });

  it('has a real route for every listed screen path', () => {
    for (const s of CHW_SCREENS) {
      const concrete = s.path.replace(':key', 'asm-00000000').replace(':id', 'NTDW-2026-000001');
      expect(matchesRoute(concrete), s.path).toBe(true);
    }
  });

  it('has no screen marked as a placeholder', () => {
    expect(CHW_SCREENS.every((s) => s.stage === 'Built')).toBe(true);
  });
});

function matchesRoute(path: string): boolean {
  const found = matchRoutes(routes, path);
  return !!found && !found.some((m) => m.route.path === '*');
}
