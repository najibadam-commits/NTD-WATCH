import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Notice } from '@ntd-watch/design-system';
import { DEMO_CHW, communityName } from '@ntd-watch/demo-data';
import {
  DEMO_DATA_NOTICE,
  DEMO_RULES_NOTICE,
  GEOGRAPHY_NOTICE,
  PROTOTYPE_OFFLINE_NOTICE,
  SIMULATED_AUTH_NOTICE,
} from '@ntd-watch/domain';
import { useMockControls } from '../../mock/controls';
import { useConnectivity } from '../../offline/connectivity';
import { localDb } from '../../offline/localDb';
import { requeue, syncOutbox } from '../../offline/sync';
import { useDemoSession } from '../../session/demoSession';
import { SyncBadge } from '../components/Shared';
import { useRecords } from '../useRecord';
import styles from '../chw.module.css';

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={styles.row}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function ProfileScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signOut = useDemoSession((s) => s.signOut);
  const simulatedOffline = useConnectivity((s) => s.simulatedOffline);
  const setSimulatedOffline = useConnectivity((s) => s.setSimulatedOffline);
  const controls = useMockControls();
  const queue = useRecords(
    async () => (await localDb.outbox.orderBy('createdAt').toArray()).reverse(),
    [],
  );

  return (
    <div className={styles.stack}>
      <h1>{t('chw.profile.title')}</h1>
      <p>{t('chw.profile.who', { label: DEMO_CHW.label })}</p>
      <p className={styles.muted}>
        {t('chw.profile.community', { name: communityName(DEMO_CHW.communityId) })}
      </p>

      <section className={styles.resultBox} aria-labelledby="sync-h">
        <h2 id="sync-h">{t('chw.profile.syncTitle')}</h2>
        <p className={styles.muted}>{t('chw.profile.syncBody')}</p>
        <Notice tone="info">{PROTOTYPE_OFFLINE_NOTICE}</Notice>
        <Button size="sm" onClick={() => void syncOutbox({ force: true })}>
          {t('chw.profile.syncNow')}
        </Button>
        {queue.items.length === 0 ? (
          <p className={styles.muted}>{t('chw.profile.queueEmpty')}</p>
        ) : (
          <ul className={styles.list} aria-label={t('chw.profile.syncTitle')}>
            {queue.items.map((i) => (
              <li key={i.key} className={styles.item}>
                <div className={styles.between}>
                  <strong>{t(`sync.kind.${i.kind}`)}</strong>
                  <SyncBadge state={i.status} />
                </div>
                <span className={styles.muted}>
                  {t('chw.profile.attempts', { n: i.attempts })}
                  {i.lastError ? ` · ${i.lastError}` : ''}
                </span>
                {i.status === 'failed' || i.status === 'rejected' ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void requeue(i.key).then(() => syncOutbox({ force: true }))}
                  >
                    {t('chw.profile.retry')}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.resultBox} aria-labelledby="sim-h">
        <h2 id="sim-h">{t('chw.profile.simTitle')}</h2>
        <p className={styles.muted}>{t('chw.profile.simBody')}</p>
        <Toggle
          label={t('chw.profile.offline')}
          checked={simulatedOffline}
          onChange={setSimulatedOffline}
        />
        <Toggle
          label={t('chw.profile.serverDown')}
          checked={controls.serverDown}
          onChange={controls.setServerDown}
        />
        <div className={styles.row}>
          <Button size="sm" variant="secondary" onClick={() => controls.setFailNext(1)}>
            {t('chw.profile.failOnce')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => controls.setDropResponseNext(1)}>
            {t('chw.profile.dropOnce')}
          </Button>
        </div>
      </section>

      <section className={styles.stack} aria-labelledby="notes-h">
        <h2 id="notes-h">{t('chw.profile.notices')}</h2>
        <Notice tone="demo">{DEMO_DATA_NOTICE}</Notice>
        <Notice tone="demo">{DEMO_RULES_NOTICE}</Notice>
        <Notice tone="info">{SIMULATED_AUTH_NOTICE}</Notice>
        <Notice tone="info">{GEOGRAPHY_NOTICE}</Notice>
      </section>

      <Button
        variant="secondary"
        block
        onClick={() => {
          signOut();
          navigate('/');
        }}
      >
        {t('chw.profile.signOut')}
      </Button>
    </div>
  );
}
