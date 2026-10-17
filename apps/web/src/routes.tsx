import type { RouteObject } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { ChwLayout } from './layouts/ChwLayout';
import { ProgrammeLayout } from './layouts/ProgrammeLayout';
import { RequireArea, RequirePage, RedirectToHome } from './guards/guards';
import { LandingPage } from './pages/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { PROGRAMME_SCREENS } from './nav/navigation';
import { ContextScreen } from './chw/screens/ContextScreen';
import { DashboardScreen } from './chw/screens/DashboardScreen';
import { FollowUpFormScreen } from './chw/screens/FollowUpFormScreen';
import { FollowUpListScreen } from './chw/screens/FollowUpListScreen';
import { HistoryScreen } from './chw/screens/HistoryScreen';
import { LoginScreen } from './chw/screens/LoginScreen';
import { PersonScreen } from './chw/screens/PersonScreen';
import { ProfileScreen } from './chw/screens/ProfileScreen';
import { ReferralListScreen } from './chw/screens/ReferralListScreen';
import { ReferralNewScreen } from './chw/screens/ReferralNewScreen';
import { ReferralStatusScreen } from './chw/screens/ReferralStatusScreen';
import { ResultScreen } from './chw/screens/ResultScreen';
import { StartScreen } from './chw/screens/StartScreen';
import { SummaryScreen } from './chw/screens/SummaryScreen';
import { SymptomsScreen } from './chw/screens/SymptomsScreen';
import { WashScreen } from './chw/screens/WashScreen';

const chwChildren: RouteObject[] = [
  { index: true, element: <DashboardScreen /> },
  { path: 'assessments', element: <HistoryScreen /> },
  { path: 'assessments/new', element: <StartScreen /> },
  { path: 'assessments/new/person', element: <PersonScreen /> },
  { path: 'assessments/new/symptoms', element: <SymptomsScreen /> },
  { path: 'assessments/new/context', element: <ContextScreen /> },
  { path: 'assessments/new/wash', element: <WashScreen /> },
  { path: 'assessments/new/summary', element: <SummaryScreen /> },
  { path: 'assessments/:key/result', element: <ResultScreen /> },
  { path: 'assessments/:key/referral', element: <ReferralNewScreen /> },
  { path: 'referrals', element: <ReferralListScreen /> },
  { path: 'referrals/:id', element: <ReferralStatusScreen /> },
  { path: 'follow-ups', element: <FollowUpListScreen /> },
  { path: 'follow-ups/:key', element: <FollowUpFormScreen /> },
  { path: 'profile', element: <ProfileScreen /> },
];

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/chw/login', element: <LoginScreen /> },
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
