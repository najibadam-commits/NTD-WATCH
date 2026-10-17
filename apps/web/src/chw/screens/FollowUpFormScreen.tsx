import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
  ChoiceGroup,
  EmptyState,
  ErrorSummary,
  LoadingState,
  Notice,
  type FormError,
} from '@ntd-watch/design-system';
import { DEMO_CHW } from '@ntd-watch/demo-data';
import type { FollowUp } from '@ntd-watch/domain';
import i18n from '../../i18n';
import { localDb } from '../../offline/localDb';
import { saveFollowUp } from '../../offline/repository';
import { LinkButton } from '../../components/LinkButton';
import { RecordSync } from '../components/Shared';
import { choices } from '../components/helpers';
import { newKey } from '../draft';
import { CONDITIONS, TRI } from '../options';
import { useRecord } from '../useRecord';
import styles from '../chw.module.css';

interface Form {
  personReached?: 'yes' | 'no' | 'unknown';
  attendedFacility?: 'yes' | 'no' | 'unknown';
  condition?: 'better' | 'same' | 'worse' | 'unknown';
  needsFurtherReferral?: 'yes' | 'no';
}

export function FollowUpFormScreen() {
  const { t } = useTranslation();
  const { key = '' } = useParams();
  const assessment = useRecord(() => localDb.assessments.get(key), [key]);
  const referral = useRecord(
    () => localDb.referrals.where('assessmentKey').equals(key).first(),
    [key],
  );
  // One key per opened form: pressing Save twice can never create two follow-ups.
  const clientKey = useRef(newKey('fu'));
  const [form, setForm] = useState<Form>({});
  const [errors, setErrors] = useState<FormError[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  if (assessment.loading || referral.loading) return <LoadingState label={t('common.loading')} />;
  const a = assessment.value;
  if (!a) {
    return (
      <EmptyState
        title={t('chw.followup.notFound')}
        action={<Link to="/chw/follow-ups">{t('chw.followup.backToList')}</Link>}
      />
    );
  }

  const err = (field: string): FormError => ({ field, message: i18n.t(`validation.${field}`) });
  const errorFor = (field: string) => errors.find((e) => e.field === field)?.message;

  const save = async () => {
    const found: FormError[] = [];
    if (!form.personReached) found.push(err('personReached'));
    if (!form.attendedFacility) found.push(err('attendedFacility'));
    if (!form.condition) found.push(err('condition'));
    if (!form.needsFurtherReferral) found.push(err('needsFurtherReferral'));
    setErrors(found);
    setAttempt((n) => n + 1);
    if (found.length > 0) return;

    const followUp: FollowUp = {
      demo: true,
      clientKey: clientKey.current,
      assessmentKey: a.clientKey,
      referralId: referral.value?.id ?? null,
      chwId: DEMO_CHW.id,
      performedAt: new Date().toISOString(),
      personReached: form.personReached!,
      attendedFacility: form.attendedFacility!,
      condition: form.condition!,
      needsFurtherReferral: form.needsFurtherReferral === 'yes',
    };
    await saveFollowUp(followUp);
    setSavedKey(followUp.clientKey);
  };

  if (savedKey) {
    return (
      <div className={styles.stack}>
        <h1>{t('chw.followup.formTitle')}</h1>
        <Notice tone="success">{t('chw.followup.saved')}</Notice>
        <RecordSync kind="followUp" clientKey={savedKey} />
        {form.needsFurtherReferral === 'yes' ? (
          <Notice tone="info">{t('chw.followup.further')}</Notice>
        ) : null}
        <div className={styles.actions}>
          {form.needsFurtherReferral === 'yes' && !referral.value ? (
            <LinkButton block to={`/chw/assessments/${a.clientKey}/referral`}>
              {t('chw.followup.referNow')}
            </LinkButton>
          ) : null}
          <LinkButton block variant="secondary" to="/chw/follow-ups">
            {t('chw.followup.backToList')}
          </LinkButton>
          <Link to="/chw/assessments">{t('chw.history.title')}</Link>
        </div>
      </div>
    );
  }

  return (
    <form
      className={styles.stack}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <h1>{t('chw.followup.formTitle')}</h1>
      <p className={styles.muted}>{t('chw.referral.for', { code: a.id })}</p>
      <ErrorSummary title={t('validation.summaryTitle')} errors={errors} attempt={attempt} />
      <ChoiceGroup
        legend={t('chw.followup.personReached')}
        name="personReached"
        required
        options={choices(t, 'tri', TRI)}
        value={form.personReached}
        error={errorFor('personReached')}
        onChange={(v) => setForm({ ...form, personReached: v as Form['personReached'] })}
      />
      <ChoiceGroup
        legend={t('chw.followup.attendedFacility')}
        name="attendedFacility"
        required
        options={choices(t, 'tri', TRI)}
        value={form.attendedFacility}
        error={errorFor('attendedFacility')}
        onChange={(v) => setForm({ ...form, attendedFacility: v as Form['attendedFacility'] })}
      />
      <ChoiceGroup
        legend={t('chw.followup.condition')}
        name="condition"
        required
        options={choices(t, 'condition', CONDITIONS)}
        value={form.condition}
        error={errorFor('condition')}
        onChange={(v) => setForm({ ...form, condition: v as Form['condition'] })}
      />
      <ChoiceGroup
        legend={t('chw.followup.needsFurtherReferral')}
        name="needsFurtherReferral"
        required
        options={[
          { value: 'yes', label: t('common.yes') },
          { value: 'no', label: t('common.no') },
        ]}
        value={form.needsFurtherReferral}
        error={errorFor('needsFurtherReferral')}
        onChange={(v) =>
          setForm({ ...form, needsFurtherReferral: v as Form['needsFurtherReferral'] })
        }
      />
      <div className={styles.actions}>
        <Button type="submit" block>
          {t('chw.followup.submit')}
        </Button>
        <Link to="/chw/follow-ups">{t('common.back')}</Link>
      </div>
    </form>
  );
}
