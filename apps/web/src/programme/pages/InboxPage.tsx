import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Notice, RiskBadge } from '@ntd-watch/design-system';
import {
  REFERRAL_OUTCOMES,
  REFERRAL_OUTCOME_LABELS,
  REFERRAL_STAGE_LABELS,
  nextStage,
  stageIndex,
  type ReferralOutcome,
} from '@ntd-watch/domain';
import type { InboxItem } from '@ntd-watch/programme';
import { patchReferralStage } from '../api';
import { notifyDataChanged } from '../dataChannel';
import { formatDateTime, formatNumber } from '../format';
import { DataStatus, Kpi, PageHeader, QueryBoundary } from '../components/Common';
import { TableScroll } from '../components/TableScroll';
import { useInbox, useLiveRefresh, useRole } from '../useProgrammeData';
import styles from '../programme.module.css';

const ACTION_KEY = {
  ACCEPTED: 'accept',
  PATIENT_ARRIVED: 'arrived',
  ASSESSED: 'assessed',
  FOLLOW_UP: 'followUp',
  CLOSED: 'close',
} as const;

/**
 * Experience B: the facility worker's referral inbox. It lists only referrals sent to the
 * caller's SIMULATED facility, lets them move each one forward one stage at a time, and records
 * a synthetic outcome. The outcome is a demonstration category, not a clinical record.
 */
export function InboxPage() {
  const { t } = useTranslation();
  const query = useInbox();
  const role = useRole();
  const client = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [outcome, setOutcome] = useState<ReferralOutcome | ''>('');
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  useLiveRefresh();

  const advance = useMutation({
    mutationFn: (v: {
      id: string;
      stage: Parameters<typeof patchReferralStage>[2];
      o?: ReferralOutcome;
    }) => patchReferralStage(role, v.id, v.stage, v.o),
    onSuccess: () => {
      setOutcome('');
      notifyDataChanged();
      void client.invalidateQueries({ queryKey: ['programme'] });
    },
  });

  return (
    <div className={styles.page}>
      <PageHeader title={t('programme.inbox.title')} lead={t('programme.inbox.lead')} />
      <Notice tone="info">{t('programme.inbox.scopeNote')}</Notice>
      <DataStatus query={query} />
      <QueryBoundary
        query={query}
        isEmpty={(i) => i.items.length === 0}
        emptyTitle={t('programme.inbox.empty')}
      >
        {(inbox) => {
          const count = (pred: (i: InboxItem) => boolean) => inbox.items.filter(pred).length;
          const idx = (i: InboxItem) => stageIndex(i.referral.stage);
          const visible = inbox.items.filter(
            (i) => filter === 'all' || i.referral.stage !== 'CLOSED',
          );
          const selected = inbox.items.find((i) => i.referral.id === selectedId);
          const next = selected ? nextStage(selected.referral.stage) : null;
          return (
            <>
              <p className={styles.muted}>
                {t('programme.inbox.facility', { name: inbox.facilityName })}
              </p>
              <div className={styles.grid} role="group" aria-label={t('programme.inbox.counts')}>
                <Kpi
                  label={t('programme.inbox.new')}
                  value={formatNumber(count((i) => i.referral.stage === 'GENERATED'))}
                />
                <Kpi
                  label={t('programme.inbox.inProgress')}
                  value={formatNumber(count((i) => idx(i) >= 1 && idx(i) <= 2))}
                />
                <Kpi
                  label={t('programme.inbox.assessedOpen')}
                  value={formatNumber(count((i) => idx(i) >= 3 && i.referral.stage !== 'CLOSED'))}
                />
                <Kpi
                  label={t('programme.inbox.closed')}
                  value={formatNumber(count((i) => i.referral.stage === 'CLOSED'))}
                />
              </div>

              <div className={styles.row}>
                <label className={styles.field}>
                  {t('programme.inbox.show')}
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as 'open' | 'all')}
                  >
                    <option value="open">{t('programme.inbox.showOpen')}</option>
                    <option value="all">{t('programme.inbox.showAll')}</option>
                  </select>
                </label>
              </div>

              <section className={styles.panel} aria-labelledby="inbox-table">
                <h2 id="inbox-table">{t('programme.inbox.tableTitle')}</h2>
                <TableScroll>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">{t('programme.inbox.received')}</th>
                        <th scope="col">{t('programme.table.community')}</th>
                        <th scope="col">{t('programme.inbox.riskSignal')}</th>
                        <th scope="col">{t('programme.inbox.stage')}</th>
                        <th scope="col">{t('programme.inbox.outcome')}</th>
                        <th scope="col">
                          <span className="visually-hidden">{t('programme.table.actions')}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((i) => (
                        <tr key={i.referral.id} data-selected={i.referral.id === selectedId}>
                          <td>{formatDateTime(i.referral.stageTimestamps[0]!)}</td>
                          <th scope="row">{i.assessment?.communityName ?? '–'}</th>
                          <td>
                            {i.assessment?.riskLevel ? (
                              <RiskBadge level={i.assessment.riskLevel} />
                            ) : (
                              '–'
                            )}
                          </td>
                          <td>{REFERRAL_STAGE_LABELS[i.referral.stage]}</td>
                          <td>
                            {i.referral.outcome ? REFERRAL_OUTCOME_LABELS[i.referral.outcome] : '–'}
                          </td>
                          <td>
                            <button
                              type="button"
                              className={styles.linkBtn}
                              aria-label={t('programme.inbox.openRef', {
                                name: i.assessment?.communityName ?? '',
                              })}
                              onClick={() => {
                                setSelectedId(i.referral.id);
                                setOutcome('');
                              }}
                            >
                              {t('programme.inbox.open')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
                {visible.length === 0 ? (
                  <p className={styles.muted}>{t('programme.inbox.noneOpen')}</p>
                ) : null}
              </section>

              {selected ? (
                <section
                  className={styles.panel}
                  aria-label={t('programme.inbox.detail')}
                  aria-live="polite"
                >
                  <h2>{t('programme.inbox.detail')}</h2>
                  <Notice tone="demo">{t('programme.inbox.notClinical')}</Notice>
                  <dl className={styles.kv}>
                    <dt>{t('programme.table.community')}</dt>
                    <dd>{selected.assessment?.communityName ?? '–'}</dd>
                    <dt>{t('programme.inbox.person')}</dt>
                    <dd>
                      {selected.assessment
                        ? `${selected.assessment.ageGroup}, ${selected.assessment.sex}`
                        : '–'}
                    </dd>
                    <dt>{t('programme.inbox.riskSignal')}</dt>
                    <dd>
                      {selected.assessment?.riskLevel ? (
                        <RiskBadge level={selected.assessment.riskLevel} />
                      ) : (
                        '–'
                      )}
                    </dd>
                    <dt>{t('programme.inbox.reported')}</dt>
                    <dd>
                      {selected.assessment?.symptoms.length
                        ? selected.assessment.symptoms
                            .map((s) => t(`options.symptoms.${s}`, { defaultValue: s }))
                            .join(', ')
                        : '–'}
                    </dd>
                    <dt>{t('programme.inbox.source')}</dt>
                    <dd>{t(`programme.inbox.source_${selected.source}`)}</dd>
                    <dt>{t('programme.inbox.stage')}</dt>
                    <dd>{REFERRAL_STAGE_LABELS[selected.referral.stage]}</dd>
                  </dl>
                  {selected.assessment?.riskWhy.length ? (
                    <>
                      <h3>{t('programme.inbox.why')}</h3>
                      <ul>
                        {selected.assessment.riskWhy.map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}

                  {next ? (
                    <div className={styles.stack}>
                      {next === 'ASSESSED' ? (
                        <label className={styles.field}>
                          {t('programme.inbox.outcomeLabel')}
                          <select
                            value={outcome}
                            onChange={(e) => setOutcome(e.target.value as ReferralOutcome | '')}
                          >
                            <option value="">{t('programme.inbox.outcomeChoose')}</option>
                            {REFERRAL_OUTCOMES.map((o) => (
                              <option key={o} value={o}>
                                {REFERRAL_OUTCOME_LABELS[o]}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                      <Button
                        disabled={advance.isPending || (next === 'ASSESSED' && !outcome)}
                        onClick={() =>
                          advance.mutate({
                            id: selected.referral.id,
                            stage: next,
                            o: next === 'ASSESSED' && outcome ? outcome : undefined,
                          })
                        }
                      >
                        {t(`programme.inbox.action.${ACTION_KEY[next as keyof typeof ACTION_KEY]}`)}
                      </Button>
                    </div>
                  ) : (
                    <p className={styles.muted}>{t('programme.inbox.finished')}</p>
                  )}
                  {advance.isError ? (
                    <Notice tone="error">
                      {advance.error instanceof Error
                        ? advance.error.message
                        : t('programme.errorBody')}
                    </Notice>
                  ) : null}
                </section>
              ) : null}
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
