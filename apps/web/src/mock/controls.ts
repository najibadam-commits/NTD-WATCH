import { create } from 'zustand';

/**
 * Failure injection for the MOCK API, so offline and error behaviour can be demonstrated and
 * tested on purpose. Labelled in the interface as simulation controls.
 */
export interface MockControls {
  /** Every request fails with 503 while true. */
  serverDown: boolean;
  /** The next N requests fail with 500 and then service resumes. */
  failNext: number;
  /** The next N requests are stored by the server, but the response never reaches the device. */
  dropResponseNext: number;
  latencyMs: number;
  setServerDown: (v: boolean) => void;
  setFailNext: (n: number) => void;
  setDropResponseNext: (n: number) => void;
  setLatency: (ms: number) => void;
  reset: () => void;
}

const initial = { serverDown: false, failNext: 0, dropResponseNext: 0, latencyMs: 0 };

export const useMockControls = create<MockControls>()((set) => ({
  ...initial,
  setServerDown: (serverDown) => set({ serverDown }),
  setFailNext: (failNext) => set({ failNext }),
  setDropResponseNext: (dropResponseNext) => set({ dropResponseNext }),
  setLatency: (latencyMs) => set({ latencyMs }),
  reset: () => set({ ...initial }),
}));

declare global {
  interface Window {
    /** Exposed for automated browser tests only. */
    __ntdMock?: typeof useMockControls;
  }
}

if (typeof window !== 'undefined') window.__ntdMock = useMockControls;
