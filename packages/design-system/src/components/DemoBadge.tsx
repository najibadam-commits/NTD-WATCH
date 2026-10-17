import styles from './DemoBadge.module.css';

export function DemoBadge({ children = 'DEMO DATA' }: { children?: string }) {
  return <span className={styles.demo}>{children}</span>;
}
