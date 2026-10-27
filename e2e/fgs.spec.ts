import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Automated checks catch only part of accessibility. Manual assistive-technology testing is still needed. */
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

test('FGS flow: no detectable violations, errors readable, keyboard reachable, no overflow', async ({
  page,
}) => {
  test.setTimeout(150_000);
  await page.goto('/chw/login');
  await page.getByLabel(/demo pin/i).fill('1234');
  await page.getByRole('button', { name: /sign in as demo chw/i }).click();
  await page.getByRole('link', { name: /women and girls/i }).click();
  await scan(page, 'fgs start');

  await page.getByRole('button', { name: /^start$/i }).click();
  await expect(page.getByRole('heading', { name: 'Her permission' })).toBeVisible();
  await page.getByRole('button', { name: /continue/i }).click(); // error state
  await expect(page.getByRole('alert').first()).toBeVisible();
  await scan(page, 'consent with error');

  // keyboard: radios are reachable and selectable without a pointer
  await page.getByRole('radio', { name: /yes, she agrees/i }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('radio', { name: /yes, she agrees/i })).toBeChecked();
  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page.getByRole('heading', { name: 'About her' })).toBeVisible();
  await choose(page, /age range/i, '18 to 49');
  await scan(page, 'participant');
  await page.getByRole('button', { name: /continue/i }).click();

  await choose(page, /which of these apply/i, /none of these/i);
  await page.getByRole('button', { name: /continue/i }).click();
  await choose(page, /noticed any of these/i, /pain in the lower belly/i);
  await scan(page, 'signals');
  await page.getByRole('button', { name: /continue/i }).click();
  await choose(page, /very worried or upset/i, 'Yes');
  await choose(page, /safe to follow up/i, 'Yes');
  await page.getByRole('button', { name: /review/i }).click();
  await scan(page, 'review');
  await page.getByRole('button', { name: /save and see guidance/i }).click();

  await expect(page.getByRole('heading', { name: 'Guidance for this case' })).toBeVisible();
  await scan(page, 'fgs result');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
