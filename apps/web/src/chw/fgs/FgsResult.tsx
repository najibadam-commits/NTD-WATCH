import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Notice } from '@ntd-watch/design-system';
import {
  DISCLAIMER,
  SIGNAL_CATEGORY_BY_LEVEL,
  SIGNAL_NOTICE,
  isHigherRisk,
  type Assessment,
} from '@ntd-watch/domain';
import { FGS_RULE_SET, STATUS_LABELS, contentItem, normaliseStatus } from '@ntd-watch/rules-engine';
import { LinkButton } from '../../components/LinkButton';
import { requestDeletion, withdrawConsent } from '../../offline/repository';
import { DemoLabel, RecordSync } from '../components/Shared';
import styles from '../chw.module.css';

/**
 * Result view for an FGS community assessment. Shows a non-diagnostic signal category and the
 * rule status beside it. It never names a condition or a clinical severity.
 */
export function FgsResult({
  a,
  hasReferral,
  referralId,
}: {
  a: Assessment;
  hasReferral: boolean;
  referralId?: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<'withdraw' | 'delete' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const level = a.riskLevel;
  const withdrawn = a.consent?.state === 'WITHDRAWN';
  const status = normaliseStatus(a.ruleSetStatus ?? FGS_RULE_SET.status);
  const signals = (a.fgs?.signals ?? [])
    .map((id) => contentItem(id)?.id)
    .filter(Boolean) as string[];

  const run = async (kind: 'withdraw' | 'delete') => {
    if (kind === 'withdraw') {
      await withdrawConsent(a.clientKey);
      setMessage(t('fgs.result.withdrawn'));
      setConfirm(null);
    } else {
      await requestDeletion(a.clientKey);
      navigate('/chw', { replace: true });
    }
  };

  return (
    <div className={styles.stack}>
      <div className={styles.between}>
        <h1>{t('fgs.result.title')}</h1>
        <RecordSync kind="assessment" clientKey={a.clientKey} />
      </div>
      <DemoLabel />
      <p className={styles.muted}>{t('chw.result.code', { code: a.caseId ?? a.id })}</p>

      <section className={styles.resultBox} aria-labelledby="fgs-category">
        <h2 id="fgs-category">{t('fgs.result.category')}</h2>
        {level ? (
          <p className={styles.big}>{t(`fgs.category.${SIGNAL_CATEGORY_BY_LEVEL[level]}`)}</p>
        ) : (
          <Notice tone="error">{t('chw.result.noResult')}</Notice>
        )}
        <p className={styles.muted}>{t('fgs.categoryNote')}</p>
        <p>
          <strong>{t('fgs.result.ruleStatus')}</strong>
          <span className={styles.muted}> ({STATUS_LABELS[status]})</span>
        </p>
      </section>

      <section className={styles.resultBox} aria-labelledby="fgs-why">
        <h2 id="fgs-why">{t('fgs.result.why')}</h2>
        {a.riskWhy.length > 0 ? (
          <ul className={styles.list}>
            {a.riskWhy.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : (
          <p>{signals.length === 0 ? t('fgs.result.noSignals') : null}</p>
        )}
      </section>

      {level ? (
        <section className={styles.resultBox} aria-labelledby="fgs-next">
          <h2 id="fgs-next">{t('fgs.result.next')}</h2>
          <p>{FGS_RULE_SET.actions[level]}</p>
          <p className={styles.muted}>
            {isHigherRisk(level)
              ? t('chw.result.recommendReferral')
              : t('chw.result.referralOptional')}
          </p>
        </section>
      ) : null}

      {a.fgs?.supportOffered ? (
        <Notice tone="info" title={t('fgs.result.supportTitle')}>
          {t('fgs.result.support')}
        </Notice>
      ) : null}

      <Notice tone="demo">{t('fgs.clinicalContentNotice')}</Notice>
      <Notice tone="info">{SIGNAL_NOTICE}</Notice>
      <p className={styles.muted}>{DISCLAIMER}</p>
      <p className={styles.muted}>
        {t('chw.result.ruleSet', { id: a.ruleSetId ?? '-', version: a.ruleSetVersion ?? '-' })}
      </p>

      {withdrawn ? <Notice tone="info">{t('fgs.result.withdrawn')}</Notice> : null}
      {message && !withdrawn ? <Notice tone="info">{message}</Notice> : null}

      <div className={styles.actions}>
        {withdrawn ? null : hasReferral && referralId ? (
          <LinkButton block to={`/chw/referrals/${referralId}`}>
            {t('chw.result.viewReferral')}
          </LinkButton>
        ) : level ? (
          <LinkButton
            block
            variant={isHigherRisk(level) ? 'primary' : 'secondary'}
            to={`/chw/assessments/${a.clientKey}/referral`}
          >
            {t('chw.result.generate')}
          </LinkButton>
        ) : null}
        {withdrawn ? null : (
          <LinkButton block variant="secondary" to={`/chw/follow-ups/${a.clientKey}`}>
            {t('chw.result.followUp')}
          </LinkButton>
        )}
      </div>

      <section className={styles.resultBox} aria-labelledby="fgs-choices">
        <h2 id="fgs-choices">{t('fgs.result.privacyTitle')}</h2>
        {confirm ? (
          <>
            <p role="alert">
              {confirm === 'withdraw'
                ? t('fgs.result.withdrawConfirm')
                : t('fgs.result.deleteConfirm')}
            </p>
            <div className={styles.actions}>
              <Button block onClick={() => void run(confirm)}>
                {t('fgs.result.confirm')}
              </Button>
              <Button block variant="secondary" onClick={() => setConfirm(null)}>
                {t('fgs.result.cancel')}
              </Button>
            </div>
          </>
        ) : (
          <div className={styles.actions}>
            {withdrawn ? null : (
              <Button block variant="secondary" onClick={() => setConfirm('withdraw')}>
                {t('fgs.result.withdraw')}
              </Button>
            )}
            <Button block variant="secondary" onClick={() => setConfirm('delete')}>
              {t('fgs.result.delete')}
            </Button>
          </div>
        )}
      </section>
      <Link to="/chw">{t('chw.result.dashboard')}</Link>
    </div>
  );
}
