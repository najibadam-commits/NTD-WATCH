import type { ReactNode } from 'react';
import styles from './Notice.module.css';

export type NoticeTone = 'info' | 'demo' | 'success' | 'error';

export interface NoticeProps {
  tone?: NoticeTone;
  title?: string;
  children: ReactNode;
}

/** Only errors and successes are announced to assistive tech; static notices are not. */
export function Notice({ tone = 'info', title, children }: NoticeProps) {
  const role = tone === 'error' ? 'alert' : tone === 'success' ? 'status' : undefined;
  return (
    <div className={`${styles.notice} ${styles[tone]}`} role={role} data-tone={tone}>
      {title ? <strong className={styles.title}>{title}</strong> : null}
      {children}
    </div>
  );
}
