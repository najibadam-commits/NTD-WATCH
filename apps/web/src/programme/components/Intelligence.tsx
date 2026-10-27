import { useTranslation } from 'react-i18next';
import type {
  CommunityIntelligence,
  DataConfidence,
  ProgrammePriority,
} from '@ntd-watch/programme';
import styles from '../programme.module.css';

const SYMBOL: Record<ProgrammePriority, string> = {
  HIGH_PRIORITY_FOR_ATTENTION: '◆◆',
  PRIORITY_FOR_REVIEW: '◆',
  MONITOR: '◇',
  LOW_PRIORITY: '○',
  INSUFFICIENT_DATA: '?',
};

/** Programme priority. Shape and wording carry the meaning as well as colour. */
export function PriorityPill({ priority }: { priority: ProgrammePriority }) {
  const { t } = useTranslation();
  return (
    <span className={styles.prio} data-priority={priority}>
      <span aria-hidden="true">{SYMBOL[priority]}</span> {t(`intel.priority.${priority}`)}
    </span>
  );
}

const SEGMENTS: Record<DataConfidence, number> = { HIGH: 3, MEDIUM: 2, LOW: 1, INSUFFICIENT: 0 };

/** Data confidence: a 3-segment meter and a word, so limited evidence looks different from strong. */
export function ConfidencePill({ confidence }: { confidence: DataConfidence }) {
  const { t } = useTranslation();
  return (
    <span className={styles.conf} data-confidence={confidence}>
      <span className={styles.confMeter} aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <i key={n} data-on={n <= SEGMENTS[confidence]} />
        ))}
      </span>
      {t(`intel.confidence.${confidence}`)}
    </span>
  );
}

/** Context dimensions in words, for tables and popups. */
export function DimensionList({ row }: { row: CommunityIntelligence }) {
  const { t } = useTranslation();
  return (
    <ul className={styles.dimList}>
      {(['wash', 'waterContact', 'access'] as const).map((k) => (
        <li key={k}>
          {t(`intel.dim.${k}`)}: {t(`intel.band.${row.dimensions[k]}`)}
        </li>
      ))}
    </ul>
  );
}
