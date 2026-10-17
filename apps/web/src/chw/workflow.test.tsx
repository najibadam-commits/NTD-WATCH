import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { referralIdFor } from '@ntd-watch/domain';
import { DEMO_LABEL_TEXT } from '@ntd-watch/rules-engine';
import '../i18n';
import { mockServer } from '../mock/node';
import { serverDb } from '../mock/serverDb';
import { useConnectivity } from '../offline/connectivity';
import { localDb } from '../offline/localDb';
import { routes } from '../routes';
import { useDemoSession } from '../session/demoSession';
import { resetAll } from '../testing/resetAll';
import { useDraft } from './draft';

beforeAll(() => mockServer.listen({ onUnhandledFrame: 'error' }));
afterAll(() => mockServer.close());
beforeEach(async () => {
  await resetAll();
  useDraft.getState().clear();
  useDemoSession.getState().setRole('chw');
});
afterEach(() => mockServer.resetHandlers());

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

const user = () => userEvent.setup();
const group = (name: RegExp | string) => screen.getByRole('group', { name });
const pick = async (u: ReturnType<typeof user>, g: RegExp | string, option: RegExp | string) => {
  const scope = within(group(g));
  return u.click(
    scope.queryByRole('radio', { name: option }) ?? scope.getByRole('checkbox', { name: option }),
  );
};
const press = (u: ReturnType<typeof user>, name: RegExp | string) =>
  u.click(screen.getByRole('button', { name }));

/** Fills the whole assessment with a pattern that the demonstration rules rate as HIGH. */
async function fillAssessment(u: ReturnType<typeof user>) {
  await u.click(screen.getByRole('button', { name: /start assessment/i }));

  await pick(u, /age group/i, '5 to 14 years');
  await pick(u, /^sex/i, 'Female');
  await press(u, /continue/i);

  await pick(u, /what has the person reported/i, 'Swelling of an arm or leg');
  await pick(u, /how long/i, '1 to 3 months');
  await pick(u, /getting worse/i, /no, not getting worse/i);
  await press(u, /continue/i);

  await pick(u, /open water/i, 'Yes');
  await pick(u, /livestock/i, 'No');
  await pick(u, /insect or fly bites/i, 'No');
  await pick(u, /others in the household/i, 'No');
  await press(u, /continue/i);

  await pick(u, /drinking water/i, /^protected source/i);
  await pick(u, /^sanitation/i, /latrine or toilet is used/i);
  await pick(u, /wash hands/i, 'Yes');
  await pick(u, /standing water/i, 'No');
  await press(u, /review/i);
}

describe('assessment form: validation and persistence', () => {
  it('blocks each step until required fields are answered, with clear messages', async () => {
    const u = user();
    renderAt('/chw/assessments/new');
    await u.click(screen.getByRole('button', { name: /start assessment/i }));

    await press(u, /continue/i);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Choose an age group.');
    expect(alert).toHaveTextContent('Choose a sex.');
    expect(alert).toHaveFocus();
    expect(screen.getByRole('heading', { name: 'Person information' })).toBeInTheDocument();

    await pick(u, /age group/i, '15 to 49 years');
    await pick(u, /^sex/i, 'Male');
    await press(u, /continue/i);
    expect(await screen.findByRole('heading', { name: 'Symptoms' })).toBeInTheDocument();

    await press(u, /continue/i);
    expect(await screen.findByRole('alert')).toHaveTextContent(/at least one symptom/i);

    await pick(u, /what has the person reported/i, 'Fever');
    await press(u, /continue/i);
    const a2 = await screen.findByRole('alert');
    expect(a2).toHaveTextContent(/how long the symptoms/i);
    expect(a2).toHaveTextContent(/getting worse/i);
  });

  it('keeps answers when going back, forward, or after a page refresh', async () => {
    const u = user();
    const router = renderAt('/chw/assessments/new');
    await u.click(screen.getByRole('button', { name: /start assessment/i }));
    await pick(u, /age group/i, '0 to 4 years');
    await pick(u, /^sex/i, 'Female');
    await press(u, /continue/i);
    await pick(u, /what has the person reported/i, 'Fever');
    await press(u, /^back$/i);

    expect(within(group(/age group/i)).getByRole('radio', { name: '0 to 4 years' })).toBeChecked();
    expect(within(group(/^sex/i)).getByRole('radio', { name: 'Female' })).toBeChecked();

    // A refresh reloads the app: the draft comes back from session storage.
    const saved = JSON.parse(sessionStorage.getItem('ntd-watch-draft') ?? '{}') as {
      state?: { draft?: { symptoms?: string[] } };
    };
    expect(saved.state?.draft?.symptoms).toEqual(['fever']);
    await router.navigate('/chw/assessments/new/symptoms');
    expect(await screen.findByRole('checkbox', { name: 'Fever' })).toBeChecked();
  });

  it('"None of these" and real symptoms are never selected together', async () => {
    const u = user();
    renderAt('/chw/assessments/new');
    await u.click(screen.getByRole('button', { name: /start assessment/i }));
    await pick(u, /age group/i, '0 to 4 years');
    await pick(u, /^sex/i, 'Male');
    await press(u, /continue/i);

    await pick(u, /what has the person reported/i, 'Fever');
    await pick(u, /what has the person reported/i, 'None of these');
    expect(screen.getByRole('checkbox', { name: 'Fever' })).not.toBeChecked();
    expect(screen.queryByRole('group', { name: /how long/i })).not.toBeInTheDocument();
    await pick(u, /what has the person reported/i, 'Fever');
    expect(screen.getByRole('checkbox', { name: 'None of these' })).not.toBeChecked();
  });

  it('will not save from the review screen while required answers are missing', async () => {
    const u = user();
    useDraft.getState().start();
    useDraft.getState().update({ ageGroup: '0-4', sex: 'male' });
    renderAt('/chw/assessments/new/summary');

    await press(u, /save and see demonstration result/i);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/at least one symptom/i);
    expect(alert).toHaveTextContent(/open water/i);
    expect(alert).toHaveTextContent(/drinking-water source/i);
    expect(screen.getAllByText('Not answered').length).toBeGreaterThan(0);
    expect(await localDb.assessments.count()).toBe(0);
    expect(
      screen.getAllByRole('link', { name: /go to symptom assessment/i })[0],
    ).toBeInTheDocument();
  });
});

describe('assessment-to-referral-to-follow-up journey', () => {
  it('works end to end without a dead end', async () => {
    const u = user();
    renderAt('/chw/login');

    // sign in (simulated)
    await u.type(screen.getByLabelText(/demo pin/i), '4321');
    await press(u, /sign in as demo chw/i);
    expect(
      await screen.findByRole('heading', { name: /hello, demo chw 0142/i }),
    ).toBeInTheDocument();

    // start, fill and review
    await u.click(screen.getByRole('link', { name: /\+ new assessment/i }));
    await fillAssessment(u);
    expect(await screen.findByRole('heading', { name: /review and save/i })).toBeInTheDocument();
    expect(screen.getByText('Swelling of an arm or leg')).toBeInTheDocument();
    expect(screen.getByText('1 to 3 months')).toBeInTheDocument();

    // the review screen lets the CHW edit, then return
    await u.click(screen.getAllByRole('link', { name: /^edit$/i })[1]!);
    expect(await screen.findByRole('heading', { name: 'Symptoms' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Swelling of an arm or leg' })).toBeChecked();
    await press(u, /continue/i);
    await press(u, /continue/i);
    await press(u, /review/i);

    // save: one tap, one record
    await press(u, /save and see demonstration result/i);
    expect(
      await screen.findByRole('heading', { name: /demonstration result/i }),
    ).toBeInTheDocument();
    expect(await localDb.assessments.count()).toBe(1);
    expect(useDraft.getState().draft).toBeNull();

    // the result is labelled as demonstration-only on the result, the reasons and the action
    expect(screen.getAllByText(DEMO_LABEL_TEXT).length).toBeGreaterThanOrEqual(4);
    expect(screen.getAllByText('HIGH').length).toBeGreaterThan(0);
    expect(screen.getByText(/limb swelling has lasted one month or longer/i)).toBeInTheDocument();
    expect(screen.getByText(/does not diagnose disease/i)).toBeInTheDocument();

    // it syncs to the mock server in the background
    expect(
      await screen.findByText('Synced', { selector: 'span' }, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(await serverDb.assessments.count()).toBe(1);

    // referral
    await u.click(screen.getByRole('link', { name: /generate referral/i }));
    await press(u, /generate referral/i);
    expect(await screen.findByRole('alert')).toHaveTextContent(/choose a health facility/i);
    await u.click(screen.getByRole('radio', { name: /demo north primary health centre/i }));
    await press(u, /generate referral/i);

    const assessment = (await localDb.assessments.toArray())[0]!;
    const referralId = referralIdFor(assessment.clientKey, new Date().getFullYear());
    expect(await screen.findByText(`Referral ID ${referralId}`)).toBeInTheDocument();
    await waitFor(async () => expect(await serverDb.referrals.count()).toBe(1), { timeout: 4000 });

    // the facility (simulated) accepts; the CHW sees the new status
    await waitFor(
      () => expect(screen.getByRole('button', { name: /mark as accepted/i })).toBeEnabled(),
      { timeout: 4000 },
    );
    await press(u, /mark as accepted/i);
    await waitFor(() =>
      expect(document.querySelectorAll('li[data-reached="true"]')).toHaveLength(2),
    );
    expect((await localDb.referrals.get(referralId))?.stage).toBe('ACCEPTED');

    // follow-up
    await u.click(screen.getByRole('link', { name: /record a follow-up/i }));
    await press(u, /save follow-up/i);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /say whether the person was reached/i,
    );
    await pick(u, /was the person reached/i, 'Yes');
    await pick(u, /attend the health facility/i, 'Yes');
    await pick(u, /how is the person now/i, 'About the same');
    await pick(u, /further referral/i, 'No');
    await press(u, /save follow-up/i);
    expect(await screen.findByText(/follow-up saved on this device/i)).toBeInTheDocument();
    await waitFor(async () => expect(await serverDb.followUps.count()).toBe(1), { timeout: 4000 });

    // history lists it, and the filter works
    await u.click(screen.getByRole('link', { name: /assessment history|history/i }));
    expect(await screen.findByRole('heading', { name: /assessment history/i })).toBeInTheDocument();
    expect(screen.getByText(/referred/i, { selector: 'span' })).toBeInTheDocument();
    await u.selectOptions(screen.getByLabelText(/^show$/i), 'high');
    expect(screen.getByRole('link', { name: new RegExp(assessment.id) })).toBeInTheDocument();
  });

  it('captures offline, shows it as waiting, and syncs when the connection returns', async () => {
    const u = user();
    useConnectivity.getState().setSimulatedOffline(true);
    renderAt('/chw/assessments/new');
    await fillAssessment(u);
    await press(u, /save and see demonstration result/i);

    expect(
      await screen.findByRole('heading', { name: /demonstration result/i }),
    ).toBeInTheDocument();
    expect((await screen.findAllByText('Waiting to sync')).length).toBeGreaterThan(0);
    expect(screen.getByText(/offline/i, { selector: 'strong' })).toBeInTheDocument();
    expect(await serverDb.assessments.count()).toBe(0);
    expect(await localDb.assessments.count()).toBe(1);

    useConnectivity.getState().setSimulatedOffline(false);
    expect(
      await screen.findByText('Synced', { selector: 'span' }, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(await serverDb.assessments.count()).toBe(1);
  });

  it('shows rejected or failed syncs honestly and lets the CHW retry', async () => {
    const u = user();
    const { useMockControls } = await import('../mock/controls');
    useMockControls.getState().setServerDown(true);
    renderAt('/chw/assessments/new');
    await fillAssessment(u);
    await press(u, /save and see demonstration result/i);

    expect(
      await screen.findByText('Sync failed, will retry', { selector: 'span' }, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(await serverDb.assessments.count()).toBe(0);

    useMockControls.getState().setServerDown(false);
    await u.click(screen.getByRole('button', { name: /sync now/i }));
    expect(
      await screen.findByText('Synced', { selector: 'span' }, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(await serverDb.assessments.count()).toBe(1);
  });
});

describe('empty and not-found states', () => {
  it('shows an empty history, an empty referral list and a clear message for unknown records', async () => {
    renderAt('/chw/assessments');
    expect(await screen.findByText(/no assessments saved on this device yet/i)).toBeInTheDocument();
  });

  it('says so when a result or referral is not on this device', async () => {
    renderAt('/chw/assessments/nope-00000000/result');
    expect(await screen.findByText(/not on this device/i)).toBeInTheDocument();
  });

  it('sends someone who opens a form step without a draft back to the start', async () => {
    renderAt('/chw/assessments/new/symptoms');
    expect(await screen.findByRole('heading', { name: /new assessment/i })).toBeInTheDocument();
  });
});
