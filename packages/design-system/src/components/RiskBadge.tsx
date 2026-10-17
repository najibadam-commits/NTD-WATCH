import { RISK_SYMBOL, type RiskLevel } from '@ntd-watch/domain';
import styles from './RiskBadge.module.css';

/** Risk is always shown as symbol + text. Colour is reinforcement, never the only cue. */
export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={styles.badge} data-level={level}>
      <span aria-hidden="true">{RISK_SYMBOL[level]}</span>
      {level}
    </span>
  );
}
