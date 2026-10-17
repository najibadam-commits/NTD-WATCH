import type { Assessment, FollowUp, Referral } from '@ntd-watch/domain';
import { isValidTransition } from '@ntd-watch/domain';
import { fetchReferral } from './apiClient';
import { localDb, type OutboxItem, type OutboxKind } from './localDb';
import { syncOutbox } from './sync';

function outboxItem(
  kind: OutboxKind,
  clientKey: string,
  payload: OutboxItem['payload'],
  dependsOn: string | null,
): OutboxItem {
  const now = Date.now();
  return {
    key: `${kind}:${clientKey}`,
    kind,
    clientKey,
    dependsOn,
    payload,
    status: 'pending',
    attempts: 0,
    lastError: null,
    createdAt: now,
    nextAttemptAt: 0,
    syncedAt: null,
  };
}

/** Fire and forget: a no-op while offline. */
function requestSync(): void {
  void syncOutbox().catch(() => undefined);
}

export interface SaveResult {
  created: boolean;
}

/**
 * Saves the record and queues it in ONE transaction. Saving the same client key twice (a
 * double tap, a retry after refresh) keeps the first record and the first queue entry.
 */
export async function saveAssessment(a: Assessment): Promise<SaveResult> {
  const result = await localDb.transaction('rw', localDb.assessments, localDb.outbox, async () => {
    if (await localDb.assessments.get(a.clientKey)) return { created: false };
    await localDb.assessments.add(a);
    await localDb.outbox.add(outboxItem('assessment', a.clientKey, a, null));
    return { created: true };
  });
  requestSync();
  return result;
}

export async function saveReferral(r: Referral): Promise<SaveResult> {
  const result = await localDb.transaction('rw', localDb.referrals, localDb.outbox, async () => {
    if (await localDb.referrals.get(r.id)) return { created: false };
    await localDb.referrals.add(r);
    await localDb.outbox.add(
      outboxItem('referral', r.assessmentKey, r, `assessment:${r.assessmentKey}`),
    );
    return { created: true };
  });
  requestSync();
  return result;
}

export async function saveFollowUp(f: FollowUp): Promise<SaveResult> {
  const result = await localDb.transaction('rw', localDb.followUps, localDb.outbox, async () => {
    if (await localDb.followUps.get(f.clientKey)) return { created: false };
    await localDb.followUps.add(f);
    await localDb.outbox.add(
      outboxItem('followUp', f.clientKey, f, `assessment:${f.assessmentKey}`),
    );
    return { created: true };
  });
  requestSync();
  return result;
}

/**
 * Brings a referral's stage up to date from the MOCK API. Only moves forward, so a stale
 * response can never roll a referral back. Returns the referral as now stored on the device.
 */
export async function pullReferralStatus(id: string): Promise<Referral | undefined> {
  const remote = await fetchReferral(id);
  const local = await localDb.referrals.get(id);
  if (remote && local && isValidTransition(local.stage, remote.stage)) {
    await localDb.referrals.put(remote);
    return remote;
  }
  return local;
}
