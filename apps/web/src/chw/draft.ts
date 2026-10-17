import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Exposure, Wash } from '@ntd-watch/domain';
import { DEMO_CHW } from '@ntd-watch/demo-data';

export interface Draft {
  /** Idempotency key. Fixed when the draft starts, so a repeated save can never duplicate. */
  clientKey: string;
  code: string;
  startedAt: string;
  communityId: string;
  ageGroup?: '0-4' | '5-14' | '15-49' | '50+';
  sex?: 'female' | 'male';
  symptoms: string[];
  duration?: 'lt_1_week' | '1_4_weeks' | '1_3_months' | 'gt_3_months';
  progression?: 'yes' | 'no' | 'unsure';
  exposure: Partial<Exposure>;
  wash: Partial<Wash>;
}

export function newKey(prefix = 'asm'): string {
  const c = globalThis.crypto;
  const id =
    typeof c?.randomUUID === 'function'
      ? c.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${id}`;
}

/** Short code derived from the key, shown to the CHW. It is not an identity. */
export function codeFor(clientKey: string): string {
  const compact = clientKey.replace(/[^a-z0-9]/gi, '').toUpperCase();
  return `A-${compact.slice(-5)}`;
}

function freshDraft(): Draft {
  const clientKey = newKey('asm');
  return {
    clientKey,
    code: codeFor(clientKey),
    startedAt: new Date().toISOString(),
    communityId: DEMO_CHW.communityId,
    symptoms: [],
    exposure: {},
    wash: {},
  };
}

interface DraftStore {
  draft: Draft | null;
  start: () => void;
  update: (patch: Partial<Draft>) => void;
  clear: () => void;
}

/**
 * The assessment being filled in. Kept in sessionStorage so it survives navigating between
 * screens and a browser refresh within the tab. Synthetic data only.
 */
export const useDraft = create<DraftStore>()(
  persist(
    (set, get) => ({
      draft: null,
      start: () => {
        if (!get().draft) set({ draft: freshDraft() });
      },
      update: (patch) => {
        const current = get().draft;
        if (current) set({ draft: { ...current, ...patch } });
      },
      clear: () => set({ draft: null }),
    }),
    { name: 'ntd-watch-draft', storage: createJSONStorage(() => sessionStorage) },
  ),
);
