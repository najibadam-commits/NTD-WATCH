/**
 * Data scope of a programme user: which part of the fictional hierarchy their aggregated
 * views may cover. SIMULATED in this prototype (it travels in a header the browser sets) and
 * therefore not a security control. A real system must enforce it on the server.
 */
export type ScopeKind = 'all' | 'state' | 'lga' | 'facility';

export interface DataScope {
  kind: ScopeKind;
  /** State, LGA or facility id. Absent for 'all'. */
  id?: string;
}

export const ALL_SCOPE: DataScope = { kind: 'all' };

export function encodeScope(scope: DataScope): string {
  return scope.kind === 'all' || !scope.id ? 'all' : `${scope.kind}:${scope.id}`;
}

export function parseScope(raw: string | null | undefined): DataScope | null {
  if (!raw) return null;
  if (raw === 'all') return ALL_SCOPE;
  const [kind, id] = raw.split(':');
  if ((kind === 'state' || kind === 'lga' || kind === 'facility') && id) return { kind, id };
  return null;
}
