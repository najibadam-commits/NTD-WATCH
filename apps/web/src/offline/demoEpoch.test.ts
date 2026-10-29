import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DEMO_ROLE_HEADER, IDEMPOTENCY_HEADER } from '@ntd-watch/api-contract';
import { DEMO_EPOCH_HEADER, currentDemoEpoch, startNewDemoEpoch } from '../demo/demoEpoch';
import { resetDemoEnvironment } from '../demo/resetDemo';
import { mockServer } from '../mock/node';
import { serverDb } from '../mock/serverDb';
import { makeAssessment } from '../testing/factories';
import { resetAll } from '../testing/resetAll';
import { apiFetch, apiUrl } from './apiClient';
import { saveAssessment } from './repository';
import { syncOutbox } from './sync';

/** The demo-epoch guard on the mock server. Synthetic records only. */

beforeAll(() => mockServer.listen({ onUnhandledFrame: 'error' }));
afterAll(() => mockServer.close());
beforeEach(async () => {
  await resetAll();
});

const post = (key: string, epoch: string) => {
  const a = makeAssessment(key, { id: 'A-T001' });
  return apiFetch(apiUrl('/api/v1/assessments'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [DEMO_ROLE_HEADER]: 'chw',
      [IDEMPOTENCY_HEADER]: key,
      [DEMO_EPOCH_HEADER]: epoch,
    },
    body: JSON.stringify(a),
  });
};

describe('demo epoch guard', () => {
  it('refuses a state-changing request from an earlier epoch, and writes nothing', async () => {
    const old = currentDemoEpoch();
    startNewDemoEpoch();
    expect(currentDemoEpoch()).not.toBe(old);
    const res = await post('key-earlier-epoch', old);
    expect(res.status).toBe(409);
    expect(((await res.json()) as { code: string }).code).toBe('STALE_DEMO_EPOCH');
    expect(await serverDb.assessments.count()).toBe(0);
  });

  it('accepts a request from an epoch it has never heard of, as after a page reload', async () => {
    const res = await post('key-reloaded-page', crypto.randomUUID());
    expect(res.status).toBe(201);
  });

  it('accepts a request from the current epoch', async () => {
    const res = await post('key-current-epoch', currentDemoEpoch());
    expect(res.status).toBe(201);
    expect(await serverDb.assessments.get('key-current-epoch')).toBeDefined();
  });

  it('a reset starts a new epoch, and the guard does not touch reads', async () => {
    const before = currentDemoEpoch();
    await resetDemoEnvironment();
    expect(currentDemoEpoch()).not.toBe(before);
    const read = await apiFetch(apiUrl('/api/v1/server-state'), {
      headers: { [DEMO_ROLE_HEADER]: 'chw', [DEMO_EPOCH_HEADER]: before },
    });
    expect(read.status).toBe(200);
  });

  it('normal capture and sync still work after a reset, and nothing is sent twice', async () => {
    await saveAssessment(makeAssessment('key-before-reset', { id: 'A-T002' }));
    await syncOutbox({ force: true });
    await resetDemoEnvironment();
    expect(await serverDb.assessments.count()).toBe(0);
    await saveAssessment(makeAssessment('key-after-reset', { id: 'A-T003' }));
    const summary = await syncOutbox({ force: true });
    expect(summary.sent).toBe(1);
    expect(await serverDb.assessments.count()).toBe(1);
    expect(await serverDb.assessments.get('key-after-reset')).toBeDefined();
  });
});
