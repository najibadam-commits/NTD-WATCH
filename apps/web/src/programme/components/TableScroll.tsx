import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../programme.module.css';

/**
 * A wide table that scrolls sideways on small screens. It is focusable, so a keyboard user can
 * scroll it, and it is named so a screen reader announces what it is.
 */
export function TableScroll({ children, label }: { children: ReactNode; label?: string }) {
  const { t } = useTranslation();
  return (
    <div
      className={styles.tableWrap}
      role="region"
      aria-label={label ?? t('programme.scrollable')}
      // Keyboard access to a scrollable region is required (WCAG 2.1.1).
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
    >
      {children}
    </div>
  );
}
