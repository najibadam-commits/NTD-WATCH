import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button, LoadingState, Notice } from '@ntd-watch/design-system';
import { GEOGRAPHY_NOTICE } from '@ntd-watch/domain';
import { lgaName } from '@ntd-watch/demo-data';
import type { CommunityIntelligence, CommunityStat } from '@ntd-watch/programme';
import { CommunityPanel } from '../components/CommunityPanel';
import {
  BandPill,
  DataStatus,
  DirectionPill,
  FilterBar,
  PageHeader,
  QueryBoundary,
} from '../components/Common';
import type { MapColourBy, MapLayers } from '../components/RiskMap';
import { PRIORITY_COLORS } from '../components/priorityColours';
import { DemoBanner } from '../components/IntelligenceSection';
import { ConfidencePill, PriorityPill } from '../components/Intelligence';
import { formatIndex, formatNumber } from '../format';
import { useLiveRefresh, useSummary } from '../useProgrammeData';
import styles from '../programme.module.css';
import { TableScroll } from '../components/TableScroll';

// MapLibre is large, so it loads only when this page is opened.
const RiskMap = lazy(() => import('../components/RiskMap'));

export function GisPage() {
  const { t } = useTranslation();
  const query = useSummary();
  const [params, setParams] = useSearchParams();
  const [layers, setLayers] = useState<MapLayers>({
    vulnerability: true,
    signals: true,
    facilities: true,
  });
  const [colourBy, setColourBy] = useState<MapColourBy>('vulnerability');
  const [mapProblem, setMapProblem] = useState<string | null>(null);
  useLiveRefresh();

  const wanted = params.get('community') ?? undefined;
  const select = (id: string) => setParams({ community: id }, { replace: true });
  const clear = () => setParams({}, { replace: true });

  const toggle = (key: keyof MapLayers) => (
    <label className={styles.toggle}>
      <input
        type="checkbox"
        checked={layers[key]}
        onChange={(e) => setLayers((l) => ({ ...l, [key]: e.target.checked }))}
      />
      {t(`programme.gis.layers.${key}`)}
    </label>
  );

  return (
    <div className={styles.page}>
      <PageHeader title={t('programme.gis.title')} lead={t('programme.gis.lead')} signals />
      <DemoBanner />
      <Notice tone="info">{GEOGRAPHY_NOTICE}</Notice>
      <FilterBar />
      <DataStatus query={query} />
      <QueryBoundary query={query} isEmpty={(s) => s.communities.length === 0}>
        {(s) => {
          const selected: CommunityStat | undefined = s.communities.find(
            (c) => c.communityId === wanted,
          );
          return (
            <>
              <div className={styles.panel}>
                <fieldset className={styles.toggles} style={{ border: 0, padding: 0, margin: 0 }}>
                  <legend className={styles.muted}>{t('programme.gis.layersTitle')}</legend>
                  {toggle('vulnerability')}
                  {toggle('signals')}
                  {toggle('facilities')}
                </fieldset>
                <fieldset className={styles.toggles} style={{ border: 0, padding: 0, margin: 0 }}>
                  <legend className={styles.muted}>{t('intel.gis.colourBy')}</legend>
                  {(['vulnerability', 'priority'] as const).map((m) => (
                    <label key={m} className={styles.toggle}>
                      <input
                        type="radio"
                        name="map-colour"
                        checked={colourBy === m}
                        onChange={() => setColourBy(m)}
                      />
                      {t(m === 'priority' ? 'intel.gis.byPriority' : 'intel.gis.byVulnerability')}
                    </label>
                  ))}
                </fieldset>
                {colourBy === 'priority' ? (
                  <div className={styles.mapLegend} data-testid="priority-legend">
                    <strong>{t('intel.gis.legendPriority')}</strong>
                    <span className={styles.ramp}>
                      {(
                        [
                          'HIGH_PRIORITY_FOR_ATTENTION',
                          'PRIORITY_FOR_REVIEW',
                          'MONITOR',
                          'LOW_PRIORITY',
                          'INSUFFICIENT_DATA',
                        ] as const
                      ).map((p, i) => (
                        <span key={p}>
                          <i
                            className={styles.swatch}
                            style={{ background: PRIORITY_COLORS[i], border: '1px solid #4a1d3f' }}
                          />{' '}
                          {t(`intel.priority.${p}`)}
                        </span>
                      ))}
                    </span>
                    <span className={styles.intelMapNote}>{t('intel.gis.legendConfidence')}</span>
                    <span className={styles.intelMapNote}>{t('intel.gis.mapNote')}</span>
                  </div>
                ) : null}
                <div className={styles.mapLegend} hidden={colourBy === 'priority'}>
                  <strong>{t('programme.gis.legendVulnerability')}</strong>
                  <span className={styles.ramp}>
                    <span>
                      <i className={styles.swatch} style={{ background: '#cde6f2' }} />{' '}
                      {t('programme.band.LOW')}
                    </span>
                    <span>
                      <i className={styles.swatch} style={{ background: '#6fb5d6' }} />{' '}
                      {t('programme.band.MODERATE')}
                    </span>
                    <span>
                      <i className={styles.swatch} style={{ background: '#0a5578' }} />{' '}
                      {t('programme.band.HIGH')}
                    </span>
                    <span>
                      <i className={styles.swatch} style={{ background: '#d4dde3' }} />{' '}
                      {t('programme.band.INSUFFICIENT_DATA')}
                    </span>
                  </span>
                  <span>
                    <strong>▲ n</strong> {t('programme.gis.legendSignals')}
                  </span>
                  <span>
                    <i
                      className={styles.swatch}
                      style={{
                        background: '#fff',
                        border: '2px solid #0c2030',
                        borderRadius: '50%',
                      }}
                    />{' '}
                    {t('programme.gis.legendFacility')}
                  </span>
                </div>
              </div>

              <div className={styles.mapSplit}>
                <div className={styles.stack}>
                  {mapProblem ? (
                    <Notice tone="info" title={t('programme.gis.noMapTitle')}>
                      {t('programme.gis.noMapBody')} ({mapProblem})
                    </Notice>
                  ) : (
                    <Suspense fallback={<LoadingState label={t('programme.gis.loadingMap')} />}>
                      <RiskMap
                        communities={s.communities}
                        intelligence={s.intelligence.rows}
                        colourBy={colourBy}
                        layers={layers}
                        selectedId={selected?.communityId}
                        onSelect={select}
                        onUnavailable={setMapProblem}
                      />
                    </Suspense>
                  )}
                </div>
                <div>
                  {selected ? (
                    <div className={styles.stack}>
                      <CommunityPanel communityId={selected.communityId} />
                      <Button variant="secondary" size="sm" onClick={clear}>
                        {t('programme.gis.clearSelection')}
                      </Button>
                    </div>
                  ) : (
                    <div className={styles.panel}>
                      <h2>{t('programme.community.title')}</h2>
                      <p>{t('programme.gis.selectPrompt')}</p>
                    </div>
                  )}
                </div>
              </div>

              <section className={styles.panel} aria-labelledby="gis-table">
                <h2 id="gis-table">{t('programme.gis.tableTitle')}</h2>
                <p className={styles.muted}>{t('programme.gis.tableLead')}</p>
                <TableScroll>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">{t('programme.table.community')}</th>
                        <th scope="col">{t('programme.table.lga')}</th>
                        <th scope="col" className={styles.num}>
                          {t('programme.table.assessments')}
                        </th>
                        <th scope="col" className={styles.num}>
                          {t('programme.table.signals')}
                        </th>
                        <th scope="col">{t('programme.table.direction')}</th>
                        <th scope="col" className={styles.num}>
                          {t('programme.table.index')}
                        </th>
                        <th scope="col">{t('programme.table.band')}</th>
                        <th scope="col">{t('intel.col.priority')}</th>
                        <th scope="col">{t('intel.col.confidence')}</th>
                        <th scope="col">
                          <span className="visually-hidden">{t('programme.table.actions')}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.communities.map((c) => (
                        <tr
                          key={c.communityId}
                          data-selected={c.communityId === selected?.communityId}
                        >
                          <th scope="row">{c.name}</th>
                          <td>{lgaName(c.lgaId)}</td>
                          <td className={styles.num}>{formatNumber(c.assessments)}</td>
                          <td className={styles.num}>{formatNumber(c.signals)}</td>
                          <td>
                            <DirectionPill direction={c.direction} />
                          </td>
                          <td className={styles.num}>{formatIndex(c.vulnerabilityIndex)}</td>
                          <td>
                            <BandPill band={c.vulnerabilityBand} />
                          </td>
                          <IntelCells s={s} id={c.communityId} />
                          <td>
                            <Button
                              variant="secondary"
                              size="sm"
                              aria-pressed={c.communityId === selected?.communityId}
                              aria-label={t('programme.gis.showDetails', { name: c.name })}
                              onClick={() => select(c.communityId)}
                            >
                              {t('programme.gis.details')}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              </section>
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}

function IntelCells({
  s,
  id,
}: {
  s: { intelligence: { rows: CommunityIntelligence[] } };
  id: string;
}) {
  const row = s.intelligence.rows.find((r) => r.communityId === id);
  if (!row) {
    return (
      <>
        <td>–</td>
        <td>–</td>
      </>
    );
  }
  return (
    <>
      <td>
        <PriorityPill priority={row.priority} />
      </td>
      <td>
        <ConfidencePill confidence={row.confidence} />
      </td>
    </>
  );
}
