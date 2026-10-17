import type { ProgrammePage } from '@ntd-watch/domain';

export type BuildStage = 'Stage 2' | 'Stage 3' | 'Stage 4';

export interface ScreenDef {
  id: string;
  path: string;
  titleKey: string;
  stage: BuildStage;
  /** Reference into the product specification. */
  spec: string;
}

export const CHW_LOGIN: ScreenDef = {
  id: 'login',
  path: '/chw/login',
  titleKey: 'chw.screens.login',
  stage: 'Stage 2',
  spec: 'Screen 01, section 6',
};

/** Stable demonstration identifier used for the referral status route. */
export const DEMO_REFERRAL_ID = 'NTDW-2026-000185';

export const CHW_SCREENS: ScreenDef[] = [
  {
    id: 'dashboard',
    path: '/chw',
    titleKey: 'chw.screens.dashboard',
    stage: 'Stage 2',
    spec: 'Screen 02, section 7',
  },
  {
    id: 'new',
    path: '/chw/assessments/new',
    titleKey: 'chw.screens.newAssessment',
    stage: 'Stage 2',
    spec: 'Screen 03, section 8',
  },
  {
    id: 'person',
    path: '/chw/assessments/new/person',
    titleKey: 'chw.screens.person',
    stage: 'Stage 2',
    spec: 'Screen 04, section 9',
  },
  {
    id: 'symptoms',
    path: '/chw/assessments/new/symptoms',
    titleKey: 'chw.screens.symptoms',
    stage: 'Stage 2',
    spec: 'Screen 05, section 10',
  },
  {
    id: 'context',
    path: '/chw/assessments/new/context',
    titleKey: 'chw.screens.context',
    stage: 'Stage 2',
    spec: 'Screen 06, section 11',
  },
  {
    id: 'wash',
    path: '/chw/assessments/new/wash',
    titleKey: 'chw.screens.wash',
    stage: 'Stage 2',
    spec: 'Screen 07, section 12',
  },
  {
    id: 'summary',
    path: '/chw/assessments/new/summary',
    titleKey: 'chw.screens.summary',
    stage: 'Stage 2',
    spec: 'Screen 08, section 13',
  },
  {
    id: 'result',
    path: '/chw/assessments/new/result',
    titleKey: 'chw.screens.result',
    stage: 'Stage 2',
    spec: 'Screen 09, section 14',
  },
  {
    id: 'referral',
    path: '/chw/referrals/new',
    titleKey: 'chw.screens.referral',
    stage: 'Stage 2',
    spec: 'Screen 10, section 16',
  },
  {
    id: 'referralList',
    path: '/chw/referrals',
    titleKey: 'chw.screens.referralList',
    stage: 'Stage 2',
    spec: 'Section 17',
  },
  {
    id: 'referralStatus',
    path: `/chw/referrals/${DEMO_REFERRAL_ID}`,
    titleKey: 'chw.screens.referralStatus',
    stage: 'Stage 2',
    spec: 'Section 17',
  },
  {
    id: 'followUp',
    path: '/chw/follow-ups',
    titleKey: 'chw.screens.followUp',
    stage: 'Stage 2',
    spec: 'Screen 11, section 18',
  },
  {
    id: 'history',
    path: '/chw/assessments',
    titleKey: 'chw.screens.history',
    stage: 'Stage 2',
    spec: 'Screen 12, section 19',
  },
  {
    id: 'profile',
    path: '/chw/profile',
    titleKey: 'chw.screens.profile',
    stage: 'Stage 2',
    spec: 'Section 30',
  },
];

export const CHW_BOTTOM_NAV = [
  { path: '/chw', labelKey: 'chw.nav.dashboard', end: true },
  { path: '/chw/assessments', labelKey: 'chw.nav.assessments', end: true },
  { path: '/chw/referrals', labelKey: 'chw.nav.referrals', end: false },
  { path: '/chw/follow-ups', labelKey: 'chw.nav.followUps', end: true },
  { path: '/chw/profile', labelKey: 'chw.nav.profile', end: true },
] as const;

export interface ProgrammeScreenDef {
  page: ProgrammePage;
  titleKey: string;
  stage: BuildStage;
  spec: string;
}

export const PROGRAMME_SCREENS: ProgrammeScreenDef[] = [
  {
    page: 'overview',
    titleKey: 'programme.nav.overview',
    stage: 'Stage 3',
    spec: 'Screen 13, section 21',
  },
  {
    page: 'gis',
    titleKey: 'programme.nav.gis',
    stage: 'Stage 3',
    spec: 'Screen 14, sections 22, 23 and 36',
  },
  {
    page: 'signals',
    titleKey: 'programme.nav.signals',
    stage: 'Stage 3',
    spec: 'Screen 16, section 25',
  },
  {
    page: 'vulnerability',
    titleKey: 'programme.nav.vulnerability',
    stage: 'Stage 3',
    spec: 'Screen 15, section 24',
  },
  {
    page: 'referrals',
    titleKey: 'programme.nav.referrals',
    stage: 'Stage 3',
    spec: 'Screen 17, section 26',
  },
  {
    page: 'trends',
    titleKey: 'programme.nav.trends',
    stage: 'Stage 3',
    spec: 'Screen 18, section 27',
  },
  {
    page: 'reports',
    titleKey: 'programme.nav.reports',
    stage: 'Stage 3',
    spec: 'Screen 19, section 28',
  },
  {
    page: 'users',
    titleKey: 'programme.nav.users',
    stage: 'Stage 3',
    spec: 'Screen 20, section 29',
  },
  {
    page: 'settings',
    titleKey: 'programme.nav.settings',
    stage: 'Stage 3',
    spec: 'Sections 30 and 38',
  },
];
