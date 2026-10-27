import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Automated checks catch only some accessibility problems (roughly a third). Passing them does
 * not mean the app is accessible; manual testing with assistive technology is still needed.
 */
async function scan(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const summary = results.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`,
  );
  expect(summary, `${label}: ${summary.join('\n')}`).toEqual([]);
}

const choose = (page: Page, group: RegExp, option: RegExp | string) =>
  page.getByRole('group', { name: group }).locator('label', { hasText: option }).first().click();

test('landing page and sign-in have no detectable violations', async ({ page }) => {
  await page.goto('/');
  await scan(page, 'landing');
  await page.goto('/chw/login');
  await scan(page, 'login');
});

test('CHW screens have no detectable violations', async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto('/chw/login');
  await page.getByLabel(/demo pin/i).fill('1234');
  await page.getByRole('button', { name: /sign in as demo chw/i }).click();
  await scan(page, 'dashboard');

  await page.getByRole('link', { name: '+ New assessment' }).click();
  await scan(page, 'start');
  await page.getByRole('button', { name: /start assessment/i }).click();
  await page.getByRole('button', { name: /continue/i }).click(); // show the error state
  await scan(page, 'person with errors');
  await choose(page, /age group/i, '5 to 14 years');
  await choose(page, /^sex/i, 'Female');
  await page.getByRole('button', { name: /continue/i }).click();
  await choose(page, /what has the person reported/i, 'Swelling of an arm or leg');
  await scan(page, 'symptoms');
  await choose(page, /how long/i, '1 to 3 months');
  await choose(page, /getting worse/i, /no, not getting worse/i);
  await page.getByRole('button', { name: /continue/i }).click();
  await scan(page, 'context');
  await choose(page, /open water/i, /^Yes$/);
  await choose(page, /livestock/i, /^No$/);
  await choose(page, /insect or fly bites/i, /^No$/);
  await choose(page, /others in the household/i, /^No$/);
  await page.getByRole('button', { name: /continue/i }).click();
  await scan(page, 'wash');
  await choose(page, /drinking water/i, /^Protected source/);
  await choose(page, /^sanitation/i, /latrine or toilet is used/i);
  await choose(page, /wash hands/i, /^Yes$/);
  await choose(page, /standing water/i, /^No$/);
  await page.getByRole('button', { name: /review/i }).click();
  await scan(page, 'summary');
  await page.getByRole('button', { name: /save and see demonstration result/i }).click();
  await expect(page.getByRole('heading', { name: /demonstration result/i })).toBeVisible();
  await scan(page, 'result');
  await page.getByRole('link', { name: /generate referral/i }).click();
  await scan(page, 'referral form');
  await page.getByRole('radio', { name: /demo north primary health centre/i }).check();
  await page.getByRole('button', { name: /generate referral/i }).click();
  await expect(page.getByText(/^Referral ID/)).toBeVisible();
  await scan(page, 'referral status');
  await page.getByRole('link', { name: /record a follow-up/i }).click();
  await scan(page, 'follow-up');
  await page
    .getByRole('navigation', { name: /chw navigation/i })
    .getByRole('link', { name: 'Assessments' })
    .click();
  await scan(page, 'history');
  await page
    .getByRole('navigation', { name: /chw navigation/i })
    .getByRole('link', { name: 'Profile' })
    .click();
  await scan(page, 'profile');
});

test('programme shell has no detectable violations', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /open as super administrator/i }).click();
  await scan(page, 'programme overview');
});

test('Stage 7 programme pages have no detectable violations', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await page.getByRole('button', { name: /open as super administrator/i }).click();
  await page.goto('/programme/priority');
  await expect(
    page.getByRole('heading', { name: /priority communities/i, level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  await scan(page, 'priority communities');
  await page.goto('/programme/settings');
  await expect(page.getByRole('heading', { name: /rule governance register/i })).toBeVisible();
  await scan(page, 'settings with rule governance');
  await page.getByLabel(/demo role/i).selectOption({ label: 'Health Facility Worker' });
  await expect(page.getByRole('heading', { name: /facility referral inbox/i })).toBeVisible();
  await page
    .getByRole('button', { name: /^open referral from/i })
    .first()
    .click();
  await expect(page.getByRole('heading', { name: /referral detail/i })).toBeVisible();
  await scan(page, 'facility inbox with detail');
});

test('P2 community programme priority views have no detectable violations', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await page.getByRole('button', { name: /open as super administrator/i }).click();
  await page.goto('/programme/priority');
  await expect(page.getByTestId('intelligence')).toBeVisible();
  await expect(page.getByText('DEMONSTRATION DATA').first()).toBeVisible();
  await scan(page, 'community programme priority');
  await page
    .getByRole('button', { name: /^Why this priority/ })
    .first()
    .click();
  await scan(page, 'community programme priority with explanation');
  await page.goto('/programme/gis');
  await expect(page.getByTestId('risk-map')).toBeVisible();
  await page.getByRole('radio', { name: 'Programme priority' }).check();
  await expect(page.getByTestId('priority-legend')).toBeVisible();
  await scan(page, 'GIS programme priority view');
});
