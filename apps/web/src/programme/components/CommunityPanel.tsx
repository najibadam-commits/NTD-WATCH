import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Notice } from '@ntd-watch/design-system';
import { PROGRAMME_ATTENTION, REFERRAL_STAGE_LABELS, REFERRAL_STAGES } from '@ntd-watch/domain';
import { lgaName, stateName, wardName } from '@ntd-watch/demo-data';
import { formatIndex, formatNumber, formatPercent, formatDate } from '../format';
import { useCommunityDetail } from '../useProgrammeData';
import { BarList, LineChart, RiskBar } from './Charts';
import { BandPill, DirectionPill, QueryBoundary } from './Common';
import styles from '../programme.module.css';

/**
 * A community's synthetic summary. It is built only from aggregates: no person, no record and
 * no free text reaches this panel, so it is safe to show to every programme role.
 */
export function CommunityPanel({
  communityId,
  showMapLink = false,
}: {
  communityId: string;
  showMapLink?: boolean;
}) {
  const { t } = useTranslation();
  const query = useCommunityDetail(communityId);
  return (
    <section
      className={styles.panel}
      aria-label={t('programme.community.title')}
      aria-live="polite"
    >
      <QueryBoundary query={query}>
        {(d) => {
          const s = d.stat;
          const wash = [
            {
              key: 'water',
              label: t('programme.community.unimprovedWater'),
              value: s.wash.unimprovedWater,
            },
            {
              key: 'san',
              label: t('programme.community.noSanitation'),
              value: s.wash.noSanitation,
            },
            {
              key: 'hand',
              label: t('programme.community.noHandwashing'),
              value: s.wash.noHandwashing,
            },
            {
              key: 'stand',
              label: t('programme.community.standingWater'),
              value: s.wash.standingWater,
            },
          ];
          return (
            <>
              <div className={styles.stack}>
                <h2>{s.name}</h2>
                <p className={styles.muted}>
                  {stateName(s.stateId)} › {lgaName(s.lgaId)} › {wardName(s.wardId)}
                </p>
                <Notice tone="info">{t('programme.community.aggregateOnly')}</Notice>
              </div>

              {s.assessments === 0 ? (
                <p>
                  {s.chwsAssigned === 0
                    ? t('programme.community.noChw')
                    : t('programme.community.noData')}
                </p>
              ) : (
                <>
                  <RiskBar counts={s.byRisk} label={t('programme.community.riskMix')} />
                  <dl className={styles.kv}>
                    <dt>{t('programme.community.assessments')}</dt>
                    <dd>{formatNumber(s.assessments)}</dd>
                    <dt>{t('programme.community.signals')}</dt>
                    <dd>{formatNumber(s.signals)}</dd>
                    <dt>{t('programme.community.signalsRecent')}</dt>
                    <dd>
                      {formatNumber(s.signalsRecent)} ({t('programme.community.previous')}{' '}
                      {formatNumber(s.signalsPrevious)})
                    </dd>
                    <dt>{t('programme.community.direction')}</dt>
                    <dd>
                      <DirectionPill direction={s.direction} />
                    </dd>
                    <dt>{t('programme.community.referrals')}</dt>
                    <dd>
                      {formatNumber(s.referrals)} ({formatNumber(s.referralsCompleted)}{' '}
                      {t('programme.community.completed')})
                    </dd>
                    <dt>{t('programme.community.unresolved')}</dt>
                    <dd>{formatNumber(s.unresolved)}</dd>
                    <dt>{t('programme.community.chws')}</dt>
                    <dd>
                      {s.chwsActive} / {s.chwsAssigned}
                    </dd>
                  </dl>
                  {s.signals > 0 && s.direction === 'rising' ? (
                    <Notice tone="demo">{PROGRAMME_ATTENTION}</Notice>
                  ) : null}

                  <div className={styles.stack}>
                    <div className={styles.between}>
                      <h3>{t('programme.community.vulnerability')}</h3>
                      <BandPill band={s.vulnerabilityBand} />
                    </div>
                    <p className={styles.muted}>
                      {t('programme.community.index')}:{' '}
                      <strong>{formatIndex(s.vulnerabilityIndex)}</strong>
                      {s.vulnerabilityIndex === null
                        ? ` ${t('programme.community.tooFew')}`
                        : ' / 100'}
                    </p>
                    <BarList
                      label={t('programme.community.washBreakdown')}
                      max={1}
                      items={wash.map((w) => ({
                        key: w.key,
                        label: w.label,
                        value: w.value ?? 0,
                        display: formatPercent(w.value),
                      }))}
                    />
                  </div>

                  <LineChart
                    title={t('programme.community.weeklyTitle')}
                    yLabel={t('programme.community.perWeek')}
                    labels={d.weekly.map((w) => formatDate(w.weekStart))}
                    series={[
                      {
                        key: 'a',
                        name: t('programme.community.assessments'),
                        values: d.weekly.map((w) => w.assessments),
                        color: 'var(--color-accent)',
                      },
                      {
                        key: 's',
                        name: t('programme.community.signals'),
                        values: d.weekly.map((w) => w.signals),
                        color: 'var(--color-high)',
                        dashed: true,
                      },
                    ]}
                  />

                  <div className={styles.stack}>
                    <h3>{t('programme.community.referralStages')}</h3>
                    <dl className={styles.kv}>
                      {REFERRAL_STAGES.map((st) => (
                        <div key={st} style={{ display: 'contents' }}>
                          <dt>{REFERRAL_STAGE_LABELS[st]}</dt>
                          <dd>{d.referralStages[st]}</dd>
                        </div>
                      ))}
                    </dl>
                    {d.facilities.length > 0 ? (
                      <p className={styles.muted}>
                        {t('programme.community.sentTo')}:{' '}
                        {d.facilities.map((f) => `${f.name} (${f.referrals})`).join('; ')}
                      </p>
                    ) : null}
                  </div>
                </>
              )}
              {showMapLink ? (
                <Link to={`/programme/gis?community=${s.communityId}`}>
                  {t('programme.community.openMap')}
                </Link>
              ) : null}
            </>
          );
        }}
      </QueryBoundary>
    </section>
  );
}
