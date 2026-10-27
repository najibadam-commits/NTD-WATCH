import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Notice } from '@ntd-watch/design-system';
import {
  CAPABILITIES,
  PROGRAMME_PAGES,
  PROGRAMME_PAGE_ROLES,
  ROLES,
  ROLE_LABELS,
  PROTOTYPE_OFFLINE_NOTICE,
  SIMULATED_AUTH_NOTICE,
} from '@ntd-watch/domain';
import { DEMO_LABEL_TEXT, DEMO_RULE_SET } from '@ntd-watch/rules-engine';
import { patchConfig } from '../api';
import { resetDemoEnvironment } from '../../demo/resetDemo';
import { PageHeader, QueryBoundary } from '../components/Common';
import { formatDateTime } from '../format';
import { useMockControls } from '../../mock/controls';
import { useConfig, useRole } from '../useProgrammeData';
import styles from '../programme.module.css';
import { TableScroll } from '../components/TableScroll';

export function SettingsPage() {
  const { t } = useTranslation();
  const role = useRole();
  const query = useConfig();
  const client = useQueryClient();
  const controls = useMockControls();
  const [days, setDays] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const saveDays = async (value: number) => {
    try {
      await patchConfig(role, value);
      setNotice({ tone: 'success', text: t('programme.settings.saved') });
      await client.invalidateQueries({ queryKey: ['programme'] });
    } catch (e) {
      setNotice({ tone: 'error', text: e instanceof Error ? e.message : t('programme.errorBody') });
    }
  };

  const reset = async () => {
    try {
      await resetDemoEnvironment(client);
      setConfirmReset(false);
      setNotice({ tone: 'success', text: t('programme.settings.resetDone') });
      await client.invalidateQueries({ queryKey: ['programme'] });
    } catch (e) {
      setNotice({ tone: 'error', text: e instanceof Error ? e.message : t('programme.errorBody') });
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader title={t('programme.settings.title')} lead={t('programme.settings.lead')} />
      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
      <QueryBoundary query={query}>
        {(c) => {
          const value = days ?? String(c.maxUnresolvedDays);
          const n = Number(value);
          const valid = Number.isInteger(n) && n >= 1 && n <= 30;
          return (
            <>
              <section className={styles.panel} aria-labelledby="set-rules">
                <h2 id="set-rules">{t('programme.settings.rules')}</h2>
                <Notice tone="demo">{DEMO_LABEL_TEXT}</Notice>
                <dl className={styles.kv}>
                  <dt>{t('programme.settings.ruleSet')}</dt>
                  <dd>{c.ruleSet.id}</dd>
                  <dt>{t('programme.settings.version')}</dt>
                  <dd>{c.ruleSet.version}</dd>
                  <dt>{t('programme.settings.status')}</dt>
                  <dd>{c.ruleSet.status}</dd>
                  <dt>{t('programme.settings.ruleCount')}</dt>
                  <dd>{c.ruleSet.ruleCount}</dd>
                </dl>
                <p className={styles.muted}>{c.ruleSet.description}</p>
                <p className={styles.muted}>{t('programme.settings.rulesReadOnly')}</p>
                <h3>{t('programme.settings.governanceTitle')}</h3>
                <p className={styles.muted}>{t('programme.settings.governanceNote')}</p>
                <TableScroll>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">{t('programme.settings.gov.id')}</th>
                        <th scope="col">{t('programme.settings.gov.description')}</th>
                        <th scope="col">{t('programme.settings.gov.level')}</th>
                        <th scope="col">{t('programme.settings.gov.version')}</th>
                        <th scope="col">{t('programme.settings.gov.status')}</th>
                        <th scope="col">{t('programme.settings.gov.source')}</th>
                        <th scope="col">{t('programme.settings.gov.owner')}</th>
                        <th scope="col">{t('programme.settings.gov.validation')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DEMO_RULE_SET.rules.map((r) => (
                        <tr key={r.id}>
                          <th scope="row">{r.id}</th>
                          <td>{r.explanation}</td>
                          <td>{r.level}</td>
                          <td>{DEMO_RULE_SET.version}</td>
                          <td>
                            {r.enabled
                              ? t('programme.settings.gov.active')
                              : t('programme.settings.gov.disabled')}{' '}
                            ({DEMO_RULE_SET.status})
                          </td>
                          <td>{t('programme.settings.gov.noSource')}</td>
                          <td>{t('programme.settings.gov.noOwner')}</td>
                          <td>{t('programme.settings.gov.notValidated')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              </section>

              <section className={styles.panel} aria-labelledby="set-cap">
                <h2 id="set-cap">{t('programme.settings.capabilityTitle')}</h2>
                <p className={styles.muted}>{t('programme.settings.capabilityNote')}</p>
                <TableScroll>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">{t('programme.settings.capability')}</th>
                        <th scope="col">{t('programme.settings.status')}</th>
                        <th scope="col">{t('programme.settings.capNote')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CAPABILITIES.map((c) => (
                        <tr key={c.id}>
                          <th scope="row">{c.name}</th>
                          <td>
                            <strong>{c.state}</strong>
                          </td>
                          <td>{c.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              </section>

              <section className={styles.panel} aria-labelledby="set-sla">
                <h2 id="set-sla">{t('programme.settings.thresholds')}</h2>
                <form
                  className={styles.stack}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (valid) void saveDays(n);
                  }}
                >
                  <label className={styles.field} style={{ maxWidth: '16rem' }}>
                    {t('programme.settings.unresolvedDays')}
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={value}
                      onChange={(e) => setDays(e.target.value)}
                      aria-invalid={!valid}
                    />
                  </label>
                  {!valid ? (
                    <Notice tone="error">{t('programme.settings.daysInvalid')}</Notice>
                  ) : null}
                  <div className={styles.row}>
                    <Button type="submit" disabled={!valid}>
                      {t('programme.settings.save')}
                    </Button>
                  </div>
                </form>
              </section>

              <section className={styles.panel} aria-labelledby="set-access">
                <h2 id="set-access">{t('programme.settings.access')}</h2>
                <p className={styles.muted}>{SIMULATED_AUTH_NOTICE}</p>
                <TableScroll>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">{t('programme.settings.page')}</th>
                        {ROLES.filter((r) => r !== 'chw').map((r) => (
                          <th key={r} scope="col">
                            {ROLE_LABELS[r]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PROGRAMME_PAGES.map((p) => (
                        <tr key={p}>
                          <th scope="row">{t(`programme.nav.${p}`)}</th>
                          {ROLES.filter((r) => r !== 'chw').map((r) => (
                            <td key={r}>
                              {PROGRAMME_PAGE_ROLES[p].includes(r) ? '✓ yes' : '– no'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              </section>

              <section className={styles.panel} aria-labelledby="set-sim">
                <h2 id="set-sim">{t('programme.settings.simulation')}</h2>
                <p className={styles.muted}>{PROTOTYPE_OFFLINE_NOTICE}</p>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={controls.serverDown}
                    onChange={(e) => controls.setServerDown(e.target.checked)}
                  />
                  {t('programme.settings.serverDown')}
                </label>
                <p className={styles.muted}>{t('programme.settings.serverDownNote')}</p>
              </section>

              <section className={styles.panel} aria-labelledby="set-data">
                <h2 id="set-data">{t('programme.settings.data')}</h2>
                <dl className={styles.kv}>
                  <dt>{t('programme.settings.seedAnchor')}</dt>
                  <dd>{c.seedAnchor ? formatDateTime(c.seedAnchor) : '–'}</dd>
                </dl>
                <p className={styles.muted}>{t('programme.settings.resetNote')}</p>
                {confirmReset ? (
                  <div className={styles.row}>
                    <Notice tone="error">{t('programme.settings.resetConfirm')}</Notice>
                    <Button variant="secondary" onClick={() => void reset()}>
                      {t('programme.settings.resetYes')}
                    </Button>
                    <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                      {t('programme.settings.cancel')}
                    </Button>
                  </div>
                ) : (
                  <div className={styles.row}>
                    <Button variant="secondary" onClick={() => setConfirmReset(true)}>
                      {t('programme.settings.reset')}
                    </Button>
                  </div>
                )}
              </section>
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
