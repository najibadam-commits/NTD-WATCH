import { create } from 'zustand';
import { DEMO_COMMUNITIES, DEMO_LGAS, DEMO_STATES, DEMO_WARDS } from '@ntd-watch/demo-data';
import type { DataScope } from '@ntd-watch/domain';
import { communitiesFor, type ProgrammeFilters } from '@ntd-watch/programme';

const DAY = 86_400_000;
const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Last 12 weeks up to today (UTC), the span of the synthetic seed. */
export function defaultRange(now = new Date()): { from: string; to: string } {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return { from: isoDate(today - 83 * DAY), to: isoDate(today) };
}

export function presetRange(days: number, now = new Date()): { from: string; to: string } {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return { from: isoDate(today - (days - 1) * DAY), to: isoDate(today) };
}

type GeoLevel = 'stateId' | 'lgaId' | 'wardId' | 'communityId';
const LEVELS: GeoLevel[] = ['stateId', 'lgaId', 'wardId', 'communityId'];

interface FilterStore extends ProgrammeFilters {
  setGeo: (level: GeoLevel, id: string | undefined) => void;
  setRange: (from: string, to: string) => void;
  reset: () => void;
}

/**
 * The one set of filters every programme page shares, so the map, charts and tables always
 * describe the same slice of data. Kept in memory only.
 */
export const useProgrammeFilters = create<FilterStore>()((set) => ({
  ...defaultRange(),
  setGeo: (level, id) =>
    set((s) => {
      const next: ProgrammeFilters = { from: s.from, to: s.to };
      for (const l of LEVELS.slice(0, LEVELS.indexOf(level))) {
        if (s[l]) next[l] = s[l];
      }
      if (id) next[level] = id;
      return {
        stateId: undefined,
        lgaId: undefined,
        wardId: undefined,
        communityId: undefined,
        ...next,
      };
    }),
  setRange: (from, to) => set({ from, to }),
  reset: () =>
    set({
      ...defaultRange(),
      stateId: undefined,
      lgaId: undefined,
      wardId: undefined,
      communityId: undefined,
    }),
}));

export function currentFilters(s: ProgrammeFilters): ProgrammeFilters {
  const f: ProgrammeFilters = { from: s.from, to: s.to };
  for (const l of LEVELS) if (s[l]) f[l] = s[l];
  return f;
}

/** Choices offered by each filter, limited to what the caller's scope allows and to the level above. */
export function geoOptions(filters: ProgrammeFilters, scope: DataScope) {
  const all = communitiesFor({ from: filters.from, to: filters.to }, scope);
  const stateIds = new Set(all.map((c) => c.stateId));
  const states = DEMO_STATES.filter((s) => stateIds.has(s.id));
  const inState = all.filter((c) => !filters.stateId || c.stateId === filters.stateId);
  const lgaIds = new Set(inState.map((c) => c.lgaId));
  const lgas = DEMO_LGAS.filter((l) => lgaIds.has(l.id));
  const inLga = inState.filter((c) => !filters.lgaId || c.lgaId === filters.lgaId);
  const wardIds = new Set(inLga.map((c) => c.wardId));
  const wards = DEMO_WARDS.filter((w) => wardIds.has(w.id));
  const inWard = inLga.filter((c) => !filters.wardId || c.wardId === filters.wardId);
  const communities = DEMO_COMMUNITIES.filter((c) => inWard.some((x) => x.id === c.id));
  return { states, lgas, wards, communities };
}
