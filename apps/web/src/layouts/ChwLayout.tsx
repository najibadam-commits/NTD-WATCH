import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { CHW_BOTTOM_NAV } from '../nav/navigation';
import styles from './ChwLayout.module.css';

/** Mobile-first shell for the CHW app: narrow column, bottom navigation, one primary action. */
export function ChwLayout() {
  const { t } = useTranslation();
  return (
    <div className={styles.shell}>
      <div className={styles.bar}>{t('app.name')}</div>
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <Link className={styles.fab} to="/chw/assessments/new">
        + {t('chw.nav.newAssessment')}
      </Link>
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
