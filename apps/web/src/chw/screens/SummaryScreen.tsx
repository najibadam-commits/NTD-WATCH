import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Button,
  ErrorSummary,
  Notice,
  StepProgress,
  type FormError,
} from '@ntd-watch/design-system';
import { DEMO_COMMUNITIES } from '@ntd-watch/demo-data';
import { DEMO_RULES_NOTICE } from '@ntd-watch/domain';
import { buildAssessment } from '../buildAssessment';
import { NO_SYMPTOMS } from '../options';
import { useDraft, type Draft } from '../draft';
import { STEPS, validateAll, type Step } from '../validation';
import { saveAssessment } from '../../offline/repository';
import { stepPath } from '../components/Wizard';
import styles from '../chw.module.css';

function Section({ title, step, rows }: { title: string; step: Step; rows: [string, string][] }) {
  const { t } = useTranslation();
  return (
    <section className={styles.resultBox}>
      <div className={styles.between}>
        <h2>{title}</h2>
        <Link to={stepPath(step)}>{t('chw.summary.edit')}</Link>
      </div>
      <dl className={styles.dl}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: 'contents' }}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Review({ draft }: { draft: Draft }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const clear = useDraft((s) => s.clear);
  const [problems, setProblems] = useState<{ step: Step; error: FormError }[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const submitted = useRef(false); // guards a double tap

  const tri = (v?: string) => (v ? t(`options.tri.${v}`) : t('chw.summary.notAnswered'));
  const none = draft.symptoms.includes(NO_SYMPTOMS);
  const real = draft.symptoms.filter((s) => s !== NO_SYMPTOMS);
  const community = DEMO_COMMUNITIES.find((c) => c.id === draft.communityId)?.name ?? '';

  const submit = async () => {
    if (submitted.current) return;
    const found = validateAll(draft);
    setProblems(found);
    setAttempt((n) => n + 1);
    if (found.length > 0) return;
    submitted.current = true;
    setSaving(true);
    setFailed(false);
    try {
      const assessment = buildAssessment(draft);
      await saveAssessment(assessment);
      clear();
      navigate(`/chw/assessments/${assessment.clientKey}/result`, { replace: true });
    } catch {
      submitted.current = false;
      setSaving(false);
      setFailed(true);
    }
  };

  const errors = problems.map((p) => ({
    field: p.error.field,
    message: `${p.error.message} (${t('chw.summary.fixStep', { step: t(`chw.screens.${p.step}`) })})`,
  }));

  return (
    <div className={styles.stack}>
      <StepProgress
        current={STEPS.length + 1}
        total={STEPS.length + 1}
        label={t('chw.step.label', { current: STEPS.length + 1, total: STEPS.length + 1 })}
      />
      <h1>{t('chw.summary.title')}</h1>
      <p>{t('chw.summary.intro')}</p>
      <ErrorSummary title={t('chw.summary.problems')} errors={errors} attempt={attempt} />
      {problems.length > 0 ? (
        <ul className={styles.list}>
          {[...new Set(problems.map((p) => p.step))].map((s) => (
            <li key={s}>
              <Link to={stepPath(s)}>
                {t('chw.summary.fixStep', { step: t(`chw.screens.${s}`) })}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {failed ? <Notice tone="error">{t('chw.summary.saveFailed')}</Notice> : null}

      <Section
        title={t('chw.summary.person')}
        step="person"
        rows={[
          [
            t('chw.summary.ageGroup'),
            draft.ageGroup ? t(`options.ageGroup.${draft.ageGroup}`) : t('chw.summary.notAnswered'),
          ],
          [
            t('chw.summary.sex'),
            draft.sex ? t(`options.sex.${draft.sex}`) : t('chw.summary.notAnswered'),
          ],
          [t('chw.summary.community'), community],
        ]}
      />
      <Section
        title={t('chw.summary.symptoms')}
        step="symptoms"
        rows={[
          [
            t('chw.summary.symptomList'),
            none
              ? t('chw.summary.noneReported')
              : real.length > 0
                ? real.map((s) => t(`options.symptoms.${s}`)).join(', ')
                : t('chw.summary.notAnswered'),
          ],
          ...(real.length > 0
            ? ([
                [
                  t('chw.summary.duration'),
                  draft.duration
                    ? t(`options.duration.${draft.duration}`)
                    : t('chw.summary.notAnswered'),
                ],
                [
                  t('chw.summary.progression'),
                  draft.progression
                    ? t(`options.progression.${draft.progression}`)
                    : t('chw.summary.notAnswered'),
                ],
              ] as [string, string][])
            : []),
        ]}
      />
      <Section
        title={t('chw.summary.context')}
        step="context"
        rows={(['waterContact', 'animalContact', 'insectBites', 'householdSimilar'] as const).map(
          (k) => [t(`chw.context.${k}`), tri(draft.exposure[k])],
        )}
      />
      <Section
        title={t('chw.summary.wash')}
        step="wash"
        rows={[
          [
            t('chw.wash.waterSource'),
            draft.wash.waterSource
              ? t(`options.waterSource.${draft.wash.waterSource}`)
              : t('chw.summary.notAnswered'),
          ],
          [
            t('chw.wash.sanitation'),
            draft.wash.sanitation
              ? t(`options.sanitation.${draft.wash.sanitation}`)
              : t('chw.summary.notAnswered'),
          ],
          [t('chw.wash.handwashing'), tri(draft.wash.handwashing)],
          [t('chw.wash.standingWater'), tri(draft.wash.standingWater)],
        ]}
      />

      <Notice tone="demo">{DEMO_RULES_NOTICE}</Notice>
      <div className={styles.actions}>
        <Button block disabled={saving} onClick={() => void submit()}>
          {saving ? t('chw.summary.submitting') : t('chw.summary.submit')}
        </Button>
        <Link to={stepPath('wash')}>{t('chw.step.back')}</Link>
      </div>
    </div>
  );
}

export function SummaryScreen() {
  const draft = useDraft((s) => s.draft);
  const [hadDraft, setHadDraft] = useState(false);
  if (draft && !hadDraft) setHadDraft(true);
  // After a successful save the draft is cleared while the move to the result screen is still
  // under way. Redirecting to the start here would race that move, so wait instead.
  if (!draft && hadDraft) return null;
  if (!draft) return <Navigate to="/chw/assessments/new" replace />;
  return <Review draft={draft} />;
}
