import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { UseQueryResult } from '@tanstack/react-query';
import { Button, EmptyState, ErrorState, LoadingState, Notice } from '@ntd-watch/design-system';
import { DEMO_DATA_NOTICE, SIGNAL_NOTICE, type DataScope } from '@ntd-watch/domain';
import { lgaName, stateName, facilityName } from '@ntd-watch/demo-data';
import type { SignalDirection, VulnerabilityBand } from '@ntd-watch/programme';
import { scopeForRole } from '../api';
import { formatDateTime, formatDelta } from '../format';
import { geoOptions, presetRange, useProgrammeFilters, currentFilters } from '../filters';
import { useRole } from '../useProgrammeData';
import styles from '../programme.module.css';

export function scopeLabel(scope: DataScope): string {
  switch (scope.kind) {
    case 'all':
      return 'All states and LGAs';
    case 'state':
      return stateName(scope.id!);
    case 'lga':
      return lgaName(scope.id!);
    case 'facility':
      return facilityName(scope.id!);
  }
}

/** Title, one line of purpose, and the labels every programme page must carry. */
export function PageHeader({
  title,
  lead,
  signals = false,
  children,
}: {
  title: string;
  lead?: string;
  /** Adds the reminder that signals are assessments, not confirmed cases. */
  signals?: boolean;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const role = useRole();
  return (
    <header className={styles.head}>
      <h1>{title}</h1>
      {lead ? <p className={styles.lead}>{lead}</p> : null}
      <Notice tone="demo" title={t('programme.demoTitle')}>
        {DEMO_DATA_NOTICE} {t('programme.demoRules')}
      </Notice>
      {signals ? <Notice tone="info">{SIGNAL_NOTICE}</Notice> : null}
      <p className={styles.muted}>
        {t('programme.scopeLine', { scope: scopeLabel(scopeForRole(role)) })}
      </p>
      {children}
    </header>
  );
}

/** "Updated 10:32" with a refresh button, so a reader can see how fresh the view is. */
export function DataStatus({ query }: { query: UseQueryResult<unknown> }) {
  const { t } = useTranslation();
  return (
    <div className={styles.row}>
      <span className={styles.updated} role="status">
        {query.isFetching
          ? t('programme.updating')
          : query.dataUpdatedAt
            ? t('programme.updated', {
                time: formatDateTime(new Date(query.dataUpdatedAt).toISOString()),
              })
            : ''}
      </span>
      <Button variant="ghost" size="sm" onClick={() => void query.refetch()}>
        {t('programme.refresh')}
      </Button>
    </div>
  );
}

/** The four states every data view needs: loading, error, empty, and the data. */
export function QueryBoundary<T>({
  query,
  isEmpty,
  emptyTitle,
  children,
}: {
  query: UseQueryResult<T>;
  isEmpty?: (data: T) => boolean;
  emptyTitle?: string;
  children: (data: T) => ReactNode;
}) {
  const { t } = useTranslation();
  const reset = useProgrammeFilters((s) => s.reset);
  if (query.isPending) return <LoadingState label={t('common.loading')} />;
  if (query.isError) {
    return (
      <ErrorState
        title={t('programme.errorTitle')}
        description={query.error instanceof Error ? query.error.message : t('programme.errorBody')}
        onRetry={() => void query.refetch()}
      />
    );
  }
  if (isEmpty?.(query.data)) {
    return (
      <EmptyState
        title={emptyTitle ?? t('programme.emptyTitle')}
        description={t('programme.emptyBody')}
        action={
          <Button variant="secondary" size="sm" onClick={reset}>
            {t('programme.resetFilters')}
          </Button>
        }
      />
    );
  }
  return <>{children(query.data)}</>;
}

export function Kpi({
  label,
  value,
  current,
  previous,
  comparable = true,
  hint,
}: {
  label: string;
  value: string;
  current?: number;
  previous?: number;
  /** False when the previous period has too little data for a fair comparison. */
  comparable?: boolean;
  hint?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className={styles.kpi}>
      <span className={styles.kpiLabel}>{label}</span>
      <span className={styles.kpiValue}>{value}</span>
      {current !== undefined && previous !== undefined ? (
        <span className={styles.delta}>
          {comparable
            ? t('programme.vsPrevious', { change: formatDelta(current, previous) })
            : t('programme.noComparison')}
        </span>
      ) : null}
      {hint ? <span className={styles.delta}>{hint}</span> : null}
    </div>
  );
}

export function DirectionPill({ direction }: { direction: SignalDirection }) {
  const { t } = useTranslation();
  const symbol = direction === 'rising' ? '▲' : direction === 'falling' ? '▼' : '■';
  const cls =
    direction === 'rising'
      ? styles.pillHigh
      : direction === 'falling'
        ? styles.pillLow
        : styles.pillNone;
  return (
    <span className={`${styles.pill} ${cls}`}>
      <span aria-hidden="true">{symbol}</span> {t(`programme.direction.${direction}`)}
    </span>
  );
}

export function BandPill({ band }: { band: VulnerabilityBand }) {
  const { t } = useTranslation();
  const cls =
    band === 'HIGH'
      ? styles.pillHigh
      : band === 'MODERATE'
        ? styles.pillModerate
        : band === 'LOW'
          ? styles.pillLow
          : styles.pillNone;
  const symbol = band === 'HIGH' ? '▲' : band === 'MODERATE' ? '◆' : band === 'LOW' ? '●' : '–';
  return (
    <span className={`${styles.pill} ${cls}`}>
      <span aria-hidden="true">{symbol}</span> {t(`programme.band.${band}`)}
    </span>
  );
}

/** Geographic and date filters. All programme pages share one set, so they always agree. */
export function FilterBar() {
  const { t } = useTranslation();
  const role = useRole();
  const store = useProgrammeFilters();
  const filters = currentFilters(store);
  const scope = scopeForRole(role);
  const opts = geoOptions(filters, scope);
  const [from, setFrom] = useState(store.from);
  const [to, setTo] = useState(store.to);
  const [error, setError] = useState<string | null>(null);

  const commit = (nextFrom: string, nextTo: string) => {
    setFrom(nextFrom);
    setTo(nextTo);
    if (!nextFrom || !nextTo) {
      setError(t('programme.filters.dateRequired'));
    } else if (nextFrom > nextTo) {
      setError(t('programme.filters.dateOrder'));
    } else {
      setError(null);
      store.setRange(nextFrom, nextTo);
    }
  };
  // keep the date boxes in step when something else (a preset or reset) changes the range
  if (!error && (from !== store.from || to !== store.to)) {
    setFrom(store.from);
    setTo(store.to);
  }

  const geo = (
    level: 'stateId' | 'lgaId' | 'wardId' | 'communityId',
    label: string,
    items: { id: string; name: string }[],
  ) => (
    <label className={styles.field}>
      {label}
      <select
        value={filters[level] ?? ''}
        onChange={(e) => store.setGeo(level, e.target.value || undefined)}
      >
        <option value="">{t('programme.filters.all')}</option>
        {items.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <form
      className={styles.panel}
      aria-label={t('programme.filters.title')}
      onSubmit={(e) => e.preventDefault()}
    >
      <div className={styles.filters}>
        {scope.kind === 'all' ? geo('stateId', t('programme.filters.state'), opts.states) : null}
        {scope.kind === 'all' || scope.kind === 'state'
          ? geo('lgaId', t('programme.filters.lga'), opts.lgas)
          : null}
        {scope.kind !== 'facility' ? geo('wardId', t('programme.filters.ward'), opts.wards) : null}
        {scope.kind !== 'facility'
          ? geo('communityId', t('programme.filters.community'), opts.communities)
          : null}
        <label className={styles.field}>
          {t('programme.filters.from')}
          <input type="date" value={from} onChange={(e) => commit(e.target.value, to)} />
        </label>
        <label className={styles.field}>
          {t('programme.filters.to')}
          <input type="date" value={to} onChange={(e) => commit(from, e.target.value)} />
        </label>
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className={styles.row}>
        {[28, 56, 84].map((days) => (
          <Button
            key={days}
            variant="secondary"
            size="sm"
            onClick={() => {
              const r = presetRange(days);
              setError(null);
              store.setRange(r.from, r.to);
            }}
          >
            {t('programme.filters.lastWeeks', { weeks: days / 7 })}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setError(null);
            store.reset();
          }}
        >
          {t('programme.resetFilters')}
        </Button>
      </div>
    </form>
  );
}
