import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Notice } from '@ntd-watch/design-system';
import { homePathFor, type Role } from '@ntd-watch/domain';

export function AccessDeniedPage({ role }: { role: Role }) {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t('access.title')}</h1>
      <p style={{ margin: '1rem 0' }}>
        <Notice tone="error">{t('access.body', { role: t(`roles.${role}`) })}</Notice>
      </p>
      <Link to={homePathFor(role)}>{t('access.back')}</Link>
    </div>
  );
}
