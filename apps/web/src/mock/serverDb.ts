import Dexie, { type Table } from 'dexie';
import type { Assessment, FollowUp, Referral, Role } from '@ntd-watch/domain';

/**
 * The "server side" of the MOCK API: a separate IndexedDB database standing in for a backend.
 * It is NOT a real server, NOT secure and NOT shared between devices. It exists so the
 * prototype can show what the device sends and what the "server" holds, and so the data
 * survives a browser refresh. It will be replaced by a real backend in a later milestone.
 */
export interface MetaRow {
  key: string;
  value: string;
}

/** A change to a synthetic user (the directory itself lives in demo-data). */
export interface UserOverride {
  id: string;
  role: Role;
  scopeId: string;
  active: boolean;
}

export interface AuditRow {
  id?: number;
  at: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
}

class ServerDb extends Dexie {
  assessments!: Table<Assessment, string>;
  referrals!: Table<Referral, string>;
  followUps!: Table<FollowUp, string>;
  meta!: Table<MetaRow, string>;
  users!: Table<UserOverride, string>;
  audit!: Table<AuditRow, number>;

  constructor() {
    super('ntd-watch-mock-server');
    this.version(1).stores({
      assessments: 'clientKey, capturedAt',
      referrals: 'id, assessmentKey, stage',
      followUps: 'clientKey, assessmentKey',
    });
    // Stage 3: seed anchor and settings, user changes and an audit trail for the demo.
    this.version(2).stores({
      assessments: 'clientKey, capturedAt',
      referrals: 'id, assessmentKey, stage',
      followUps: 'clientKey, assessmentKey',
      meta: 'key',
      users: 'id',
      audit: '++id, at',
    });
  }
}

export const serverDb = new ServerDb();

export async function resetServerDb(): Promise<void> {
  await serverDb.delete();
  await serverDb.open();
}
