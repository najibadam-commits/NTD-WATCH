import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button, ErrorSummary, Notice } from '@ntd-watch/design-system';
import { DEMO_CHW } from '@ntd-watch/demo-data';
import { SIMULATED_AUTH_NOTICE } from '@ntd-watch/domain';
import i18n from '../../i18n';
import { useDemoSession } from '../../session/demoSession';
import styles from '../chw.module.css';

/** SIMULATED sign-in. The PIN is only checked for shape. Nothing is verified or protected. */
export function LoginScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setRole = useDemoSession((s) => s.setRole);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      style={{ maxWidth: '30rem', margin: '0 auto', padding: '1.5rem 1rem' }}
    >
      <form
        className={styles.stack}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setAttempt((n) => n + 1);
          if (!/^\d{4}$/.test(pin)) {
            setError(i18n.t('validation.pin'));
            return;
          }
          setError(undefined);
          setRole('chw');
          navigate('/chw');
        }}
      >
        <h1>{t('chw.login.title')}</h1>
        <p>{t('chw.login.intro')}</p>
        <Notice tone="demo">{SIMULATED_AUTH_NOTICE}</Notice>
        <p>{t('chw.login.who', { label: DEMO_CHW.label })}</p>
        <ErrorSummary
          title={t('validation.summaryTitle')}
          errors={error ? [{ field: 'pin', message: error }] : []}
          attempt={attempt}
        />
        <div className={styles.field} id="pin">
          <label htmlFor="pin-input">{t('chw.login.pin')}</label>
          <span className={styles.muted}>{t('chw.login.pinHint')}</span>
          {error ? <span>{error}</span> : null}
          <input
            id="pin-input"
            className={styles.input}
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={pin}
            aria-invalid={error ? true : undefined}
            onChange={(e) => setPin(e.target.value)}
          />
        </div>
        <div className={styles.actions}>
          <Button type="submit" block>
            {t('chw.login.signIn')}
          </Button>
          <Link to="/">{t('chw.login.back')}</Link>
        </div>
      </form>
    </main>
  );
}
