import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { EmptyState, LoadingState, Notice, RiskBadge } from '@ntd-watch/design-system';
import { DISCLAIMER, RISK_SYMBOL, SIGNAL_NOTICE, isHigherRisk } from '@ntd-watch/domain';
import { DEMO_RULE_SET, evaluate } from '@ntd-watch/rules-engine';
import { inputFromAssessment } from '../buildAssessment';
import { localDb } from '../../offline/localDb';
import { LinkButton } from '../../components/LinkButton';
import { DemoLabel, RecordSync } from '../components/Shared';
import { useRecord } from '../useRecord';
import styles from '../chw.module.css';

export function ResultScreen() {
  const { t } = useTranslation();
  const { key = '' } = useParams();
  const assessment = useRecord(() => localDb.assessments.get(key), [key]);
  const referral = useRecord(
    () => localDb.referrals.where('assessmentKey').equals(key).first(),
    [key],
  );

  if (assessment.loading || referral.loading) return <LoadingState label={t('common.loading')} />;
  const a = assessment.value;
  if (!a) {
    return (
      <EmptyState
        title={t('chw.result.notFound')}
        action={<Link to="/chw/assessments">{t('chw.history.title')}</Link>}
      />
    );
  }

  const level = a.riskLevel;
  // Data-quality notes are recomputed from the saved answers when the rule set version matches.
  const check =
    a.ruleSetVersion === DEMO_RULE_SET.version
      ? evaluate(inputFromAssessment(a), DEMO_RULE_SET)
      : null;
  const incomplete = check?.incompleteInputs ?? [];

  return (
    <div className={styles.stack}>
      <div className={styles.between}>
        <h1>{t('chw.result.title')}</h1>
        <RecordSync kind="assessment" clientKey={a.clientKey} />
      </div>
      <DemoLabel />
      <p className={styles.muted}>{t('chw.result.code', { code: a.id })}</p>

      <section className={styles.resultBox} aria-labelledby="result-level">
        <DemoLabel />
        <h2 id="result-level">{t('chw.result.level')}</h2>
        {level ? (
          <>
            <RiskBadge level={level} />
            <p className={styles.big}>
              <span aria-hidden="true">{RISK_SYMBOL[level]} </span>
              {level}
            </p>
          </>
        ) : (
          <Notice tone="error">{t('chw.result.noResult')}</Notice>
        )}
      </section>

      <section className={styles.resultBox} aria-labelledby="result-why">
        <DemoLabel />
        <h2 id="result-why">{t('chw.result.why')}</h2>
        <ul className={styles.list}>
          {a.riskWhy.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </section>

      {level ? (
        <section className={styles.resultBox} aria-labelledby="result-action">
          <DemoLabel />
          <h2 id="result-action">{t('chw.result.action')}</h2>
          <p>{DEMO_RULE_SET.actions[level]}</p>
          <p className={styles.muted}>
            {isHigherRisk(level)
              ? t('chw.result.recommendReferral')
              : t('chw.result.referralOptional')}
          </p>
        </section>
      ) : null}

      {check && (check.notes.length > 0 || incomplete.length > 0) ? (
        <Notice tone="info" title={t('chw.result.notes')}>
          {check.notes.join(' ')}{' '}
          {incomplete.length > 0
            ? t('chw.result.incomplete', { items: incomplete.join(', ') })
            : null}
        </Notice>
      ) : null}

      <Notice tone="info">{SIGNAL_NOTICE}</Notice>
      <p className={styles.muted}>{DISCLAIMER}</p>
      <p className={styles.muted}>
        {t('chw.result.ruleSet', { id: a.ruleSetId ?? '-', version: a.ruleSetVersion ?? '-' })}
      </p>

      <div className={styles.actions}>
        {referral.value ? (
          <LinkButton block to={`/chw/referrals/${referral.value.id}`}>
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
        <LinkButton block variant="secondary" to={`/chw/follow-ups/${a.clientKey}`}>
          {t('chw.result.followUp')}
        </LinkButton>
        <LinkButton block variant="ghost" to="/chw/assessments/new">
          {t('chw.result.newAssessment')}
        </LinkButton>
        <Link to="/chw">{t('chw.result.dashboard')}</Link>
      </div>
    </div>
  );
}
