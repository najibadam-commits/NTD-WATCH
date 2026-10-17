import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <main id="main-content" tabIndex={-1} style={{ padding: '2rem 1rem' }}>
      <h1>{t('notFound.title')}</h1>
      <p style={{ margin: '1rem 0' }}>{t('notFound.body')}</p>
      <Link to="/">{t('notFound.back')}</Link>
    </main>
  );
}
