import { useTranslation } from 'react-i18next';
import styles from './CoreLoop.module.css';

const STEPS = [
  'signal',
  'assessment',
  'action',
  'referral',
  'followUp',
  'intelligence',
  'response',
] as const;

export function CoreLoop() {
  const { t } = useTranslation();
  return (
    <ol className={styles.loop} aria-label={t('landing.loopTitle')}>
      {STEPS.map((s, i) => (
        <li key={s} className={styles.step}>
          {t(`loop.${s}`)}
          {i < STEPS.length - 1 ? (
            <span className={styles.arrow} aria-hidden="true">
              →
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
