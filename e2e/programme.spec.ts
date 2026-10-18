import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function scan(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const summary = results.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`,
  );
  expect(summary, `${label}: ${summary.join('\n')}`).toEqual([]);
}

async function openAs(page: Page, name: RegExp) {
  await page.goto('/');
  await page.getByRole('button', { name }).click();
  await expect(page.getByRole('navigation', { name: /programme navigation/i })).toBeVisible();
}

const kpi = async (page: Page, label: string) => {
  const box = page
    .locator('[class*="kpi"]', { has: page.getByText(label, { exact: true }) })
    .first();
  await expect(box).toBeVisible();
  const text = (await box.innerText()).replace(label, '');
  return Number(/\d[\d,]*/.exec(text)?.[0].replace(/,/g, ''));
};

test('administrator sees the overview with synthetic labelling and working filters', async ({
  page,
}) => {
  await openAs(page, /open as super administrator/i);
  await page.getByRole('link', { name: 'Overview' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Programme overview' })).toBeVisible();
  await expect(page.getByText(/synthetic/i).first()).toBeVisible();
  const all = await kpi(page, 'Assessments');
  expect(all).toBeGreaterThan(100);
  await page.getByLabel('LGA').selectOption('lga-c');
  await expect.poll(() => kpi(page, 'Assessments')).toBeLessThan(all);
  await scan(page, 'overview');
});

test('GIS map draws the fictional geography, selects a community and keeps person data out', async ({
  page,
}) => {
  await openAs(page, /open as super administrator/i);
  await page.getByRole('link', { name: 'GIS map' }).click();
  await expect(page.getByText(/FICTIONAL DEMONSTRATION GEOGRAPHY/).first()).toBeVisible();
  const map = page.getByTestId('risk-map');
  await expect(map).toBeVisible();
  const ready = await map
    .getAttribute('data-ready', { timeout: 5000 })
    .then((v) => v === 'true')
    .catch(() => false);
  await page.waitForTimeout(500);
  test
    .info()
    .annotations.push({ type: 'map', description: ready ? 'WebGL map' : 'table fallback' });
  if (ready) {
    // the signal-count marker is drawn by the map on the community's centre
    await page.getByRole('button', { name: /demo riverside:.*show community details/i }).click();
  } else {
    await expect(page.getByText(/cannot be drawn here/i)).toBeVisible();
    await page.getByRole('button', { name: /show details for demo riverside/i }).click();
  }
  await expect(page.getByText(/Aggregated synthetic summary/i)).toBeVisible();
  await expect(page.getByText(/NTDW-/)).toHaveCount(0);
  await scan(page, 'gis');
});

test('layer toggles and table work', async ({ page }) => {
  await openAs(page, /open as super administrator/i);
  await page.getByRole('link', { name: 'GIS map' }).click();
  const toggle = page.getByLabel('Demonstration risk signals');
  await expect(toggle).toBeChecked();
  await toggle.uncheck();
  await expect(
    page.getByRole('button', { name: /demonstration risk signals \(HIGH or URGENT/ }),
  ).toHaveCount(0);
  await expect(page.getByRole('table').first()).toBeVisible();
});

test('every programme page has no detectable accessibility violations', async ({ page }) => {
  test.setTimeout(90_000);
  await openAs(page, /open as super administrator/i);
  for (const name of [
    'Risk signals',
    'Community vulnerability',
    'Referral monitoring',
    'Trends',
    'Reports',
    'User management',
    'Settings',
  ]) {
    await page.getByRole('link', { name, exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('status').first()).toBeVisible({ timeout: 15_000 });
    await page.waitForLoadState('networkidle');
    await scan(page, name);
  }
});

test('reports are labelled synthetic in the file name and content', async ({ page }) => {
  await openAs(page, /open as state programme manager/i);
  await page.getByRole('link', { name: 'Reports' }).click();
  await page.getByRole('button', { name: /generate report/i }).click();
  await expect(page.getByText(/File name: DEMO-SYNTHETIC-/)).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /download csv/i }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^DEMO-SYNTHETIC-.*\.csv$/);
  const stream = await file.createReadStream();
  let body = '';
  for await (const chunk of stream) body += String(chunk);
  expect(body).toContain('SYNTHETIC DEMONSTRATION DATA');
  expect(body).toContain('SYNTHETIC DEMO DATA');
});

test('roles see only their pages', async ({ page }) => {
  await openAs(page, /open as state programme manager/i);
  await expect(page.getByRole('link', { name: 'User management' })).toHaveCount(0);
  await page.goto('/programme/users');
  await expect(page.getByRole('heading', { name: /cannot open this page/i })).toBeVisible();
});

test('a CHW assessment appears in the programme view after it syncs', async ({ browser }) => {
  const context = await browser.newContext();
  const chw = await context.newPage();
  await chw.goto('/');
  await chw.getByRole('button', { name: /open as super administrator/i }).click();
  await chw.getByRole('link', { name: 'Overview' }).click();
  const before = await kpi(chw, 'Assessments');

  const page = await context.newPage();
  await page.goto('/chw/login');
  await page.getByLabel(/demo pin/i).fill('1234');
  await page.getByRole('button', { name: /sign in as demo chw/i }).click();
  const choose = (group: RegExp, option: RegExp | string) =>
    page.getByRole('group', { name: group }).locator('label', { hasText: option }).first().click();
  await page.getByRole('link', { name: '+ New assessment' }).click();
  await page.getByRole('button', { name: /start assessment/i }).click();
  await choose(/age group/i, '5 to 14 years');
  await choose(/^sex/i, 'Female');
  await page.getByRole('button', { name: /continue/i }).click();
  await choose(/what has the person reported/i, 'Swelling of an arm or leg');
  await choose(/how long/i, '1 to 3 months');
  await choose(/getting worse/i, /no, not getting worse/i);
  await page.getByRole('button', { name: /continue/i }).click();
  await choose(/open water/i, /^Yes$/);
  await choose(/livestock/i, /^No$/);
  await choose(/insect or fly bites/i, /^No$/);
  await choose(/others in the household/i, /^No$/);
  await page.getByRole('button', { name: /continue/i }).click();
  await choose(/drinking water/i, /^Protected source/);
  await choose(/^sanitation/i, /latrine or toilet is used/i);
  await choose(/wash hands/i, /^Yes$/);
  await choose(/standing water/i, /^No$/);
  await page.getByRole('button', { name: /review/i }).click();
  await page.getByRole('button', { name: /save and see demonstration result/i }).click();
  await expect(page.getByRole('heading', { name: /demonstration result/i })).toBeVisible();

  await expect.poll(() => kpi(chw, 'Assessments'), { timeout: 15_000 }).toBe(before + 1);
  await context.close();
});
