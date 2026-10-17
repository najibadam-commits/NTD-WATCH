import { render, screen } from '@testing-library/react';
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
  it('opens the CHW app from the landing page', async () => {
    renderAt('/');
    await userEvent.click(screen.getByRole('button', { name: /open the chw app/i }));
    expect(screen.getByRole('navigation', { name: /chw navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /new assessment/i })).toBeInTheDocument();
  });

  it('opens the programme dashboard as the State role without Users or Settings', async () => {
    renderAt('/');
    await userEvent.click(screen.getByRole('button', { name: /open as state programme manager/i }));
    const nav = screen.getByRole('navigation', { name: /programme navigation/i });
    expect(nav).toHaveTextContent(/Overview/);
    expect(nav).not.toHaveTextContent(/User management/);
    expect(nav).not.toHaveTextContent(/Settings/);
  });

  it('shows Users and Settings to the administrator', async () => {
    renderAt('/');
    await userEvent.click(screen.getByRole('button', { name: /open as super administrator/i }));
    const nav = screen.getByRole('navigation', { name: /programme navigation/i });
    expect(nav).toHaveTextContent(/User management/);
    expect(nav).toHaveTextContent(/Settings/);
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
