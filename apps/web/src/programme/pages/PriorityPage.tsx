import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Notice } from '@ntd-watch/design-system';
import { lgaName } from '@ntd-watch/demo-data';
import {
  PRIORITY_CATEGORIES,
  PRIORITY_LABELS,
  SIGNAL_BAND_LIMITS,
  SYNTHETIC_NOTICE,
  VULNERABILITY_BAND_LIMITS,
  countByCategory,
  rankPriorities,
  toCsv,
  type PriorityCategory,
  type PriorityRow,
} from '@ntd-watch/programme';
import { CommunityPanel } from '../components/CommunityPanel';
import { IntelligenceSection } from '../components/IntelligenceSection';
import {
  BandPill,
  DataStatus,
  DirectionPill,
  FilterBar,
  PageHeader,
  QueryBoundary,
} from '../components/Common';
import { TableScroll } from '../components/TableScroll';
import { formatIndex, formatNumber, formatPercent } from '../format';
import { useLiveRefresh, useSummary } from '../useProgrammeData';
import styles from '../programme.module.css';

/** Matrix cells in reading order: columns are vulnerability (low, high), rows are signal (high, low). */
const MATRIX: { category: PriorityCategory; row: 'high' | 'low'; col: 'low' | 'high' }[] = [
  { category: 'INVESTIGATE_SIGNAL', row: 'high', col: 'low' },
  { category: 'PRIORITY_INTERVENTION', row: 'high', col: 'high' },
  { category: 'LOWER_PRIORITY', row: 'low', col: 'low' },
  { category: 'PREVENTION_SURVEILLANCE', row: 'low', col: 'high' },
];

function download(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvOf(rows: readonly PriorityRow[]): string {
  return toCsv([
    [SYNTHETIC_NOTICE],
    [
      'community',
      'lga',
      'priority category',
      'signal band',
      'signal share %',
      'vulnerability band',
      'vulnerability index',
      'trend',
      'assessments',
      'referrals',
      'referrals completed',
      'unresolved referrals',
      'follow-ups',
      'follow-ups due',
    ],
    ...rows.map((r) => [
      r.name,
      lgaName(r.lgaId),
      PRIORITY_LABELS[r.category],
      r.signalBand,
      r.signalShare === null ? '' : Math.round(r.signalShare * 100),
      r.vulnerabilityBand,
      r.vulnerabilityIndex === null ? '' : r.vulnerabilityIndex.toFixed(1),
      r.direction,
      r.assessments,
      r.referrals,
      r.referralsCompleted,
      r.unresolved,
      r.followUps,
      r.followUpsDue,
    ]),
  ]);
}

/**
 * Experience C: priority communities. Combines the NTD signal layer with the community
 * vulnerability layer in a 2 x 2 matrix and a ranked table. Categories are DEMONSTRATION
 * categories chosen for the prototype: a prompt for a human decision, not an outbreak finding.
 */
export function PriorityPage() {
  const { t } = useTranslation();
  const query = useSummary();
  const [category, setCategory] = useState<PriorityCategory | ''>('');
  const [trend, setTrend] = useState<'' | 'rising' | 'steady' | 'falling'>('');
  const [openWork, setOpenWork] = useState(false);
  const [selected, setSelected] = useState<string | undefined>();
  useLiveRefresh();

  const ranked = useMemo(
    () => (query.data ? rankPriorities(query.data.communities) : []),
    [query.data],
  );
  const counts = useMemo(() => countByCategory(ranked), [ranked]);
  const shown = ranked.filter(
    (r) =>
      (!category || r.category === category) &&
      (!trend || r.direction === trend) &&
      (!openWork || r.unresolved + r.followUpsDue > 0),
  );

  return (
    <div className={styles.page}>
      <PageHeader
        title={t('programme.priority.title')}
        lead={t('programme.priority.lead')}
        signals
      />
      <Notice tone="info">{t('programme.priority.notOutbreak')}</Notice>
      <FilterBar />
      <DataStatus query={query} />
      <QueryBoundary query={query} isEmpty={(s) => s.kpis.assessments === 0}>
        {(s) => (
          <>
            <IntelligenceSection summary={s} />
            <Card title={t('programme.priority.matrixTitle')}>
              <p className={styles.muted}>
                {t('programme.priority.matrixNote', {
                  signalHigh: Math.round(SIGNAL_BAND_LIMITS.high * 100),
                  vulnHigh: VULNERABILITY_BAND_LIMITS.high,
                })}
              </p>
              <div
                className={styles.matrix}
                role="group"
                aria-label={t('programme.priority.matrixTitle')}
              >
                <span className={styles.matrixAxis} aria-hidden="true" />
                <span className={styles.matrixAxis}>{t('programme.priority.vulnLow')}</span>
                <span className={styles.matrixAxis}>{t('programme.priority.vulnHigh')}</span>
                {(['high', 'low'] as const).map((row) => (
                  <MatrixRow key={row} row={row}>
                    {MATRIX.filter((m) => m.row === row)
                      .sort((a, b) => (a.col === 'low' ? -1 : 1) - (b.col === 'low' ? -1 : 1))
                      .map((m) => (
                        <button
                          key={m.category}
                          type="button"
                          className={styles.matrixCell}
                          data-category={m.category}
                          aria-pressed={category === m.category}
                          onClick={() => setCategory(category === m.category ? '' : m.category)}
                        >
                          <strong>{PRIORITY_LABELS[m.category]}</strong>
                          <span className={styles.matrixCount}>
                            {t('programme.priority.communities', { count: counts[m.category] })}
                          </span>
                          <span className={styles.muted}>
                            {ranked
                              .filter((r) => r.category === m.category)
                              .map((r) => r.name)
                              .join(', ') || '–'}
                          </span>
                        </button>
                      ))}
                  </MatrixRow>
                ))}
              </div>
              {counts.INSUFFICIENT_DATA > 0 ? (
                <p className={styles.muted}>
                  {t('programme.priority.insufficient', { count: counts.INSUFFICIENT_DATA })}
                </p>
              ) : null}
            </Card>

            <section className={styles.panel} aria-labelledby="prio-table">
              <h2 id="prio-table">{t('programme.priority.tableTitle')}</h2>
              <div className={styles.filters}>
                <label className={styles.field}>
                  {t('programme.priority.filterCategory')}
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PriorityCategory | '')}
                  >
                    <option value="">{t('programme.filters.all')}</option>
                    {PRIORITY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {PRIORITY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  {t('programme.priority.filterTrend')}
                  <select value={trend} onChange={(e) => setTrend(e.target.value as typeof trend)}>
                    <option value="">{t('programme.filters.all')}</option>
                    <option value="rising">{t('programme.direction.rising')}</option>
                    <option value="steady">{t('programme.direction.steady')}</option>
                    <option value="falling">{t('programme.direction.falling')}</option>
                  </select>
                </label>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={openWork}
                    onChange={(e) => setOpenWork(e.target.checked)}
                  />
                  {t('programme.priority.filterOpen')}
                </label>
              </div>
              <div className={styles.between}>
                <p className={styles.muted} role="status">
                  {t('programme.priority.showing', { shown: shown.length, total: ranked.length })}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => download('ntd-watch-priority-communities.csv', csvOf(shown))}
                >
                  {t('programme.priority.exportCsv')}
                </Button>
              </div>
              <TableScroll>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">{t('programme.priority.rank')}</th>
                      <th scope="col">{t('programme.table.community')}</th>
                      <th scope="col">{t('programme.priority.category')}</th>
                      <th scope="col">{t('programme.priority.signal')}</th>
                      <th scope="col">{t('programme.priority.vulnerability')}</th>
                      <th scope="col">{t('programme.priority.trend')}</th>
                      <th scope="col" className={styles.num}>
                        {t('programme.table.assessments')}
                      </th>
                      <th scope="col" className={styles.num}>
                        {t('programme.priority.referrals')}
                      </th>
                      <th scope="col" className={styles.num}>
                        {t('programme.priority.openWork')}
                      </th>
                      <th scope="col">
                        <span className="visually-hidden">{t('programme.table.actions')}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((r, i) => (
                      <tr key={r.communityId} data-selected={r.communityId === selected}>
                        <td>{i + 1}</td>
                        <th scope="row">
                          {r.name}
                          <br />
                          <span className={styles.muted}>{lgaName(r.lgaId)}</span>
                        </th>
                        <td>{PRIORITY_LABELS[r.category]}</td>
                        <td>
                          <BandPill band={r.signalBand} /> {formatPercent(r.signalShare)}
                        </td>
                        <td>
                          <BandPill band={r.vulnerabilityBand} />{' '}
                          {formatIndex(r.vulnerabilityIndex)}
                        </td>
                        <td>
                          <DirectionPill direction={r.direction} />
                        </td>
                        <td className={styles.num}>{formatNumber(r.assessments)}</td>
                        <td className={styles.num}>
                          {r.referralsCompleted}/{r.referrals}
                        </td>
                        <td className={styles.num}>
                          {t('programme.priority.openWorkCell', {
                            unresolved: r.unresolved,
                            due: r.followUpsDue,
                          })}
                        </td>
                        <td>
                          <button
                            type="button"
                            className={styles.linkBtn}
                            aria-label={t('programme.gis.showDetails', { name: r.name })}
                            onClick={() => setSelected(r.communityId)}
                          >
                            {t('programme.gis.details')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
              {shown.length === 0 ? (
                <p className={styles.muted}>{t('programme.priority.noneMatch')}</p>
              ) : null}
            </section>

            {selected ? (
              <>
                <section className={styles.panel} aria-label={t('programme.priority.why')}>
                  <h2>{t('programme.priority.why')}</h2>
                  <ul>
                    {(ranked.find((r) => r.communityId === selected)?.why ?? []).map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </section>
                <CommunityPanel communityId={selected} showMapLink />
              </>
            ) : null}
          </>
        )}
      </QueryBoundary>
    </div>
  );
}

function MatrixRow({ row, children }: { row: 'high' | 'low'; children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <>
      <span className={styles.matrixAxis}>
        {row === 'high' ? t('programme.priority.signalHigh') : t('programme.priority.signalLow')}
      </span>
      {children}
    </>
  );
}
