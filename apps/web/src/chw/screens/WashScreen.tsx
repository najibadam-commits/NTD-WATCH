import { useTranslation } from 'react-i18next';
import { ChoiceGroup } from '@ntd-watch/design-system';
import type { Wash } from '@ntd-watch/domain';
import { SANITATION, TRI, WATER_SOURCES } from '../options';
import { useDraft } from '../draft';
import { Wizard, useFieldError } from '../components/Wizard';
import { WithDraft, choices } from '../components/helpers';
import styles from '../chw.module.css';

const FIELDS = [
  { name: 'waterSource', group: 'waterSource', values: WATER_SOURCES },
  { name: 'sanitation', group: 'sanitation', values: SANITATION },
  { name: 'handwashing', group: 'tri', values: TRI },
  { name: 'standingWater', group: 'tri', values: TRI },
] as const;

function Field({ field }: { field: (typeof FIELDS)[number] }) {
  const { t } = useTranslation();
  const update = useDraft((s) => s.update);
  const error = useFieldError(field.name);
  return (
    <WithDraft>
      {(d) => (
        <ChoiceGroup
          legend={t(`chw.wash.${field.name}`)}
          name={field.name}
          required
          options={choices(t, field.group, field.values)}
          value={d.wash[field.name]}
          error={error}
          onChange={(v) =>
            update({ wash: { ...d.wash, [field.name]: v as Wash[typeof field.name] } })
          }
        />
      )}
    </WithDraft>
  );
}

export function WashScreen() {
  const { t } = useTranslation();
  return (
    <Wizard step="wash" title={t('chw.wash.title')}>
      <p className={styles.muted}>{t('chw.wash.intro')}</p>
      {FIELDS.map((f) => (
        <Field key={f.name} field={f} />
      ))}
    </Wizard>
  );
}
