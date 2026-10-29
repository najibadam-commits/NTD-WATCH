import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, Notice } from '@ntd-watch/design-system';
import { REFERRAL_STAGE_LABELS, REFERRAL_STAGES } from '@ntd-watch/domain';
import { CommunityPanel } from '../components/CommunityPanel';
import { BarList, LineChart, RiskBar } from '../components/Charts';
import {
  DataStatus,
  DirectionPill,
  FilterBar,
  Kpi,
  PageHeader,
  QueryBoundary,
} from '../components/Common';
import { formatCount, formatCountShort, formatDate, formatPercent } from '../format';
import { useSummary, useLiveRefresh } from '../useProgrammeData';
import { useState } from 'react';
import styles from '../programme.module.css';

export function OverviewPage() {
  const { t } = useTranslation();
  const query = useSummary();
  const [selected, setSelected] = useState<string | undefined>();
  useLiveRefresh();

  return (
    <div className={styles.page}>
      <PageHeader title={t('programme.overview.title')} lead={t('programme.overview.lead')} />
      <FilterBar />
      <DataStatus query={query} />
      <QueryBoundary
        query={query}
        isEmpty={(s) => s.kpis.assessments === 0 && s.kpis.referrals === 0}
      >
        {(s) => {
          const k = s.kpis;
          // Compare only when the earlier period holds at least half as much data.
          // A count that is not shown cannot be compared.
          const comparable =
            s.previous.assessments !== null &&
            k.assessments !== null &&
            s.previous.assessments >= k.assessments * 0.5;
          // Communities whose signal count is not shown are listed apart: they are neither
          // ranked nor treated as zero.
          const top = [...s.communities]
            .filter((c) => c.signals !== null && c.signals > 0)
            .sort((a, b) => (b.signals ?? 0) - (a.signals ?? 0));
          const hiddenSignals = s.communities.filter((c) => c.signals === null);
          const attention = s.communities.filter((c) => c.direction === 'rising');
          return (
            <>
              <Notice tone="demo" title={t('programme.overview.provenanceTitle')}>
                <span data-testid="provenance-notice">
                  {t('programme.overview.provenanceBody')}
                </span>{' '}
                <strong data-testid="provenance-counts">
                  {t('programme.overview.provenanceCounts', {
                    seeded: formatCount(s.dataSources.seeded),
                    live: formatCount(s.dataSources.live),
                  })}
                </strong>{' '}
                {t('programme.overview.provenanceNote')}
              </Notice>
              <div className={styles.grid} aria-label={t('programme.overview.kpis')} role="group">
                <Kpi
                  label={t('programme.overview.assessments')}
                  value={formatCount(k.assessments)}
                  current={k.assessments}
                  previous={s.previous.assessments}
                  comparable={comparable}
                />
                <Kpi
                  label={t('programme.overview.signals')}
                  value={formatCount(k.highUrgent)}
                  current={k.highUrgent}
                  previous={s.previous.highUrgent}
                  comparable={comparable}
                  hint={t('programme.overview.signalShare', {
                    share: formatPercent(k.highUrgentShare, 1),
                  })}
                />
                <Kpi
                  label={t('programme.overview.referrals')}
                  value={formatCount(k.referrals)}
                  current={k.referrals}
                  previous={s.previous.referrals}
                  comparable={comparable}
                />
                <Kpi
                  label={t('programme.overview.completion')}
                  value={
                    k.referralCompletion === null ? formatCount(null) : `${k.referralCompletion}%`
                  }
                  hint={t('programme.overview.completionHint')}
                />
                <Kpi
                  label={t('programme.overview.unresolved')}
                  value={formatCount(k.unresolved)}
                  hint={t('programme.overview.unresolvedHint')}
                />
                <Kpi
                  label={t('programme.overview.followUps')}
                  value={formatCount(k.followUps)}
                  hint={t('programme.overview.followUpsWorse', {
                    count: formatCount(k.followUpsWorse),
                  })}
                />
                <Kpi
                  label={t('programme.overview.followUpsDue')}
                  value={formatCount(k.followUpsDue)}
                  hint={t('programme.overview.followUpsDueHint')}
                />
                <Kpi
                  label={t('programme.overview.chws')}
                  value={formatCount(k.activeChws)}
                  hint={t('programme.overview.coverage', {
                    reporting: k.communitiesReporting,
                    total: k.communitiesInScope,
                  })}
                />
              </div>

              <div className={styles.grid2}>
                <Card title={t('programme.overview.riskMix')}>
                  <RiskBar counts={s.byRisk} label={t('programme.overview.riskMix')} />
                  {k.unclassified === null || k.unclassified > 0 ? (
                    <p className={styles.muted}>
                      {t('programme.overview.unclassified', { count: formatCount(k.unclassified) })}
                    </p>
                  ) : null}
                </Card>
                <Card title={t('programme.overview.funnel')}>
                  <BarList
                    label={t('programme.overview.funnel')}
                    items={REFERRAL_STAGES.map((st) => ({
                      key: st,
                      label: REFERRAL_STAGE_LABELS[st],
                      value: s.referralStages[st],
                    }))}
                  />
                  <Link to="/programme/referrals">{t('programme.overview.openReferrals')}</Link>
                </Card>
              </div>

              <Card title={t('programme.overview.trendTitle')}>
                <LineChart
                  title={t('programme.overview.trendTitle')}
                  yLabel={t('programme.community.perWeek')}
                  nullText={formatCount(null)}
                  labels={s.weekly.map((w) => formatDate(w.weekStart))}
                  series={[
                    {
                      key: 'a',
                      name: t('programme.overview.assessments'),
                      values: s.weekly.map((w) => w.assessments),
                      color: 'var(--color-accent)',
                    },
                    {
                      key: 's',
                      name: t('programme.overview.signals'),
                      values: s.weekly.map((w) => w.signals),
                      color: 'var(--color-high)',
                      dashed: true,
                    },
                  ]}
                />
              </Card>

              <div className={styles.grid2}>
                <Card title={t('programme.overview.topCommunities')}>
                  {top.length === 0 ? (
                    <p>{t('programme.overview.noSignals')}</p>
                  ) : (
                    <BarList
                      label={t('programme.overview.topCommunities')}
                      items={top.slice(0, 8).map((c) => ({
                        key: c.communityId,
                        label: (
                          <button
                            type="button"
                            className={styles.linkBtn}
                            onClick={() => setSelected(c.communityId)}
                          >
                            {c.name}
                          </button>
                        ),
                        value: c.signals,
                      }))}
                    />
                  )}
                </Card>
                <Card title={t('programme.overview.attention')}>
                  {attention.length === 0 ? (
                    <p>{t('programme.overview.noAttention')}</p>
                  ) : (
                    <ul className={styles.stack} style={{ margin: 0, paddingLeft: '1.1rem' }}>
                      {attention.map((c) => (
                        <li key={c.communityId}>
                          <button
                            type="button"
                            className={styles.linkBtn}
                            onClick={() => setSelected(c.communityId)}
                          >
                            {c.name}
                          </button>{' '}
                          <DirectionPill direction={c.direction} /> (
                          {formatCountShort(c.signalsRecent)} {t('programme.overview.vs')}{' '}
                          {formatCountShort(c.signalsPrevious)})
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className={styles.muted}>{t('programme.overview.attentionNote')}</p>
                  {hiddenSignals.length > 0 ? (
                    <p className={styles.muted}>
                      {t('programme.overview.hiddenSignals', { count: hiddenSignals.length })}
                    </p>
                  ) : null}
                </Card>
              </div>

              {selected ? <CommunityPanel communityId={selected} showMapLink /> : null}
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
