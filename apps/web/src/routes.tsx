import type { RouteObject } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { ChwLayout } from './layouts/ChwLayout';
import { ProgrammeLayout } from './layouts/ProgrammeLayout';
import { RequireArea, RequirePage, RedirectToHome } from './guards/guards';
import { LandingPage } from './pages/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { CHW_LOGIN, CHW_SCREENS, PROGRAMME_SCREENS } from './nav/navigation';

const chwChildren: RouteObject[] = CHW_SCREENS.map((s) => ({
  path: s.path.replace(/^\/chw\/?/, ''),
  index: s.path === '/chw',
  element: <PlaceholderPage titleKey={s.titleKey} stage={s.stage} spec={s.spec} />,
}));

// The referral status route is a parameter in the real build; the demo id is a fixed example here.
const referralStatus = chwChildren.findIndex((r) => r.path?.startsWith('referrals/NTDW'));
if (referralStatus >= 0)
  chwChildren[referralStatus] = { ...chwChildren[referralStatus], path: 'referrals/:id' };

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      {
        path: CHW_LOGIN.path,
        element: (
          <main id="main-content" tabIndex={-1} style={{ padding: '1rem' }}>
            <PlaceholderPage
              titleKey={CHW_LOGIN.titleKey}
              stage={CHW_LOGIN.stage}
              spec={CHW_LOGIN.spec}
            />
          </main>
        ),
      },
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
              ...PROGRAMME_SCREENS.map((s) => ({
                path: s.page,
                element: (
                  <RequirePage page={s.page}>
                    <PlaceholderPage titleKey={s.titleKey} stage={s.stage} spec={s.spec} />
                  </RequirePage>
                ),
              })),
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
