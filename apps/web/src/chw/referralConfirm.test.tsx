import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { referralIdFor } from '@ntd-watch/domain';
import '../i18n';
import type * as Repository from '../offline/repository';
import { mockServer } from '../mock/node';
import { localDb } from '../offline/localDb';
import { saveAssessment, saveReferral } from '../offline/repository';
import { routes } from '../routes';
import { useDemoSession } from '../session/demoSession';
import { makeAssessment, makeFgsAssessment } from '../testing/factories';
import { resetAll } from '../testing/resetAll';
import { useDraft } from './draft';

// Only the save is replaced, and only where a test asks for it: by default the real
// implementation runs, so consent enforcement in `saveReferral` is never bypassed.
vi.mock('../offline/repository', async (importOriginal) => {
  const actual = await importOriginal<typeof Repository>();
  return { ...actual, saveReferral: vi.fn(actual.saveReferral) };
});

const KEY = 'key-assess-confirm';

beforeAll(() => mockServer.listen({ onUnhandledFrame: 'error' }));
afterAll(() => mockServer.close());
beforeEach(async () => {
  await resetAll();
  useDraft.getState().clear();
  useDemoSession.getState().setRole('chw');
});
afterEach(() => {
  mockServer.resetHandlers();
  vi.mocked(saveReferral).mockClear();
});

async function renderConfirm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, {
    initialEntries: [`/chw/assessments/${KEY}/referral`],
  });
  await waitFor(() => expect(router.state.initialized).toBe(true));
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  await screen.findByRole('heading', { name: /generate referral/i, level: 1 });
  return router;
}

const confirmButton = () => screen.getByRole('button', { name: /generate referral/i });

async function chooseFacilityAndConfirm(u: ReturnType<typeof userEvent.setup>) {
  await u.click(screen.getByRole('radio', { name: /demo north primary health centre/i }));
  await u.click(confirmButton());
}

const referralQueued = async () =>
  (await localDb.outbox.toArray()).filter((i) => i.kind === 'referral').length;

const expectedId = () => referralIdFor(KEY, new Date().getFullYear());

describe('referral confirmation: failure handling', () => {
  it('still creates the referral and moves to its status page when the save succeeds', async () => {
    await saveAssessment(makeAssessment(KEY));
    const router = await renderConfirm();
    await chooseFacilityAndConfirm(userEvent.setup());

    expect(await screen.findByText(`Referral ID ${expectedId()}`)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/chw/referrals/${expectedId()}`);
    expect(await localDb.referrals.count()).toBe(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a safe error notice, creates nothing and stays on the form when the save is rejected', async () => {
    await saveAssessment(makeAssessment(KEY));
    vi.mocked(saveReferral).mockRejectedValueOnce(
      new Error('DexieError: internal detail that must not be shown'),
    );
    const router = await renderConfirm();
    await chooseFacilityAndConfirm(userEvent.setup());

    const notice = await screen.findByRole('alert');
    expect(notice).toHaveTextContent(/referral could not be saved on this device/i);
    expect(notice).toHaveTextContent(/no referral was created/i);
    expect(notice).not.toHaveTextContent(/dexie|internal detail/i);
    // not taken to a referral, not shown as created, nothing stored
    expect(router.state.location.pathname).toBe(`/chw/assessments/${KEY}/referral`);
    expect(screen.queryByText(/^Referral ID/)).not.toBeInTheDocument();
    expect(await localDb.referrals.count()).toBe(0);
    expect(await referralQueued()).toBe(0);
  });

  it('gives the saving state back after a failed save, so the person can try again', async () => {
    await saveAssessment(makeAssessment(KEY));
    vi.mocked(saveReferral).mockRejectedValueOnce(new Error('boom'));
    await renderConfirm();
    await chooseFacilityAndConfirm(userEvent.setup());

    await screen.findByRole('alert');
    await waitFor(() => expect(confirmButton()).toBeEnabled());
  });

  it('succeeds on a retry after a recoverable failure, once and only once', async () => {
    await saveAssessment(makeAssessment(KEY));
    vi.mocked(saveReferral).mockRejectedValueOnce(new Error('transient'));
    const u = userEvent.setup();
    const router = await renderConfirm();
    await chooseFacilityAndConfirm(u);
    await screen.findByRole('alert');
    await waitFor(() => expect(confirmButton()).toBeEnabled());

    await u.click(confirmButton());

    expect(await screen.findByText(`Referral ID ${expectedId()}`)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/chw/referrals/${expectedId()}`);
    expect(await localDb.referrals.count()).toBe(1);
    expect(await referralQueued()).toBe(1);
    expect(vi.mocked(saveReferral)).toHaveBeenCalledTimes(2);
  });

  it('explains that consent is no longer active, and the real consent check still blocks the save', async () => {
    // the real saveReferral runs here: it must refuse because consent was withdrawn
    await saveAssessment(
      makeFgsAssessment(KEY, {
        consent: {
          state: 'WITHDRAWN',
          version: 'demo-consent-0.1',
          recordedAt: '2026-10-17T09:58:00.000Z',
          scope: 'ASSESSMENT_AND_REFERRAL',
          withdrawnAt: '2026-10-17T10:30:00.000Z',
        },
      }),
    );
    const router = await renderConfirm();
    const u = userEvent.setup();
    await chooseFacilityAndConfirm(u);

    const notice = await screen.findByRole('alert');
    expect(notice).toHaveTextContent(/consent is no longer active/i);
    expect(notice).toHaveTextContent(/no referral was created/i);
    expect(notice).not.toHaveTextContent(/could not be saved on this device/i);
    expect(router.state.location.pathname).toBe(`/chw/assessments/${KEY}/referral`);
    expect(screen.queryByText(/^Referral ID/)).not.toBeInTheDocument();
    expect(await localDb.referrals.count()).toBe(0);
    expect(await referralQueued()).toBe(0);
    await waitFor(() => expect(confirmButton()).toBeEnabled());
  });

  it('does not save twice when the button is pressed twice quickly', async () => {
    await saveAssessment(makeAssessment(KEY));
    await renderConfirm();
    const u = userEvent.setup();
    await u.click(screen.getByRole('radio', { name: /demo north primary health centre/i }));
    await Promise.all([u.dblClick(confirmButton())]);

    await screen.findByText(`Referral ID ${expectedId()}`);
    expect(await localDb.referrals.count()).toBe(1);
    expect(await referralQueued()).toBe(1);
  });
});
