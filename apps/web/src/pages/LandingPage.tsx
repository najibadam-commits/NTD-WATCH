import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Notice } from '@ntd-watch/design-system';
import {
  DEMO_DATA_NOTICE,
  DEMO_RULES_NOTICE,
  DISCLAIMER,
  GEOGRAPHY_NOTICE,
  PROTOTYPE_OFFLINE_NOTICE,
  SIMULATED_AUTH_NOTICE,
  homePathFor,
  type Role,
} from '@ntd-watch/domain';
import { CoreLoop } from '../components/CoreLoop';
import { CHW_SCREENS, PROGRAMME_SCREENS } from '../nav/navigation';
import { useDemoSession } from '../session/demoSession';
import styles from './LandingPage.module.css';

const PROGRAMME_ROLES: Role[] = ['facility', 'lga', 'state', 'admin'];
const LIMITS = ['diagnose', 'outbreak', 'validated', 'real', 'integrations'] as const;

export function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setRole = useDemoSession((s) => s.setRole);
  const role = useDemoSession((s) => s.role);

  const enter = (role: Role) => {
    setRole(role);
    navigate(homePathFor(role));
  };

  return (
    <main id="main-content" tabIndex={-1} className={styles.page}>
      <section className={styles.hero}>
        <img
          className={styles.logo}
          src={`${import.meta.env.BASE_URL}brand/ntd-watch-logo-640.png`}
          width={640}
          height={240}
          alt={t('app.logoAlt')}
        />
        <h1 className={styles.visuallyHidden}>{t('app.name')}</h1>
        <p className={styles.sub}>{t('app.tagline')}</p>
        <p>{t('landing.what')}</p>
        <Notice tone="demo">{DISCLAIMER}</Notice>
        <CoreLoop />
      </section>

      <section className={styles.entries}>
        <Card>
          <h2>{t('landing.chwTitle')}</h2>
          <p>{t('landing.chwBody')}</p>
          <div className={styles.actions}>
            <Button onClick={() => navigate(role === 'chw' ? '/chw' : '/chw/login')}>
              {t('landing.chwOpen')}
            </Button>
          </div>
        </Card>
        <Card>
          <h2>{t('landing.progTitle')}</h2>
          <p>{t('landing.progBody')}</p>
          <div className={styles.actions} role="group" aria-label={t('landing.progOpenAs')}>
            {PROGRAMME_ROLES.map((r) => (
              <Button key={r} variant="secondary" size="sm" onClick={() => enter(r)}>
                {t('landing.progOpenAs')} {t(`roles.${r}`)}
              </Button>
            ))}
          </div>
        </Card>
      </section>

      <section>
        <h2>{t('landing.limitsTitle')}</h2>
        <ul className={styles.list}>
          {LIMITS.map((k) => (
            <li key={k}>{t(`limits.${k}`)}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>{t('landing.statusTitle')}</h2>
        <ul className={styles.list}>
          <li>
            Women and girls assessment: permission first, a non-diagnostic signal with an
            explanation, and a simulated referral to invented facilities.
          </li>
          <li>
            Community health worker app ({CHW_SCREENS.length} screens): records are saved on the
            device first and synchronised later to a mock server.
          </li>
          <li>
            Programme dashboard ({PROGRAMME_SCREENS.length} screens): priority communities, a
            fictional-geography map, referral monitoring and reports, all from synthetic data.
          </li>
          <li>
            Simulated, not real: sign-in, roles, the server and the facilities. Not yet built: a
            real backend, integrations, clinical validation and languages other than English.
          </li>
        </ul>
      </section>

      <section className={styles.notices} aria-label={t('landing.noticesTitle')}>
        <Notice tone="info">{SIMULATED_AUTH_NOTICE}</Notice>
        <Notice tone="info">{DEMO_RULES_NOTICE}</Notice>
        <Notice tone="info">{DEMO_DATA_NOTICE}</Notice>
        <Notice tone="info">{GEOGRAPHY_NOTICE}</Notice>
        <Notice tone="info">{PROTOTYPE_OFFLINE_NOTICE}</Notice>
      </section>
    </main>
  );
}
