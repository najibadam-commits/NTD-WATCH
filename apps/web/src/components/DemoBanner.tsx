import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DemoBadge, Button } from '@ntd-watch/design-system';
import { ROLES, homePathFor, type Role } from '@ntd-watch/domain';
import { useDemoSession } from '../session/demoSession';
import styles from './DemoBanner.module.css';

/** Shown on every screen so synthetic data and simulated access are never mistaken for the real thing. */
export function DemoBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const role = useDemoSession((s) => s.role);
  const setRole = useDemoSession((s) => s.setRole);
  const signOut = useDemoSession((s) => s.signOut);

  return (
    <header className={styles.banner}>
      <DemoBadge />
      <p className={styles.text}>
        {t('banner.demo')} {t('banner.auth')}
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
