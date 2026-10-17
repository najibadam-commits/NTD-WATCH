import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@ntd-watch/domain';
import { API_ROUTES } from './index';

describe('API contract', () => {
  it('only references permissions that exist in the domain model', () => {
    for (const route of Object.values(API_ROUTES)) {
      expect(PERMISSIONS).toContain(route.permission);
    }
  });

  it('has unique method and path pairs', () => {
    const keys = Object.values(API_ROUTES).map((r) => `${r.method} ${r.path}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
