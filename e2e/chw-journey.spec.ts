import { expect, test, type Page } from '@playwright/test';

async function signIn(page: Page) {
  await page.goto('/chw/login');
  await page.getByLabel(/demo pin/i).fill('1234');
  await page.getByRole('button', { name: /sign in as demo chw/i }).click();
  await expect(page.getByRole('heading', { name: /hello, demo chw 0142/i })).toBeVisible();
}

const choose = (page: Page, group: RegExp, option: RegExp | string) =>
  page.getByRole('group', { name: group }).locator('label', { hasText: option }).first().click();

/** Fills the form with a pattern the demonstration rules rate as HIGH, then opens the review screen. */
async function fillAssessment(page: Page) {
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
  await expect(page.getByRole('heading', { name: /review and save/i })).toBeVisible();
}

const save = (page: Page) =>
  page.getByRole('button', { name: /save and see demonstration result/i }).click();

test('required fields block each step with clear messages', async ({ page }) => {
  await signIn(page);
  await page.getByRole('link', { name: '+ New assessment' }).click();
  await page.getByRole('button', { name: /start assessment/i }).click();
  await page.getByRole('button', { name: /continue/i }).click();
  await expect(page.getByRole('alert')).toContainText('Choose an age group.');
  await expect(page.getByRole('alert')).toContainText('Choose a sex.');
  await expect(page).toHaveURL(/new\/person$/);
});

test('assessment to referral to follow-up works end to end in a real browser', async ({ page }) => {
  await signIn(page);
  await fillAssessment(page);
  await save(page);

  // result: demonstration labels on result, reasons and action
  await expect(page.getByRole('heading', { name: /demonstration result/i })).toBeVisible();
  await expect(page.getByTestId('demo-label')).toHaveCount(4);
  await expect(page.getByText('Limb swelling has lasted one month or longer.')).toBeVisible();
  await expect(page.getByText('Synced', { exact: true }).first()).toBeVisible({ timeout: 15_000 });

  // referral
  await page.getByRole('link', { name: /generate referral/i }).click();
  await page.getByRole('radio', { name: /demo north primary health centre/i }).check();
  await page.getByRole('button', { name: /generate referral/i }).click();
  await expect(page.getByText(/^Referral ID NTDW-\d{4}-\d{6}$/)).toBeVisible();
  const accept = page.getByRole('button', { name: /mark as accepted/i });
  await expect(accept).toBeEnabled({ timeout: 15_000 });
  await accept.click();
  await expect(page.locator('li[data-reached="true"]')).toHaveCount(2);

  // follow-up
  await page.getByRole('link', { name: /record a follow-up/i }).click();
  await choose(page, /was the person reached/i, /^Yes$/);
  await choose(page, /attend the health facility/i, /^Yes$/);
  await choose(page, /how is the person now/i, 'About the same');
  await choose(page, /further referral/i, /^No$/);
  await page.getByRole('button', { name: /save follow-up/i }).click();
  await expect(page.getByText(/follow-up saved on this device/i)).toBeVisible();

  // history
  await page
    .getByRole('navigation', { name: /chw navigation/i })
    .getByRole('link', { name: 'Assessments' })
    .click();
  await expect(page.getByRole('heading', { name: /assessment history/i })).toBeVisible();
  await expect(page.getByText(/referred/i).first()).toBeVisible();
});

test('capture while offline, survive a refresh, and sync on reconnection', async ({ page }) => {
  await signIn(page);
  await page
    .getByRole('navigation', { name: /chw navigation/i })
    .getByRole('link', { name: 'Profile' })
    .click();
  await page.getByLabel(/simulate being offline/i).check();
  await expect(page.getByRole('status', { name: /connection status/i })).toContainText('Offline');

  await page
    .getByRole('navigation', { name: /chw navigation/i })
    .getByRole('link', { name: 'Dashboard' })
    .click();
  await fillAssessment(page);
  await save(page);
  await expect(page.getByText('Waiting to sync').first()).toBeVisible();

  // a refresh wipes the page but not the device store; the simulation switch resets with it
  await page.reload();
  await expect(page.getByRole('heading', { name: /demonstration result/i })).toBeVisible();
  await expect(page.getByText('Synced', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
});

test('server failures are shown honestly and can be retried', async ({ page }) => {
  await signIn(page);
  await page.evaluate(() => window.__ntdMock?.getState().setServerDown(true));
  await fillAssessment(page);
  await save(page);
  await expect(page.getByText('Sync failed, will retry').first()).toBeVisible({ timeout: 15_000 });

  await page.evaluate(() => window.__ntdMock?.getState().setServerDown(false));
  await page.getByRole('button', { name: /sync now/i }).click();
  await expect(page.getByText('Synced', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
});

test('a lost response never creates a duplicate on the server', async ({ page }) => {
  await signIn(page);
  await page.evaluate(() => window.__ntdMock?.getState().setDropResponseNext(1));
  await fillAssessment(page);
  await save(page);
  await expect(page.getByText('Sync failed, will retry').first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /sync now/i }).click();
  await expect(page.getByText('Synced', { exact: true }).first()).toBeVisible({ timeout: 15_000 });

  const count = await page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const open = indexedDB.open('ntd-watch-mock-server');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const req = open.result.transaction('assessments').objectStore('assessments').count();
          req.onsuccess = () => resolve(req.result);
        };
      }),
  );
  expect(count).toBe(1);
});
