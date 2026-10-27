/** Programme pages, loaded one route at a time. */
export const programmePageModules = {
  inbox: async () => (await import('./InboxPage')).InboxPage,
  overview: async () => (await import('./OverviewPage')).OverviewPage,
  gis: async () => (await import('./GisPage')).GisPage,
  signals: async () => (await import('./SignalsPage')).SignalsPage,
  vulnerability: async () => (await import('./VulnerabilityPage')).VulnerabilityPage,
  priority: async () => (await import('./PriorityPage')).PriorityPage,
  referrals: async () => (await import('./ReferralsPage')).ReferralsPage,
  trends: async () => (await import('./TrendsPage')).TrendsPage,
  reports: async () => (await import('./ReportsPage')).ReportsPage,
  users: async () => (await import('./UsersPage')).UsersPage,
  settings: async () => (await import('./SettingsPage')).SettingsPage,
} as const;
