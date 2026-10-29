import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Notice } from '@ntd-watch/design-system';
import { lgaName } from '@ntd-watch/demo-data';
import {
  PROGRAMME_PRIORITIES,
  countByProgrammePriority,
  type ProgrammeSummary,
} from '@ntd-watch/programme';
import { ConfidencePill, DimensionList, PriorityPill } from './Intelligence';
import styles from '../programme.module.css';

/** The DEMONSTRATION DATA banner shown on every P2 programme-intelligence view. */
export function DemoBanner() {
  const { t } = useTranslation();
  return (
    <div className={styles.demoBanner} role="note">
      <strong>{t('intel.banner')}</strong>
      <span>{t('intel.bannerBody')}</span>
    </div>
  );
}

/**
 * Community programme priority (women and girls). Community-level only: bands, coarse
 * observation ranges and explanations. No person-level data reaches this component.
 */
export function IntelligenceSection({ summary }: { summary: ProgrammeSummary }) {
  const { t } = useTranslation();
  const { intelligence, fgs } = summary;
  const [open, setOpen] = useState<string | undefined>();
  const rows = intelligence.rows;
  const counts = countByProgrammePriority(rows);
  const observed = rows.filter((r) => r.observations !== 'UNDER_THRESHOLD').length;
  const attention = counts.HIGH_PRIORITY_FOR_ATTENTION + counts.PRIORITY_FOR_REVIEW;
  const needInfo = rows.filter(
    (r) => r.confidence === 'LOW' || r.confidence === 'INSUFFICIENT',
  ).length;

  return (
    <section className={styles.stack} aria-labelledby="intel-title" data-testid="intelligence">
      <h2 id="intel-title">{t('intel.title')}</h2>
      <p>{t('intel.lead')}</p>
      <DemoBanner />
      <Notice tone="info">{t('intel.suppression', { threshold: intelligence.threshold })}</Notice>

      <Card title={t('intel.summaryTitle')}>
        <dl className={styles.prioBands}>
          <div>
            <dt className={styles.muted}>{t('intel.observed')}</dt>
            <dd>{t('intel.observedValue', { count: observed, total: rows.length })}</dd>
          </div>
          <div>
            <dt className={styles.muted}>{t('intel.attention')}</dt>
            <dd>{attention}</dd>
          </div>
          <div>
            <dt className={styles.muted}>{t('intel.needInfo')}</dt>
            <dd>{needInfo}</dd>
          </div>
          <div>
            <dt className={styles.muted}>{t('intel.referrals')}</dt>
            <dd>
              {fgs.referrals === null
                ? t('intel.referralsHidden', { threshold: intelligence.threshold })
                : fgs.referrals}
            </dd>
          </div>
        </dl>
        <h3>{t('intel.countsTitle')}</h3>
        <ul className={styles.prioBands}>
          {PROGRAMME_PRIORITIES.map((p) => (
            <li key={p}>
              <PriorityPill priority={p} /> {counts[p]}
            </li>
          ))}
        </ul>
        <p className={styles.muted}>{t('intel.notFinding')}</p>
      </Card>

      <div className={styles.panel}>
        <h3 id="intel-table">{t('intel.tableTitle')}</h3>
        <p className={styles.muted}>{t('intel.tableLead')}</p>
        <ul className={styles.intelList} aria-labelledby="intel-table">
          {rows.map((r) => (
            <li
              key={r.communityId}
              className={styles.intelItem}
              data-selected={r.communityId === open}
            >
              <div className={styles.intelHead}>
                <strong>{r.name}</strong>
                <span className={styles.muted}>
                  {lgaName(r.lgaId)} · {t('intel.synthetic')}
                </span>
                <PriorityPill priority={r.priority} />
                <ConfidencePill confidence={r.confidence} />
              </div>
              {r.cappedByConfidence ? <p className={styles.muted}>{t('intel.capped')}</p> : null}
              <dl className={styles.intelFacts}>
                <div>
                  <dt>{t('intel.col.signal')}</dt>
                  <dd>{t(`intel.signal.${r.signalActivity}`)}</dd>
                </div>
                <div>
                  <dt>{t('intel.col.context')}</dt>
                  <dd>
                    <strong>{t(`intel.band.${r.vulnerability}`)}</strong>
                    <DimensionList row={r} />
                  </dd>
                </div>
                <div>
                  <dt>{t('intel.col.observations')}</dt>
                  <dd>{t(`intel.range.${r.observations}`)}</dd>
                </div>
              </dl>
              <button
                type="button"
                className={styles.linkBtn}
                aria-expanded={r.communityId === open}
                onClick={() => setOpen(open === r.communityId ? undefined : r.communityId)}
              >
                {t('intel.showReason')}
                <span className="visually-hidden"> {r.name}</span>
              </button>
              {r.communityId === open ? (
                <div role="region" aria-label={t('intel.reasonFor', { name: r.name })}>
                  <h4>{t('intel.reasonFor', { name: r.name })}</h4>
                  <ul>
                    {r.why.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
