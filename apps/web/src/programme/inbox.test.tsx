import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { HttpResponse, delay, http } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { referralIdFor, REFERRAL_STAGE_LABELS, type Role } from '@ntd-watch/domain';
import '../i18n';
import { mockServer } from '../mock/node';
import { serverDb } from '../mock/serverDb';
import { localDb } from '../offline/localDb';
import { saveAssessment, saveReferral, withdrawConsent } from '../offline/repository';
import { syncOutbox } from '../offline/sync';
import { routes } from '../routes';
import { useDemoSession } from '../session/demoSession';
import { makeAssessment, makeFgsAssessment, makeReferral } from '../testing/factories';
import { resetAll } from '../testing/resetAll';
import { fetchInbox, patchReferralStage } from './api';

/**
 * The facility referral inbox as a person uses it: the page, the mock API and the real referral
 * state machine, with synthetic data. The facility is SIMULATED; nothing here is a real facility.
 */

beforeAll(() => mockServer.listen({ onUnhandledFrame: 'error' }));
afterAll(() => mockServer.close());
beforeEach(async () => {
  await resetAll();
  useDemoSession.getState().signOut();
});
afterEach(() => mockServer.resetHandlers());

async function open(path: string, role: Role) {
  useDemoSession.getState().setRole(role);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  await waitFor(() => expect(router.state.initialized).toBe(true));
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

const openInbox = () => open('/programme/inbox', 'facility');
const user = () => userEvent.setup();

/** Waits for the inbox table and returns its body rows. */
async function inboxRows() {
  await screen.findByRole('heading', { name: /^referrals$/i, level: 2 });
  return within(screen.getAllByRole('table')[0]!).getAllByRole('row').slice(1);
}

/** The open (not closed) referrals the page lists, in the order the page lists them. */
const visibleItems = async () =>
  (await fetchInbox('facility')).items.filter((i) => i.referral.stage !== 'CLOSED');

/** Makes a LIVE referral (created in the demo session) for the simulated north facility. */
async function makeLiveReferral(key = 'key-assess-inbox') {
  await saveAssessment(makeAssessment(key, { id: 'A-0999' }));
  await saveReferral(
    makeReferral(key, { id: referralIdFor(key, new Date().getFullYear()), assessmentId: 'A-0999' }),
  );
  await syncOutbox({ force: true });
  return referralIdFor(key, new Date().getFullYear());
}

async function openReferralRowAt(u: ReturnType<typeof user>, index: number) {
  const rows = await inboxRows();
  await u.click(within(rows[index]!).getByRole('button', { name: /open referral/i }));
  return screen.findByRole('region', { name: /referral detail/i });
}

describe('facility inbox: what the page shows', () => {
  it('lists the referrals the inbox API returns, and says it is a simulated workflow on synthetic data', async () => {
    await openInbox();
    const rows = await inboxRows();
    expect(rows).toHaveLength((await visibleItems()).length);
    expect(rows.length).toBeGreaterThan(0);
    expect(screen.getByText(/facility: /i)).toBeInTheDocument();
    const notice = screen.getByText(
      /simulated facility workflow using synthetic demonstration data/i,
    );
    expect(notice).toHaveTextContent(/no real facility receives or processes these referrals/i);
  });

  it('shows an empty state when the inbox API returns no referrals', async () => {
    mockServer.use(
      http.get('*/api/v1/referrals/inbox', () =>
        HttpResponse.json({
          demo: true,
          notice: 'SYNTHETIC DEMONSTRATION DATA.',
          facilityId: 'fac-n1',
          facilityName: 'Demo North Primary Health Centre',
          items: [],
        }),
      ),
    );
    await openInbox();
    expect(
      await screen.findByText(/no referrals have been sent to this facility yet/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows a loading state while the inbox is being fetched', async () => {
    mockServer.use(
      http.get('*/api/v1/referrals/inbox', async () => {
        await delay(400);
        // falls through to the real handler afterwards
      }),
    );
    await openInbox();
    expect(await screen.findByText(/loading/i)).toBeInTheDocument();
    expect((await inboxRows()).length).toBeGreaterThan(0);
  });

  it('shows the service error when the inbox cannot be loaded, not an empty inbox', async () => {
    mockServer.use(
      http.get('*/api/v1/referrals/inbox', () =>
        HttpResponse.json(
          { code: 'SERVER_ERROR', message: 'Simulated service failure.' },
          { status: 503 },
        ),
      ),
    );
    await openInbox();
    expect(await screen.findByText(/could not load this view/i)).toBeInTheDocument();
    expect(screen.getByText(/simulated service failure/i)).toBeInTheDocument();
    expect(screen.queryByText(/no referrals have been sent/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('facility inbox: moving a referral forward', () => {
  it('offers only the next stage and, once the update succeeds, shows the new stage and a simulated-update message', async () => {
    const u = user();
    await openInbox();
    const before = await visibleItems();
    const index = before.findIndex((i) => i.referral.stage === 'GENERATED');
    expect(index).toBeGreaterThanOrEqual(0);
    const id = before[index]!.referral.id;

    const detail = await openReferralRowAt(u, index);
    // only the next stage is offered, and no success is shown before anything is done
    expect(within(detail).getByRole('button', { name: /accept referral/i })).toBeEnabled();
    expect(within(detail).queryByRole('button', { name: /mark person as arrived/i })).toBeNull();
    expect(within(detail).queryByRole('status')).not.toBeInTheDocument();

    await u.click(within(detail).getByRole('button', { name: /accept referral/i }));

    expect(await within(detail).findByRole('status')).toHaveTextContent(
      /moved to “accepted”.*simulated facility update on synthetic data/i,
    );
    // the authoritative mock-server record has the new stage
    expect((await serverDb.referrals.get(id))?.stage).toBe('ACCEPTED');
    expect(
      (await fetchInbox('facility')).items.find((i) => i.referral.id === id)!.referral.stage,
    ).toBe('ACCEPTED');
    // the page re-reads it and offers the following stage
    expect(
      await within(detail).findByRole('button', { name: /mark person as arrived/i }),
    ).toBeInTheDocument();
  });

  it('does not report success when the update fails, and the person can try again', async () => {
    const u = user();
    await openInbox();
    const before = await visibleItems();
    const index = before.findIndex((i) => i.referral.stage === 'GENERATED');
    const id = before[index]!.referral.id;
    mockServer.use(
      http.patch(
        '*/api/v1/referrals/:id',
        () =>
          HttpResponse.json(
            { code: 'SERVER_ERROR', message: 'Simulated service failure.' },
            { status: 503 },
          ),
        { once: true },
      ),
    );

    const detail = await openReferralRowAt(u, index);
    await u.click(within(detail).getByRole('button', { name: /accept referral/i }));

    expect(await within(detail).findByRole('alert')).toHaveTextContent(
      /simulated service failure/i,
    );
    expect(within(detail).queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText(/simulated facility update on synthetic data/i)).toBeNull();
    expect((await serverDb.referrals.get(id))?.stage ?? 'GENERATED').toBe('GENERATED');
    expect(within(detail).getByRole('button', { name: /accept referral/i })).toBeEnabled();

    // the one-off failure has passed: retrying works
    await u.click(within(detail).getByRole('button', { name: /accept referral/i }));
    expect(await within(detail).findByRole('status')).toHaveTextContent(/moved to “accepted”/i);
    expect((await serverDb.referrals.get(id))?.stage).toBe('ACCEPTED');
  });

  it('refuses a stale update from an out-of-date view, shows the reason, reports no success and leaves the record intact', async () => {
    const u = user();
    await openInbox();
    const before = await visibleItems();
    const index = before.findIndex((i) => i.referral.stage === 'GENERATED');
    const id = before[index]!.referral.id;
    const detail = await openReferralRowAt(u, index);

    // meanwhile the referral moves on (another session of the simulated facility)
    await patchReferralStage('facility', id, 'ACCEPTED');
    await u.click(within(detail).getByRole('button', { name: /accept referral/i }));

    expect(await within(detail).findByRole('alert')).toHaveTextContent(
      /status can only move forward/i,
    );
    expect(within(detail).queryByRole('status')).not.toBeInTheDocument();
    // the server was not changed by the refused request, and the page re-reads the true stage
    expect((await serverDb.referrals.get(id))?.stage).toBe('ACCEPTED');
    expect(
      await within(detail).findByRole('button', { name: /mark person as arrived/i }),
    ).toBeInTheDocument();
  });

  it('sends one update only when the button is pressed twice quickly', async () => {
    const u = user();
    let patches = 0;
    mockServer.use(
      http.patch('*/api/v1/referrals/:id', async () => {
        patches += 1;
        await delay(250);
        // falls through to the real handler
      }),
    );
    await openInbox();
    const index = (await visibleItems()).findIndex((i) => i.referral.stage === 'GENERATED');
    const detail = await openReferralRowAt(u, index);
    const button = within(detail).getByRole('button', { name: /accept referral/i });

    await u.dblClick(button);

    expect(await within(detail).findByRole('status')).toBeInTheDocument();
    expect(patches).toBe(1);
  });
});

describe('facility inbox and the community health worker', () => {
  it('shows the CHW the new stage after the existing "Refresh status", and keeps both views intact after refused skips and reversals', async () => {
    const u = user();
    const id = await makeLiveReferral();
    await openInbox();
    const items = await visibleItems();
    const index = items.findIndex((i) => i.referral.id === id);
    expect(index).toBeGreaterThanOrEqual(0);
    expect(items[index]!.source).toBe('live');

    const detail = await openReferralRowAt(u, index);
    await u.click(within(detail).getByRole('button', { name: /accept referral/i }));
    await within(detail).findByRole('status');
    expect((await serverDb.referrals.get(id))?.stage).toBe('ACCEPTED');
    // there is no automatic push: the device still holds the earlier stage
    expect((await localDb.referrals.get(id))?.stage).toBe('GENERATED');

    // invalid: skipping a stage and moving backwards are refused and change nothing
    await expect(
      patchReferralStage('facility', id, 'ASSESSED', 'CARE_PROVIDED'),
    ).rejects.toMatchObject({
      status: 409,
    });
    await expect(patchReferralStage('facility', id, 'GENERATED')).rejects.toMatchObject({
      status: 409,
    });
    expect((await serverDb.referrals.get(id))?.stage).toBe('ACCEPTED');

    // the CHW opens the referral and uses the existing refresh
    cleanup();
    useDemoSession.getState().signOut();
    await open(`/chw/referrals/${id}`, 'chw');
    await screen.findByText(`Referral ID ${id}`);
    expect(document.querySelectorAll('li[data-reached="true"]')).toHaveLength(1);
    await u.click(screen.getByRole('button', { name: /refresh status/i }));
    await waitFor(() =>
      expect(document.querySelectorAll('li[data-reached="true"]')).toHaveLength(2),
    );
    expect((await localDb.referrals.get(id))?.stage).toBe('ACCEPTED');
    expect(REFERRAL_STAGE_LABELS.ACCEPTED).toBe('Accepted');
  });
});

describe('facility inbox: role, scope and consent', () => {
  it('is not available to a role that does not use the facility inbox', async () => {
    await open('/programme/inbox', 'admin');
    expect(
      await screen.findByRole('heading', { name: /cannot open this page/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('only lists referrals for the simulated facility of the role', async () => {
    await openInbox();
    await inboxRows();
    const inbox = await fetchInbox('facility');
    expect(inbox.items.every((i) => i.referral.facilityId === inbox.facilityId)).toBe(true);
  });

  it('drops a referral from the inbox once consent for its assessment is withdrawn', async () => {
    const key = 'key-fgs-inbox';
    await saveAssessment(makeFgsAssessment(key));
    const id = referralIdFor(key, new Date().getFullYear());
    await saveReferral(makeReferral(key, { id }));
    await syncOutbox({ force: true });
    expect((await fetchInbox('facility')).items.some((i) => i.referral.id === id)).toBe(true);

    await withdrawConsent(key);
    await syncOutbox({ force: true });

    expect((await fetchInbox('facility')).items.some((i) => i.referral.id === id)).toBe(false);
    await openInbox();
    expect((await inboxRows()).length).toBe((await visibleItems()).length);
  });
});
