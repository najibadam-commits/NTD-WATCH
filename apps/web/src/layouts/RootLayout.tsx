import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { DemoBanner } from '../components/DemoBanner';

export function RootLayout() {
  const { t } = useTranslation();
  return (
    <>
      <a className="skip-link" href="#main-content">
        {t('skip')}
      </a>
      <DemoBanner />
      <Outlet />
    </>
  );
}
