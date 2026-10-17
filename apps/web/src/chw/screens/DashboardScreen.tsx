import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Notice, RiskBadge } from '@ntd-watch/design-system';
import { DEMO_CHW, communityName } from '@ntd-watch/demo-data';
import { DEMO_DATA_NOTICE, isHigherRisk, stageIndex } from '@ntd-watch/domain';
import { localDb } from '../../offline/localDb';
import { LinkButton } from '../../components/LinkButton';
import { useRecord } from '../useRecord';
import styles from '../chw.module.css';

export function DashboardScreen() {
  const { t } = useTranslation();
  const stats = useRecord(async () => {
    const [assessments, referrals, followUps, queue] = await Promise.all([
      localDb.assessments.toArray(),
      localDb.referrals.toArray(),
      localDb.followUps.toArray(),
      localDb.outbox.where('status').notEqual('synced').count(),
    ]);
    const today = new Date().toDateString();
    const referred = new Set(referrals.map((r) => r.assessmentKey));
    const followed = new Set(followUps.map((f) => f.assessmentKey));
    return {
      total: assessments.length,
      today: assessments.filter((a) => new Date(a.capturedAt).toDateString() === today).length,
      urgent: assessments.filter((a) => a.riskLevel && isHigherRisk(a.riskLevel)).length,
      pending: queue,
      openReferrals: referrals.filter((r) => stageIndex(r.stage) < stageIndex('CLOSED')).length,
      due: assessments.filter(
        (a) =>
          (referred.has(a.clientKey) || a.riskLevel === 'MODERATE') && !followed.has(a.clientKey),
      ).length,
      recent: [...assessments].sort((x, y) => y.capturedAt.localeCompare(x.capturedAt)).slice(0, 3),
    };
  }, []);
  const s = stats.value;

  const tiles: [string, number | undefined][] = [
    [t('chw.dashboard.today'), s?.today],
    [t('chw.dashboard.total'), s?.total],
    [t('chw.dashboard.urgent'), s?.urgent],
    [t('chw.dashboard.pending'), s?.pending],
    [t('chw.dashboard.referrals'), s?.openReferrals],
    [t('chw.dashboard.followUps'), s?.due],
  ];

  return (
    <div className={styles.stack}>
      <h1>{t('chw.dashboard.greeting', { label: DEMO_CHW.label })}</h1>
      <p className={styles.muted}>
        {t('chw.dashboard.community', { name: communityName(DEMO_CHW.communityId) })}
      </p>
      <Notice tone="demo">{DEMO_DATA_NOTICE}</Notice>
      <LinkButton block to="/chw/assessments/new">
        {t('chw.dashboard.startNew')}
      </LinkButton>
      <div className={styles.grid}>
        {tiles.map(([label, value]) => (
          <div key={label} className={styles.stat}>
            <strong>{value ?? '–'}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <section className={styles.stack}>
        <div className={styles.between}>
          <h2>{t('chw.dashboard.recent')}</h2>
          <Link to="/chw/assessments">{t('chw.dashboard.viewAll')}</Link>
        </div>
        {s && s.recent.length > 0 ? (
          <ul className={styles.list}>
            {s.recent.map((a) => (
              <li key={a.clientKey} className={styles.item}>
                <div className={styles.between}>
                  <Link to={`/chw/assessments/${a.clientKey}/result`}>{a.id}</Link>
                  {a.riskLevel ? <RiskBadge level={a.riskLevel} /> : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>{t('chw.dashboard.none')}</p>
        )}
      </section>
    </div>
  );
}
