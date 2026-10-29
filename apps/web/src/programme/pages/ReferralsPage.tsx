import { useTranslation } from 'react-i18next';
import { Card, Notice } from '@ntd-watch/design-system';
import { REFERRAL_STAGE_LABELS, REFERRAL_STAGES } from '@ntd-watch/domain';
import { lgaName } from '@ntd-watch/demo-data';
import { BarList } from '../components/Charts';
import { DataStatus, FilterBar, Kpi, PageHeader, QueryBoundary } from '../components/Common';
import { formatCount, formatCountShort, NOT_SHOWN_SHORT } from '../format';

const pct = (n: number | null) => (n === null ? formatCount(null) : `${n}%`);
import { useLiveRefresh, useReferralMonitor } from '../useProgrammeData';
import { useRole } from '../useProgrammeData';
import styles from '../programme.module.css';
import { TableScroll } from '../components/TableScroll';

export function ReferralsPage() {
  const { t } = useTranslation();
  const query = useReferralMonitor();
  const role = useRole();
  useLiveRefresh();
  return (
    <div className={styles.page}>
      <PageHeader title={t('programme.referrals.title')} lead={t('programme.referrals.lead')} />
      <Notice tone="info">{t('programme.referrals.aggregateOnly')}</Notice>
      {role === 'facility' ? (
        <Notice tone="info">{t('programme.referrals.facilityOnly')}</Notice>
      ) : null}
      <FilterBar />
      <DataStatus query={query} />
      <QueryBoundary
        query={query}
        isEmpty={(m) => m.total === 0}
        emptyTitle={t('programme.referrals.empty')}
      >
        {(m) => (
          <>
            <div className={styles.grid} role="group" aria-label={t('programme.overview.kpis')}>
              <Kpi label={t('programme.referrals.total')} value={formatCount(m.total)} />
              <Kpi
                label={t('programme.overview.completion')}
                value={pct(m.completionRate)}
                hint={t('programme.overview.completionHint')}
              />
              <Kpi
                label={t('programme.overview.unresolved')}
                value={formatCount(m.unresolved)}
                hint={t('programme.referrals.unresolvedHint', { days: m.maxUnresolvedDays })}
              />
              <Kpi
                label={t('programme.referrals.medianAccept')}
                value={
                  m.medianHoursToAccept === null ? '–' : `${m.medianHoursToAccept.toFixed(1)} h`
                }
              />
              <Kpi
                label={t('programme.referrals.medianAssessed')}
                value={
                  m.medianDaysToAssessed === null ? '–' : `${m.medianDaysToAssessed.toFixed(1)} d`
                }
              />
            </div>

            <div className={styles.grid2}>
              <Card title={t('programme.referrals.reached')}>
                <p className={styles.muted}>{t('programme.referrals.reachedNote')}</p>
                <BarList
                  label={t('programme.referrals.reached')}
                  max={Math.max(
                    1,
                    m.total ?? 0,
                    ...REFERRAL_STAGES.map((st) => m.reached[st] ?? 0),
                  )}
                  items={REFERRAL_STAGES.map((st) => ({
                    key: st,
                    label: REFERRAL_STAGE_LABELS[st],
                    value: m.reached[st],
                  }))}
                />
              </Card>
              <Card title={t('programme.referrals.ageing')}>
                <p className={styles.muted}>
                  {t('programme.referrals.ageingNote', { days: m.maxUnresolvedDays })}
                </p>
                <BarList
                  label={t('programme.referrals.ageing')}
                  items={m.ageing.map((a) => ({ key: a.label, label: a.label, value: a.count }))}
                />
              </Card>
            </div>

            <section className={styles.panel} aria-labelledby="ref-fac">
              <h2 id="ref-fac">{t('programme.referrals.byFacility')}</h2>
              <TableScroll>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">{t('programme.table.facility')}</th>
                      <th scope="col">{t('programme.table.lga')}</th>
                      <th scope="col" className={styles.num}>
                        {t('programme.referrals.total')}
                      </th>
                      {REFERRAL_STAGES.map((st) => (
                        <th key={st} scope="col" className={styles.num}>
                          {REFERRAL_STAGE_LABELS[st]}
                        </th>
                      ))}
                      <th scope="col" className={styles.num}>
                        {t('programme.table.completion')}
                      </th>
                      <th scope="col" className={styles.num}>
                        {t('programme.overview.unresolved')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.byFacility.map((f) => (
                      <tr key={f.facilityId}>
                        <th scope="row">{f.name}</th>
                        <td>{lgaName(f.lgaId)}</td>
                        <td className={styles.num}>{formatCountShort(f.referrals)}</td>
                        {REFERRAL_STAGES.map((st) => (
                          <td key={st} className={styles.num}>
                            {formatCountShort(f.byStage[st])}
                          </td>
                        ))}
                        <td className={styles.num}>
                          {f.completionRate === null ? NOT_SHOWN_SHORT : `${f.completionRate}%`}
                        </td>
                        <td className={styles.num}>{formatCountShort(f.unresolved)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
              <p className={styles.muted}>{t('programme.referrals.currentStageNote')}</p>
              <p className={styles.muted}>{t('programme.smallCountNote')}</p>
            </section>

            {m.byLga.length > 1 ? (
              <Card title={t('programme.referrals.byLga')}>
                <BarList
                  label={t('programme.referrals.byLga')}
                  items={m.byLga.map((l) => ({
                    key: l.lgaId,
                    label: l.name,
                    value: l.completionRate,
                    display:
                      l.completionRate === null || l.referrals === null
                        ? formatCount(null)
                        : `${l.completionRate}% of ${l.referrals}`,
                  }))}
                  max={100}
                />
              </Card>
            ) : null}
          </>
        )}
      </QueryBoundary>
    </div>
  );
}
