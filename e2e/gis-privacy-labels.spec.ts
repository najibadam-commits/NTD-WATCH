import { expect, test, type Page } from '@playwright/test';

/**
 * GIS map: label placement and small-count protection, checked in a real browser at the four
 * supported widths. The placement rules themselves are unit tested (labelLayout.test.ts); this
 * proves they hold in the real layout with real fonts, markers and map controls.
 */
const WIDTHS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
] as const;

async function openGis(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /open as super administrator/i }).click();
  await expect(page.getByRole('navigation', { name: /programme navigation/i })).toBeVisible();
  await page.getByRole('link', { name: 'GIS map' }).click();
  const map = page.getByTestId('risk-map');
  await expect(map).toBeVisible();
  await expect.poll(() => map.getAttribute('data-ready'), { timeout: 20_000 }).toBe('true');
  // Labels are placed once the map has settled.
  await expect(page.locator('.ntd-map-label')).not.toHaveCount(0);
  await page.waitForTimeout(500);
}

interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const labelBoxes = (page: Page) =>
  page.evaluate(() => {
    const canvas = document.querySelector('[data-testid="risk-map"]')!.getBoundingClientRect();
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return {
        id: (el as HTMLElement).dataset.community ?? '',
        x: r.left - canvas.left,
        y: r.top - canvas.top,
        w: r.width,
        h: r.height,
      };
    };
    return {
      canvas: { w: canvas.width, h: canvas.height },
      shown: [...document.querySelectorAll<HTMLElement>('.ntd-map-label')]
        .filter((l) => l.dataset.visible === 'true')
        .map(box),
      hidden: [...document.querySelectorAll<HTMLElement>('.ntd-map-label')]
        .filter((l) => l.dataset.visible === 'false')
        .map(box),
    };
  });

const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

for (const vp of WIDTHS) {
  test(`map labels stay inside the map and clear of each other at ${vp.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(vp);
    await openGis(page);
    const { canvas, shown, hidden } = await labelBoxes(page);

    // Every community has a label element; each is either placed or deliberately hidden.
    expect(shown.length + hidden.length).toBe(15);
    expect(shown.length).toBeGreaterThan(0);

    const outside = shown.filter(
      (b) => b.x < -0.5 || b.y < -0.5 || b.x + b.w > canvas.w + 0.5 || b.y + b.h > canvas.h + 0.5,
    );
    expect(outside, `labels outside the ${canvas.w}x${canvas.h} map`).toEqual([]);

    const colliding: string[] = [];
    for (let i = 0; i < shown.length; i++) {
      for (let j = i + 1; j < shown.length; j++) {
        if (overlaps(shown[i]!, shown[j]!)) colliding.push(`${shown[i]!.id}/${shown[j]!.id}`);
      }
    }
    expect(colliding, 'overlapping visible labels').toEqual([]);

    // The count of hidden names is disclosed on the page, not silent.
    if (hidden.length > 0) {
      await expect(page.getByTestId('map-label-note')).toContainText(
        `Names hidden on the map to avoid overlap: ${hidden.length}`,
      );
    } else {
      await expect(page.getByTestId('map-label-note')).toHaveCount(0);
    }

    // Names stay discoverable: every community is in the table.
    await expect(page.getByRole('rowheader').filter({ hasText: /^Demo / })).toHaveCount(15);

    await testInfo.attach(`labels-${vp.width}.json`, {
      contentType: 'application/json',
      body: JSON.stringify(
        { viewport: vp, map: canvas, visible: shown.length, hidden: hidden.length, colliding },
        null,
        2,
      ),
    });
  });
}

test('selecting a community reveals its label and leaves the others uncrossed', async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await openGis(page);
  const before = await labelBoxes(page);
  const target = before.hidden[0]?.id ?? before.shown[0]!.id;
  const name = await page
    .locator(`.ntd-map-label[data-community="${target}"]`)
    .evaluate((el) => (el.firstChild as Text).textContent ?? '');
  await page
    .getByRole('button', { name: new RegExp(`show details for demo ${name}`, 'i') })
    .first()
    .click();
  await expect(page.getByText(/Aggregated synthetic summary/i)).toBeVisible();
  await expect(page.locator(`.ntd-map-label[data-community="${target}"]`)).toHaveAttribute(
    'data-visible',
    'true',
  );
  const after = await labelBoxes(page);
  for (let i = 0; i < after.shown.length; i++) {
    for (let j = i + 1; j < after.shown.length; j++) {
      expect(overlaps(after.shown[i]!, after.shown[j]!)).toBe(false);
    }
  }
});

test('no marker, label, tooltip or table cell shows a count of 1 to 4', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openGis(page);
  const leaks = await page.evaluate(() => {
    const small = /(^|[^\d.])[1-4]([^\d.]|$)/;
    const out: string[] = [];
    document
      .querySelectorAll<HTMLElement>('.ntd-map-label, [data-testid="risk-map"] button')
      .forEach((el) => {
        // MapLibre's own zoom controls carry static titles and no data.
        if (el.closest('.maplibregl-ctrl')) return;
        // style and class hold layout numbers (pixel offsets), not content.
        const attrs = [...el.attributes]
          .filter((a) => a.name !== 'style' && a.name !== 'class')
          .map((a) => `${a.name}=${a.value}`)
          .join(' ');
        if (el.hasAttribute('title')) out.push(`title on ${el.className}`);
        if (small.test(`${el.textContent} ${attrs}`)) out.push(`${el.textContent} | ${attrs}`);
      });
    // Table: assessments and signals columns.
    document.querySelectorAll('table tbody tr').forEach((tr) => {
      const cells = tr.querySelectorAll('td');
      for (const i of [1, 2]) {
        const t = cells[i]?.textContent?.trim() ?? '';
        if (/^[1-4]$/.test(t)) out.push(`table cell ${t}`);
      }
    });
    return out;
  });
  expect(leaks).toEqual([]);
  // The notice that explains n/s is on the page.
  await expect(page.getByText(/n\/s.*means not shown/i).first()).toBeVisible();
  await expect(page.getByText(/FICTIONAL DEMONSTRATION GEOGRAPHY/).first()).toBeVisible();
});
