import type { ReactNode } from 'react';
import { RISK_LEVELS, RISK_SYMBOL, type RiskLevel } from '@ntd-watch/domain';
import { formatNumber, niceMax } from '../format';
import styles from '../programme.module.css';
import { TableScroll } from './TableScroll';

/*
 * Small, dependency-free SVG/HTML charts. Each one: states what it shows to assistive
 * technology, never uses colour alone (symbols, dashes and text labels), keeps marks thin,
 * and has a data table behind it.
 */

export interface TableData {
  caption: string;
  columns: string[];
  rows: (string | number)[][];
}

export function ChartTable({ caption, columns, rows }: TableData) {
  return (
    <details className={styles.details}>
      <summary>Data table</summary>
      <TableScroll>
        <table className={styles.table}>
          <caption className="visually-hidden">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={c} scope="col" className={i > 0 ? styles.num : undefined}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) =>
                  j === 0 ? (
                    <th key={j} scope="row">
                      {cell}
                    </th>
                  ) : (
                    <td key={j} className={styles.num}>
                      {typeof cell === 'number' ? formatNumber(cell) : cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
    </details>
  );
}

export interface LineSeries {
  key: string;
  name: string;
  values: (number | null)[];
  color: string;
  dashed?: boolean;
}

const W = 640;
const H = 230;
const M = { l: 40, r: 14, t: 14, b: 30 };

export function LineChart({
  title,
  labels,
  series,
  yLabel,
  decimals = 0,
}: {
  title: string;
  labels: string[];
  series: LineSeries[];
  yLabel: string;
  decimals?: number;
}) {
  const all = series.flatMap((s) => s.values).filter((v): v is number => v !== null);
  const top = niceMax(Math.max(0, ...all));
  const n = labels.length;
  const x = (i: number) => M.l + (n <= 1 ? (W - M.l - M.r) / 2 : (i * (W - M.l - M.r)) / (n - 1));
  const y = (v: number) => M.t + (1 - v / top) * (H - M.t - M.b);
  const step = Math.max(1, Math.ceil(n / 7));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * top);
  const fmt = (v: number) => (decimals ? v.toFixed(decimals) : formatNumber(v));

  return (
    <figure style={{ margin: 0 }}>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${title}. ${series.map((s) => s.name).join(', ')} by week. The data table below lists every value.`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line className={styles.gridline} x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} />
            <text className={styles.tick} x={M.l - 6} y={y(t) + 4} textAnchor="end">
              {fmt(t)}
            </text>
          </g>
        ))}
        <line className={styles.axis} x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} />
        {labels.map((l, i) =>
          i % step === 0 ? (
            <text key={l} className={styles.tick} x={x(i)} y={H - 10} textAnchor="middle">
              {l}
            </text>
          ) : null,
        )}
        <text className={styles.tick} x={M.l} y={10} textAnchor="start">
          {yLabel}
        </text>
        {series.map((s) => {
          const segments: string[] = [];
          let current = '';
          s.values.forEach((v, i) => {
            if (v === null) {
              if (current) segments.push(current);
              current = '';
            } else {
              current += `${current ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
            }
          });
          if (current) segments.push(current);
          return (
            <g key={s.key}>
              {segments.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeDasharray={s.dashed ? '6 4' : undefined}
                  strokeLinejoin="round"
                />
              ))}
              {s.values.map((v, i) =>
                v === null ? null : (
                  <circle
                    key={i}
                    cx={x(i)}
                    cy={y(v)}
                    r={4}
                    fill={s.color}
                    stroke="var(--color-surface)"
                    strokeWidth={2}
                  >
                    <title>{`${s.name}, week of ${labels[i]}: ${fmt(v)}`}</title>
                  </circle>
                ),
              )}
            </g>
          );
        })}
      </svg>
      {series.length > 1 ? (
        <ul className={styles.legend} aria-label="Legend">
          {series.map((s) => (
            <li key={s.key}>
              <svg width="26" height="10" aria-hidden="true">
                <line
                  x1="0"
                  x2="26"
                  y1="5"
                  y2="5"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeDasharray={s.dashed ? '6 4' : undefined}
                />
              </svg>
              {s.name}
            </li>
          ))}
        </ul>
      ) : null}
      <ChartTable
        caption={title}
        columns={['Week starting', ...series.map((s) => s.name)]}
        rows={labels.map((l, i) => [
          l,
          ...series.map((s) =>
            s.values[i] === null || s.values[i] === undefined ? '–' : fmt(s.values[i]!),
          ),
        ])}
      />
    </figure>
  );
}

export function RiskLegend({ counts }: { counts?: Record<RiskLevel, number> }) {
  return (
    <ul className={styles.legend} aria-label="Risk levels">
      {RISK_LEVELS.map((l) => (
        <li key={l}>
          <span className={`${styles.swatch} ${styles[`risk${l}`]}`} aria-hidden="true" />
          <span aria-hidden="true">{RISK_SYMBOL[l]}</span> {l}
          {counts ? ` ${formatNumber(counts[l])}` : ''}
        </li>
      ))}
    </ul>
  );
}

/** One horizontal stacked bar for a risk mix, with the numbers in a legend beneath it. */
export function RiskBar({ counts, label }: { counts: Record<RiskLevel, number>; label: string }) {
  const total = RISK_LEVELS.reduce((s, l) => s + counts[l], 0);
  return (
    <div className={styles.stack}>
      <div
        className={styles.riskBar}
        role="img"
        aria-label={`${label}: ${RISK_LEVELS.map((l) => `${counts[l]} ${l}`).join(', ')}`}
      >
        {total === 0 ? (
          <span
            className={styles.riskSeg}
            style={{ flex: 1, background: 'var(--color-surface-2)' }}
          />
        ) : (
          RISK_LEVELS.map((l) =>
            counts[l] > 0 ? (
              <span
                key={l}
                className={`${styles.riskSeg} ${styles[`risk${l}`]}`}
                style={{ flex: counts[l] }}
              />
            ) : null,
          )
        )}
      </div>
      <RiskLegend counts={counts} />
    </div>
  );
}

export function StackedColumns({
  title,
  labels,
  stacks,
}: {
  title: string;
  labels: string[];
  stacks: Record<RiskLevel, number>[];
}) {
  const totals = stacks.map((s) => RISK_LEVELS.reduce((a, l) => a + s[l], 0));
  const top = niceMax(Math.max(0, ...totals));
  const n = labels.length;
  const slot = (W - M.l - M.r) / Math.max(1, n);
  const bw = Math.min(28, slot * 0.6);
  const y = (v: number) => M.t + (1 - v / top) * (H - M.t - M.b);
  const step = Math.max(1, Math.ceil(n / 7));
  const colors: Record<RiskLevel, string> = {
    LOW: 'var(--color-low)',
    MODERATE: 'var(--color-moderate)',
    HIGH: 'var(--color-high)',
    URGENT: 'var(--color-urgent-solid)',
  };
  return (
    <figure style={{ margin: 0 }}>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${title}. Weekly assessments stacked by demonstration risk level. The data table below lists every value.`}
      >
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line
              className={styles.gridline}
              x1={M.l}
              x2={W - M.r}
              y1={y(f * top)}
              y2={y(f * top)}
            />
            <text className={styles.tick} x={M.l - 6} y={y(f * top) + 4} textAnchor="end">
              {formatNumber(f * top)}
            </text>
          </g>
        ))}
        <line className={styles.axis} x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} />
        {stacks.map((s, i) => {
          const cx = M.l + slot * i + slot / 2;
          let acc = 0;
          return (
            <g key={labels[i]}>
              {RISK_LEVELS.map((l) => {
                const from = acc;
                acc += s[l];
                if (s[l] === 0) return null;
                return (
                  <rect
                    key={l}
                    x={cx - bw / 2}
                    y={y(acc)}
                    width={bw}
                    height={Math.max(1, y(from) - y(acc))}
                    fill={colors[l]}
                    stroke="var(--color-surface)"
                    strokeWidth={1}
                  >
                    <title>{`Week of ${labels[i]}, ${l}: ${s[l]}`}</title>
                  </rect>
                );
              })}
              {i % step === 0 ? (
                <text className={styles.tick} x={cx} y={H - 10} textAnchor="middle">
                  {labels[i]}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <RiskLegend />
      <ChartTable
        caption={title}
        columns={['Week starting', ...RISK_LEVELS, 'Total']}
        rows={stacks.map((s, i) => [labels[i]!, ...RISK_LEVELS.map((l) => s[l]), totals[i]!])}
      />
    </figure>
  );
}

export interface BarItem {
  key: string;
  label: ReactNode;
  value: number;
  display?: string;
}

/** Ranked horizontal bars. Values are printed, so no value depends on bar length alone. */
export function BarList({ items, max, label }: { items: BarItem[]; max?: number; label: string }) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className={styles.barList} aria-label={label}>
      {items.map((i) => (
        <li key={i.key} className={styles.barItem}>
          <span>{i.label}</span>
          <span className={styles.barTrack} aria-hidden="true">
            <span
              className={styles.barFill}
              style={{ width: `${Math.max(2, (i.value / top) * 100)}%` }}
            />
          </span>
          <span className={styles.barValue}>{i.display ?? formatNumber(i.value)}</span>
        </li>
      ))}
    </ul>
  );
}
