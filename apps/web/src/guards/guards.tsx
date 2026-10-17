import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import {
  canAccessArea,
  canViewProgrammePage,
  homePathFor,
  type Area,
  type ProgrammePage,
} from '@ntd-watch/domain';
import { useDemoSession } from '../session/demoSession';
import { AccessDeniedPage } from '../pages/AccessDeniedPage';

/**
 * Route guards. They hide screens by simulated role.
 * They are a user-interface convenience, NOT a security control.
 */
export function RequireArea({ area }: { area: Area }) {
  const role = useDemoSession((s) => s.role);
  if (!role) return <Navigate to="/" replace />;
  if (!canAccessArea(role, area)) return <Navigate to={homePathFor(role)} replace />;
  return <Outlet />;
}

export function RequirePage({ page, children }: { page: ProgrammePage; children: ReactNode }) {
  const role = useDemoSession((s) => s.role);
  if (!role) return <Navigate to="/" replace />;
  if (!canViewProgrammePage(role, page)) return <AccessDeniedPage role={role} />;
  return <>{children}</>;
}

export function RedirectToHome() {
  const role = useDemoSession((s) => s.role);
  return <Navigate to={role ? homePathFor(role) : '/'} replace />;
}
