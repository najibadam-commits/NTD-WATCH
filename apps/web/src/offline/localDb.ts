import Dexie, { type Table } from 'dexie';
import type { Assessment, FollowUp, Referral } from '@ntd-watch/domain';

export type OutboxKind = 'assessment' | 'referral' | 'followUp';
export type OutboxStatus = 'pending' | 'syncing' | 'failed' | 'rejected' | 'synced';

export interface OutboxItem {
  /** `${kind}:${clientKey}`. Unique, so saving the same record twice cannot queue it twice. */
  key: string;
  kind: OutboxKind;
  clientKey: string;
  /** Outbox key of an item that must reach the server first. */
  dependsOn: string | null;
  payload: Assessment | Referral | FollowUp;
  status: OutboxStatus;
  attempts: number;
  lastError: string | null;
  createdAt: number;
  nextAttemptAt: number;
  syncedAt: number | null;
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

export async function resetLocalDb(): Promise<void> {
  await localDb.delete();
  await localDb.open();
}
