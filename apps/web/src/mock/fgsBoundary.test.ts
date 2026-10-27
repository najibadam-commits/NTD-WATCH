import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CONSENT_AUDIT_ACTIONS } from '@ntd-watch/domain';
import { SMALL_CELL_THRESHOLD } from '@ntd-watch/programme';
import { mockServer } from './node';
import { loadRecords, setFgsSeedEnabled, setMockClock } from './programmeStore';
import { serverDb } from './serverDb';
import { localDb } from '../offline/localDb';
import { requestDeletion, saveAssessment, withdrawConsent } from '../offline/repository';
import { syncOutbox } from '../offline/sync';
import {
  ApiError,
  fetchCommunity,
  fetchReferralMonitor,
  fetchSummary,
  fetchUsers,
} from '../programme/api';
import { makeFgsAssessment } from '../testing/factories';
import { resetAll } from '../testing/resetAll';

const NOW = new Date('2026-10-18T12:00:00Z');
const range = { from: '2026-07-27', to: '2026-10-18' };
const keyOf = (i: number) => `key-fgs-${String(i).padStart(4, '0')}`;
const fgsRecord = (i: number) =>
  makeFgsAssessment(keyOf(i), {
    id: `A-FGS${i}`,
    caseId: `PC-${(0x1000 + i).toString(16).toUpperCase()}-${(0x2000 + i).toString(16).toUpperCase()}`,
  });

beforeAll(() => mockServer.listen({ onUnhandledFrame: 'error' }));
afterAll(() => mockServer.close());
beforeEach(async () => {
  // These P1 tests assume the only women-and-girls records are the ones they add.
  setFgsSeedEnabled(false);
  setMockClock(() => NOW);
  await resetAll();
});
afterEach(() => {
  setFgsSeedEnabled(true);
  mockServer.resetHandlers();
  setMockClock(null);
});

async function syncMany(n: number) {
  for (let i = 1; i <= n; i++) await saveAssessment(fgsRecord(i));
  await syncOutbox();
}

const statusOf = async (p: Promise<unknown>) => {
  try {
    await p;
    return 200;
  } catch (e) {
    return e instanceof ApiError ? e.status : -1;
  }
};

describe('FGS record through the full path: draft, queue, mock API, store, aggregate', () => {
  it('stays below the threshold on every endpoint and carries no identifying field', async () => {
    await syncMany(SMALL_CELL_THRESHOLD - 1);
    expect(await serverDb.assessments.count()).toBe(SMALL_CELL_THRESHOLD - 1);

    const summary = await fetchSummary('state', range);
    const detail = await fetchCommunity('state', fgsRecord(1).communityId, range);
    const monitor = await fetchReferralMonitor('state', range);
    expect(summary.fgs.assessments).toBeNull();
    expect(detail.fgs.assessments).toBeNull();
    expect(summary.fgs.signalCounts).toEqual({});

    const body = JSON.stringify([summary, detail, monitor]);
    expect(body).not.toMatch(/PC-[0-9A-F]{4}-[0-9A-F]{4}/);
    expect(body).not.toContain('key-fgs-');
    expect(body).not.toContain('fgs_sig_');
    expect(body).not.toMatch(/"(latitude|longitude|lat|lng|coordinates|household\w*)"/i);
  });

  it('publishes the aggregate at the threshold, still without case ids or signal-level rows', async () => {
    await syncMany(SMALL_CELL_THRESHOLD);
    const summary = await fetchSummary('state', range);
    expect(summary.fgs.assessments).toBe(SMALL_CELL_THRESHOLD);
    const body = JSON.stringify(summary);
    expect(body).not.toMatch(/PC-[0-9A-F]{4}-[0-9A-F]{4}/);
    expect(body).not.toContain('key-fgs-');
  });

  it('a withdrawn record leaves the aggregate once the server has been told', async () => {
    await syncMany(SMALL_CELL_THRESHOLD);
    expect((await fetchSummary('state', range)).fgs.assessments).toBe(SMALL_CELL_THRESHOLD);
    await withdrawConsent(keyOf(1));
    await syncOutbox();
    expect((await fetchSummary('state', range)).fgs.assessments).toBeNull();
    // withdrawn, not deleted: the mock server still holds the record
    expect(await serverDb.assessments.get(keyOf(1))).toBeDefined();
  });

  it('a deleted record is removed from the device, the mock server and the aggregate', async () => {
    await syncMany(SMALL_CELL_THRESHOLD);
    await requestDeletion(keyOf(1));
    // device: nothing about the case is left, including sent queue entries
    expect(await localDb.assessments.get(keyOf(1))).toBeUndefined();
    expect(
      (await localDb.outbox.toArray()).some(
        (o) => o.clientKey === keyOf(1) && o.kind === 'assessment',
      ),
    ).toBe(false);
    await syncOutbox();
    expect(await serverDb.assessments.get(keyOf(1))).toBeUndefined();
    expect((await fetchSummary('state', range)).fgs.assessments).toBeNull();
    expect((await loadRecords()).assessments.some((a) => a.clientKey === keyOf(1))).toBe(false);
    // audited with the pseudonymous case id only
    const actions = (await serverDb.audit.toArray()).map((a) => a.action);
    expect(actions).toContain(CONSENT_AUDIT_ACTIONS.deletionRequested);
    expect(actions).toContain(CONSENT_AUDIT_ACTIONS.deletionCompleted);
  });

  it('a queued but unsent record deleted offline never reaches the server or the aggregate', async () => {
    await saveAssessment(fgsRecord(1));
    await requestDeletion(keyOf(1));
    await syncOutbox();
    expect(await serverDb.assessments.count()).toBe(0);
    expect(await localDb.outbox.count()).toBe(0);
  });
});

describe('role restrictions on aggregate and person-level routes (simulated roles)', () => {
  it('refuses the CHW and facility roles on programme aggregates and user management', async () => {
    for (const role of ['chw', 'facility'] as const) {
      expect(await statusOf(fetchSummary(role, range)), role).toBe(403);
      expect(await statusOf(fetchUsers(role)), role).toBe(403);
    }
  });
});
