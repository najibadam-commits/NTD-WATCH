import { isOnline } from './connectivity';
import { sendItem } from './apiClient';
import { localDb, type OutboxItem } from './localDb';

export interface SyncSummary {
  skipped: 'offline' | null;
  sent: number;
  failed: number;
  rejected: number;
  deferred: number;
}

export interface SyncOptions {
  /** Ignore retry back-off (the "Sync now" button). */
  force?: boolean;
  now?: () => number;
}

/** 2 s, 4 s, 8 s ... capped at 60 s. */
export function backoffMs(attempts: number): number {
  return Math.min(60_000, 2_000 * 2 ** Math.max(0, attempts - 1));
}

let inFlight: Promise<SyncSummary> | null = null;
let rerunRequested = false;
let rerunForce = false;

function merge(a: SyncSummary, b: SyncSummary): SyncSummary {
  return {
    skipped: b.skipped,
    sent: a.sent + b.sent,
    failed: a.failed + b.failed,
    rejected: a.rejected + b.rejected,
    deferred: b.deferred,
  };
}

/**
 * Sends waiting changes to the MOCK API, oldest first. Single-flight: concurrent calls share one
 * run, so this device never sends an item twice at once. A call made while a run is under way
 * is not lost: the run repeats once more before it finishes, so items queued in the meantime
 * are picked up. Server-side idempotency (the Idempotency-Key) covers the remaining case where
 * a response is lost and the same item is sent again later.
 */
export function syncOutbox(options: SyncOptions = {}): Promise<SyncSummary> {
  if (inFlight) {
    rerunRequested = true;
    rerunForce = rerunForce || options.force === true;
    return inFlight;
  }
  inFlight = (async () => {
    try {
      let total = await run(options);
      while (rerunRequested) {
        const force = rerunForce || options.force === true;
        rerunRequested = false;
        rerunForce = false;
        total = merge(total, await run({ ...options, force }));
      }
      return total;
    } finally {
      // No await between the last check of `rerunRequested` and here, so a caller can never
      // join this run after it has decided to stop.
      inFlight = null;
      rerunRequested = false;
      rerunForce = false;
    }
  })();
  return inFlight;
}

async function run({ force = false, now = Date.now }: SyncOptions): Promise<SyncSummary> {
  const summary: SyncSummary = { skipped: null, sent: 0, failed: 0, rejected: 0, deferred: 0 };
  if (!isOnline()) return { ...summary, skipped: 'offline' };

  const waiting = await localDb.outbox
    .where('status')
    .anyOf('pending', 'failed')
    .sortBy('createdAt');

  for (const queued of waiting) {
    if (!isOnline()) {
      summary.skipped = 'offline';
      break;
    }
    const item = await localDb.outbox.get(queued.key); // fresh copy
    if (!item || (item.status !== 'pending' && item.status !== 'failed')) continue;
    if (!force && item.nextAttemptAt > now()) {
      summary.deferred++;
      continue;
    }
    if (item.dependsOn) {
      const parent = await localDb.outbox.get(item.dependsOn);
      if (parent && parent.status === 'rejected') {
        await localDb.outbox.update(item.key, {
          status: 'rejected',
          lastError: 'The record this depends on was rejected by the server.',
        });
        summary.rejected++;
        continue;
      }
      if (parent && parent.status !== 'synced') {
        summary.deferred++;
        continue;
      }
    }

    const attempts = item.attempts + 1;
    await localDb.outbox.update(item.key, { status: 'syncing', attempts });
    const outcome = await sendItem(item);
    const patch: Partial<OutboxItem> =
      outcome.kind === 'ok'
        ? { status: 'synced', lastError: null, syncedAt: now() }
        : outcome.kind === 'retry'
          ? {
              status: 'failed',
              lastError: outcome.reason,
              nextAttemptAt: now() + backoffMs(attempts),
            }
          : { status: 'rejected', lastError: outcome.reason };
    await localDb.outbox.update(item.key, patch);
    if (outcome.kind === 'ok') summary.sent++;
    else if (outcome.kind === 'retry') summary.failed++;
    else summary.rejected++;
  }
  return summary;
}

/** After a browser refresh or crash, anything left "syncing" is safe to send again. */
export async function recoverInterrupted(): Promise<number> {
  return localDb.outbox.where('status').equals('syncing').modify({ status: 'pending' });
}

/** Puts a failed or rejected item back in the queue for the next run. */
export async function requeue(key: string): Promise<void> {
  await localDb.outbox.update(key, { status: 'pending', nextAttemptAt: 0, lastError: null });
}
