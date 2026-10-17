import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@ntd-watch/domain';
import { API_ROUTES, IMPLEMENTED_ROUTES } from './index';

describe('API contract', () => {
  it('only references permissions that exist in the domain model', () => {
    for (const route of Object.values(API_ROUTES)) {
      for (const p of route.anyOf) expect(PERMISSIONS).toContain(p);
    }
  });

  it('has unique method and path pairs', () => {
    const keys = Object.values(API_ROUTES).map((r) => `${r.method} ${r.path}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('lists only routes that exist in the contract', () => {
    for (const name of IMPLEMENTED_ROUTES) expect(API_ROUTES).toHaveProperty(name);
  });
});
