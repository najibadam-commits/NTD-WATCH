import Dexie, { type Table } from 'dexie';
import type { Assessment, FollowUp, Referral } from '@ntd-watch/domain';

/**
 * The "server side" of the MOCK API: a separate IndexedDB database standing in for a backend.
 * It is NOT a real server, NOT secure and NOT shared between devices. It exists so the
 * prototype can show what the device sends and what the "server" holds, and so the data
 * survives a browser refresh. It will be replaced by a real backend in a later milestone.
 */
class ServerDb extends Dexie {
  assessments!: Table<Assessment, string>;
  referrals!: Table<Referral, string>;
  followUps!: Table<FollowUp, string>;

  constructor() {
    super('ntd-watch-mock-server');
    this.version(1).stores({
      assessments: 'clientKey, capturedAt',
      referrals: 'id, assessmentKey, stage',
      followUps: 'clientKey, assessmentKey',
    });
  }
}

export const serverDb = new ServerDb();

export async function resetServerDb(): Promise<void> {
  await serverDb.delete();
  await serverDb.open();
}
