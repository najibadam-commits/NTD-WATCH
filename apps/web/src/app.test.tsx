import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { DISCLAIMER } from '@ntd-watch/domain';
import './i18n';
import { routes } from './routes';
import { useDemoSession } from './session/demoSession';

beforeEach(() => {
  useDemoSession.getState().signOut();
});

function renderAt(path: string) {
  return render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);
}

describe('landing page', () => {
  it('states that the system does not diagnose, and shows the disclaimer', () => {
    renderAt('/');
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument();
    expect(screen.getByText(/does not diagnose disease/i)).toBeInTheDocument();
  });

  it('shows the demo banner on every route', () => {
    renderAt('/does-not-exist');
    expect(screen.getByText(/Every record is synthetic/i)).toBeInTheDocument();
    expect(screen.getByText(/Not security controls/i)).toBeInTheDocument();
  });
});

describe('navigation and simulated roles', () => {
  it('opens the CHW app through the simulated sign-in screen', async () => {
    renderAt('/');
    await userEvent.click(screen.getByRole('button', { name: /open the chw app/i }));
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getAllByText(/simulated/i).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: /sign in as demo chw/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/enter any 4 digits/i);

    await userEvent.type(screen.getByLabelText(/demo pin/i), '1234');
    await userEvent.click(screen.getByRole('button', { name: /sign in as demo chw/i }));
    expect(screen.getByRole('navigation', { name: /chw navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /\+ new assessment/i })).toBeInTheDocument();
  });

  it('opens the programme dashboard as the State role without Users or Settings', async () => {
    renderAt('/');
    await userEvent.click(screen.getByRole('button', { name: /open as state programme manager/i }));
    const nav = screen.getByRole('navigation', { name: /programme navigation/i });
    expect(nav).toHaveTextContent(/Overview/);
    expect(nav).not.toHaveTextContent(/User management/);
    expect(nav).not.toHaveTextContent(/Settings/);
  });

  it('shows the administrator every programme page, including Users and Settings', async () => {
    renderAt('/');
    await userEvent.click(screen.getByRole('button', { name: /open as super administrator/i }));
    const nav = screen.getByRole('navigation', { name: /programme navigation/i });
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

  it('never gives a programme role access to the community health worker app', () => {
    for (const role of ['facility', 'lga', 'state', 'admin'] as const) {
      useDemoSession.getState().setRole(role);
      const { unmount } = renderAt('/chw/assessments');
      expect(screen.queryByRole('navigation', { name: /chw navigation/i })).not.toBeInTheDocument();
      unmount();
    }
  });

  it('shows access denied for a page opened by direct URL', () => {
    useDemoSession.getState().setRole('state');
    renderAt('/programme/users');
    expect(screen.getByRole('heading', { name: /cannot open this page/i })).toBeInTheDocument();
  });

  it('sends a signed-out visitor from a protected route back to the start', () => {
    renderAt('/chw');
    expect(screen.getByRole('heading', { level: 1, name: 'NTD-WATCH' })).toBeInTheDocument();
  });

  it('keeps a programme role out of the CHW app', () => {
    useDemoSession.getState().setRole('lga');
    renderAt('/chw');
    expect(screen.getByRole('navigation', { name: /programme navigation/i })).toBeInTheDocument();
  });
});
