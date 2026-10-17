import { useTranslation } from 'react-i18next';
import { ChoiceGroup } from '@ntd-watch/design-system';
import type { Exposure } from '@ntd-watch/domain';
import { TRI } from '../options';
import { useDraft } from '../draft';
import { Wizard, useFieldError } from '../components/Wizard';
import { WithDraft, choices } from '../components/helpers';
import styles from '../chw.module.css';

const FIELDS = ['waterContact', 'animalContact', 'insectBites', 'householdSimilar'] as const;

function Field({ name }: { name: (typeof FIELDS)[number] }) {
  const { t } = useTranslation();
  const update = useDraft((s) => s.update);
  const error = useFieldError(name);
  return (
    <WithDraft>
      {(d) => (
        <ChoiceGroup
          legend={t(`chw.context.${name}`)}
          name={name}
          required
          options={choices(t, 'tri', TRI)}
          value={d.exposure[name]}
          error={error}
          onChange={(v) =>
            update({ exposure: { ...d.exposure, [name]: v as Exposure[typeof name] } })
          }
        />
      )}
    </WithDraft>
  );
}

export function ContextScreen() {
  const { t } = useTranslation();
  return (
    <Wizard step="context" title={t('chw.context.title')}>
      <p className={styles.muted}>{t('chw.context.intro')}</p>
      {FIELDS.map((f) => (
        <Field key={f} name={f} />
      ))}
    </Wizard>
  );
}
