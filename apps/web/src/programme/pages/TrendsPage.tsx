import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@ntd-watch/design-system';
import { LineChart, StackedColumns } from '../components/Charts';
import { DataStatus, FilterBar, PageHeader, QueryBoundary } from '../components/Common';
import { formatCount, formatDate } from '../format';
import { useLiveRefresh, useSummary } from '../useProgrammeData';
import styles from '../programme.module.css';

const METRICS = ['assessments', 'signals', 'referrals', 'vulnerabilityIndex'] as const;
type Metric = (typeof METRICS)[number];

export function TrendsPage() {
  const { t } = useTranslation();
  const query = useSummary();
  const [metric, setMetric] = useState<Metric>('signals');
  useLiveRefresh();
  return (
    <div className={styles.page}>
      <PageHeader title={t('programme.trends.title')} lead={t('programme.trends.lead')} signals />
      <FilterBar />
      <DataStatus query={query} />
      <QueryBoundary query={query} isEmpty={(s) => s.kpis.assessments === 0}>
        {(s) => {
          const labels = s.weekly.map((w) => formatDate(w.weekStart));
          return (
            <>
              <Card title={t('programme.trends.metricTitle')}>
                <label className={styles.field} style={{ maxWidth: '20rem' }}>
                  {t('programme.trends.metric')}
                  <select value={metric} onChange={(e) => setMetric(e.target.value as Metric)}>
                    {METRICS.map((m) => (
                      <option key={m} value={m}>
                        {t(`programme.trends.metrics.${m}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <LineChart
                  title={t(`programme.trends.metrics.${metric}`)}
                  yLabel={t(`programme.trends.metrics.${metric}`)}
                  labels={labels}
                  decimals={metric === 'vulnerabilityIndex' ? 1 : 0}
                  nullText={metric === 'vulnerabilityIndex' ? '–' : formatCount(null)}
                  series={[
                    {
                      key: metric,
                      name: t(`programme.trends.metrics.${metric}`),
                      values: s.weekly.map((w) => w[metric]),
                      color: 'var(--color-accent)',
                    },
                  ]}
                />
                <p className={styles.muted}>{t('programme.trends.partialWeek')}</p>
              </Card>
              <Card title={t('programme.trends.mixTitle')}>
                <StackedColumns
                  title={t('programme.trends.mixTitle')}
                  labels={labels}
                  stacks={s.weekly.map((w) => w.byRisk)}
                  totals={s.weekly.map((w) => w.assessments)}
                />
              </Card>
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
