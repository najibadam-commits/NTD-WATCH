import { expect, test, type Download, type Page } from '@playwright/test';

/**
 * Downloaded exports, checked as files in a real browser. Every report (CSV and JSON) and the
 * priority CSV must carry published values only: no count of 1 to 4 in a count column, and the
 * not-shown text where a count is withheld. Raw records have no export path; see the review file.
 * This is a display rule over a mock API, not a security control.
 */

const KINDS = [
  'Programme summary',
  'Community signals and vulnerability',
  'Referral monitoring',
  'Weekly trends',
] as const;

// Columns that are not counts of the people assessed or referred (documented as not protected),
// text columns, and percentages or indices.
const NOT_COUNT =
  /chw|index|percent|\(%\)|share|week_starting|direction|band|status|metric|lga|ward|community|facility|trend|category|priority|^value$|signal band|completion/i;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

async function read(file: Download): Promise<string> {
  const stream = await file.createReadStream();
  let body = '';
  for await (const chunk of stream) body += String(chunk);
  return body;
}

/** Cells of 1 to 4 in count columns. The header row is the first row with more than one cell. */
function smallCells(csv: string): string[] {
  const rows = parseCsv(csv).filter((r) => r.length > 1);
  const [header = [], ...data] = rows;
  const found: string[] = [];
  header.forEach((name, c) => {
    if (NOT_COUNT.test(name)) return;
    for (const r of data) {
      if (/^[1-4]$/.test((r[c] ?? '').trim())) found.push(`${name}=${r[c]}`);
    }
  });
  // programme-summary is metric/value rows: the value of a count metric.
  if (header[0] === 'metric') {
    for (const r of data) {
      if (/chw|communities|\(%\)|index/i.test(r[0] ?? '')) continue;
      if (/^[1-4]$/.test((r[1] ?? '').trim())) found.push(`${r[0]}=${r[1]}`);
    }
  }
  return found;
}

async function open(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /open as super administrator/i }).click();
  await expect(page.getByRole('navigation', { name: /programme navigation/i })).toBeVisible();
}

test('every report, as CSV and JSON, carries no count of 1 to 4 and says what "not shown" means', async ({
  page,
}) => {
  await open(page);
  await page.getByRole('link', { name: 'Reports' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  for (const kind of KINDS) {
    await page.getByRole('combobox', { name: 'Report', exact: true }).selectOption({ label: kind });
    await page.getByRole('button', { name: /generate report/i }).click();
    await expect(page.getByText(/File name: DEMO-SYNTHETIC-/)).toBeVisible();

    const csvDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: /download csv/i }).click();
    const csv = await read(await csvDownload);
    expect(csv, kind).toContain('SYNTHETIC DEMONSTRATION DATA');
    expect(csv, kind).toContain('Small counts:');
    expect(smallCells(csv), `${kind} CSV`).toEqual([]);

    const jsonDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: /download json/i }).click();
    const json = JSON.parse(await read(await jsonDownload)) as {
      smallCounts: string;
      rows: Record<string, unknown>[];
    };
    expect(json.smallCounts, kind).toMatch(/not zero/i);
    for (const row of json.rows) {
      for (const [column, value] of Object.entries(row)) {
        if (NOT_COUNT.test(column) || column === 'metric') continue;
        expect(
          typeof value === 'number' && value >= 1 && value <= 4,
          `${kind} JSON ${column}`,
        ).toBe(false);
      }
    }
  }
});

test('the priority CSV carries no count of 1 to 4', async ({ page }) => {
  await open(page);
  await page.getByRole('link', { name: 'Priority communities' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /export csv/i }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('DEMO-SYNTHETIC-ntd-watch-priority-communities.csv');
  const csv = await read(file);
  expect(csv).toContain('SYNTHETIC');
  expect(smallCells(csv)).toEqual([]);
});
