import { expect, test, type Page } from '@playwright/test';

/**
 * The Stage 7 core demo story across all three field roles in one real browser:
 * CHW assessment -> risk signal -> referral -> facility inbox -> outcome -> CHW follow-up ->
 * programme priority view. Everything is synthetic and the role switches are simulated.
 */
const choose = (page: Page, group: RegExp, option: RegExp | string) =>
  page.getByRole('group', { name: group }).locator('label', { hasText: option }).first().click();

const switchRole = async (page: Page, label: string) => {
  await page.getByLabel(/demo role/i).selectOption({ label });
};

test('community to action: CHW, facility and programme see one story', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('NTD-WATCH DEMO MODE')).toBeVisible();

  // A. CHW assessment with a risk signal
  await page.goto('/chw/login');
  await page.getByLabel(/demo pin/i).fill('1234');
  await page.getByRole('button', { name: /sign in as demo chw/i }).click();
  await page.getByRole('link', { name: '+ New assessment' }).click();
  await page.getByRole('button', { name: /start assessment/i }).click();
  await choose(page, /age group/i, '5 to 14 years');
  await choose(page, /^sex/i, 'Female');
  await page.getByRole('button', { name: /continue/i }).click();
  await choose(page, /what has the person reported/i, 'Swelling of an arm or leg');
  await choose(page, /how long/i, '1 to 3 months');
  await choose(page, /getting worse/i, /no, not getting worse/i);
  await page.getByRole('button', { name: /continue/i }).click();
  await choose(page, /open water/i, /^Yes$/);
  await choose(page, /livestock/i, /^No$/);
  await choose(page, /insect or fly bites/i, /^No$/);
  await choose(page, /others in the household/i, /^No$/);
  await page.getByRole('button', { name: /continue/i }).click();
  await choose(page, /drinking water/i, /^Protected source/);
  await choose(page, /^sanitation/i, /latrine or toilet is used/i);
  await choose(page, /wash hands/i, /^Yes$/);
  await choose(page, /standing water/i, /^No$/);
  await page.getByRole('button', { name: /review/i }).click();
  await page.getByRole('button', { name: /save and see demonstration result/i }).click();
  await expect(page.getByText('Limb swelling has lasted one month or longer.')).toBeVisible();
  await expect(page.getByText('Synced', { exact: true }).first()).toBeVisible({ timeout: 15_000 });

  // referral to the facility the facility demo user belongs to
  await page.getByRole('link', { name: /generate referral/i }).click();
  await page.getByRole('radio', { name: /demo north primary health centre/i }).check();
  await page.getByRole('button', { name: /generate referral/i }).click();
  await expect(page.getByText(/^Referral ID NTDW-/)).toBeVisible();
  await expect(page.getByText('Synced', { exact: true }).first()).toBeVisible({ timeout: 15_000 });

  // B. Facility: the new referral is in the inbox and moves through the stages
  await switchRole(page, 'Health Facility Worker');
  await expect(page.getByRole('heading', { name: /facility referral inbox/i })).toBeVisible();
  const row = page
    .locator('tr', { hasText: 'Created in this demo session' })
    .or(page.locator('tr', { hasText: 'Demo Riverside' }).first());
  await expect(row.first()).toBeVisible();
  await page
    .getByRole('button', { name: /open referral from demo riverside/i })
    .first()
    .click();
  await expect(page.getByText('Created in this demo session')).toBeVisible();
  await page.getByRole('button', { name: /accept referral/i }).click();
  await page.getByRole('button', { name: /mark person as arrived/i }).click();
  await expect(page.getByRole('button', { name: /record assessment outcome/i })).toBeDisabled();
  await page.getByLabel(/outcome of the facility assessment/i).selectOption({
    label: 'Follow-up in the community needed',
  });
  await page.getByRole('button', { name: /record assessment outcome/i }).click();
  await expect(page.getByText('Assessed', { exact: true }).first()).toBeVisible();

  // A again: the CHW sees the facility outcome and records the follow-up
  await switchRole(page, 'Community Health Worker');
  await page.goto('/chw/referrals');
  await page
    .getByRole('link', { name: /view|status|ntdw/i })
    .first()
    .click();
  await page.getByRole('button', { name: /refresh status/i }).click();
  await expect(page.getByText(/follow-up in the community needed/i)).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole('link', { name: /record a follow-up/i }).click();
  await choose(page, /was the person reached/i, /^Yes$/);
  await choose(page, /attend the health facility/i, /^Yes$/);
  await choose(page, /how is the person now/i, 'About the same');
  await choose(page, /further referral/i, /^No$/);
  await page.getByRole('button', { name: /save follow-up/i }).click();
  await expect(page.getByText(/follow-up saved on this device/i)).toBeVisible();

  // C. Programme: the same story appears in the priority view
  await switchRole(page, 'State Programme Manager');
  await page.goto('/programme/priority');
  await expect(
    page.getByRole('heading', { name: /priority communities/i, level: 1 }),
  ).toBeVisible();
  const riverside = page.locator('tr', { hasText: 'Demo Riverside' });
  await expect(riverside).toBeVisible();
  await expect(riverside).toContainText('Priority investigation or intervention');
});

test('priority communities: matrix, filters and drill-down work together', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /open as state programme manager/i }).click();
  await page.goto('/programme/priority');
  await expect(
    page.getByRole('heading', { name: /priority communities/i, level: 1 }),
  ).toBeVisible();

  // scenario A, B and C each appear in their own matrix cell
  const cell = (name: RegExp) => page.getByRole('button', { name, pressed: false });
  await expect(page.getByRole('group', { name: /signal and vulnerability matrix/i })).toContainText(
    'Demo Streamside',
  );

  // choosing a cell filters the table
  await cell(/^Investigate an unusual signal/).click();
  const table = page.getByRole('table');
  await expect(table.locator('tbody tr').filter({ hasText: 'Demo Marketfield' })).toHaveCount(1);
  await expect(table.locator('tbody tr').filter({ hasText: 'Demo Streamside' })).toHaveCount(0);
  await page.getByRole('button', { name: /^Investigate an unusual signal/ }).click(); // clear

  await cell(/^Prevention or active surveillance/).click();
  await expect(table.locator('tbody tr').filter({ hasText: 'Demo Hillview' })).toHaveCount(1);
  await page.getByRole('button', { name: /^Prevention or active surveillance/ }).click();

  // trend filter and drill-down
  await page.getByRole('combobox', { name: /trend/i }).selectOption('rising');
  await expect(page.getByRole('status').filter({ hasText: /Showing \d+ of \d+/ })).toBeVisible();
  await page.getByRole('button', { name: /show details for demo streamside/i }).click();
  await expect(
    page.getByRole('heading', { name: /why this community is placed here/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: /community summary|community/i }).first(),
  ).toBeVisible();
});

test('reset demo returns every role to the starting data', async ({ page }) => {
  await page.goto('/chw/login');
  await page.getByLabel(/demo pin/i).fill('1234');
  await page.getByRole('button', { name: /sign in as demo chw/i }).click();
  await expect(page.getByRole('heading', { name: /hello, demo chw 0142/i })).toBeVisible();

  // facility inbox before any live record
  await page.getByLabel(/demo role/i).selectOption({ label: 'Health Facility Worker' });
  await expect(page.getByRole('heading', { name: /facility referral inbox/i })).toBeVisible();
  const kpi = page.getByRole('group', { name: /inbox counts/i });
  const before = (await kpi.textContent()) ?? '';

  // change state: accept the first generated referral
  await page
    .getByRole('button', { name: /^open referral from/i })
    .first()
    .click();
  const accept = page.getByRole('button', { name: /accept referral/i });
  if (await accept.isVisible()) {
    await accept.click();
    await expect(kpi).not.toHaveText(before);
  }

  // reset from the banner, with confirmation
  await page.getByRole('button', { name: /reset demo/i }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button', { name: /yes, reset/i }).click();
  await expect(page.getByText('Demo reset.')).toBeVisible();
  await expect(page.getByRole('heading', { name: /facility referral inbox/i })).toBeVisible();
  await expect(kpi).toHaveText(before, { timeout: 15_000 });
});

test('each role lands on a page that suits it and sees the demo-mode label', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('NTD-WATCH DEMO MODE')).toBeVisible();
  const cases: [RegExp, RegExp][] = [
    [/open as health facility worker/i, /facility referral inbox/i],
    [/open as lga programme officer/i, /overview/i],
    [/open as state programme manager/i, /overview/i],
    [/open as super administrator/i, /overview/i],
  ];
  for (const [button, heading] of cases) {
    await page.goto('/');
    await page.getByRole('button', { name: button }).click();
    await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
    await expect(page.getByText('NTD-WATCH DEMO MODE')).toBeVisible();
  }
});
