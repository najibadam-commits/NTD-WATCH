/**
 * Tells other tabs of this browser that the mock server received new records, so open
 * programme views refresh. Same-browser only; it stands in for a real push channel.
 */
const NAME = 'ntd-watch-data';

type Listener = () => void;

export function notifyDataChanged(): void {
  if (typeof BroadcastChannel === 'undefined') return;
  const channel = new BroadcastChannel(NAME);
  channel.postMessage('changed');
  channel.close();
}

export function onDataChanged(listener: Listener): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => undefined;
  const channel = new BroadcastChannel(NAME);
  channel.onmessage = () => listener();
  return () => channel.close();
}
