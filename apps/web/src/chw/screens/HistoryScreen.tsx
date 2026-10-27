import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { EmptyState, LoadingState } from '@ntd-watch/design-system';
import { communityName } from '@ntd-watch/demo-data';
import { isHigherRisk } from '@ntd-watch/domain';
import { localDb } from '../../offline/localDb';
import { LinkButton } from '../../components/LinkButton';
import { RecordSync } from '../components/Shared';
import { useRecords } from '../useRecord';
import { AssessmentBadge } from '../fgs/category';
import styles from '../chw.module.css';

export function HistoryScreen() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'high'>('all');
  const selectId = useId();
  const data = useRecords(async () => {
    const [assessments, referrals, followUps] = await Promise.all([
      localDb.assessments.toArray(),
      localDb.referrals.toArray(),
      localDb.followUps.toArray(),
    ]);
    const referred = new Set(referrals.map((r) => r.assessmentKey));
    const followed = new Set(followUps.map((f) => f.assessmentKey));
    return assessments
      .sort((x, y) => y.capturedAt.localeCompare(x.capturedAt))
      .map((a) => ({
        a,
        referred: referred.has(a.clientKey),
        followed: followed.has(a.clientKey),
      }));
  }, []);

  if (data.loading) return <LoadingState label={t('common.loading')} />;
  const rows = data.items.filter(
    (r) => filter === 'all' || (r.a.riskLevel && isHigherRisk(r.a.riskLevel)),
  );

  return (
    <div className={styles.stack}>
      <h1>{t('chw.history.title')}</h1>
      <div className={styles.field}>
        <label htmlFor={selectId}>{t('chw.history.filter')}</label>
        <select
          id={selectId}
          className={styles.select}
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'high')}
        >
          <option value="all">{t('chw.history.all')}</option>
          <option value="high">{t('chw.history.highUp')}</option>
        </select>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          title={data.items.length === 0 ? t('chw.history.empty') : t('chw.history.emptyFiltered')}
          action={
            data.items.length === 0 ? (
              <LinkButton to="/chw/assessments/new">{t('chw.start.start')}</LinkButton>
            ) : undefined
          }
        />
      ) : (
        <ul className={styles.list}>
          {rows.map(({ a, referred, followed }) => (
            <li key={a.clientKey} className={styles.item}>
              <div className={styles.between}>
                <Link to={`/chw/assessments/${a.clientKey}/result`}>
                  {a.id} · {new Date(a.capturedAt).toLocaleDateString()}
                </Link>
                <AssessmentBadge a={a} />
              </div>
              <span className={styles.muted}>
                {communityName(a.communityId)}
                {referred ? ` · ${t('chw.history.referred')}` : ''}
                {followed ? ` · ${t('chw.history.followedUp')}` : ''}
              </span>
              <RecordSync kind="assessment" clientKey={a.clientKey} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
