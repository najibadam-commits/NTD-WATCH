import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { EmptyState, LoadingState, RiskBadge } from '@ntd-watch/design-system';
import { facilityName } from '@ntd-watch/demo-data';
import { REFERRAL_STAGE_LABELS, shortReferralCode } from '@ntd-watch/domain';
import { localDb } from '../../offline/localDb';
import { RecordSync } from '../components/Shared';
import { useRecords } from '../useRecord';
import styles from '../chw.module.css';

export function ReferralListScreen() {
  const { t } = useTranslation();
  const list = useRecords(async () => (await localDb.referrals.toArray()).reverse(), []);
  if (list.loading) return <LoadingState label={t('common.loading')} />;
  return (
    <div className={styles.stack}>
      <h1>{t('chw.referral.listTitle')}</h1>
      {list.items.length === 0 ? (
        <EmptyState title={t('chw.referral.listEmpty')} />
      ) : (
        <ul className={styles.list}>
          {list.items.map((r) => (
            <li key={r.id} className={styles.item}>
              <div className={styles.between}>
                <Link to={`/chw/referrals/${r.id}`}>{shortReferralCode(r.id)}</Link>
                <RiskBadge level={r.riskLevel} />
              </div>
              <span>
                {REFERRAL_STAGE_LABELS[r.stage]} · {facilityName(r.facilityId)}
              </span>
              <RecordSync kind="referral" clientKey={r.assessmentKey} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
