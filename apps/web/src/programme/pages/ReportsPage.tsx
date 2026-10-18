import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Notice } from '@ntd-watch/design-system';
import { ROLE_LABELS } from '@ntd-watch/domain';
import {
  REPORT_KINDS,
  REPORT_TITLES,
  buildReport,
  type Report,
  type ReportKind,
} from '@ntd-watch/programme';
import { postReport, scopeForRole } from '../api';
import { DataStatus, FilterBar, PageHeader, QueryBoundary, scopeLabel } from '../components/Common';
import { useLiveRefresh, useReferralMonitor, useRole, useSummary } from '../useProgrammeData';
import styles from '../programme.module.css';
import { TableScroll } from '../components/TableScroll';

function download(filename: string, mime: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const { t } = useTranslation();
  const role = useRole();
  const summary = useSummary();
  const monitor = useReferralMonitor();
  const [kind, setKind] = useState<ReportKind>('programme-summary');
  const [report, setReport] = useState<Report | null>(null);
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  useLiveRefresh();

  const generate = async () => {
    if (!summary.data || !monitor.data) return;
    const built = buildReport(kind, summary.data, monitor.data, {
      roleLabel: ROLE_LABELS[role],
      scopeLabel: scopeLabel(scopeForRole(role)),
      generatedAt: new Date().toISOString(),
    });
    setReport(built);
    try {
      await postReport(role, kind);
      setStatus({
        tone: 'success',
        text: t('programme.reports.generated', { title: built.title }),
      });
    } catch (e) {
      // the report itself is complete; only the audit entry failed
      setStatus({
        tone: 'error',
        text: t('programme.reports.auditFailed', { reason: e instanceof Error ? e.message : '' }),
      });
    }
  };

  return (
    <div className={styles.page}>
      <PageHeader title={t('programme.reports.title')} lead={t('programme.reports.lead')} signals />
      <FilterBar />
      <DataStatus query={summary} />
      <QueryBoundary query={summary}>
        {() => (
          <QueryBoundary query={monitor}>
            {() => (
              <section className={styles.panel} aria-labelledby="rep-form">
                <h2 id="rep-form">{t('programme.reports.choose')}</h2>
                <label className={styles.field} style={{ maxWidth: '24rem' }}>
                  {t('programme.reports.kind')}
                  <select
                    value={kind}
                    onChange={(e) => {
                      setKind(e.target.value as ReportKind);
                      setReport(null);
                      setStatus(null);
                    }}
                  >
                    {REPORT_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {REPORT_TITLES[k]}
                      </option>
                    ))}
                  </select>
                </label>
                <div className={styles.row}>
                  <Button onClick={() => void generate()}>{t('programme.reports.generate')}</Button>
                </div>
                {status ? <Notice tone={status.tone}>{status.text}</Notice> : null}

                {report ? (
                  <div className={styles.stack}>
                    <Notice tone="demo" title={t('programme.reports.noticeTitle')}>
                      {report.notice}
                    </Notice>
                    <h3>{report.title}</h3>
                    <TableScroll>
                      <table className={styles.table}>
                        <caption className="visually-hidden">{report.title}</caption>
                        <thead>
                          <tr>
                            {report.rows[0]!.map((c) => (
                              <th key={String(c)} scope="col">
                                {String(c)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {report.rows.slice(1).map((r, i) => (
                            <tr key={i}>
                              {r.map((cell, j) => (
                                <td key={j}>{String(cell)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </TableScroll>
                    <div className={styles.row}>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          download(`${report.filename}.csv`, 'text/csv;charset=utf-8', report.csv)
                        }
                      >
                        {t('programme.reports.csv')}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          download(`${report.filename}.json`, 'application/json', report.json)
                        }
                      >
                        {t('programme.reports.json')}
                      </Button>
                      <Button variant="ghost" onClick={() => window.print()}>
                        {t('programme.reports.print')}
                      </Button>
                    </div>
                    <p className={styles.muted}>
                      {t('programme.reports.fileName', { name: report.filename })}
                    </p>
                  </div>
                ) : null}
              </section>
            )}
          </QueryBoundary>
        )}
      </QueryBoundary>
    </div>
  );
}
