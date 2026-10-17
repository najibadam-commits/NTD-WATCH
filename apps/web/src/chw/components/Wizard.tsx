import { createContext, useContext, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button, ErrorSummary, StepProgress, type FormError } from '@ntd-watch/design-system';
import { useDraft } from '../draft';
import { STEPS, validateStep, type Step } from '../validation';
import styles from '../chw.module.css';

const PATH: Record<Step | 'summary', string> = {
  person: '/chw/assessments/new/person',
  symptoms: '/chw/assessments/new/symptoms',
  context: '/chw/assessments/new/context',
  wash: '/chw/assessments/new/wash',
  summary: '/chw/assessments/new/summary',
};
export const stepPath = (s: Step | 'summary') => PATH[s];

/**
 * Shared frame for the four data-entry steps: progress, error summary, Back and Continue.
 * Continue validates this step and only moves on when it passes. Data is saved to the draft
 * on every change, so Back, a refresh or leaving and returning never loses it.
 */
export function Wizard({
  step,
  title,
  children,
}: {
  step: Step;
  title: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const draft = useDraft((s) => s.draft);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [attempt, setAttempt] = useState(0);
  const index = STEPS.indexOf(step);
  const prev = index > 0 ? STEPS[index - 1] : undefined;
  const next = STEPS[index + 1];

  const goNext = () => {
    if (!draft) return;
    const found = validateStep(step, draft);
    setErrors(found);
    setAttempt((n) => n + 1);
    if (found.length === 0) navigate(PATH[next ?? 'summary']);
  };

  return (
    <form
      className={styles.stack}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        goNext();
      }}
    >
      <StepProgress
        current={index + 1}
        total={STEPS.length + 1}
        label={t('chw.step.label', { current: index + 1, total: STEPS.length + 1 })}
      />
      <h1>{title}</h1>
      <ErrorSummary title={t('validation.summaryTitle')} errors={errors} attempt={attempt} />
      <WizardErrors errors={errors}>{children}</WizardErrors>
      <div className={styles.actions}>
        <Button type="submit" block>
          {next ? t('chw.step.continue') : t('chw.step.review')}
        </Button>
        {prev ? (
          <Button variant="secondary" block onClick={() => navigate(PATH[prev])}>
            {t('chw.step.back')}
          </Button>
        ) : (
          <Link to="/chw/assessments/new">{t('chw.step.back')}</Link>
        )}
      </div>
    </form>
  );
}

// Lets fields find their own error without prop drilling through every screen.
const ErrorContext = createContext<readonly FormError[]>([]);
function WizardErrors({ errors, children }: { errors: readonly FormError[]; children: ReactNode }) {
  return <ErrorContext.Provider value={errors}>{children}</ErrorContext.Provider>;
}
export function useFieldError(field: string): string | undefined {
  return useContext(ErrorContext).find((e) => e.field === field)?.message;
}
