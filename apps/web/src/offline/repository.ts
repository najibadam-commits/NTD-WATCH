import type { Assessment, ConsentEvent, FollowUp, Referral } from '@ntd-watch/domain';
import { CONSENT_AUDIT_ACTIONS, isValidTransition } from '@ntd-watch/domain';
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

/** Thrown when follow-on work is attempted for a person who has withdrawn consent. */
export class ConsentWithdrawnError extends Error {
  constructor() {
    super(
      'Consent was withdrawn for this assessment, so no further referral or follow-up can be recorded.',
    );
    this.name = 'ConsentWithdrawnError';
  }
}

async function assertConsentActive(assessmentKey: string): Promise<void> {
  const a = await localDb.assessments.get(assessmentKey);
  if (a?.consent?.state === 'WITHDRAWN') throw new ConsentWithdrawnError();
}

export async function saveReferral(r: Referral): Promise<SaveResult> {
  const result = await localDb.transaction(
    'rw',
    localDb.referrals,
    localDb.assessments,
    localDb.outbox,
    async () => {
      await assertConsentActive(r.assessmentKey);
      if (await localDb.referrals.get(r.id)) return { created: false };
      await localDb.referrals.add(r);
      await localDb.outbox.add(
        outboxItem('referral', r.assessmentKey, r, `assessment:${r.assessmentKey}`),
      );
      return { created: true };
    },
  );
  requestSync();
  return result;
}

export async function saveFollowUp(f: FollowUp): Promise<SaveResult> {
  const result = await localDb.transaction(
    'rw',
    localDb.followUps,
    localDb.assessments,
    localDb.outbox,
    async () => {
      await assertConsentActive(f.assessmentKey);
      if (await localDb.followUps.get(f.clientKey)) return { created: false };
      await localDb.followUps.add(f);
      await localDb.outbox.add(
        outboxItem('followUp', f.clientKey, f, `assessment:${f.assessmentKey}`),
      );
      return { created: true };
    },
  );
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

export interface ConsentChangeResult {
  /** False when there was nothing to do (unknown record, or the action was already recorded). */
  changed: boolean;
  /** True when an event was queued for the (mock) server. */
  queuedEvent: boolean;
}

function consentEventFor(
  kind: ConsentEvent['kind'],
  assessment: Assessment,
  at: string,
): ConsentEvent {
  return {
    demo: true,
    clientKey: `cev-${kind === 'CONSENT_WITHDRAWN' ? 'wd' : 'del'}-${assessment.clientKey}`,
    assessmentKey: assessment.clientKey,
    kind,
    chwId: assessment.chwId,
    at,
  };
}

/** Drops queued items that have not left the device. Returns whether anything was already sent. */
async function dropUnsentWork(
  assessmentKey: string,
  kinds: readonly OutboxKind[],
  includeSent = false,
): Promise<boolean> {
  const related = (await localDb.outbox.toArray()).filter((item) => {
    const p = item.payload as { assessmentKey?: string; clientKey?: string };
    return item.kind === 'assessment'
      ? item.clientKey === assessmentKey
      : p.assessmentKey === assessmentKey || item.clientKey === assessmentKey;
  });
  let sentAny = false;
  for (const item of related) {
    const sent = item.status === 'synced' || item.status === 'syncing';
    // only a sent record (not an event about it) means the server may hold the person's data
    if (sent && item.kind !== 'consentEvent') sentAny = true;
    // on deletion even sent items go, so no copy of the person-level payload stays on the device
    if ((!sent || includeSent) && kinds.includes(item.kind)) await localDb.outbox.delete(item.key);
  }
  return sentAny;
}

/**
 * Withdraws consent. Consent, withdrawal and deletion are separate: this stops further use of
 * the record (no new referral or follow-up, excluded from programme aggregates once the server
 * has been told) but does not delete it. Deletion is `requestDeletion`.
 */
export async function withdrawConsent(
  assessmentKey: string,
  now: Date = new Date(),
): Promise<ConsentChangeResult> {
  const result = await localDb.transaction(
    'rw',
    localDb.assessments,
    localDb.referrals,
    localDb.followUps,
    localDb.outbox,
    async (): Promise<ConsentChangeResult> => {
      const a = await localDb.assessments.get(assessmentKey);
      if (!a?.consent || a.consent.state === 'WITHDRAWN')
        return { changed: false, queuedEvent: false };
      const at = now.toISOString();
      await localDb.assessments.put({
        ...a,
        consent: { ...a.consent, state: 'WITHDRAWN', withdrawnAt: at },
      });
      await dropUnsentWork(assessmentKey, ['referral', 'followUp']);
      const event = consentEventFor('CONSENT_WITHDRAWN', a, at);
      await localDb.outbox.add(
        outboxItem('consentEvent', event.clientKey, event, `assessment:${assessmentKey}`),
      );
      return { changed: true, queuedEvent: true };
    },
  );
  requestSync();
  return result;
}

/**
 * Requests deletion of a person-level record. Everything held on this device for the case is
 * removed straight away, including queued items that never left the device. If the server may
 * already hold the record, a deletion event is queued so the (mock) server removes it too.
 */
export async function requestDeletion(
  assessmentKey: string,
  now: Date = new Date(),
): Promise<ConsentChangeResult> {
  const result = await localDb.transaction(
    'rw',
    localDb.assessments,
    localDb.referrals,
    localDb.followUps,
    localDb.outbox,
    async (): Promise<ConsentChangeResult> => {
      const a = await localDb.assessments.get(assessmentKey);
      if (!a) return { changed: false, queuedEvent: false };
      const sentAny = await dropUnsentWork(
        assessmentKey,
        ['assessment', 'referral', 'followUp', 'consentEvent'],
        true,
      );
      await localDb.referrals.where('assessmentKey').equals(assessmentKey).delete();
      await localDb.followUps.where('assessmentKey').equals(assessmentKey).delete();
      await localDb.assessments.delete(assessmentKey);
      if (!sentAny) return { changed: true, queuedEvent: false };
      const event = consentEventFor('DELETION_REQUESTED', a, now.toISOString());
      await localDb.outbox.add(outboxItem('consentEvent', event.clientKey, event, null));
      return { changed: true, queuedEvent: true };
    },
  );
  requestSync();
  return result;
}

/** Audit action names, re-exported so the device and the mock server agree on them. */
export { CONSENT_AUDIT_ACTIONS };
