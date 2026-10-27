import { expect, test } from '@playwright/test';

/**
 * Demo safety net: when the browser's mock service worker is not answering (blocked or stale on
 * the presenting machine), the page server replies with HTML for API calls. Programme views must
 * still show the synthetic data, answered by the same mock handlers in-page. Synthetic data only.
 */
test.use({ serviceWorkers: 'block' });

test('programme views still load with the service worker blocked and API calls returning HTML', async ({
  page,
}) => {
  await page.route('**/api/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><p>page</p>' }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: /open as state programme manager/i }).click();
  await page.goto('/programme/priority');
  const table = page.getByRole('table');
  await expect(table.locator('tbody tr').filter({ hasText: 'Demo Streamside' })).toBeVisible();
  await expect(page.getByText(/is not valid JSON/i)).toHaveCount(0);
});
