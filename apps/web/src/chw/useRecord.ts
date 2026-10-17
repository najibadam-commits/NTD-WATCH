import { useLiveQuery } from 'dexie-react-hooks';

/**
 * Reads from IndexedDB and re-renders when it changes. Unlike a bare live query, it tells
 * "still loading" apart from "loaded and nothing there".
 */
export function useRecord<T>(
  read: () => Promise<T | undefined>,
  deps: unknown[],
): { loading: boolean; value: T | undefined } {
  const box = useLiveQuery(async () => ({ value: await read() }), deps);
  return { loading: box === undefined, value: box?.value };
}

export function useRecords<T>(
  read: () => Promise<T[]>,
  deps: unknown[],
): { loading: boolean; items: T[] } {
  const box = useLiveQuery(async () => ({ items: await read() }), deps);
  return { loading: box === undefined, items: box?.items ?? [] };
}
