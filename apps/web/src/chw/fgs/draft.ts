import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AgeBand } from '@ntd-watch/domain';
import { caseIdFor } from '@ntd-watch/domain';
import { DEMO_CHW } from '@ntd-watch/demo-data';
import { newKey, codeFor } from '../draft';

export type Tri = 'yes' | 'no' | 'unknown';

/** The "none of these" choice on a multi-select list. It never coexists with real choices. */
export const NONE = 'none';

export interface FgsDraft {
  /** Idempotency key, fixed when the draft starts. */
  clientKey: string;
  code: string;
  /** Pseudonymous case id, shown instead of any identity. */
  caseId: string;
  startedAt: string;
  communityId: string;
  /**
   * Consent is the first answer. Until it is GIVEN nothing else is collected, and a DECLINED
   * draft is discarded straight away (no consent, no record).
   */
  consent?: 'GIVEN';
  consentAt?: string;
  ageBand?: AgeBand;
  exposure: string[];
  signals: string[];
  context: string[];
  distress?: Tri;
  safeContact?: Tri;
}

function freshDraft(): FgsDraft {
  const clientKey = newKey('asm');
  return {
    clientKey,
    code: codeFor(clientKey),
    caseId: caseIdFor(clientKey),
    startedAt: new Date().toISOString(),
    communityId: DEMO_CHW.communityId,
    exposure: [],
    signals: [],
    context: [],
  };
}

interface FgsDraftStore {
  draft: FgsDraft | null;
  start: () => void;
  update: (patch: Partial<FgsDraft>) => void;
  clear: () => void;
}

/**
 * The FemTech assessment being filled in, kept in sessionStorage (like the general draft).
 * Synthetic data only. Cleared on decline, on save, and when the CHW discards it.
 */
export const useFgsDraft = create<FgsDraftStore>()(
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
    { name: 'ntd-watch-fgs-draft', storage: createJSONStorage(() => sessionStorage) },
  ),
);
