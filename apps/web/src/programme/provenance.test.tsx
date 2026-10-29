import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { isSeedKey, isVerifiedDemoCreated } from '@ntd-watch/programme';
import '../i18n';
import { newKey } from '../chw/draft';
import { useMockControls } from '../mock/controls';
import { mockServer } from '../mock/node';
import { setFgsSeedEnabled, setMockClock } from '../mock/programmeStore';
import { serverDb } from '../mock/serverDb';
import { saveAssessment } from '../offline/repository';
import { syncOutbox } from '../offline/sync';
import { routes } from '../routes';
import { useDemoSession } from '../session/demoSession';
import { makeAssessment } from '../testing/factories';
import { resetAll } from '../testing/resetAll';
import { fetchSummary, postReset } from './api';
import { useProgrammeFilters } from './filters';

/**
 * Seed baseline versus demo-created records. The distinction rests on the client key: every
 * generated record has a key starting `seed-`, and every record the CHW app creates has a key
 * from `newKey()` (`asm-<uuid>`). Everything here is synthetic. The expectations avoid fixed
 * seed sizes: they compare the same view before and after.
 */

const NOW = new Date('2026-10-18T12:00:00Z');
const range = { from: '2026-07-27', to: '2026-10-18' };

beforeAll(() => mockServer.listen({ onUnhandledFrame: 'error' }));
afterAll(() => mockServer.close());
afterEach(() => mockServer.resetHandlers());
beforeEach(async () => {
  setMockClock(() => NOW);
  setFgsSeedEnabled(true);
  await resetAll();
  useProgrammeFilters.getState().reset();
  useDemoSession.getState().signOut();
});
afterEach(() => setMockClock(null));

/** Distinct synthetic demo-created assessments, captured inside the window. */
async function createDemoRecords(n: number, first = 1) {
  for (let i = first; i < first + n; i++) {
    await saveAssessment(
      makeAssessment(`key-demo-${i}`, {
        id: `A-D${String(i).padStart(3, '0')}`,
        capturedAt: '2026-10-17T10:00:00.000Z',
      }),
    );
  }
  return syncOutbox({ force: true });
}

describe('how provenance is told apart', () => {
  it('keys made by the CHW app never look like seed keys, and generated ones always do', async () => {
    for (let i = 0; i < 20; i++) expect(isSeedKey(newKey())).toBe(false);
    expect(isSeedKey(newKey('fup'))).toBe(false);
    const s = await fetchSummary('admin', range);
    expect(s.dataSources.seeded).toBeGreaterThan(0);
  });
});

describe('counts in the summary', () => {
  it('does not count generated baseline records as demo-created', async () => {
    const s = await fetchSummary('admin', range);
    expect(s.dataSources.seeded).toBeGreaterThan(0);
    expect(s.dataSources.live).toBe(0);
    expect(await serverDb.assessments.count()).toBe(0);
  });

  it('counts demo-created records once they are received, and leaves the baseline alone', async () => {
    const before = await fetchSummary('admin', range);
    const summary = await createDemoRecords(5);
    expect(summary.sent).toBe(5);
    const after = await fetchSummary('admin', range);
    expect(after.dataSources.live).toBe(5);
    expect(after.dataSources.seeded).toBe(before.dataSources.seeded);
    // the established analytics still count the new records exactly as before
    expect(after.byRisk.HIGH).toBe(before.byRisk.HIGH! + 5);
  });

  it.each([0, 1, 4, 5, 7])('publishes %i verified demo-created assessments exactly', async (n) => {
    const before = await fetchSummary('admin', range);
    if (n > 0) await createDemoRecords(n);
    const after = await fetchSummary('admin', range);
    expect(after.dataSources.live).toBe(n);
    expect(after.dataSources.seeded).toBe(before.dataSources.seeded);
  });

  it('keeps the small-count rule when one non-seed record cannot be verified as a demonstration record', async () => {
    await createDemoRecords(2);
    // stored directly, as bad or foreign data would be: not demonstration rules
    await serverDb.assessments.put(
      makeAssessment('key-unknown-1', { id: 'A-U001', ruleSetId: 'rules-v1' }),
    );
    const s = await fetchSummary('admin', range);
    expect(s.dataSources.live).toBeNull(); // 3 records: hidden, not shown as 3 or 2
  });

  it('keeps the small-count rule when a stored record lacks the demo flag', async () => {
    await createDemoRecords(1);
    await serverDb.assessments.put({
      ...makeAssessment('key-unknown-2', { id: 'A-U002' }),
      demo: undefined,
    } as never);
    expect((await fetchSummary('admin', range)).dataSources.live).toBeNull();
  });

  it('does not use the key prefix alone: a seed-looking key is baseline, and an asm- key is not enough', async () => {
    const odd = makeAssessment('asm-looks-demo', { id: 'A-U003', ruleSetId: 'rules-v1' });
    expect(isVerifiedDemoCreated(odd)).toBe(false);
    expect(isVerifiedDemoCreated(makeAssessment('key-demo-1'))).toBe(true);
    expect(isVerifiedDemoCreated(makeAssessment('seed-asm-x'))).toBe(false);
  });

  it('applies the existing rule to a larger mixed set: no figure is derived from another', async () => {
    await createDemoRecords(5);
    await serverDb.assessments.put(
      makeAssessment('key-unknown-3', { id: 'A-U004', ruleSetId: 'rules-v1' }),
    );
    // six non-seed records, one unverified: the whole figure follows the existing rule (>= 5)
    expect((await fetchSummary('admin', range)).dataSources.live).toBe(6);
  });

  it('does not count a record that failed to reach the mock server', async () => {
    useMockControls.getState().setServerDown(true);
    const summary = await createDemoRecords(5);
    expect(summary.sent).toBe(0);
    useMockControls.getState().setServerDown(false);
    const during = await fetchSummary('admin', range);
    expect(during.dataSources.live).toBe(0);
    // the record is still on the device and counts once it has been received
    await syncOutbox({ force: true });
    expect((await fetchSummary('admin', range)).dataSources.live).toBe(5);
  });

  it('keeps the distinction after the page is reloaded and the seed is rebuilt', async () => {
    await createDemoRecords(5);
    const first = await fetchSummary('admin', range);
    setFgsSeedEnabled(true); // drops the in-memory seed cache, as a reload would
    const second = await fetchSummary('admin', range);
    expect(second.dataSources).toEqual(first.dataSources);
    expect(second.kpis).toEqual(first.kpis);
  });

  it('shows the actual result after a reset: demo-created records gone, baseline regenerated', async () => {
    await createDemoRecords(5);
    await postReset('admin');
    const s = await fetchSummary('admin', range);
    expect(s.dataSources.live).toBe(0);
    expect(s.dataSources.seeded).toBeGreaterThan(0);
  });

  it('does not change the totals the dashboard already published', async () => {
    const baseline = await fetchSummary('admin', range);
    // same view, asked again: provenance labelling must not alter any other figure
    const again = await fetchSummary('admin', range);
    expect({ ...again, generatedAt: '' }).toEqual({ ...baseline, generatedAt: '' });
  });
});

describe('the overview page', () => {
  async function openOverview() {
    useDemoSession.getState().setRole('admin');
    const router = createMemoryRouter(routes, { initialEntries: ['/programme/overview'] });
    await waitFor(() => expect(router.state.initialized).toBe(true));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
    return queryClient;
  }

  it('says in words that the data is synthetic and what the counts cover, and updates after a creation', async () => {
    const client = await openOverview();
    const notice = await screen.findByTestId('provenance-notice');
    expect(notice).toHaveTextContent(/uses synthetic data for demonstration and testing/i);
    expect(notice).toHaveTextContent(
      /generated baseline records and records created during this demo/i,
    );
    expect(notice).toHaveTextContent(/do not represent verified real-world cases/i);
    // the existing page-level disclosure is still there
    expect(screen.getAllByText(/synthetic demonstration data/i).length).toBeGreaterThan(1);
    expect(screen.getAllByText(/not clinically validated/i).length).toBeGreaterThan(0);

    const counts = screen.getByTestId('provenance-counts');
    expect(counts).toHaveTextContent(/generated baseline records/);
    expect(counts).toHaveTextContent(/and 0 demo-created assessments/);

    await createDemoRecords(5);
    await waitFor(() =>
      expect(screen.getByTestId('provenance-counts')).toHaveTextContent(
        /and 5 demo-created assessments/,
      ),
    );
    await waitFor(() => expect(client.isFetching()).toBe(0));
  });

  it('shows 1 to 4 verified demo-created assessments as numbers, and hides them when one cannot be verified', async () => {
    const client = await openOverview();
    await screen.findByTestId('provenance-counts');
    await createDemoRecords(1);
    await waitFor(() =>
      expect(screen.getByTestId('provenance-counts')).toHaveTextContent(
        /and 1 demo-created assessments/,
      ),
    );
    expect(screen.getByTestId('provenance-notice')).toHaveTextContent(/synthetic data/i);

    await serverDb.assessments.put(
      makeAssessment('key-unknown-ui', { id: 'A-U005', ruleSetId: 'rules-v1' }),
    );
    await client.invalidateQueries({ queryKey: ['programme'] });
    await waitFor(() =>
      expect(screen.getByTestId('provenance-counts')).toHaveTextContent(
        /and Not shown \(small-count rule\) demo-created assessments/,
      ),
    );
    await waitFor(() => expect(client.isFetching()).toBe(0));
  });
});
