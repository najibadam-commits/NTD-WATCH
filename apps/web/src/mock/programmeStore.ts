import { DEMO_USERS, type DemoUser } from '@ntd-watch/demo-data';
import {
  DEFAULT_MAX_UNRESOLVED_DAYS,
  generateSeed,
  type ProgrammeRecords,
  type QueryContext,
} from '@ntd-watch/programme';
import { serverDb, type AuditRow } from './serverDb';

/**
 * The MOCK server's view of programme data: the synthetic seed plus every record the CHW app
 * has synced to the mock server. Person-level records stay in here. Handlers turn them into
 * aggregates before anything leaves.
 */

let clock: () => Date = () => new Date();
/** Tests only: pin the clock the mock server uses. */
export function setMockClock(fn: (() => Date) | null): void {
  clock = fn ?? (() => new Date());
}
export const mockNow = () => clock();

const SEED_WEEKS = 12;
let seedCache: { anchorMs: number; records: ProgrammeRecords } | null = null;

/** The end of the synthetic period: fixed the first time the mock server is used. */
export async function seedAnchor(): Promise<Date> {
  const row = await serverDb.meta.get('seedAnchor');
  if (row) return new Date(row.value);
  const anchor = new Date(Math.floor(mockNow().getTime() / 3_600_000) * 3_600_000);
  await serverDb.meta.put({ key: 'seedAnchor', value: anchor.toISOString() });
  return anchor;
}

export async function loadRecords(): Promise<ProgrammeRecords> {
  const anchor = await seedAnchor();
  if (!seedCache || seedCache.anchorMs !== anchor.getTime()) {
    seedCache = {
      anchorMs: anchor.getTime(),
      records: generateSeed({ anchor, weeks: SEED_WEEKS }),
    };
  }
  const [assessments, referrals, followUps] = await Promise.all([
    serverDb.assessments.toArray(),
    serverDb.referrals.toArray(),
    serverDb.followUps.toArray(),
  ]);
  // A referral the facility has updated is stored on the mock server under the same id as its
  // seeded original (or as a new live referral). The stored copy wins, so one referral is never
  // counted twice.
  const stored = new Map(referrals.map((r) => [r.id, r]));
  return {
    assessments: [...seedCache.records.assessments, ...assessments],
    referrals: [...seedCache.records.referrals.filter((r) => !stored.has(r.id)), ...referrals],
    followUps: [...seedCache.records.followUps, ...followUps],
  };
}

/** Seeded referrals by id, for the facility inbox (which may update a seeded referral). */
export async function seededReferral(id: string) {
  await loadRecords(); // makes sure the seed is generated
  return seedCache?.records.referrals.find((r) => r.id === id);
}

export async function maxUnresolvedDays(): Promise<number> {
  const row = await serverDb.meta.get('maxUnresolvedDays');
  const n = row ? Number(row.value) : NaN;
  return Number.isFinite(n) ? n : DEFAULT_MAX_UNRESOLVED_DAYS;
}

export async function queryContext(): Promise<QueryContext> {
  return { now: mockNow(), maxUnresolvedDays: await maxUnresolvedDays() };
}

export async function usersWithChanges(): Promise<DemoUser[]> {
  const overrides = new Map((await serverDb.users.toArray()).map((u) => [u.id, u]));
  return DEMO_USERS.map((u) => ({ ...u, ...(overrides.get(u.id) ?? {}) }));
}

export async function writeAudit(row: Omit<AuditRow, 'id' | 'at'>): Promise<void> {
  await serverDb.audit.add({ ...row, at: mockNow().toISOString() });
}

/** Clears everything the mock server holds and reseeds from a new anchor. */
export async function resetProgrammeData(): Promise<void> {
  seedCache = null;
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
