import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  ChoiceGroup,
  EmptyState,
  ErrorSummary,
  LoadingState,
  Notice,
} from '@ntd-watch/design-system';
import { DEMO_CHW, communityName, facilitiesForCommunity } from '@ntd-watch/demo-data';
import { DEMO_RULES_NOTICE, referralIdFor, type Referral } from '@ntd-watch/domain';
import { localDb } from '../../offline/localDb';
import { saveReferral } from '../../offline/repository';
import { DemoLabel } from '../components/Shared';
import { useRecord } from '../useRecord';
import i18n from '../../i18n';
import styles from '../chw.module.css';

export function ReferralNewScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { key = '' } = useParams();
  const assessment = useRecord(() => localDb.assessments.get(key), [key]);
  const existing = useRecord(
    () => localDb.referrals.where('assessmentKey').equals(key).first(),
    [key],
  );
  const [facilityId, setFacilityId] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);

  if (assessment.loading || existing.loading) return <LoadingState label={t('common.loading')} />;
  const a = assessment.value;
  if (!a || !a.riskLevel) {
    return (
      <EmptyState
        title={t('chw.result.notFound')}
        action={<Link to="/chw/assessments">{t('chw.history.title')}</Link>}
      />
    );
  }
  // One referral per assessment: asking again goes to the one that exists.
  if (existing.value) return <Navigate to={`/chw/referrals/${existing.value.id}`} replace />;

  const facilities = facilitiesForCommunity(a.communityId);

  const confirm = async () => {
    if (saving) return;
    if (!facilityId) {
      setError(i18n.t('validation.facility'));
      setAttempt((n) => n + 1);
      return;
    }
    setSaving(true);
    const now = new Date();
    const referral: Referral = {
      demo: true,
      id: referralIdFor(a.clientKey, now.getFullYear()),
      assessmentId: a.id,
      assessmentKey: a.clientKey,
      chwId: DEMO_CHW.id,
      communityId: a.communityId,
      facilityId,
      riskLevel: a.riskLevel!,
      stage: 'GENERATED',
      stageTimestamps: [now.toISOString()],
    };
    await saveReferral(referral);
    navigate(`/chw/referrals/${referral.id}`, { replace: true });
  };

  return (
    <div className={styles.stack}>
      <h1>{t('chw.referral.newTitle')}</h1>
      <p className={styles.muted}>
        {t('chw.referral.for', { code: a.id })} · {communityName(a.communityId)}
      </p>
      <DemoLabel />
      <p>
        {t('chw.referral.urgency')}: <strong>{t(`options.urgency.${a.riskLevel}`)}</strong>
      </p>
      <ErrorSummary
        title={t('validation.summaryTitle')}
        errors={error ? [{ field: 'facility', message: error }] : []}
        attempt={attempt}
      />
      <ChoiceGroup
        legend={t('chw.referral.facility')}
        hint={t('chw.referral.facilityHint')}
        name="facility"
        required
        options={facilities.map((f) => ({ value: f.id, label: f.name, hint: f.kind }))}
        value={facilityId}
        error={error}
        onChange={(v) => {
          setFacilityId(v);
          setError(undefined);
        }}
      />
      <Notice tone="demo">{DEMO_RULES_NOTICE}</Notice>
      <div className={styles.actions}>
        <Button block disabled={saving} onClick={() => void confirm()}>
          {t('chw.referral.confirm')}
        </Button>
        <Link to={`/chw/assessments/${a.clientKey}/result`}>{t('common.back')}</Link>
      </div>
    </div>
  );
}
