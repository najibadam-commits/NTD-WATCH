import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEMO_ROLE_HEADER, IDEMPOTENCY_HEADER } from '@ntd-watch/api-contract';
import { serverDb } from '../mock/serverDb';
import { makeAssessment } from '../testing/factories';
import { resetAll } from '../testing/resetAll';
import { apiFetch, apiUrl } from './apiClient';

beforeEach(async () => {
  await resetAll();
});
afterEach(() => vi.unstubAllGlobals());

/** Replaces the network with one reply. A fresh Response each call, as a real fetch gives. */
function pageServerReplies(make: () => Response) {
  const spy = vi.fn(async () => make());
  vi.stubGlobal('fetch', spy);
  return spy;
}

const post = (a = makeAssessment()) =>
  apiFetch(apiUrl('/api/v1/assessments'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [DEMO_ROLE_HEADER]: 'chw',
      [IDEMPOTENCY_HEADER]: a.clientKey,
    },
    body: JSON.stringify(a),
  });

const JSON_HEADERS = { 'content-type': 'application/json' };
const HTML = () =>
  new Response('<!doctype html>', { status: 200, headers: { 'content-type': 'text/html' } });

describe('apiFetch: the mock service worker is not answering', () => {
  it('answers a POST in-page when the page server replies 404 with no body and no type', async () => {
    pageServerReplies(() => new Response(null, { status: 404 }));
    const response = await post();
    expect(response.status).toBe(201);
    expect(response.headers.get('content-type')).toContain('json');
    expect(await serverDb.assessments.count()).toBe(1);
  });

  it('does the same for a PATCH and a GET', async () => {
    pageServerReplies(() => new Response(null, { status: 404 }));
    // The referral does not exist, so the in-page mock gives its own JSON 404.
    const patch = await apiFetch(apiUrl('/api/v1/referrals/none'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', [DEMO_ROLE_HEADER]: 'facility' },
      body: JSON.stringify({ stage: 'ACCEPTED' }),
    });
    expect(patch.status).toBe(404);
    expect(await patch.json()).toMatchObject({ code: 'NOT_FOUND' });
    const get = await apiFetch(apiUrl('/api/v1/referrals/none'), {
      headers: { [DEMO_ROLE_HEADER]: 'chw' },
    });
    expect(await get.json()).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('answers in-page when the page server replies with its HTML page', async () => {
    pageServerReplies(HTML);
    expect((await post()).status).toBe(201);
    expect(await serverDb.assessments.count()).toBe(1);
  });

  it('returns the page server reply when the mock has no route for the path', async () => {
    pageServerReplies(HTML);
    const response = await apiFetch(apiUrl('/not-an-api-path'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
  });
});

describe('apiFetch: replies that are left exactly as they are', () => {
  it('keeps a JSON error, including a real mock 404 and a problem+json type', async () => {
    const body = JSON.stringify({ code: 'NOT_FOUND', message: 'No such referral.' });
    for (const type of ['application/json', 'application/problem+json; charset=utf-8']) {
      const spy = pageServerReplies(
        () => new Response(body, { status: 404, headers: { 'content-type': type } }),
      );
      const response = await post();
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({ code: 'NOT_FOUND' });
      expect(spy).toHaveBeenCalledTimes(1);
    }
    expect(await serverDb.assessments.count()).toBe(0);
  });

  it('keeps a JSON 5xx such as an injected failure or outage', async () => {
    for (const status of [500, 503]) {
      pageServerReplies(
        () => new Response('{"code":"X","message":"m"}', { status, headers: JSON_HEADERS }),
      );
      expect((await post()).status).toBe(status);
    }
    expect(await serverDb.assessments.count()).toBe(0);
  });

  it('keeps a plain-text error, for example from a proxy', async () => {
    const cases: [number, string][] = [
      [404, 'Not Found'],
      [502, 'Bad Gateway'],
      [503, 'Service Unavailable'],
    ];
    for (const [status, text] of cases) {
      const spy = pageServerReplies(() => new Response(text, { status }));
      const response = await post();
      expect(response.status).toBe(status);
      expect(await response.text()).toBe(text);
      expect(spy).toHaveBeenCalledTimes(1);
    }
    expect(await serverDb.assessments.count()).toBe(0);
  });

  it('keeps a bodiless reply that is not a 404', async () => {
    for (const status of [204, 405, 502, 504]) {
      pageServerReplies(() => new Response(null, { status }));
      expect((await post()).status).toBe(status);
    }
    expect(await serverDb.assessments.count()).toBe(0);
  });

  it('keeps a 404 that has a body but no content type', async () => {
    pageServerReplies(() => new Response(new Uint8Array([1, 2, 3]), { status: 404 }));
    const response = await post();
    expect(response.status).toBe(404);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
    expect(await serverDb.assessments.count()).toBe(0);
  });

  it('keeps a JSON success untouched', async () => {
    pageServerReplies(
      () => new Response('{"duplicate":true}', { status: 200, headers: JSON_HEADERS }),
    );
    const response = await post();
    expect(await response.json()).toEqual({ duplicate: true });
    expect(await serverDb.assessments.count()).toBe(0);
  });
});

describe('apiFetch: real network failures', () => {
  it('still throws, and does not switch to the mock', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    await expect(post()).rejects.toThrow('Failed to fetch');
    expect(await serverDb.assessments.count()).toBe(0);
  });
});
