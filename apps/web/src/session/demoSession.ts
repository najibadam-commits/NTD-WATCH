import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Role } from '@ntd-watch/domain';

/**
 * SIMULATED session. Choosing a role here is a demonstration convenience.
 * It is not authentication and not a security control. It lives in sessionStorage
 * so a refresh keeps the demo role, and it is cleared when the tab closes.
 */
interface DemoSession {
  role: Role | null;
  setRole: (role: Role) => void;
  signOut: () => void;
}

export const useDemoSession = create<DemoSession>()(
  persist(
    (set) => ({
      role: null,
      setRole: (role) => set({ role }),
      signOut: () => set({ role: null }),
    }),
    { name: 'ntd-watch-demo-session', storage: createJSONStorage(() => sessionStorage) },
  ),
);
