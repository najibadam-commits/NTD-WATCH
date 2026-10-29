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

/**
 * The id of this mock server's current "generation". It is created the first time it is asked
 * for, and lives in `meta`, so a cleared or newly created database starts a new generation. That
 * is how a device can tell a mock server that lost its records from one that is merely slow or
 * unreachable. It cannot tell that a database was only partly emptied while `meta` survived
 * (a limit of this approach, described in the Phase 3 report).
 */
export async function serverGeneration(): Promise<string> {
  const existing = await serverDb.meta.get('generation');
  if (existing) return existing.value;
  return serverDb.transaction('rw', serverDb.meta, async () => {
    const again = await serverDb.meta.get('generation');
    if (again) return again.value;
    const value = crypto.randomUUID();
    await serverDb.meta.put({ key: 'generation', value });
    return value;
  });
}

/**
 * Empties every table of the mock server, `meta` included, in one transaction: records, user
 * overrides, audit rows, the seed anchor and the generation id. The next request therefore
 * starts a new seed period and a new generation, as a deleted database would. The database stays
 * open, so nothing that is using it at that moment fails with `DatabaseClosedError`.
 */
export async function resetServerDb(): Promise<void> {
  await serverDb.transaction(
    'rw',
    [
      serverDb.assessments,
      serverDb.referrals,
      serverDb.followUps,
      serverDb.meta,
      serverDb.users,
      serverDb.audit,
    ],
    async () => {
      await Promise.all([
        serverDb.assessments.clear(),
        serverDb.referrals.clear(),
        serverDb.followUps.clear(),
        serverDb.meta.clear(),
        serverDb.users.clear(),
        serverDb.audit.clear(),
      ]);
    },
  );
}
