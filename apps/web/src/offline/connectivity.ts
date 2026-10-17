import { create } from 'zustand';

interface Connectivity {
  /** What the browser reports (navigator.onLine and the online/offline events). */
  browserOnline: boolean;
  /** A deliberate switch for demonstrating offline capture. */
  simulatedOffline: boolean;
  setBrowserOnline: (v: boolean) => void;
  setSimulatedOffline: (v: boolean) => void;
}

export const useConnectivity = create<Connectivity>()((set) => ({
  browserOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  simulatedOffline: false,
  setBrowserOnline: (browserOnline) => set({ browserOnline }),
  setSimulatedOffline: (simulatedOffline) => set({ simulatedOffline }),
}));

export function isOnline(): boolean {
  const s = useConnectivity.getState();
  return s.browserOnline && !s.simulatedOffline;
}

/** Wires browser online/offline events into the store. Returns a cleanup function. */
export function watchBrowserConnectivity(): () => void {
  const on = () => useConnectivity.getState().setBrowserOnline(true);
  const off = () => useConnectivity.getState().setBrowserOnline(false);
  window.addEventListener('online', on);
  window.addEventListener('offline', off);
  useConnectivity.getState().setBrowserOnline(navigator.onLine);
  return () => {
    window.removeEventListener('online', on);
    window.removeEventListener('offline', off);
  };
}
