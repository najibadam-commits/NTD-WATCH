import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router-dom';
import { programmePagesFor } from '@ntd-watch/domain';
import { PROGRAMME_SCREENS } from '../nav/navigation';
import { useDemoSession } from '../session/demoSession';
import styles from './ProgrammeLayout.module.css';

/** Responsive shell for programme users. Navigation shows only the pages the simulated role can open. */
export function ProgrammeLayout() {
  const { t } = useTranslation();
  const role = useDemoSession((s) => s.role);
  const allowed = role ? programmePagesFor(role) : [];
  return (
    <div className={styles.shell}>
      <nav className={styles.side} aria-label={t('programme.nav.label')}>
        {PROGRAMME_SCREENS.filter((s) => allowed.includes(s.page)).map((s) => (
          <NavLink key={s.page} to={`/programme/${s.page}`}>
            {t(s.titleKey)}
          </NavLink>
        ))}
      </nav>
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
