import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@ntd-watch/design-system';
import { lgaName } from '@ntd-watch/demo-data';
import { CommunityPanel } from '../components/CommunityPanel';
import { BarList } from '../components/Charts';
import {
  DataStatus,
  DirectionPill,
  FilterBar,
  PageHeader,
  QueryBoundary,
} from '../components/Common';
import { formatNumber, formatPercent } from '../format';
import { useLiveRefresh, useSummary } from '../useProgrammeData';
import styles from '../programme.module.css';
import { TableScroll } from '../components/TableScroll';

export function SignalsPage() {
  const { t } = useTranslation();
  const query = useSummary();
  const [selected, setSelected] = useState<string | undefined>();
  useLiveRefresh();
  return (
    <div className={styles.page}>
      <PageHeader title={t('programme.signals.title')} lead={t('programme.signals.lead')} signals />
      <FilterBar />
      <DataStatus query={query} />
      <QueryBoundary query={query} isEmpty={(s) => s.kpis.assessments === 0}>
        {(s) => {
          const ranked = [...s.communities]
            .filter((c) => c.assessments > 0)
            .sort((a, b) => b.signals - a.signals || b.signalsRecent - a.signalsRecent);
          const symptoms = Object.entries(s.symptomCounts).sort((a, b) => b[1] - a[1]);
          return (
            <>
              <div className={styles.grid2}>
                <Card title={t('programme.signals.byCommunity')}>
                  <BarList
                    label={t('programme.signals.byCommunity')}
                    items={ranked
                      .slice(0, 10)
                      .map((c) => ({ key: c.communityId, label: c.name, value: c.signals }))}
                  />
                </Card>
                <Card title={t('programme.signals.indicators')}>
                  <p className={styles.muted}>{t('programme.signals.indicatorsNote')}</p>
                  <BarList
                    label={t('programme.signals.indicators')}
                    items={symptoms.slice(0, 8).map(([id, n]) => ({
                      key: id,
                      label: t(`options.symptoms.${id}`, { defaultValue: id }),
                      value: n,
                    }))}
                  />
                </Card>
              </div>

              <section className={styles.panel} aria-labelledby="sig-table">
                <h2 id="sig-table">{t('programme.signals.tableTitle')}</h2>
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
                        <th scope="col" className={styles.num}>
                          {t('programme.table.urgent')}
                        </th>
                        <th scope="col" className={styles.num}>
                          {t('programme.table.share')}
                        </th>
                        <th scope="col" className={styles.num}>
                          {t('programme.table.recent')}
                        </th>
                        <th scope="col" className={styles.num}>
                          {t('programme.table.previous')}
                        </th>
                        <th scope="col">{t('programme.table.direction')}</th>
                        <th scope="col">
                          <span className="visually-hidden">{t('programme.table.actions')}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranked.map((c) => (
                        <tr key={c.communityId} data-selected={c.communityId === selected}>
                          <th scope="row">{c.name}</th>
                          <td>{lgaName(c.lgaId)}</td>
                          <td className={styles.num}>{formatNumber(c.assessments)}</td>
                          <td className={styles.num}>{formatNumber(c.signals)}</td>
                          <td className={styles.num}>{formatNumber(c.byRisk.URGENT)}</td>
                          <td className={styles.num}>
                            {formatPercent(c.signals / c.assessments, 1)}
                          </td>
                          <td className={styles.num}>{formatNumber(c.signalsRecent)}</td>
                          <td className={styles.num}>{formatNumber(c.signalsPrevious)}</td>
                          <td>
                            <DirectionPill direction={c.direction} />
                          </td>
                          <td>
                            <button
                              type="button"
                              className={styles.linkBtn}
                              aria-label={t('programme.gis.showDetails', { name: c.name })}
                              onClick={() => setSelected(c.communityId)}
                            >
                              {t('programme.gis.details')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
                <p className={styles.muted}>{t('programme.signals.directionNote')}</p>
              </section>
              {selected ? <CommunityPanel communityId={selected} showMapLink /> : null}
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
