import { lgaName, wardName } from '@ntd-watch/demo-data';
import { REFERRAL_STAGE_LABELS, REFERRAL_STAGES } from '@ntd-watch/domain';
import { SYNTHETIC_NOTICE, type ProgrammeSummary, type ReferralMonitor } from './types';

export const REPORT_KINDS = [
  'programme-summary',
  'community-signals',
  'referral-monitoring',
  'weekly-trends',
] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

export const REPORT_TITLES: Record<ReportKind, string> = {
  'programme-summary': 'Programme summary',
  'community-signals': 'Community signals and vulnerability',
  'referral-monitoring': 'Referral monitoring',
  'weekly-trends': 'Weekly trends',
};

/** Present in every row of every export, so a row copied out of context still says what it is. */
export const ROW_STATUS = 'SYNTHETIC DEMO DATA';

export interface ReportMeta {
  roleLabel: string;
  scopeLabel: string;
  generatedAt: string;
}

export interface Report {
  kind: ReportKind;
  title: string;
  notice: string;
  filename: string;
  /** Header row first. The last column is always the data status. */
  rows: (string | number)[][];
  csv: string;
  json: string;
}

const n = (v: number | null, digits = 1) => (v === null ? '' : Number(v.toFixed(digits)));

/** Cells that a spreadsheet could read as a formula are prefixed so they stay text. */
function csvCell(value: string | number): string {
  let text = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(lines: readonly (readonly (string | number)[])[]): string {
  return lines.map((line) => line.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

function filterLabel(f: ProgrammeSummary['filters']): string {
  const parts = [`${f.from} to ${f.to}`];
  if (f.stateId) parts.push(`state ${f.stateId}`);
  if (f.lgaId) parts.push(lgaName(f.lgaId));
  if (f.wardId) parts.push(wardName(f.wardId));
  if (f.communityId) parts.push(`community ${f.communityId}`);
  return parts.join('; ');
}

function body(
  kind: ReportKind,
  summary: ProgrammeSummary,
  monitor: ReferralMonitor,
): (string | number)[][] {
  switch (kind) {
    case 'programme-summary': {
      const k = summary.kpis;
      return [
        ['metric', 'value', 'data_status'],
        ['Assessments', k.assessments, ROW_STATUS],
        ['HIGH and URGENT demonstration signals', k.highUrgent, ROW_STATUS],
        [
          'Signals as share of assessments (%)',
          n(k.highUrgentShare === null ? null : k.highUrgentShare * 100),
          ROW_STATUS,
        ],
        ['Referrals generated', k.referrals, ROW_STATUS],
        ['Referral completion (%)', k.referralCompletion, ROW_STATUS],
        ['Unresolved referrals', k.unresolved, ROW_STATUS],
        ['Follow-ups recorded', k.followUps, ROW_STATUS],
        ['Follow-ups reporting worse condition', k.followUpsWorse, ROW_STATUS],
        ['Active CHWs', k.activeChws, ROW_STATUS],
        ['Communities reporting', k.communitiesReporting, ROW_STATUS],
        ['Communities in scope', k.communitiesInScope, ROW_STATUS],
        ['Assessments not classified', k.unclassified, ROW_STATUS],
        ['LOW', summary.byRisk.LOW, ROW_STATUS],
        ['MODERATE', summary.byRisk.MODERATE, ROW_STATUS],
        ['HIGH', summary.byRisk.HIGH, ROW_STATUS],
        ['URGENT', summary.byRisk.URGENT, ROW_STATUS],
        [
          `Previous period assessments (${summary.previous.from} to ${summary.previous.to})`,
          summary.previous.assessments,
          ROW_STATUS,
        ],
        ['Previous period HIGH and URGENT', summary.previous.highUrgent, ROW_STATUS],
        ['Previous period referrals', summary.previous.referrals, ROW_STATUS],
      ];
    }
    case 'community-signals':
      return [
        [
          'community',
          'lga',
          'ward',
          'assessments',
          'low',
          'moderate',
          'high',
          'urgent',
          'signals',
          'signals_last_28_days',
          'signals_previous_28_days',
          'direction',
          'wash_vulnerability_index',
          'vulnerability_band',
          'referrals',
          'referrals_unresolved',
          'chws_assigned',
          'data_status',
        ],
        ...summary.communities.map((c) => [
          c.name,
          lgaName(c.lgaId),
          wardName(c.wardId),
          c.assessments,
          c.byRisk.LOW,
          c.byRisk.MODERATE,
          c.byRisk.HIGH,
          c.byRisk.URGENT,
          c.signals,
          c.signalsRecent,
          c.signalsPrevious,
          c.direction,
          n(c.vulnerabilityIndex),
          c.vulnerabilityBand,
          c.referrals,
          c.unresolved,
          c.chwsAssigned,
          ROW_STATUS,
        ]),
      ];
    case 'referral-monitoring':
      return [
        [
          'facility',
          'lga',
          'referrals',
          ...REFERRAL_STAGES.map(
            (s) => `now_${REFERRAL_STAGE_LABELS[s].toLowerCase().replaceAll(' ', '_')}`,
          ),
          'completion_percent',
          'unresolved',
          'data_status',
        ],
        ...monitor.byFacility.map((f) => [
          f.name,
          lgaName(f.lgaId),
          f.referrals,
          ...REFERRAL_STAGES.map((s) => f.byStage[s]),
          f.completionRate,
          f.unresolved,
          ROW_STATUS,
        ]),
      ];
    case 'weekly-trends':
      return [
        [
          'week_starting',
          'assessments',
          'low',
          'moderate',
          'high',
          'urgent',
          'signals',
          'referrals',
          'wash_vulnerability_index',
          'data_status',
        ],
        ...summary.weekly.map((w) => [
          w.weekStart,
          w.assessments,
          w.byRisk.LOW,
          w.byRisk.MODERATE,
          w.byRisk.HIGH,
          w.byRisk.URGENT,
          w.signals,
          w.referrals,
          n(w.vulnerabilityIndex),
          ROW_STATUS,
        ]),
      ];
  }
}

/** Builds a report whose every format states that the data is synthetic and the rules unvalidated. */
export function buildReport(
  kind: ReportKind,
  summary: ProgrammeSummary,
  monitor: ReferralMonitor,
  meta: ReportMeta,
): Report {
  const rows = body(kind, summary, monitor);
  const title = REPORT_TITLES[kind];
  const stem = `DEMO-SYNTHETIC-${kind}-${summary.filters.from}_${summary.filters.to}`;
  const header: (string | number)[][] = [
    [SYNTHETIC_NOTICE],
    [`Report: ${title}`],
    [`Generated: ${meta.generatedAt} for ${meta.roleLabel} (${meta.scopeLabel})`],
    [`Filters: ${filterLabel(summary.filters)}`],
    [],
  ];
  const csv = toCsv([...header, ...rows, [], [SYNTHETIC_NOTICE]]);
  const [columns = [], ...data] = rows;
  const json = JSON.stringify(
    {
      notice: SYNTHETIC_NOTICE,
      dataStatus: 'SYNTHETIC_DEMONSTRATION',
      report: kind,
      title,
      generatedAt: meta.generatedAt,
      generatedFor: { role: meta.roleLabel, scope: meta.scopeLabel },
      filters: summary.filters,
      columns,
      rows: data.map((r) => Object.fromEntries(columns.map((c, i) => [String(c), r[i]]))),
    },
    null,
    2,
  );
  return { kind, title, notice: SYNTHETIC_NOTICE, filename: stem, rows, csv, json };
}
