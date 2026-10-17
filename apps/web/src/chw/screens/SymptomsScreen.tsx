import { useTranslation } from 'react-i18next';
import { ChoiceGroup } from '@ntd-watch/design-system';
import { DURATIONS, NO_SYMPTOMS, PROGRESSIONS, SYMPTOMS } from '../options';
import { useDraft } from '../draft';
import { Wizard, useFieldError } from '../components/Wizard';
import { WithDraft, choices } from '../components/helpers';

function Fields() {
  const { t } = useTranslation();
  const update = useDraft((s) => s.update);
  const symptomsError = useFieldError('symptoms');
  const durationError = useFieldError('duration');
  const progressionError = useFieldError('progression');
  return (
    <WithDraft>
      {(d) => {
        const none = d.symptoms.includes(NO_SYMPTOMS);
        const hasSymptoms = d.symptoms.some((s) => s !== NO_SYMPTOMS);
        return (
          <>
            <ChoiceGroup
              multiple
              legend={t('chw.symptoms.legend')}
              hint={t('chw.symptoms.hint')}
              name="symptoms"
              required
              options={choices(t, 'symptoms', [...SYMPTOMS, NO_SYMPTOMS])}
              value={d.symptoms}
              error={symptomsError}
              onChange={(next) => {
                // "None of these" and real symptoms never coexist in the form.
                const addedNone = next.includes(NO_SYMPTOMS) && !d.symptoms.includes(NO_SYMPTOMS);
                const symptoms = addedNone ? [NO_SYMPTOMS] : next.filter((s) => s !== NO_SYMPTOMS);
                update(
                  symptoms.includes(NO_SYMPTOMS)
                    ? { symptoms, duration: undefined, progression: undefined }
                    : { symptoms },
                );
              }}
            />
            {hasSymptoms && !none ? (
              <>
                <ChoiceGroup
                  legend={t('chw.symptoms.duration')}
                  name="duration"
                  required
                  options={choices(t, 'duration', DURATIONS)}
                  value={d.duration}
                  error={durationError}
                  onChange={(v) => update({ duration: v as typeof d.duration })}
                />
                <ChoiceGroup
                  legend={t('chw.symptoms.progression')}
                  name="progression"
                  required
                  options={choices(t, 'progression', PROGRESSIONS)}
                  value={d.progression}
                  error={progressionError}
                  onChange={(v) => update({ progression: v as typeof d.progression })}
                />
              </>
            ) : null}
          </>
        );
      }}
    </WithDraft>
  );
}

export function SymptomsScreen() {
  const { t } = useTranslation();
  return (
    <Wizard step="symptoms" title={t('chw.symptoms.title')}>
      <Fields />
    </Wizard>
  );
}
