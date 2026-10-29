import { useEffect, useMemo, useRef, useState } from 'react';
import { Map as MapLibreMap, Marker, NavigationControl, Popup, setWorkerUrl } from 'maplibre-gl';
// The map's worker script is a separate file that the bundler does not copy next to this chunk,
// so it is emitted as its own asset and its address is given to MapLibre explicitly. Without this
// the production build fails to start the worker and the polygon (vulnerability) layer stays blank.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { DEMO_GEOGRAPHY, GEOGRAPHY_LABEL } from '@ntd-watch/demo-data';
import i18n from '../../i18n';
import { PRIORITY_COLORS } from './priorityColours';
import type { CommunityIntelligence, CommunityStat } from '@ntd-watch/programme';
import { PRIORITY_RANK } from '@ntd-watch/programme';
import { NOT_SHOWN_SHORT } from '../format';
import { layoutLabels, type LabelInput, type Rect } from './labelLayout';
import styles from '../programme.module.css';

/**
 * The FICTIONAL demonstration map. It draws only the generated shapes from demo-data: there is
 * no base map, no tile server and no real place. Two separate layers sit on top of it:
 *   - community WASH / environment vulnerability (filled polygons), and
 *   - NTD-related demonstration signals (count markers).
 * Both are computed from the same filtered records as every other programme view.
 */
export interface MapLayers {
  vulnerability: boolean;
  signals: boolean;
  facilities: boolean;
}

export type MapColourBy = 'vulnerability' | 'priority';

export interface RiskMapProps {
  communities: CommunityStat[];
  /** Community-level programme intelligence (synthetic). Optional; needed for the priority view. */
  intelligence?: CommunityIntelligence[];
  colourBy?: MapColourBy;
  layers: MapLayers;
  selectedId?: string;
  onSelect: (communityId: string) => void;
  /** Called when the browser cannot draw the map (for example no WebGL). */
  onUnavailable?: (reason: string) => void;
}

setWorkerUrl(new URL(workerUrl, window.location.href).href);

const NO_DATA = '#d4dde3';
export const VULNERABILITY_COLORS = {
  low: '#cde6f2',
  moderate: '#6fb5d6',
  high: '#0a5578',
} as const;

/** Fainter fill for weaker evidence, so limited data never looks as solid as strong data. */
const CONFIDENCE_OPACITY = { HIGH: 0.95, MEDIUM: 0.72, LOW: 0.5, INSUFFICIENT: 0.35 } as const;
const CONFIDENCE_RANK = { HIGH: 0, MEDIUM: 1, LOW: 2, INSUFFICIENT: 3 } as const;

declare global {
  interface Window {
    /** Exposed so automated browser tests can find where a community is drawn. */
    __ntdMap?: MapLibreMap;
  }
}

const STYLE = {
  version: 8 as const,
  sources: {},
  layers: [
    { id: 'background', type: 'background' as const, paint: { 'background-color': '#eef3f6' } },
  ],
};

export default function RiskMap({
  communities,
  intelligence,
  colourBy = 'vulnerability',
  layers,
  selectedId,
  onSelect,
  onUnavailable,
}: RiskMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [hiddenLabels, setHiddenLabels] = useState(0);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const byId = useMemo(
    () => new globalThis.Map(communities.map((c) => [c.communityId, c])),
    [communities],
  );

  const intelById = useMemo(
    () => new globalThis.Map((intelligence ?? []).map((r) => [r.communityId, r])),
    [intelligence],
  );

  const polygons = useMemo(
    () => ({
      ...DEMO_GEOGRAPHY.communities,
      features: DEMO_GEOGRAPHY.communities.features.map((f) => {
        const c = byId.get(f.properties.id);
        const i = intelById.get(f.properties.id);
        return {
          ...f,
          properties: {
            ...f.properties,
            inScope: Boolean(c),
            vulnerability: c?.vulnerabilityIndex ?? -1,
            priorityRank: i ? PRIORITY_RANK[i.priority] : 4,
            confidenceRank: i ? CONFIDENCE_RANK[i.confidence] : 3,
          },
        };
      }),
    }),
    [byId, intelById],
  );

  // create the map once
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
        container: el,
        style: STYLE,
        bounds: DEMO_GEOGRAPHY.bounds,
        // Narrow maps keep a small margin so the fictional geography fills the width; the wider
        // 80px margin on a phone would shrink it until the count badges collide.
        fitBoundsOptions: {
          padding:
            el.clientWidth > 0 && el.clientWidth < 500
              ? { top: 56, bottom: 24, left: 28, right: 28 }
              : { top: 24, bottom: 24, left: 80, right: 80 },
        },
        attributionControl: false,
        cooperativeGestures: true,
        dragRotate: false,
        pitchWithRotate: false,
      });
    } catch (e) {
      onUnavailable?.(e instanceof Error ? e.message : 'The map could not be drawn.');
      return;
    }
    mapRef.current = map;
    window.__ntdMap = map;
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      map.addSource('communities', { type: 'geojson', data: polygons as never });
      map.addSource('facilities', { type: 'geojson', data: DEMO_GEOGRAPHY.facilities as never });
      map.addSource('wards', { type: 'geojson', data: DEMO_GEOGRAPHY.wardBoundaries as never });
      map.addSource('lgas', { type: 'geojson', data: DEMO_GEOGRAPHY.lgaBoundaries as never });
      map.addSource('states', { type: 'geojson', data: DEMO_GEOGRAPHY.stateBoundaries as never });

      map.addLayer({
        id: 'community-fill',
        type: 'fill',
        source: 'communities',
        paint: {
          'fill-color': [
            'case',
            ['<', ['get', 'vulnerability'], 0],
            NO_DATA,
            [
              'step',
              ['get', 'vulnerability'],
              VULNERABILITY_COLORS.low,
              30,
              VULNERABILITY_COLORS.moderate,
              45,
              VULNERABILITY_COLORS.high,
            ],
          ],
          'fill-opacity': 0.95,
        },
      });
      map.addLayer({
        id: 'community-outline',
        type: 'line',
        source: 'communities',
        paint: { 'line-color': '#ffffff', 'line-width': 1 },
      });
      map.addLayer({
        id: 'ward-lines',
        type: 'line',
        source: 'wards',
        paint: { 'line-color': '#5d7686', 'line-width': 1.2, 'line-dasharray': [2, 2] },
      });
      map.addLayer({
        id: 'lga-lines',
        type: 'line',
        source: 'lgas',
        paint: { 'line-color': '#27414f', 'line-width': 2 },
      });
      map.addLayer({
        id: 'state-lines',
        type: 'line',
        source: 'states',
        paint: { 'line-color': '#0c2030', 'line-width': 3.5 },
      });
      map.addLayer({
        id: 'selected-outline',
        type: 'line',
        source: 'communities',
        filter: ['==', ['get', 'id'], ''],
        paint: { 'line-color': '#e8590c', 'line-width': 4 },
      });
      map.addLayer({
        id: 'facility-points',
        type: 'circle',
        source: 'facilities',
        paint: {
          'circle-radius': 6,
          'circle-color': '#ffffff',
          'circle-stroke-color': '#0c2030',
          'circle-stroke-width': 2.5,
        },
      });

      map.on('click', 'community-fill', (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (typeof id === 'string') onSelectRef.current(id);
      });
      map.on('click', 'facility-points', (e) => {
        const f = e.features?.[0];
        if (!f) return;
        e.originalEvent?.stopPropagation?.();
        new Popup({ closeButton: true })
          .setLngLat((f.geometry as unknown as { coordinates: [number, number] }).coordinates)
          .setText(`${String(f.properties?.name)} (fictional facility)`)
          .addTo(map);
      });
      for (const id of ['community-fill', 'facility-points']) {
        map.on('mouseenter', id, () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', id, () => (map.getCanvas().style.cursor = ''));
      }
      setReady(true);
    });

    return () => {
      for (const m of markers.current) m.remove();
      markers.current = [];
      map.remove();
      mapRef.current = null;
      if (window.__ntdMap === map) delete window.__ntdMap;
      setReady(false);
    };
    // The map is created once; data and layer changes are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource('communities') as { setData: (d: unknown) => void } | undefined)?.setData(
      polygons,
    );
  }, [polygons, ready]);

  // colour mode: water and environment context, or programme priority (faded by data confidence)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (colourBy === 'priority') {
      map.setPaintProperty('community-fill', 'fill-color', [
        'case',
        ['<', ['get', 'vulnerability'], 0],
        NO_DATA,
        [
          'step',
          ['get', 'priorityRank'],
          PRIORITY_COLORS[0],
          1,
          PRIORITY_COLORS[1],
          2,
          PRIORITY_COLORS[2],
          3,
          PRIORITY_COLORS[3],
          4,
          PRIORITY_COLORS[4],
        ],
      ]);
      map.setPaintProperty('community-fill', 'fill-opacity', [
        'step',
        ['get', 'confidenceRank'],
        CONFIDENCE_OPACITY.HIGH,
        1,
        CONFIDENCE_OPACITY.MEDIUM,
        2,
        CONFIDENCE_OPACITY.LOW,
        3,
        CONFIDENCE_OPACITY.INSUFFICIENT,
      ]);
    } else {
      map.setPaintProperty('community-fill', 'fill-color', [
        'case',
        ['<', ['get', 'vulnerability'], 0],
        NO_DATA,
        [
          'step',
          ['get', 'vulnerability'],
          VULNERABILITY_COLORS.low,
          30,
          VULNERABILITY_COLORS.moderate,
          45,
          VULNERABILITY_COLORS.high,
        ],
      ]);
      map.setPaintProperty('community-fill', 'fill-opacity', 0.95);
    }
  }, [colourBy, polygons, ready]);

  // layer switches
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const set = (id: string, on: boolean) =>
      map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
    set('community-fill', layers.vulnerability);
    set('facility-points', layers.facilities);
  }, [layers, ready]);

  // selection highlight
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setFilter('selected-outline', ['==', ['get', 'id'], selectedId ?? '']);
  }, [selectedId, ready]);

  // DOM markers: community names and signal badges. Names are placed by a deterministic
  // collision-aware layout (labelLayout.ts); a name that cannot be placed without overlapping is
  // hidden, never moved off its community, and stays available in the table, in the detail panel
  // and in the badge's accessible name. A badge shows a published count, or "n/s" when the count
  // is not shown. No exact suppressed value is written to the text, an attribute or a label.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const m of markers.current) m.remove();
    markers.current = [];

    interface Item {
      id: string;
      at: [number, number];
      rank: number;
      label: HTMLDivElement;
      marker: Marker;
      badge?: HTMLButtonElement;
    }
    const items: Item[] = [];
    for (const c of communities) {
      const at = DEMO_GEOGRAPHY.centroids[c.communityId];
      if (!at) continue;
      const intel = intelById.get(c.communityId);
      const label = document.createElement('div');
      label.className = 'ntd-map-label';
      label.dataset.community = c.communityId;
      // The visible name is decoration for sighted users; the same names are in the table.
      label.setAttribute('aria-hidden', 'true');
      label.textContent = c.name.replace('Demo ', '');
      if (colourBy === 'priority' && intel && c.communityId === selectedId) {
        // The longer priority text is revealed for the selected community only, so it does not
        // widen every label and cause more overlaps.
        const sub = document.createElement('div');
        sub.className = 'ntd-map-sublabel';
        sub.textContent = `${i18n.t(`intel.priority.${intel.priority}`)} · ${i18n.t(`intel.confidence.${intel.confidence}`)}`;
        label.appendChild(sub);
      }
      const marker = new Marker({ element: label, anchor: 'top-left' }).setLngLat(at).addTo(map);
      markers.current.push(marker);
      const item: Item = {
        id: c.communityId,
        at,
        rank: intel ? PRIORITY_RANK[intel.priority] : 5,
        label,
        marker,
      };

      // c.signals is null when the count is not shown (1 to 4, or withheld so that it cannot
      // be worked out by subtraction). Zero is a published count and draws no badge.
      if (layers.signals && (c.signals === null || c.signals > 0)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = styles.signalMarker!;
        button.textContent = c.signals === null ? `▲ ${NOT_SHOWN_SHORT}` : `▲ ${c.signals}`;
        button.dataset.selected = String(c.communityId === selectedId);
        button.dataset.direction = c.direction;
        button.dataset.community = c.communityId;
        const trend = c.direction;
        button.setAttribute(
          'aria-label',
          c.signals === null
            ? `${c.name}: ${NOT_SHOWN_SHORT}, demonstration risk signals not shown (small-count rule), ${trend}. Show community details.`
            : `${c.name}: ${c.signals} demonstration risk signals (HIGH or URGENT assessments), ${trend}. Show community details.`,
        );
        button.addEventListener('click', (ev) => {
          ev.stopPropagation();
          onSelectRef.current(c.communityId);
        });
        item.badge = button;
        markers.current.push(
          new Marker({ element: button, anchor: 'bottom' }).setLngLat(at).addTo(map),
        );
      }
      items.push(item);
    }

    const place = () => {
      const box = map.getContainer();
      const W = box.clientWidth;
      const H = box.clientHeight;
      const origin = box.getBoundingClientRect();
      const rel = (r: DOMRect): Rect => ({
        x: r.left - origin.left,
        y: r.top - origin.top,
        w: r.width,
        h: r.height,
      });
      const obstacles: Rect[] = [];
      const controls = box.querySelector('.maplibregl-ctrl-top-right');
      if (controls) obstacles.push(rel(controls.getBoundingClientRect()));
      const notice = box.parentElement?.querySelector('[data-testid="map-badge"]');
      if (notice) obstacles.push(rel(notice.getBoundingClientRect()));
      const inputs: LabelInput[] = [];
      // On a narrow map the badges are drawn smaller (still 24px high) so fewer of them touch.
      for (const it of items) it.badge?.setAttribute('data-compact', String(W < 500));
      for (const it of items) {
        const pt = map.project(it.at);
        if (it.badge) {
          const bw = it.badge.offsetWidth;
          const bh = it.badge.offsetHeight;
          obstacles.push({ x: pt.x - bw / 2, y: pt.y - bh, w: bw, h: bh });
        }
        inputs.push({
          id: it.id,
          px: pt.x,
          py: pt.y,
          w: it.label.offsetWidth,
          h: it.label.offsetHeight,
          rank: it.rank,
          pinned: it.id === selectedId,
        });
      }
      const out = layoutLabels(inputs, { width: W, height: H }, obstacles);
      let hidden = 0;
      for (const p of out) {
        const it = items.find((x) => x.id === p.id)!;
        const inp = inputs.find((x) => x.id === p.id)!;
        it.label.style.visibility = p.visible ? 'visible' : 'hidden';
        it.label.dataset.visible = String(p.visible);
        if (p.visible) it.marker.setOffset([p.x - inp.px, p.y - inp.py]);
        else hidden += 1;
      }
      setHiddenLabels(hidden);
    };
    place();
    map.on('moveend', place);
    map.on('resize', place);
    return () => {
      map.off('moveend', place);
      map.off('resize', place);
    };
  }, [communities, intelById, colourBy, layers.signals, selectedId, ready]);

  return (
    <div className={styles.mapShell}>
      <div className={styles.mapBadge} data-testid="map-badge">
        {GEOGRAPHY_LABEL}
      </div>
      <div
        ref={container}
        className={styles.mapCanvas}
        data-testid="risk-map"
        data-ready={ready}
        role="region"
        aria-label="Fictional demonstration map of communities. The same information is in the table below the map."
      />
      {hiddenLabels > 0 ? (
        <p className={styles.mapNote} data-testid="map-label-note">
          {i18n.t('programme.gis.labelsHidden', { count: hiddenLabels })}
        </p>
      ) : null}
    </div>
  );
}
