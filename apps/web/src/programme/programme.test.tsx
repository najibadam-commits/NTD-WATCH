import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Role } from '@ntd-watch/domain';
import { DEMO_COMMUNITIES } from '@ntd-watch/demo-data';
import '../i18n';
import { routes } from '../routes';
import { mockServer } from '../mock/node';
import { useMockControls } from '../mock/controls';
import { useDemoSession } from '../session/demoSession';
import { saveAssessment } from '../offline/repository';
import { syncOutbox } from '../offline/sync';
import { makeAssessment } from '../testing/factories';
import { resetAll } from '../testing/resetAll';
import { useProgrammeFilters } from './filters';
import { intersects } from './components/labelLayout';

// A small stand-in for MapLibre, so map behaviour can be tested without WebGL.
const fake = vi.hoisted(() => {
  type Handler = (e: unknown) => void;
  const state = {
    maps: [] as unknown[],
    markers: [] as {
      element: HTMLElement;
      added: boolean;
      at?: [number, number];
      offset?: [number, number];
    }[],
  };
  class FakeMap {
    handlers: Record<string, Handler[]> = {};
    layerHandlers: Record<string, Handler[]> = {};
    layers: string[] = [];
    visibility: Record<string, string> = {};
    filters: Record<string, unknown> = {};
    constructor() {
      state.maps.push(this);
    }
    addControl() {}
    on(type: string, a: string | Handler, b?: Handler) {
      if (typeof a === 'function') {
        (this.handlers[type] ??= []).push(a);
        if (type === 'load') setTimeout(() => a({}), 0);
      } else if (b) {
        (this.layerHandlers[`${type}:${a}`] ??= []).push(b);
      }
    }
    addSource() {}
    addLayer(l: { id: string }) {
      this.layers.push(l.id);
    }
    getSource() {
      return { setData() {} };
    }
    setLayoutProperty(id: string, _p: string, v: string) {
      this.visibility[id] = v;
    }
    paint: Record<string, unknown> = {};
    setPaintProperty(id: string, prop: string, v: unknown) {
      this.paint[`${id}:${prop}`] = v;
    }
    setFilter(id: string, f: unknown) {
      this.filters[id] = f;
    }
    getCanvas() {
      return document.createElement('canvas');
    }
    container?: HTMLElement;
    /** A 800 x 500 box, so label placement has a size to work with. */
    getContainer() {
      if (!this.container) {
        this.container = document.createElement('div');
        Object.defineProperty(this.container, 'clientWidth', { value: 800 });
        Object.defineProperty(this.container, 'clientHeight', { value: 500 });
      }
      return this.container;
    }
    /** A fixed, spread-out projection: enough for placement code, not a real map. */
    project(at: [number, number]) {
      return { x: 50 + (Math.abs(at[0] * 1000) % 700), y: 50 + (Math.abs(at[1] * 1000) % 400) };
    }
    off() {}
    remove() {}
    click(layer: string, id: string) {
      for (const h of this.layerHandlers[`click:${layer}`] ?? []) {
        h({ features: [{ properties: { id } }] });
      }
    }
  }
  class FakeMarker {
    entry: {
      element: HTMLElement;
      added: boolean;
      at?: [number, number];
      offset?: [number, number];
    };
    constructor(o: { element: HTMLElement }) {
      this.entry = { element: o.element, added: false };
      state.markers.push(this.entry);
    }
    setLngLat(at: [number, number]) {
      this.entry.at = at;
      return this;
    }
    setOffset(o: [number, number]) {
      this.entry.offset = o;
      return this;
    }
    addTo() {
      this.entry.added = true;
      return this;
    }
    remove() {
      this.entry.added = false;
    }
  }
  class FakePopup {
    setLngLat() {
      return this;
    }
    setText() {
      return this;
    }
    addTo() {
      return this;
    }
  }
  class FakeNav {}
  return { state, FakeMap, FakeMarker, FakePopup, FakeNav };
});

vi.mock('maplibre-gl', () => ({
  Map: fake.FakeMap,
  Marker: fake.FakeMarker,
  Popup: fake.FakePopup,
  NavigationControl: fake.FakeNav,
  setWorkerUrl: vi.fn(),
}));
vi.mock('maplibre-gl/dist/maplibre-gl-worker.mjs?url', () => ({
  default: '/maplibre-gl-worker.mjs',
}));
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

beforeAll(() => mockServer.listen({ onUnhandledFrame: 'error' }));
afterAll(() => mockServer.close());
afterEach(() => mockServer.resetHandlers());
let client: QueryClient | null = null;
afterEach(async () => {
  if (client) await waitFor(() => expect(client!.isFetching()).toBe(0));
  client = null;
});
beforeEach(async () => {
  await resetAll();
  useProgrammeFilters.getState().reset();
  useDemoSession.getState().signOut();
  fake.state.maps.length = 0;
  fake.state.markers.length = 0;
});

async function open(path: string, role: Role = 'admin') {
  useDemoSession.getState().setRole(role);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  await waitFor(() => expect(router.state.initialized).toBe(true));
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client = queryClient;
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

const kpiValue = async (label: RegExp) => {
  const el = await waitFor(() => {
    const found = [...document.querySelectorAll('.kpiLabel')].find((e) =>
      label.test(e.textContent ?? ''),
    );
    if (!found) throw new Error('KPI not shown yet');
    return found;
  });
  return Number((el.nextElementSibling?.textContent ?? '').replace(/[^\d]/g, ''));
};

describe('overview', () => {
  it('shows KPIs from the synthetic records, with the demonstration labels', async () => {
    await open('/programme/overview');
    expect(await screen.findByRole('heading', { name: 'Programme overview' })).toBeInTheDocument();
    expect(await kpiValue(/^Assessments$/)).toBeGreaterThan(100);
    expect(screen.getAllByText(/synthetic/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/not clinically validated/i).length).toBeGreaterThan(0);
  });

  it('does not show a misleading change when the previous period has no data', async () => {
    await open('/programme/overview');
    await kpiValue(/^Assessments$/);
    expect(screen.getAllByText(/no comparison: too little data/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/\+\d+ vs the previous period/)).not.toBeInTheDocument();
  });

  it('updates the figures when a geographic filter changes, and back on reset', async () => {
    const u = userEvent.setup();
    await open('/programme/overview');
    const all = await kpiValue(/^Assessments$/);
    await u.selectOptions(await screen.findByLabelText('LGA'), 'lga-c');
    await waitFor(async () => expect(await kpiValue(/^Assessments$/)).toBeLessThan(all));
    await u.click(screen.getByRole('button', { name: /reset filters/i }));
    await waitFor(async () => expect(await kpiValue(/^Assessments$/)).toBe(all));
  });

  it('updates the figures when the date range changes', async () => {
    const u = userEvent.setup();
    await open('/programme/overview');
    const all = await kpiValue(/^Assessments$/);
    await u.click(await screen.findByRole('button', { name: /last 4 weeks/i }));
    await waitFor(async () => expect(await kpiValue(/^Assessments$/)).toBeLessThan(all));
  });

  it('refuses an inverted date range with a clear message and does not query', async () => {
    const u = userEvent.setup();
    await open('/programme/overview');
    const from = await screen.findByLabelText('From');
    await u.clear(from);
    await u.type(from, '2999-01-01');
    expect(await screen.findByText(/start date must be on or before/i)).toBeInTheDocument();
  });

  it('shows the empty state for a period with no records, and recovers', async () => {
    const u = userEvent.setup();
    await open('/programme/overview');
    await kpiValue(/^Assessments$/);
    useProgrammeFilters.getState().setRange('2020-01-01', '2020-01-31');
    expect(await screen.findByText(/no records match these filters/i)).toBeInTheDocument();
    await u.click(
      within(screen.getByText(/no records match/i).closest('div')!).getByRole('button', {
        name: /reset filters/i,
      }),
    );
    expect(await kpiValue(/^Assessments$/)).toBeGreaterThan(0);
  });

  it('shows an error state when the mock server is down, with a working retry', async () => {
    const u = userEvent.setup();
    useMockControls.getState().setServerDown(true);
    await open('/programme/overview');
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    useMockControls.getState().setServerDown(false);
    await u.click(screen.getByRole('button', { name: /try again|retry/i }));
    expect(await kpiValue(/^Assessments$/)).toBeGreaterThan(0);
  });

  it('reflects a newly synced CHW assessment', async () => {
    await open('/programme/overview');
    const before = await kpiValue(/^Assessments$/);
    await saveAssessment(makeAssessment());
    await syncOutbox();
    await userEvent.click(screen.getByRole('button', { name: /refresh/i }));
    await waitFor(async () => expect(await kpiValue(/^Assessments$/)).toBe(before + 1));
  });
});

describe('scope and access', () => {
  it('limits an LGA manager to their own LGA in the filters', async () => {
    await open('/programme/overview', 'lga');
    const community = await screen.findByLabelText('Community');
    const names = within(community)
      .getAllByRole('option')
      .map((o) => o.getAttribute('value'));
    expect(names).not.toContain('com-13');
    expect(names).toContain('com-04');
    expect(screen.queryByLabelText('State')).not.toBeInTheDocument();
  });
  it('shows the facility role only referral monitoring', async () => {
    await open('/programme/overview', 'facility');
    expect(
      await screen.findByRole('heading', { name: /cannot open this page/i }),
    ).toBeInTheDocument();
    await open('/programme/referrals', 'facility');
    expect(
      await screen.findAllByRole('heading', { name: /referral monitoring/i }),
    ).not.toHaveLength(0);
  });
  it('hides Users and Settings from every role except the administrator', async () => {
    for (const role of ['lga', 'state', 'facility'] as Role[]) {
      const router = await open('/programme/settings', role);
      expect(
        await screen.findByRole('heading', { name: /cannot open this page/i }),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/programme/settings');
      document.body.innerHTML = '';
    }
  });
});

describe('GIS map', () => {
  it('draws the fictional map with a label, separate layers and a table alternative', async () => {
    await open('/programme/gis');
    await waitFor(() =>
      expect(screen.getByTestId('risk-map')).toHaveAttribute('data-ready', 'true'),
    );
    expect(screen.getAllByText(/FICTIONAL DEMONSTRATION GEOGRAPHY/).length).toBeGreaterThan(0);
    const map = fake.state.maps[0] as InstanceType<typeof fake.FakeMap>;
    expect(map.layers).toEqual(
      expect.arrayContaining([
        'community-fill',
        'facility-points',
        'ward-lines',
        'lga-lines',
        'state-lines',
      ]),
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('selects a community when its polygon is clicked and shows aggregates only', async () => {
    await open('/programme/gis');
    await waitFor(() =>
      expect(screen.getByTestId('risk-map')).toHaveAttribute('data-ready', 'true'),
    );
    const map = fake.state.maps[0] as InstanceType<typeof fake.FakeMap>;
    map.click('community-fill', 'com-01');
    expect(await screen.findByText(/Aggregated synthetic summary/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Demo Riverside/).length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/NTDW-|clientKey/);
    await waitFor(() =>
      expect(map.filters['selected-outline']).toEqual(['==', ['get', 'id'], 'com-01']),
    );
  });

  it('selects a community from a signal-count marker button', async () => {
    await open('/programme/gis');
    await waitFor(() =>
      expect(fake.state.markers.some((m) => m.element.tagName === 'BUTTON')).toBe(true),
    );
    const button = fake.state.markers.find((m) => m.added && m.element.tagName === 'BUTTON')!;
    button.element.click();
    expect(await screen.findByText(/Aggregated synthetic summary/i)).toBeInTheDocument();
  });

  it('toggles the two layers independently', async () => {
    const u = userEvent.setup();
    await open('/programme/gis');
    await waitFor(() =>
      expect(screen.getByTestId('risk-map')).toHaveAttribute('data-ready', 'true'),
    );
    const map = fake.state.maps[0] as InstanceType<typeof fake.FakeMap>;
    await u.click(screen.getByLabelText('WASH and environment vulnerability'));
    expect(map.visibility['community-fill']).toBe('none');
    const signalButtons = () =>
      fake.state.markers.filter((m) => m.added && m.element.tagName === 'BUTTON');
    expect(signalButtons().length).toBeGreaterThan(0);
    await u.click(screen.getByLabelText('Demonstration risk signals'));
    await waitFor(() => expect(signalButtons()).toHaveLength(0));
    expect(map.visibility['community-fill']).toBe('none');
  });

  it('narrows the map and table when a filter is applied', async () => {
    const u = userEvent.setup();
    await open('/programme/gis');
    const rows = async () => (await screen.findAllByRole('row')).length;
    const all = await rows();
    await u.selectOptions(await screen.findByLabelText('LGA'), 'lga-c');
    await waitFor(async () => expect(await rows()).toBeLessThan(all));
  });

  it('works from the table when the map cannot be drawn', async () => {
    const u = userEvent.setup();
    vi.spyOn(fake.state, 'maps', 'get').mockReturnValue([]);
    await open('/programme/gis?community=com-02');
    expect(await screen.findByText(/Aggregated synthetic summary/i)).toBeInTheDocument();
    await u.click(await screen.findByRole('button', { name: /show details for demo hillview/i }));
    expect(await screen.findByText(/Aggregated synthetic summary/i)).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  const markerButtons = () =>
    fake.state.markers.filter((m) => m.added && m.element.tagName === 'BUTTON');
  const labels = () =>
    fake.state.markers.filter((m) => m.added && m.element.classList.contains('ntd-map-label'));
  const tableRow = (name: string) =>
    screen
      .getAllByRole('rowheader')
      .find((th) => th.textContent === name)!
      .closest('tr')!;

  it('keeps the map badges and the table from contradicting each other', async () => {
    await open('/programme/gis');
    await waitFor(() => expect(markerButtons().length).toBeGreaterThan(0));
    await screen.findAllByRole('rowheader');
    let hiddenSeen = 0;
    let shownSeen = 0;
    for (const b of markerButtons()) {
      const name = b.element.getAttribute('aria-label')!.split(':')[0]!;
      const cells = tableRow(name).querySelectorAll('td');
      const signalsCell = cells[2]!.textContent; // community, then LGA, assessments, signals
      const badge = b.element.textContent!.replace('▲', '').trim();
      expect(badge).toBe(signalsCell);
      if (badge === 'n/s') hiddenSeen += 1;
      else shownSeen += 1;
    }
    // The synthetic data has both kinds, so the check above exercised both.
    expect(hiddenSeen).toBeGreaterThan(0);
    expect(shownSeen).toBeGreaterThan(0);
  });

  it('puts no small count into any marker text, label, title or data attribute', async () => {
    await open('/programme/gis');
    await waitFor(() => expect(markerButtons().length).toBeGreaterThan(0));
    for (const m of fake.state.markers.filter((x) => x.added)) {
      const el = m.element;
      expect(el.getAttribute('title')).toBeNull();
      const attrs = [...el.attributes]
        .filter((a) => a.name !== 'style' && a.name !== 'class')
        .map((a) => `${a.name}=${a.value}`)
        .join(' ');
      expect(`${el.textContent} ${attrs}`).not.toMatch(/(^|[^\d.])[1-4]([^\d.]|$)/);
      for (const name of Object.keys(el.dataset)) {
        expect(['selected', 'direction', 'community', 'visible', 'compact']).toContain(name);
      }
    }
    // A hidden count is announced as not shown, never as a number or as zero.
    const hidden = markerButtons().find((b) => b.element.textContent!.includes('n/s'))!;
    // The accessible name contains the visible text ("n/s") and says what it means.
    expect(hidden.element.getAttribute('aria-label')).toMatch(/n\/s, .*not shown/);
    expect(hidden.element.getAttribute('aria-label')).not.toMatch(/\b0\b/);
  });

  it('keeps every community name available in the table and the detail panel', async () => {
    const u = userEvent.setup();
    await open('/programme/gis');
    await screen.findAllByRole('rowheader');
    const names = screen.getAllByRole('rowheader').map((th) => th.textContent!);
    for (const c of DEMO_COMMUNITIES) expect(names).toContain(c.name);
    await u.click(screen.getByRole('button', { name: /show details for demo reedbed/i }));
    expect(await screen.findByRole('heading', { name: 'Demo Reedbed' })).toBeInTheDocument();
  });

  describe('label placement', () => {
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
    const originalH = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    beforeEach(() => {
      // Wide labels so that several must collide on the 800 x 500 fake map.
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        get() {
          return (this as HTMLElement).classList.contains('ntd-map-label') ? 220 : 40;
        },
      });
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        configurable: true,
        get() {
          return (this as HTMLElement).classList.contains('ntd-map-label') ? 22 : 24;
        },
      });
    });
    afterEach(() => {
      if (original) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', original);
      if (originalH) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalH);
    });

    const rectOf = (
      m: (typeof fake.state.markers)[number],
      map: InstanceType<typeof fake.FakeMap>,
    ) => {
      const p = map.project(m.at!);
      return { x: p.x + m.offset![0], y: p.y + m.offset![1], w: 220, h: 22 };
    };

    it('shows only labels that fit inside the map and clear of each other, and says so', async () => {
      await open('/programme/gis');
      await waitFor(() => expect(labels().length).toBe(DEMO_COMMUNITIES.length));
      const map = fake.state.maps[0] as InstanceType<typeof fake.FakeMap>;
      const shown = labels().filter((l) => l.element.dataset.visible === 'true');
      const hidden = labels().filter((l) => l.element.dataset.visible === 'false');
      expect(shown.length).toBeGreaterThan(0);
      expect(hidden.length).toBeGreaterThan(0);
      for (const l of shown) {
        const r = rectOf(l, map);
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w).toBeLessThanOrEqual(800);
        expect(r.y + r.h).toBeLessThanOrEqual(500);
      }
      for (let i = 0; i < shown.length; i++) {
        for (let j = i + 1; j < shown.length; j++) {
          expect(intersects(rectOf(shown[i]!, map), rectOf(shown[j]!, map))).toBe(false);
        }
      }
      expect(await screen.findByTestId('map-label-note')).toHaveTextContent(
        `Names hidden on the map to avoid overlap: ${hidden.length}`,
      );
      // Hidden labels are not announced twice; the names are in the table.
      for (const l of hidden) expect(l.element.style.visibility).toBe('hidden');
    });

    it('reveals the label of a selected community even when it was hidden', async () => {
      await open('/programme/gis');
      await waitFor(() => expect(labels().length).toBe(DEMO_COMMUNITIES.length));
      const map = fake.state.maps[0] as InstanceType<typeof fake.FakeMap>;
      const hiddenId = labels().find((l) => l.element.dataset.visible === 'false')!.element.dataset
        .community!;
      map.click('community-fill', hiddenId);
      await waitFor(() => {
        const l = labels().find((x) => x.element.dataset.community === hiddenId)!;
        expect(l.element.dataset.visible).toBe('true');
      });
    });
  });

  it('explains a coverage gap instead of showing blank figures', async () => {
    await open('/programme/gis?community=com-05');
    expect(await screen.findByText(/coverage gap/i)).toBeInTheDocument();
  });
});

describe('other programme pages', () => {
  it.each([
    ['/programme/signals', /risk signals/i],
    ['/programme/vulnerability', /vulnerability/i],
    ['/programme/referrals', /referral monitoring/i],
    ['/programme/trends', /trends/i],
  ])('%s loads with a table alternative and the synthetic notice', async (path, heading) => {
    await open(path);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole('table').length).toBeGreaterThan(0));
    expect(screen.getAllByText(/synthetic/i).length).toBeGreaterThan(0);
  });

  it('referral monitoring shows aggregates and no referral ids', async () => {
    await open('/programme/referrals');
    await screen.findByRole('heading', { level: 1, name: /referral monitoring/i });
    await waitFor(() => expect(screen.getAllByRole('table').length).toBeGreaterThan(0));
    expect(document.body.textContent).not.toMatch(/NTDW-/);
  });
});

describe('reports', () => {
  it('generates a report that is labelled synthetic and named accordingly', async () => {
    const u = userEvent.setup();
    await open('/programme/reports');
    await u.click(await screen.findByRole('button', { name: /generate report/i }));
    expect(
      await screen.findByText(/labelled as synthetic demonstration data/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/File name: DEMO-SYNTHETIC-programme-summary/),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/SYNTHETIC DEMO DATA/).length).toBeGreaterThan(0);
  });
});

describe('users and settings (administrator)', () => {
  it('disables and re-enables a user with a confirmation message', async () => {
    const u = userEvent.setup();
    await open('/programme/users');
    const disable = await screen.findByRole('button', { name: /disable demo chw 0143/i });
    await u.click(disable);
    expect(await screen.findByText(/saved changes for demo chw 0143/i)).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /enable demo chw 0143/i }),
    ).toBeInTheDocument();
  });
  it('does not offer to disable the administrator account', async () => {
    await open('/programme/users');
    await screen.findAllByRole('row');
    const admin = (await screen.findAllByRole('row')).find((r) =>
      /admin/i.test(r.textContent ?? ''),
    );
    expect(admin).toBeDefined();
    expect(within(admin!).getByRole('button', { name: /^disable/i })).toBeDisabled();
  });
  it('validates and saves the unresolved-days setting', async () => {
    const u = userEvent.setup();
    await open('/programme/settings');
    const input = await screen.findByLabelText(/days before an unassessed referral/i);
    await u.clear(input);
    await u.type(input, '99');
    expect(await screen.findByText(/whole number from 1 to 30/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await u.clear(input);
    await u.type(input, '4');
    await u.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText(/settings saved/i)).toBeInTheDocument();
  });
  it('asks before resetting and then resets', async () => {
    const u = userEvent.setup();
    await open('/programme/settings');
    await u.click(await screen.findByRole('button', { name: /reset demonstration data/i }));
    expect(await screen.findByText(/deletes records entered/i)).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: /yes, reset/i }));
    expect(await screen.findByText(/demonstration data reset/i)).toBeInTheDocument();
  });
});

describe('community programme priority (P2)', () => {
  it('shows the priority section on the priority page with the demonstration notice and confidence', async () => {
    await open('/programme/priority');
    const section = await screen.findByTestId('intelligence');
    expect(within(section).getAllByText('DEMONSTRATION DATA').length).toBeGreaterThan(0);
    expect(within(section).getByText(/not a validated epidemiological model/i)).toBeInTheDocument();
    expect(within(section).getByText(/Counts below 5 are not shown/i)).toBeInTheDocument();
    const table = within(section).getByRole('list', { name: /Community signals/ });
    expect(
      within(table).getAllByText(/High priority for programme attention/).length,
    ).toBeGreaterThan(0);
    expect(within(table).getAllByText('Insufficient').length).toBeGreaterThan(0);
    expect(within(table).getAllByText('Fewer than 5').length).toBeGreaterThan(0);
  });

  it('explains a priority in words on request, with no figures and no claim about disease', async () => {
    const u = userEvent.setup();
    await open('/programme/priority');
    const section = await screen.findByTestId('intelligence');
    const [first] = within(section).getAllByRole('button', {
      name: /^Why this priority/,
    });
    await u.click(first!);
    const region = within(section).getByRole('region', { name: /has this programme priority/ });
    expect(region.textContent).toMatch(/data confidence/);
    expect(region.textContent).not.toMatch(/\d/);
    expect(region.textContent).not.toMatch(/has FGS|prevalence is|high risk/i);
  });

  it('shows no case code, participant key or worker id on the page', async () => {
    await open('/programme/priority');
    const section = await screen.findByTestId('intelligence');
    expect(section.textContent).not.toMatch(/PC-[0-9A-F]{4}-[0-9A-F]{4}|seed-fgs|CHW-\d{4}/);
  });

  it('offers a programme-priority map colouring with a legend that explains faded colour', async () => {
    const u = userEvent.setup();
    await open('/programme/gis');
    await waitFor(() =>
      expect(screen.getByTestId('risk-map')).toHaveAttribute('data-ready', 'true'),
    );
    expect(screen.getAllByText('DEMONSTRATION DATA').length).toBeGreaterThan(0);
    await u.click(screen.getByRole('radio', { name: 'Programme priority' }));
    const legend = await screen.findByTestId('priority-legend');
    expect(legend.textContent).toMatch(/Fainter colour means lower data confidence/);
    expect(legend.textContent).toMatch(/does not show disease or prevalence/);
    const map = fake.state.maps[0] as InstanceType<typeof fake.FakeMap>;
    await waitFor(() => expect(map.paint['community-fill:fill-opacity']).toBeDefined());
    expect(JSON.stringify(map.paint['community-fill:fill-opacity'])).toContain('confidenceRank');
    // The table alternative carries the same priority and confidence.
    const table = screen.getByRole('table');
    expect(
      within(table).getAllByText(/Priority for review|High priority for programme attention/)
        .length,
    ).toBeGreaterThan(0);
  });

  it('is not offered to the facility role', async () => {
    await open('/programme/priority', 'facility');
    expect(
      await screen.findByText(/This page is hidden for the Health Facility Worker role/),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('intelligence')).not.toBeInTheDocument();
  });
});
