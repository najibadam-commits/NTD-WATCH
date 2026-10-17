import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { Button, EmptyState, LoadingState, Notice, RiskBadge } from '@ntd-watch/design-system';
import { facilityName } from '@ntd-watch/demo-data';
import { REFERRAL_STAGES, REFERRAL_STAGE_LABELS, nextStage } from '@ntd-watch/domain';
import { simulateFacilityUpdate } from '../../offline/apiClient';
import { isOnline, useConnectivity } from '../../offline/connectivity';
import { localDb } from '../../offline/localDb';
import { pullReferralStatus } from '../../offline/repository';
import { LinkButton } from '../../components/LinkButton';
import { DemoLabel, RecordSync, useSyncState } from '../components/Shared';
import { useRecord } from '../useRecord';
import styles from '../chw.module.css';

export function ReferralStatusScreen() {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const referral = useRecord(() => localDb.referrals.get(id), [id]);
  const online = useConnectivity((s) => s.browserOnline && !s.simulatedOffline);
  const syncState = useSyncState('referral', referral.value?.assessmentKey ?? '');
  const [message, setMessage] = useState<{
    tone: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const refresh = useMutation({
    mutationFn: async () => {
      if (!isOnline()) return 'offline' as const;
      await pullReferralStatus(id);
      return 'ok' as const;
    },
    onSuccess: (r) =>
      setMessage(
        r === 'offline'
          ? { tone: 'info', text: t('chw.referral.offline') }
          : { tone: 'success', text: t('chw.referral.refreshed') },
      ),
    onError: () => setMessage({ tone: 'error', text: t('chw.referral.refreshFailed') }),
  });

  const advance = useMutation({
    mutationFn: async (stage: string) => {
      await simulateFacilityUpdate(id, stage);
      await pullReferralStatus(id);
    },
    onSuccess: () => setMessage({ tone: 'success', text: t('chw.referral.refreshed') }),
    onError: (e: Error) => setMessage({ tone: 'error', text: e.message }),
  });

  if (referral.loading) return <LoadingState label={t('common.loading')} />;
  const r = referral.value;
  if (!r) {
    return (
      <EmptyState
        title={t('chw.referral.notFound')}
        action={<Link to="/chw/referrals">{t('chw.referral.listTitle')}</Link>}
      />
    );
  }
  const next = nextStage(r.stage);
  const reached = REFERRAL_STAGES.indexOf(r.stage);
  const synced = syncState === 'synced';

  return (
    <div className={styles.stack}>
      <div className={styles.between}>
        <h1>{t('chw.referral.statusTitle')}</h1>
        <RecordSync kind="referral" clientKey={r.assessmentKey} />
      </div>
      <DemoLabel />
      <p>
        <strong>{t('chw.referral.id', { id: r.id })}</strong>
      </p>
      <div className={styles.row}>
        <RiskBadge level={r.riskLevel} />
        <span>{t('chw.referral.facilityLine', { name: facilityName(r.facilityId) })}</span>
      </div>
      <p className={styles.muted}>{t('chw.referral.for', { code: r.assessmentId })}</p>

      {!synced ? <Notice tone="info">{t('chw.referral.notSyncedYet')}</Notice> : null}
      {r.stage === 'CLOSED' ? <Notice tone="success">{t('chw.referral.closed')}</Notice> : null}

      <section className={styles.resultBox} aria-labelledby="timeline-h">
        <h2 id="timeline-h">{t('chw.referral.timeline')}</h2>
        <ol className={styles.timeline}>
          {REFERRAL_STAGES.map((stage, i) => {
            const at = r.stageTimestamps[i];
            return (
              <li key={stage} data-reached={i <= reached} data-current={i === reached}>
                <span aria-hidden="true">{i <= reached ? '✓' : '○'}</span>
                <span>
                  {REFERRAL_STAGE_LABELS[stage]}
                  <span className={styles.muted}>
                    {' · '}
                    {at
                      ? `${t('chw.referral.reached')} ${new Date(at).toLocaleString()}`
                      : t('chw.referral.notReached')}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
      {!online ? <Notice tone="info">{t('chw.referral.offline')}</Notice> : null}

      <div className={styles.actions}>
        <Button
          block
          variant="secondary"
          disabled={refresh.isPending}
          onClick={() => refresh.mutate()}
        >
          {refresh.isPending ? t('chw.referral.refreshing') : t('chw.referral.refresh')}
        </Button>
        <LinkButton block to={`/chw/follow-ups/${r.assessmentKey}`}>
          {t('chw.referral.followUp')}
        </LinkButton>
      </div>

      {next ? (
        <Notice tone="demo" title={t('chw.referral.demoPanel')}>
          <p>{t('chw.referral.demoPanelBody')}</p>
          <Button
            size="sm"
            variant="secondary"
            disabled={!synced || !online || advance.isPending}
            onClick={() => advance.mutate(next)}
          >
            {t('chw.referral.advance', { stage: REFERRAL_STAGE_LABELS[next] })}
          </Button>
        </Notice>
      ) : null}
    </div>
  );
}
