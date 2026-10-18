import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DISCLAIMER } from '@ntd-watch/domain';
import './i18n';
import { routes } from './routes';
import { mockServer } from './mock/node';
import { useDemoSession } from './session/demoSession';
import { resetAll } from './testing/resetAll';

beforeAll(() => mockServer.listen({ onUnhandledFrame: 'error' }));
afterAll(() => mockServer.close());
afterEach(() => mockServer.resetHandlers());
let client: QueryClient | null = null;
// Let any request the page started finish before the databases are reset under it.
afterEach(async () => {
  // A request abandoned by a closing page still reaches the mock server, so wait for the page
  // to finish loading its data before the databases are reset under it.
  await waitFor(() => expect(screen.queryByText(/^loading/i)).not.toBeInTheDocument());
  if (client) await waitFor(() => expect(client!.isFetching()).toBe(0));
  client = null;
});
beforeEach(async () => {
  await resetAll();
  useDemoSession.getState().signOut();
});

/** Routes load lazily, so wait until the first route is ready before drawing it. */
async function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  await waitFor(() => expect(router.state.initialized).toBe(true));
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client = queryClient;
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('landing page', () => {
  it('states that the system does not diagnose, and shows the disclaimer', async () => {
    await renderAt('/');
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument();
    expect(screen.getByText(/does not diagnose disease/i)).toBeInTheDocument();
  });

  it('shows the demo banner on every route', async () => {
    await renderAt('/does-not-exist');
    expect(screen.getByText(/Every record is synthetic/i)).toBeInTheDocument();
    expect(screen.getByText(/Not security controls/i)).toBeInTheDocument();
  });
});

describe('navigation and simulated roles', () => {
  it('opens the CHW app through the simulated sign-in screen', async () => {
    await renderAt('/');
    await userEvent.click(screen.getByRole('button', { name: /open the chw app/i }));
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getAllByText(/simulated/i).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: /sign in as demo chw/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/enter any 4 digits/i);

    await userEvent.type(screen.getByLabelText(/demo pin/i), '1234');
    await userEvent.click(screen.getByRole('button', { name: /sign in as demo chw/i }));
    expect(await screen.findByRole('navigation', { name: /chw navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /\+ new assessment/i })).toBeInTheDocument();
  });

  it('opens the programme dashboard as the State role without Users or Settings', async () => {
    await renderAt('/');
    await userEvent.click(screen.getByRole('button', { name: /open as state programme manager/i }));
    const nav = await screen.findByRole('navigation', { name: /programme navigation/i });
    expect(nav).toHaveTextContent(/Overview/);
    expect(nav).not.toHaveTextContent(/User management/);
    expect(nav).not.toHaveTextContent(/Settings/);
  });

  it('shows the administrator every programme page, including Users and Settings', async () => {
    await renderAt('/');
    await userEvent.click(screen.getByRole('button', { name: /open as super administrator/i }));
    const nav = await screen.findByRole('navigation', { name: /programme navigation/i });
    for (const name of [
      'Overview',
      'GIS map',
      'Risk signals',
      'Community vulnerability',
      'Referral monitoring',
      'Trends',
      'Reports',
      'User management',
      'Settings',
    ]) {
      expect(within(nav).getByRole('link', { name })).toBeInTheDocument();
    }
  });

  it('never gives a programme role access to the community health worker app', async () => {
    for (const role of ['facility', 'lga', 'state', 'admin'] as const) {
      useDemoSession.getState().setRole(role);
      const { unmount } = await renderAt('/chw/assessments');
      expect(screen.queryByRole('navigation', { name: /chw navigation/i })).not.toBeInTheDocument();
      unmount();
    }
  });

  it('shows access denied for a page opened by direct URL', async () => {
    useDemoSession.getState().setRole('state');
    await renderAt('/programme/users');
    expect(
      await screen.findByRole('heading', { name: /cannot open this page/i }),
    ).toBeInTheDocument();
  });

  it('sends a signed-out visitor from a protected route back to the start', async () => {
    await renderAt('/chw');
    expect(await screen.findByRole('heading', { level: 1, name: 'NTD-WATCH' })).toBeInTheDocument();
  });

  it('keeps a programme role out of the CHW app', async () => {
    useDemoSession.getState().setRole('lga');
    await renderAt('/chw');
    expect(
      await screen.findByRole('navigation', { name: /programme navigation/i }),
    ).toBeInTheDocument();
  });
});
