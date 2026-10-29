/**
 * The demo "epoch": which run of the demonstration a request belongs to. DEMO ONLY. This is a
 * consistency aid for a browser-based mock server, not a security control.
 *
 * Resetting the demo ends the current epoch and starts a new one. Every state-changing request
 * carries the epoch it was started in, and the mock server refuses a request from an ended epoch. Without this, a
 * request that was already in flight when the demo was reset could finish afterwards and write
 * its record into the freshly reset mock server.
 *
 * The mock handlers run in the same page as the app (the service worker hands requests back to
 * the page), so module-level values are shared by both sides. The server refuses an epoch only
 * when it is known to have been ended by a reset; an epoch it has never heard of (for example
 * from a page that was just reloaded) is accepted, so a reload never locks a device out.
 */
export const DEMO_EPOCH_HEADER = 'X-Demo-Epoch';

let epoch = crypto.randomUUID();

/** The epoch a request started now belongs to. */
export const currentDemoEpoch = (): string => epoch;

const ended = new Set<string>();

/** True when a reset has ended this epoch: a request that carries it is out of date. */
export const isEndedDemoEpoch = (id: string): boolean => ended.has(id);

/** Ends the current epoch and starts a new one. Requests that carry the old one are refused. */
export function startNewDemoEpoch(): void {
  ended.add(epoch);
  epoch = crypto.randomUUID();
}

let tail: Promise<unknown> = Promise.resolve();

/**
 * Runs `fn` after every earlier call has finished, one at a time. State-changing mock requests
 * and the server side of a demo reset both run through here, so the epoch check and the write
 * of a request cannot interleave with a reset: the request either completes before the reset
 * clears the server, or starts after it and sees the new epoch.
 */
export function exclusiveServerWrite<T>(fn: () => Promise<T> | T): Promise<T> {
  const result = tail.then(fn);
  tail = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}
