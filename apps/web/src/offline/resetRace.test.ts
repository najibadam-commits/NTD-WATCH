import { http } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetDemoEnvironment } from '../demo/resetDemo';
import { mockServer } from '../mock/node';
import { serverDb } from '../mock/serverDb';
import { makeAssessment } from '../testing/factories';
import { resetAll } from '../testing/resetAll';
import { localDb } from './localDb';
import { saveAssessment } from './repository';
import { syncOutbox } from './sync';

/**
 * Phase 4B. Evidence test, not a fix: can an assessment request that was already in flight when
 * the demo was reset complete afterwards and put the pre-reset record back on the (reset) mock
 * server? The request is held at the mock API with an explicit gate; nothing here sleeps or
 * retries. All records are synthetic.
 */

const PRE = 'key-pre-reset';
const POST = 'key-post-reset';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

beforeAll(() => mockServer.listen({ onUnhandledFrame: 'error' }));
afterAll(() => mockServer.close());
beforeEach(async () => {
  await resetAll();
});
afterEach(() => mockServer.resetHandlers());

describe('demo reset while an assessment request is in flight', () => {
  it('does not let the pre-reset request repopulate the reset environment, and sync still works afterwards', async () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on('unhandledRejection', onUnhandled);

    const reached = deferred();
    const gate = deferred();
    // Holds the first assessment POST. When the gate opens the handler returns nothing, so the
    // request falls through to the normal mock handler and is stored exactly as in the app.
    mockServer.use(
      http.post(
        '*/api/v1/assessments',
        async () => {
          reached.resolve();
          await gate.promise;
        },
        { once: true },
      ),
    );

    let sync: Promise<unknown> = Promise.resolve();
    let reset: Promise<unknown> = Promise.resolve();
    try {
      await saveAssessment(makeAssessment(PRE, { id: 'A-PRE1' }));
      expect(await localDb.outbox.count()).toBe(1);

      sync = syncOutbox({ force: true }).catch((e: unknown) => ({ threw: e }));
      await reached.promise; // the POST has reached the interception point and is pending

      reset = resetDemoEnvironment();
      await reset; // the reset completes while the request is still held
    } finally {
      gate.resolve(); // never leave a request held, even if something above failed
    }
    const syncResult = await sync;
    await reset;
    // Unhandled rejections are reported after the microtask queue drains and before the next
    // macrotask turn, so waiting for one turn is a barrier, not a delay.
    await new Promise<void>((r) => setImmediate(r));
    process.off('unhandledRejection', onUnhandled);

    // Facts after both the reset and the held sync have settled
    const afterReset = {
      syncRejected:
        typeof syncResult === 'object' && syncResult !== null && 'threw' in syncResult
          ? String((syncResult as { threw: unknown }).threw)
          : null,
      unhandledErrors: unhandled.map((e) => (e as { name?: string })?.name ?? String(e)),
      localAssessments: await localDb.assessments.count(),
      localOutbox: await localDb.outbox.count(),
      serverHasPreResetAssessment: !!(await serverDb.assessments.get(PRE)),
      serverAssessments: await serverDb.assessments.count(),
    };

    // Reset remains functional: a fresh assessment goes through the normal flow
    await saveAssessment(makeAssessment(POST, { id: 'A-POST1' }));
    const next = await syncOutbox({ force: true });

    expect.soft(afterReset.unhandledErrors, 'unhandled database errors').toEqual([]);
    expect.soft(afterReset.syncRejected, 'held sync rejection').toBeNull();
    expect.soft(afterReset.serverHasPreResetAssessment, 'stale server record').toBe(false);
    expect.soft(afterReset.serverAssessments, 'server assessments after reset').toBe(0);
    expect.soft(afterReset.localAssessments, 'local assessments after reset').toBe(0);
    expect.soft(afterReset.localOutbox, 'local outbox after reset').toBe(0);

    expect.soft(next.sent, 'post-reset items sent').toBe(1);
    expect.soft(!!(await serverDb.assessments.get(POST)), 'post-reset record on server').toBe(true);
    expect.soft((await localDb.outbox.get(`assessment:${POST}`))?.status).toBe('synced');
    expect.soft(!!(await serverDb.assessments.get(PRE)), 'pre-reset record at the end').toBe(false);
  });
});
