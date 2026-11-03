import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { CHW_BOTTOM_NAV } from '../nav/navigation';
import { ConnectivityBanner } from '../chw/components/Shared';
import { useSyncEngine } from '../chw/useSyncEngine';
import styles from './ChwLayout.module.css';

/** Mobile-first shell for the CHW app: narrow column, bottom navigation, one primary action. */
export function ChwLayout() {
  const { t } = useTranslation();
  useSyncEngine();
  const { pathname } = useLocation();
  // The shortcut only appears on the dashboard and the assessments list, so it never covers a form, a result or a Back button.
  const showFab = pathname === '/chw' || pathname === '/chw/assessments';
  return (
    <div className={styles.shell}>
      <div className={styles.bar}>
        <img
          className={styles.emblem}
          src={`${import.meta.env.BASE_URL}brand/ntd-watch-emblem-64.png`}
          width={32}
          height={32}
          alt=""
        />
        {t('app.name')}
      </div>
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <ConnectivityBanner />
        <Outlet />
      </main>
      {showFab ? (
        <Link className={styles.fab} to="/chw/assessments/new">
          + {t('chw.nav.newAssessment')}
        </Link>
      ) : null}
      <nav className={styles.nav} aria-label={t('chw.nav.label')}>
        {CHW_BOTTOM_NAV.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.end}>
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
