import type { ProgrammePage } from '@ntd-watch/domain';

export type BuildStage = 'Built' | 'Stage 4';

export interface ScreenDef {
  id: string;
  /** Route pattern. `:key` is an assessment client key, `:id` a referral id. */
  path: string;
  titleKey: string;
  stage: BuildStage;
  /** Reference into the product specification. */
  spec: string;
}

/** The 13 CHW screens of the first milestone, plus the referral list and profile used by the bottom navigation. */
export const CHW_SCREENS: ScreenDef[] = [
  {
    id: 'login',
    path: '/chw/login',
    titleKey: 'chw.screens.login',
    stage: 'Built',
    spec: 'Screen 01, section 6',
  },
  {
    id: 'dashboard',
    path: '/chw',
    titleKey: 'chw.screens.dashboard',
    stage: 'Built',
    spec: 'Screen 02, section 7',
  },
  {
    id: 'new',
    path: '/chw/assessments/new',
    titleKey: 'chw.screens.newAssessment',
    stage: 'Built',
    spec: 'Screen 03, section 8',
  },
  {
    id: 'person',
    path: '/chw/assessments/new/person',
    titleKey: 'chw.screens.person',
    stage: 'Built',
    spec: 'Screen 04, section 9',
  },
  {
    id: 'symptoms',
    path: '/chw/assessments/new/symptoms',
    titleKey: 'chw.screens.symptoms',
    stage: 'Built',
    spec: 'Screen 05, section 10',
  },
  {
    id: 'context',
    path: '/chw/assessments/new/context',
    titleKey: 'chw.screens.context',
    stage: 'Built',
    spec: 'Screen 06, section 11',
  },
  {
    id: 'wash',
    path: '/chw/assessments/new/wash',
    titleKey: 'chw.screens.wash',
    stage: 'Built',
    spec: 'Screen 07, section 12',
  },
  {
    id: 'summary',
    path: '/chw/assessments/new/summary',
    titleKey: 'chw.screens.summary',
    stage: 'Built',
    spec: 'Screen 08, section 13',
  },
  {
    id: 'result',
    path: '/chw/assessments/:key/result',
    titleKey: 'chw.screens.result',
    stage: 'Built',
    spec: 'Screen 09, section 14',
  },
  {
    id: 'referral',
    path: '/chw/assessments/:key/referral',
    titleKey: 'chw.screens.referral',
    stage: 'Built',
    spec: 'Screen 10, section 16',
  },
  {
    id: 'referralStatus',
    path: '/chw/referrals/:id',
    titleKey: 'chw.screens.referralStatus',
    stage: 'Built',
    spec: 'Section 17',
  },
  {
    id: 'followUp',
    path: '/chw/follow-ups/:key',
    titleKey: 'chw.screens.followUp',
    stage: 'Built',
    spec: 'Screen 11, section 18',
  },
  {
    id: 'history',
    path: '/chw/assessments',
    titleKey: 'chw.screens.history',
    stage: 'Built',
    spec: 'Screen 12, section 19',
  },
  {
    id: 'referralList',
    path: '/chw/referrals',
    titleKey: 'chw.screens.referralList',
    stage: 'Built',
    spec: 'Section 17',
  },
  {
    id: 'followUpList',
    path: '/chw/follow-ups',
    titleKey: 'chw.screens.followUpList',
    stage: 'Built',
    spec: 'Screen 11, section 18',
  },
  {
    id: 'profile',
    path: '/chw/profile',
    titleKey: 'chw.screens.profile',
    stage: 'Built',
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
    page: 'inbox',
    titleKey: 'programme.nav.inbox',
    stage: 'Built',
    spec: 'Stage 7, facility experience',
  },
  {
    page: 'overview',
    titleKey: 'programme.nav.overview',
    stage: 'Built',
    spec: 'Screen 13, section 21',
  },
  {
    page: 'gis',
    titleKey: 'programme.nav.gis',
    stage: 'Built',
    spec: 'Screen 14, sections 22, 23 and 36',
  },
  {
    page: 'signals',
    titleKey: 'programme.nav.signals',
    stage: 'Built',
    spec: 'Screen 16, section 25',
  },
  {
    page: 'vulnerability',
    titleKey: 'programme.nav.vulnerability',
    stage: 'Built',
    spec: 'Screen 15, section 24',
  },
  {
    page: 'priority',
    titleKey: 'programme.nav.priority',
    stage: 'Built',
    spec: 'Stage 7, priority communities',
  },
  {
    page: 'referrals',
    titleKey: 'programme.nav.referrals',
    stage: 'Built',
    spec: 'Screen 17, section 26',
  },
  {
    page: 'trends',
    titleKey: 'programme.nav.trends',
    stage: 'Built',
    spec: 'Screen 18, section 27',
  },
  {
    page: 'reports',
    titleKey: 'programme.nav.reports',
    stage: 'Built',
    spec: 'Screen 19, section 28',
  },
  {
    page: 'users',
    titleKey: 'programme.nav.users',
    stage: 'Built',
    spec: 'Screen 20, section 29',
  },
  {
    page: 'settings',
    titleKey: 'programme.nav.settings',
    stage: 'Built',
    spec: 'Sections 30 and 38',
  },
];
