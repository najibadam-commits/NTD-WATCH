import { expect, test, type Page } from '@playwright/test';

/** Stage 7.1: scenario, role-boundary, reset-and-reload and console checks. Synthetic data only. */
const enter = async (page: Page, role: string) => {
  await page.goto('/');
  await page.getByRole('button', { name: new RegExp(`open as ${role}`, 'i') }).click();
};

test('scenarios A, B and C sit in their documented categories and nothing claims an outbreak', async ({
  page,
}) => {
  await enter(page, 'state programme manager');
  await page.goto('/programme/priority');
  const table = page.getByRole('table');
  const row = (name: string) => table.locator('tbody tr').filter({ hasText: name });

  // A: Demo Streamside, South LGA, high on both layers, rising
  await expect(row('Demo Streamside')).toContainText('Demo South LGA');
  await expect(row('Demo Streamside')).toContainText('Priority investigation or intervention');
  await expect(row('Demo Streamside')).toContainText(/rising/i);
  // B: Demo Marketfield, North LGA, high signal, lower vulnerability
  await expect(row('Demo Marketfield')).toContainText('Demo North LGA');
  await expect(row('Demo Marketfield')).toContainText('Investigate an unusual signal');
  // C: Demo Hillview, North LGA, high vulnerability, low signal
  await expect(row('Demo Hillview')).toContainText('Demo North LGA');
  await expect(row('Demo Hillview')).toContainText('Prevention or active surveillance opportunity');

  // incomplete follow-up is visible for A, and the explanation never declares anything
  await page.getByRole('button', { name: /show details for demo streamside/i }).click();
  const why = page.getByRole('region', { name: /why this community is placed here/i });
  await expect(why).toContainText(/rated HIGH or URGENT/);
  await expect(why).toContainText(/Signals are rising/);
  await expect(why).toContainText(/unresolved|waiting for a community follow-up/);
  await expect(page.locator('main')).not.toContainText(
    /outbreak (declared|confirmed|detected)|confirmed case of/i,
  );
  // vulnerability and signal both show as higher for A in the table
  await expect(row('Demo Streamside').getByText('Higher').first()).toBeVisible();
});

test('role boundaries: each simulated role reaches only its own pages', async ({ page }) => {
  const nav = (p: Page) => p.getByRole('navigation', { name: /programme navigation/i });
  // CHW is sent away from programme pages
  await page.goto('/chw/login');
  await page.getByLabel(/demo pin/i).fill('1234');
  await page.getByRole('button', { name: /sign in as demo chw/i }).click();
  await page.goto('/programme/settings');
  await expect(page).toHaveURL(/\/chw/);
  await expect(page.getByRole('heading', { name: /settings/i, level: 1 })).toHaveCount(0);

  // facility: inbox and referral monitoring only
  await page.getByLabel(/demo role/i).selectOption({ label: 'Health Facility Worker' });
  await expect(nav(page).getByRole('link')).toHaveText(['Referral inbox', 'Referral monitoring']);
  await page.goto('/programme/priority');
  await expect(
    page.getByRole('heading', { name: /your demo role cannot open this page/i }),
  ).toBeVisible();

  // state: analytics pages, no users or settings
  await page.getByLabel(/demo role/i).selectOption({ label: 'State Programme Manager' });
  await expect(nav(page).getByRole('link', { name: 'Priority communities' })).toBeVisible();
  await expect(nav(page).getByRole('link', { name: 'GIS map' })).toBeVisible();
  await expect(nav(page).getByRole('link', { name: 'Reports' })).toBeVisible();
  await expect(nav(page).getByRole('link', { name: 'User management' })).toHaveCount(0);
  await expect(nav(page).getByRole('link', { name: 'Settings' })).toHaveCount(0);
  await expect(nav(page).getByRole('link', { name: 'Referral inbox' })).toHaveCount(0);
  await page.goto('/programme/users');
  await expect(
    page.getByRole('heading', { name: /your demo role cannot open this page/i }),
  ).toBeVisible();

  // administrator: everything documented, but not the person-level inbox
  await page.getByLabel(/demo role/i).selectOption({ label: 'Super Administrator' });
  await expect(nav(page).getByRole('link', { name: 'User management' })).toBeVisible();
  await expect(nav(page).getByRole('link', { name: 'Settings' })).toBeVisible();
  await expect(nav(page).getByRole('link', { name: 'Referral inbox' })).toHaveCount(0);
});

test('reset then reload restores the seeded starting state', async ({ page }) => {
  await enter(page, 'health facility worker');
  const kpi = page.getByRole('group', { name: /inbox counts/i });
  await expect(kpi).toBeVisible();
  const start = (await kpi.textContent()) ?? '';

  // change state: accept a generated referral, then close one more stage
  // open a referral that is still Generated (the first row may already be further along)
  await page
    .locator('tr', { hasText: 'Generated' })
    .getByRole('button', { name: /^open referral from/i })
    .first()
    .click();
  await page.getByRole('button', { name: /accept referral/i }).click();
  await expect(kpi).not.toHaveText(start);

  await page.getByRole('button', { name: /reset demo/i }).click();
  await page.getByRole('button', { name: /yes, reset/i }).click();
  await expect(page.getByText('Demo reset.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('group', { name: /inbox counts/i })).toHaveText(start);

  // the programme view agrees after the reload
  await page.getByLabel(/demo role/i).selectOption({ label: 'State Programme Manager' });
  await page.goto('/programme/priority');
  await expect(
    page.getByRole('table').locator('tbody tr').filter({ hasText: 'Demo Streamside' }),
  ).toContainText('Priority investigation or intervention');
});

test('the demo banner states the prototype status without developer UI', async ({ page }) => {
  await page.goto('/');
  const banner = page.getByRole('banner');
  await expect(banner).toContainText('NTD-WATCH DEMO MODE');
  await expect(banner).toContainText(/internal functional prototype/i);
  await expect(banner).toContainText(/synthetic data and illustrative rules/i);
  await expect(banner).toContainText(/not a clinically validated or production system/i);
});

test('no console errors, page errors or failed local requests during the main journey', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console: ${m.text()}`);
  });
  page.on('requestfailed', (r) => {
    // a request cancelled because the test navigated away is not a failure
    if (r.url().startsWith('http://localhost') && !/ERR_ABORTED/.test(r.failure()?.errorText ?? ''))
      problems.push(`failed: ${r.url()}`);
  });

  await page.goto('/');
  await expect(page.getByText('NTD-WATCH DEMO MODE')).toBeVisible();
  await page.goto('/chw/login');
  await page.getByLabel(/demo pin/i).fill('1234');
  await page.getByRole('button', { name: /sign in as demo chw/i }).click();
  await expect(page.getByRole('heading', { name: /hello, demo chw 0142/i })).toBeVisible();
  for (const role of ['Health Facility Worker', 'State Programme Manager', 'Super Administrator']) {
    await page.getByLabel(/demo role/i).selectOption({ label: role });
    await page.waitForTimeout(400);
  }
  for (const path of [
    'overview',
    'gis',
    'signals',
    'vulnerability',
    'priority',
    'referrals',
    'trends',
    'reports',
    'users',
    'settings',
  ]) {
    await page.goto(`/programme/${path}`);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    // let the map library and its worker finish loading before leaving the page
    await page.waitForTimeout(path === 'gis' ? 3000 : 400);
  }
  expect(problems).toEqual([]);
});
