import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { DemoBadge, Button } from '@ntd-watch/design-system';
import { ROLES, homePathFor, type Role } from '@ntd-watch/domain';
import { resetDemoEnvironment } from '../demo/resetDemo';
import { useDemoSession } from '../session/demoSession';
import styles from './DemoBanner.module.css';

/** True on a phone-width screen, where the banner keeps the same facts in fewer lines. */
function useCompactScreen(): boolean {
  const query = '(max-width: 40rem)';
  const [compact, setCompact] = useState(
    () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const m = window.matchMedia(query);
    const on = () => setCompact(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return compact;
}

/** Shown on every screen so synthetic data and simulated access are never mistaken for the real thing. */
export function DemoBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const role = useDemoSession((s) => s.role);
  const setRole = useDemoSession((s) => s.setRole);
  const signOut = useDemoSession((s) => s.signOut);
  const client = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const compact = useCompactScreen();

  return (
    <header className={styles.banner}>
      <DemoBadge />
      <strong className={styles.mode}>{t('banner.mode')}</strong>
      <p className={styles.text}>
        {compact ? t('banner.short') : `${t('banner.demo')} ${t('banner.auth')}`}
      </p>
      {role ? (
        <div className={styles.controls}>
          <label>
            <span className="visually-hidden">{t('banner.role')}</span>
            <select
              className={styles.select}
              aria-label={t('banner.role')}
              value={role}
              onChange={(e) => {
                const next = e.target.value as Role;
                setRole(next);
                navigate(homePathFor(next));
              }}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`roles.${r}`)}
                </option>
              ))}
            </select>
          </label>
          {confirming ? (
            <span
              role="alertdialog"
              aria-label={t('banner.resetConfirm')}
              className={styles.confirm}
            >
              <span>{t('banner.resetConfirm')}</span>
              <Button
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  void resetDemoEnvironment(client)
                    .then(() => {
                      setConfirming(false);
                      setDone(true);
                      navigate(homePathFor(role));
                    })
                    .finally(() => setBusy(false));
                }}
              >
                {t('banner.resetYes')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                {t('banner.resetNo')}
              </Button>
            </span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDone(false);
                setConfirming(true);
              }}
            >
              {t('banner.reset')}
            </Button>
          )}
          {done ? (
            <span role="status" className={styles.done}>
              {t('banner.resetDone')}
            </span>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              signOut();
              navigate('/');
            }}
          >
            Exit demo
          </Button>
        </div>
      ) : null}
    </header>
  );
}
