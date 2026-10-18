import { useEffect, useMemo, useRef, useState } from 'react';
import { Map as MapLibreMap, Marker, NavigationControl, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { DEMO_GEOGRAPHY, GEOGRAPHY_LABEL } from '@ntd-watch/demo-data';
import type { CommunityStat } from '@ntd-watch/programme';
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

export interface RiskMapProps {
  communities: CommunityStat[];
  layers: MapLayers;
  selectedId?: string;
  onSelect: (communityId: string) => void;
  /** Called when the browser cannot draw the map (for example no WebGL). */
  onUnavailable?: (reason: string) => void;
}

const NO_DATA = '#d4dde3';
export const VULNERABILITY_COLORS = {
  low: '#cde6f2',
  moderate: '#6fb5d6',
  high: '#0a5578',
} as const;

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

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const byId = useMemo(
    () => new globalThis.Map(communities.map((c) => [c.communityId, c])),
    [communities],
  );

  const polygons = useMemo(
    () => ({
      ...DEMO_GEOGRAPHY.communities,
      features: DEMO_GEOGRAPHY.communities.features.map((f) => {
        const c = byId.get(f.properties.id);
        return {
          ...f,
          properties: {
            ...f.properties,
            inScope: Boolean(c),
            vulnerability: c?.vulnerabilityIndex ?? -1,
            signals: c?.signals ?? 0,
          },
        };
      }),
    }),
    [byId],
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
        fitBoundsOptions: { padding: 24 },
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

  // DOM markers: names and signal counts. Real buttons, so they work with a keyboard.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const m of markers.current) m.remove();
    markers.current = [];
    for (const c of communities) {
      const at = DEMO_GEOGRAPHY.centroids[c.communityId];
      if (!at) continue;
      const label = document.createElement('div');
      label.className = 'ntd-map-label';
      label.textContent = c.name.replace('Demo ', '');
      markers.current.push(
        new Marker({ element: label, anchor: 'top', offset: [0, 14] }).setLngLat(at).addTo(map),
      );

      if (layers.signals && c.signals > 0) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = styles.signalMarker!;
        button.textContent = `▲ ${c.signals}`;
        button.dataset.selected = String(c.communityId === selectedId);
        button.dataset.direction = c.direction;
        button.dataset.community = c.communityId;
        button.setAttribute(
          'aria-label',
          `${c.name}: ${c.signals} demonstration risk signals (HIGH or URGENT assessments), ${c.direction}. Show community details.`,
        );
        button.addEventListener('click', (ev) => {
          ev.stopPropagation();
          onSelectRef.current(c.communityId);
        });
        markers.current.push(
          new Marker({ element: button, anchor: 'bottom' }).setLngLat(at).addTo(map),
        );
      }
    }
  }, [communities, layers.signals, selectedId, ready]);

  return (
    <div className={styles.mapShell}>
      <div className={styles.mapBadge}>{GEOGRAPHY_LABEL}</div>
      <div
        ref={container}
        className={styles.mapCanvas}
        data-testid="risk-map"
        data-ready={ready}
        role="region"
        aria-label="Fictional demonstration map of communities. The same information is in the table below the map."
      />
    </div>
  );
}
