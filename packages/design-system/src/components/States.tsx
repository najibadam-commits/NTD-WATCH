import type { ReactNode } from 'react';
import { Button } from './Button';
import styles from './States.module.css';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className={styles.state} role="status" aria-busy="true">
      <span className={styles.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.state}>
      <strong className={styles.title}>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={`${styles.state} ${styles.error}`} role="alert">
      <strong className={styles.title}>{title}</strong>
      <p>{description}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
