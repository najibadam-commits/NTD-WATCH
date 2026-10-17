import { useEffect } from 'react';
import { useConnectivity, watchBrowserConnectivity } from '../offline/connectivity';
import { recoverInterrupted, syncOutbox } from '../offline/sync';

/**
 * Keeps the outbox moving while the CHW app is open: once at start (after recovering anything
 * interrupted by a refresh), whenever the connection comes back, and every 10 seconds so
 * back-off retries fire. PROTOTYPE functionality against a mock API.
 */
export function useSyncEngine(): void {
  useEffect(() => {
    const stopWatching = watchBrowserConnectivity();
    void recoverInterrupted().then(() => syncOutbox());

    const unsubscribe = useConnectivity.subscribe((state, previous) => {
      const wasOnline = previous.browserOnline && !previous.simulatedOffline;
      const nowOnline = state.browserOnline && !state.simulatedOffline;
      if (nowOnline && !wasOnline) void syncOutbox({ force: true });
    });
    const timer = window.setInterval(() => void syncOutbox(), 10_000);

    return () => {
      stopWatching();
      unsubscribe();
      window.clearInterval(timer);
    };
  }, []);
}
