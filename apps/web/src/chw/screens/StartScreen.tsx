import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Notice } from '@ntd-watch/design-system';
import { DISCLAIMER } from '@ntd-watch/domain';
import { useDraft } from '../draft';
import styles from '../chw.module.css';

export function StartScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const draft = useDraft((s) => s.draft);
  const start = useDraft((s) => s.start);
  const clear = useDraft((s) => s.clear);

  const begin = () => {
    start();
    navigate('/chw/assessments/new/person');
  };

  return (
    <div className={styles.stack}>
      <h1>{t('chw.start.title')}</h1>
      <p>{t('chw.start.intro')}</p>
      <Notice tone="info">{t('chw.start.privacy')}</Notice>
      <Notice tone="demo">{t('chw.start.demo')}</Notice>
      <p className={styles.muted}>{DISCLAIMER}</p>
      {draft ? (
        <>
          <Notice tone="info">{t('chw.start.draftFound', { code: draft.code })}</Notice>
          <div className={styles.actions}>
            <Button block onClick={begin}>
              {t('chw.start.continue')}
            </Button>
            <Button
              variant="secondary"
              block
              onClick={() => {
                clear();
                begin();
              }}
            >
              {t('chw.start.discard')}
            </Button>
          </div>
        </>
      ) : (
        <div className={styles.actions}>
          <Button block onClick={begin}>
            {t('chw.start.start')}
          </Button>
        </div>
      )}
    </div>
  );
}
