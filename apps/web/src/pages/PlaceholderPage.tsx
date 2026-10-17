import { useTranslation } from 'react-i18next';
import { Notice } from '@ntd-watch/design-system';
import type { BuildStage } from '../nav/navigation';
import styles from './PlaceholderPage.module.css';

export interface PlaceholderPageProps {
  titleKey: string;
  stage: BuildStage;
  spec: string;
}

/** Honest stand-in for a screen that is planned but not built yet. */
export function PlaceholderPage({ titleKey, stage, spec }: PlaceholderPageProps) {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <h1>{t(titleKey)}</h1>
      <Notice tone="info" title={t('placeholder.badge')}>
        {t('placeholder.planned', { stage })}. {t('placeholder.body')}
      </Notice>
      <p className={styles.meta}>{t('placeholder.spec', { ref: spec })}</p>
    </div>
  );
}
