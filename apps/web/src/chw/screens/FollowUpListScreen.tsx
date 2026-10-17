import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { EmptyState, LoadingState, RiskBadge } from '@ntd-watch/design-system';
import { communityName } from '@ntd-watch/demo-data';
import { localDb } from '../../offline/localDb';
import { useRecords } from '../useRecord';
import styles from '../chw.module.css';

export function FollowUpListScreen() {
  const { t } = useTranslation();
  const data = useRecords(async () => {
    const [assessments, referrals, followUps] = await Promise.all([
      localDb.assessments.toArray(),
      localDb.referrals.toArray(),
      localDb.followUps.toArray(),
    ]);
    const referred = new Set(referrals.map((r) => r.assessmentKey));
    const done = new Set(followUps.map((f) => f.assessmentKey));
    return assessments
      .filter(
        (a) => (referred.has(a.clientKey) || a.riskLevel === 'MODERATE') && !done.has(a.clientKey),
      )
      .sort((x, y) => y.capturedAt.localeCompare(x.capturedAt));
  }, []);
  const doneCount = useRecords(async () => localDb.followUps.toArray(), []);

  if (data.loading) return <LoadingState label={t('common.loading')} />;
  return (
    <div className={styles.stack}>
      <h1>{t('chw.followup.listTitle')}</h1>
      <p className={styles.muted}>{t('chw.followup.intro')}</p>
      <h2>{t('chw.followup.due')}</h2>
      {data.items.length === 0 ? (
        <EmptyState title={t('chw.followup.none')} />
      ) : (
        <ul className={styles.list}>
          {data.items.map((a) => (
            <li key={a.clientKey} className={styles.item}>
              <div className={styles.between}>
                <Link to={`/chw/follow-ups/${a.clientKey}`}>
                  {a.id} · {t('chw.followup.open')}
                </Link>
                {a.riskLevel ? <RiskBadge level={a.riskLevel} /> : null}
              </div>
              <span className={styles.muted}>{communityName(a.communityId)}</span>
            </li>
          ))}
        </ul>
      )}
      <h2>
        {t('chw.followup.done')} ({doneCount.items.length})
      </h2>
    </div>
  );
}
