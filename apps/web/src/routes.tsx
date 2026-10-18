import { Outlet, type RouteObject } from 'react-router-dom';
import { LoadingState } from '@ntd-watch/design-system';
import { PROGRAMME_PAGES } from '@ntd-watch/domain';
import { RootLayout } from './layouts/RootLayout';
import { ChwLayout } from './layouts/ChwLayout';
import { ProgrammeLayout } from './layouts/ProgrammeLayout';
import { RequireArea, RequirePage, RedirectToHome } from './guards/guards';
import { LandingPage } from './pages/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import type * as ChwScreens from './chw/screens';
import { programmePageModules } from './programme/pages';

/*
 * Route-level code splitting: the landing page and layouts load first; the CHW app and each
 * programme page load when their route is opened. The map library loads only on the GIS page.
 */
const chw = (name: keyof typeof ChwScreens) => async () => ({
  Component: (await import('./chw/screens'))[name],
});

const chwChildren: RouteObject[] = [
  { index: true, lazy: chw('DashboardScreen') },
  { path: 'assessments', lazy: chw('HistoryScreen') },
  { path: 'assessments/new', lazy: chw('StartScreen') },
  { path: 'assessments/new/person', lazy: chw('PersonScreen') },
  { path: 'assessments/new/symptoms', lazy: chw('SymptomsScreen') },
  { path: 'assessments/new/context', lazy: chw('ContextScreen') },
  { path: 'assessments/new/wash', lazy: chw('WashScreen') },
  { path: 'assessments/new/summary', lazy: chw('SummaryScreen') },
  { path: 'assessments/:key/result', lazy: chw('ResultScreen') },
  { path: 'assessments/:key/referral', lazy: chw('ReferralNewScreen') },
  { path: 'referrals', lazy: chw('ReferralListScreen') },
  { path: 'referrals/:id', lazy: chw('ReferralStatusScreen') },
  { path: 'follow-ups', lazy: chw('FollowUpListScreen') },
  { path: 'follow-ups/:key', lazy: chw('FollowUpFormScreen') },
  { path: 'profile', lazy: chw('ProfileScreen') },
];

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    hydrateFallbackElement: <LoadingState />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/chw/login', lazy: chw('LoginScreen') },
      {
        element: <RequireArea area="chw" />,
        children: [{ path: '/chw', element: <ChwLayout />, children: chwChildren }],
      },
      {
        element: <RequireArea area="programme" />,
        children: [
          {
            path: '/programme',
            element: <ProgrammeLayout />,
            children: [
              { index: true, element: <RedirectToHome /> },
              ...PROGRAMME_PAGES.map((page) => ({
                path: page,
                element: (
                  <RequirePage page={page}>
                    <Outlet />
                  </RequirePage>
                ),
                children: [
                  {
                    index: true,
                    lazy: async () => ({ Component: await programmePageModules[page]() }),
                  },
                ],
              })),
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
