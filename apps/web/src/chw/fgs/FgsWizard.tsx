import { createContext, useContext, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button, ErrorSummary, StepProgress, type FormError } from '@ntd-watch/design-system';
import { useFgsDraft, type FgsDraft } from './draft';
import { FGS_STEPS, validateFgsStep, type FgsStep } from './validation';
import styles from '../chw.module.css';

export const FGS_PATH: Record<FgsStep | 'summary', string> = {
  consent: '/chw/fgs/consent',
  participant: '/chw/fgs/participant',
  exposure: '/chw/fgs/exposure',
  signals: '/chw/fgs/signals',
  context: '/chw/fgs/context',
  summary: '/chw/fgs/summary',
};

const ErrorContext = createContext<readonly FormError[]>([]);
export function useFgsFieldError(field: string): string | undefined {
  return useContext(ErrorContext).find((e) => e.field === field)?.message;
}

/** Screens that edit the FGS draft go back to the start when there is none. */
export function WithFgsDraft({ children }: { children: (draft: FgsDraft) => ReactNode }) {
  const draft = useFgsDraft((s) => s.draft);
  if (!draft) return <Navigate to="/chw/fgs" replace />;
  return <>{children(draft)}</>;
}

/**
 * Shared frame for the FGS data-entry steps: progress, error summary, Back and Continue.
 * Same pattern as the general wizard. Continue validates this step; data is saved to the draft
 * on every change. `onContinue` lets the consent step branch before moving on.
 */
export function FgsWizard({
  step,
  title,
  children,
  onContinue,
}: {
  step: FgsStep;
  title: string;
  children: ReactNode;
  /** Return false to stop the normal move to the next step (the step handled navigation). */
  onContinue?: () => boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const draft = useFgsDraft((s) => s.draft);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [attempt, setAttempt] = useState(0);
  const index = FGS_STEPS.indexOf(step);
  const prev = index > 0 ? FGS_STEPS[index - 1] : undefined;
  const next = FGS_STEPS[index + 1];

  const goNext = () => {
    if (!draft) return;
    if (onContinue && onContinue() === false) return;
    const current = useFgsDraft.getState().draft ?? draft;
    const found = validateFgsStep(step, current);
    setErrors(found);
    setAttempt((n) => n + 1);
    if (found.length === 0) navigate(FGS_PATH[next ?? 'summary']);
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
        total={FGS_STEPS.length + 1}
        label={t('chw.step.label', { current: index + 1, total: FGS_STEPS.length + 1 })}
      />
      <h1>{title}</h1>
      <ErrorSummary title={t('validation.summaryTitle')} errors={errors} attempt={attempt} />
      <ErrorContext.Provider value={errors}>{children}</ErrorContext.Provider>
      <div className={styles.actions}>
        <Button type="submit" block>
          {next ? t('chw.step.continue') : t('chw.step.review')}
        </Button>
        {prev ? (
          <Button variant="secondary" block onClick={() => navigate(FGS_PATH[prev])}>
            {t('chw.step.back')}
          </Button>
        ) : (
          <Link to="/chw/fgs">{t('chw.step.back')}</Link>
        )}
      </div>
    </form>
  );
}
