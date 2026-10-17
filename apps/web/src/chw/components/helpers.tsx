import { Navigate } from 'react-router-dom';
import type { TFunction } from 'i18next';
import type { ChoiceOption } from '@ntd-watch/design-system';
import { useDraft, type Draft } from '../draft';

/** Builds radio/checkbox options from value lists, with labels from the locale file. */
export function choices(t: TFunction, group: string, values: readonly string[]): ChoiceOption[] {
  return values.map((value) => ({ value, label: t(`options.${group}.${value}`) }));
}

/** Screens that edit the draft redirect to the start when there is none. */
export function WithDraft({ children }: { children: (draft: Draft) => React.ReactNode }) {
  const draft = useDraft((s) => s.draft);
  if (!draft) return <Navigate to="/chw/assessments/new" replace />;
  return <>{children(draft)}</>;
}
