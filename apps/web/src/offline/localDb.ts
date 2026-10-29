import Dexie, { type Table } from 'dexie';
import type { Assessment, ConsentEvent, FollowUp, Referral } from '@ntd-watch/domain';

export type OutboxKind = 'assessment' | 'referral' | 'followUp' | 'consentEvent';
export type OutboxStatus = 'pending' | 'syncing' | 'failed' | 'rejected' | 'synced';

export interface OutboxItem {
  /** `${kind}:${clientKey}`. Unique, so saving the same record twice cannot queue it twice. */
  key: string;
  kind: OutboxKind;
  clientKey: string;
  /** Outbox key of an item that must reach the server first. */
  dependsOn: string | null;
  payload: Assessment | Referral | FollowUp | ConsentEvent;
  status: OutboxStatus;
  attempts: number;
  lastError: string | null;
  createdAt: number;
  nextAttemptAt: number;
  syncedAt: number | null;
  /**
   * The mock-server generation that acknowledged this item. A synced item whose generation
   * differs from the server's current one, or that has none recorded, is not known to be on the
   * server any more.
   */
  serverGeneration?: string | null;
  /** True while a record the server once acknowledged is being sent again after server loss. */
  restore?: boolean;
}

/**
 * The device's own IndexedDB store: what the CHW has captured, plus the outbox of changes
 * waiting for the (mock) server. Prototype functionality, not production-ready offline operation.
 */
class LocalDb extends Dexie {
  assessments!: Table<Assessment, string>;
  referrals!: Table<Referral, string>;
  followUps!: Table<FollowUp, string>;
  outbox!: Table<OutboxItem, string>;

  constructor() {
    super('ntd-watch-local');
    this.version(1).stores({
      assessments: 'clientKey, capturedAt',
      referrals: 'id, assessmentKey',
      followUps: 'clientKey, assessmentKey',
      outbox: 'key, status, createdAt',
    });
  }
}

export const localDb = new LocalDb();

/**
 * Removes every record held on this device, including the offline queue. The tables are emptied
 * in one transaction; the database itself stays open. (Deleting and reopening it would close it
 * for a moment, and any sync or live query that touched it in that moment would fail with
 * `DatabaseClosedError`.)
 */
export async function resetLocalDb(): Promise<void> {
  await localDb.transaction(
    'rw',
    [localDb.assessments, localDb.referrals, localDb.followUps, localDb.outbox],
    async () => {
      await Promise.all([
        localDb.assessments.clear(),
        localDb.referrals.clear(),
        localDb.followUps.clear(),
        localDb.outbox.clear(),
      ]);
    },
  );
}
