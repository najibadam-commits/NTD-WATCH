import { useTranslation } from 'react-i18next';
import { RiskBadge } from '@ntd-watch/design-system';
import { SIGNAL_CATEGORY_BY_LEVEL, type Assessment } from '@ntd-watch/domain';

/**
 * Badge for a saved assessment. General records keep the level badge. FGS records show only the
 * non-diagnostic signal category text, never a level name that could read as clinical severity.
 */
export function AssessmentBadge({ a }: { a: Pick<Assessment, 'module' | 'riskLevel'> }) {
  const { t } = useTranslation();
  if (!a.riskLevel) return null;
  if (a.module !== 'FGS') return <RiskBadge level={a.riskLevel} />;
  return <strong>{t(`fgs.category.${SIGNAL_CATEGORY_BY_LEVEL[a.riskLevel]}`)}</strong>;
}
