import { expect, test } from '@playwright/test';

test('landing shows the demo banner and disclaimer', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/Every record is synthetic/i).first()).toBeVisible();
  await expect(page.getByText(/does not diagnose disease/i)).toBeVisible();
});

test('CHW entry opens the simulated sign-in, then the mobile app with bottom navigation', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /open the chw app/i }).click();
  await expect(page).toHaveURL(/\/chw\/login$/);
  await page.getByLabel(/demo pin/i).fill('1234');
  await page.getByRole('button', { name: /sign in as demo chw/i }).click();
  await expect(page).toHaveURL(/\/chw$/);
  await page
    .getByRole('navigation', { name: /chw navigation/i })
    .getByRole('link', { name: 'Referrals' })
    .click();
  await expect(page).toHaveURL(/\/chw\/referrals$/);
});

test('State role sees programme pages but not user management', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /open as state programme manager/i }).click();
  const nav = page.getByRole('navigation', { name: /programme navigation/i });
  await expect(nav.getByRole('link', { name: 'GIS map' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'User management' })).toHaveCount(0);
  await page.goto('/programme/users');
  await expect(page.getByRole('heading', { name: /cannot open this page/i })).toBeVisible();
});
