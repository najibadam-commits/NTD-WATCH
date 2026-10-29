import { useTranslation } from 'react-i18next';
import { Button } from '@ntd-watch/design-system';
import { DEMO_LABEL_TEXT } from '@ntd-watch/rules-engine';
import { useLiveQuery } from 'dexie-react-hooks';
import { useConnectivity, isOnline } from '../../offline/connectivity';
import { localDb, type OutboxItem } from '../../offline/localDb';
import { syncOutbox } from '../../offline/sync';
import styles from '../chw.module.css';

/** Rule sets whose id starts with "demo-" are demonstration placeholders. */
export function isDemoRuleSetId(id: string | null | undefined): boolean {
  return !id || id.startsWith('demo-');
}

/** The mandatory marker. It appears with the result, with the reasons and with the action. */
export function DemoLabel() {
  return (
    <p className={styles.label} data-testid="demo-label">
      {DEMO_LABEL_TEXT}
    </p>
  );
}

export type SyncState = 'local' | 'restoring' | OutboxItem['status'];

export function SyncBadge({ state }: { state: SyncState }) {
  const { t } = useTranslation();
  const label = state === 'local' ? t('sync.local') : t(`sync.${state}`);
  return (
    <span className={styles.badge} data-sync={state}>
      {label}
    </span>
  );
}

/** Sync state of one record, read live from the queue. */
export function useSyncState(kind: OutboxItem['kind'], clientKey: string): SyncState | undefined {
  return useLiveQuery(async () => {
    const item = await localDb.outbox.get(`${kind}:${clientKey}`);
    if (!item) return 'local';
    // A record the mock server once acknowledged and then lost is being sent again.
    const waiting =
      item.status === 'pending' || item.status === 'syncing' || item.status === 'failed';
    return item.restore && waiting ? 'restoring' : item.status;
  }, [kind, clientKey]);
}

export function RecordSync({ kind, clientKey }: { kind: OutboxItem['kind']; clientKey: string }) {
  const state = useSyncState(kind, clientKey);
  return state ? <SyncBadge state={state} /> : null;
}

/** Connection and queue status at the top of the CHW app. */
export function ConnectivityBanner() {
  const { t } = useTranslation();
  const browserOnline = useConnectivity((s) => s.browserOnline);
  const simulatedOffline = useConnectivity((s) => s.simulatedOffline);
  const online = browserOnline && !simulatedOffline;
  const waiting =
    useLiveQuery(() => localDb.outbox.where('status').notEqual('synced').count(), [], 0) ?? 0;
  const restoring =
    useLiveQuery(
      () =>
        localDb.outbox
          .filter((i) => !!i.restore && i.status !== 'synced' && i.status !== 'rejected')
          .count(),
      [],
      0,
    ) ?? 0;

  return (
    <div className={styles.conn} data-online={online} role="status" aria-label={t('sync.label')}>
      <span>
        <strong>{online ? t('sync.online') : t('sync.offline')}</strong>
        {simulatedOffline ? ` ${t('sync.simulated')}` : ''}
        {' · '}
        {waiting > 0 ? t('sync.waiting', { count: waiting }) : t('sync.allSynced')}
        {restoring > 0 ? ` · ${t('sync.restoringNote', { count: restoring })}` : ''}
      </span>
      {waiting > 0 && isOnline() ? (
        <Button size="sm" variant="secondary" onClick={() => void syncOutbox({ force: true })}>
          {t('chw.profile.syncNow')}
        </Button>
      ) : null}
    </div>
  );
}
