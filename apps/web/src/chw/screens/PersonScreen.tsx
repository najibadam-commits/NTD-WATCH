import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { ChoiceGroup } from '@ntd-watch/design-system';
import { DEMO_COMMUNITIES } from '@ntd-watch/demo-data';
import { AGE_GROUPS, SEXES } from '../options';
import { useDraft } from '../draft';
import { Wizard, useFieldError } from '../components/Wizard';
import { WithDraft, choices } from '../components/helpers';
import styles from '../chw.module.css';

function Fields() {
  const { t } = useTranslation();
  const update = useDraft((s) => s.update);
  const selectId = useId();
  const communityError = useFieldError('community');
  const ageGroupError = useFieldError('ageGroup');
  const sexError = useFieldError('sex');
  return (
    <WithDraft>
      {(d) => (
        <>
          <p className={styles.muted}>{t('chw.person.code', { code: d.code })}</p>
          <ChoiceGroup
            legend={t('chw.summary.ageGroup')}
            name="ageGroup"
            required
            options={choices(t, 'ageGroup', AGE_GROUPS)}
            value={d.ageGroup}
            error={ageGroupError}
            onChange={(v) => update({ ageGroup: v as typeof d.ageGroup })}
          />
          <ChoiceGroup
            legend={t('chw.summary.sex')}
            name="sex"
            required
            options={choices(t, 'sex', SEXES)}
            value={d.sex}
            error={sexError}
            onChange={(v) => update({ sex: v as typeof d.sex })}
          />
          <div className={styles.field} id="community">
            <label htmlFor={selectId}>{t('chw.person.community')}</label>
            <span className={styles.muted}>{t('chw.person.communityHint')}</span>
            {communityError ? <span>{communityError}</span> : null}
            <select
              id={selectId}
              className={styles.select}
              value={d.communityId}
              onChange={(e) => update({ communityId: e.target.value })}
            >
              {DEMO_COMMUNITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </WithDraft>
  );
}

export function PersonScreen() {
  const { t } = useTranslation();
  return (
    <Wizard step="person" title={t('chw.person.title')}>
      <Fields />
    </Wizard>
  );
}
