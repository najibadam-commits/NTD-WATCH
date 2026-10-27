import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Button,
  ChoiceGroup,
  ErrorSummary,
  Notice,
  StepProgress,
  type ChoiceOption,
  type FormError,
} from '@ntd-watch/design-system';
import { DEMO_COMMUNITIES } from '@ntd-watch/demo-data';
import {
  AGE_BAND_CONFIG,
  CONSENT_TEXT_VERSION,
  DEMO_RULES_NOTICE,
  isMinorBand,
} from '@ntd-watch/domain';
import { itemsOf, type FgsGroup } from '@ntd-watch/rules-engine';
import { saveAssessment } from '../../offline/repository';
import { buildFgsAssessment } from './build';
import { NONE, useFgsDraft, type Tri } from './draft';
import { FGS_PATH, FgsWizard, WithFgsDraft, useFgsFieldError } from './FgsWizard';
import { FGS_STEPS, realChoices, validateFgsAll, type FgsStep } from './validation';
import styles from '../chw.module.css';

/** Options for one catalogue group. Wording comes from the locale file via the item's textKey. */
function groupOptions(
  t: (k: string) => string,
  group: FgsGroup,
  withNone: boolean,
): ChoiceOption[] {
  const opts = itemsOf(group).map((i) => ({ value: i.id, label: t(i.textKey) }));
  return withNone ? [...opts, { value: NONE, label: t('fgs.noneOfThese') }] : opts;
}

/** "None of these" and real choices never coexist. */
function nextMulti(previous: string[], next: string[]): string[] {
  const addedNone = next.includes(NONE) && !previous.includes(NONE);
  return addedNone ? [NONE] : next.filter((v) => v !== NONE);
}

const triOptions = (t: (k: string) => string): ChoiceOption[] => [
  { value: 'yes', label: t('options.tri.yes') },
  { value: 'no', label: t('options.tri.no') },
  { value: 'unknown', label: t('fgs.preferNotToSay') },
];

export function FgsStartScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const draft = useFgsDraft((s) => s.draft);
  const start = useFgsDraft((s) => s.start);
  const clear = useFgsDraft((s) => s.clear);
  const begin = () => {
    start();
    navigate(FGS_PATH.consent);
  };
  return (
    <div className={styles.stack}>
      <h1>{t('fgs.start.title')}</h1>
      <p>{t('fgs.start.intro')}</p>
      <Notice tone="info">{t('fgs.start.privacy')}</Notice>
      <Notice tone="demo">{t('fgs.start.demo')}</Notice>
      <Notice tone="demo">{t('fgs.clinicalContentNotice')}</Notice>
      <p className={styles.muted}>{t('fgs.start.forWorker')}</p>
      {draft ? (
        <>
          <Notice tone="info">{t('fgs.start.draftFound', { code: draft.caseId })}</Notice>
          <div className={styles.actions}>
            <Button block onClick={begin}>
              {t('chw.start.continue')}
            </Button>
            <Button
              variant="secondary"
              block
              onClick={() => {
                clear();
                begin();
              }}
            >
              {t('chw.start.discard')}
            </Button>
          </div>
        </>
      ) : (
        <div className={styles.actions}>
          <Button block onClick={begin}>
            {t('fgs.start.begin')}
          </Button>
        </div>
      )}
    </div>
  );
}

export function FgsConsentScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const update = useFgsDraft((s) => s.update);
  const draft = useFgsDraft((s) => s.draft);
  const [choice, setChoice] = useState<'yes' | 'no' | undefined>(
    draft?.consent === 'GIVEN' ? 'yes' : undefined,
  );
  return (
    <WithFgsDraft>
      {() => (
        <FgsWizard
          step="consent"
          title={t('fgs.consent.title')}
          onContinue={() => {
            if (choice === 'no') {
              // No consent, no record: nothing is saved, and the declined screen discards the draft.
              navigate('/chw/fgs/declined', { replace: true });
              return false;
            }
            if (choice === 'yes') {
              update({ consent: 'GIVEN', consentAt: new Date().toISOString() });
            } else {
              update({ consent: undefined, consentAt: undefined });
            }
            return true;
          }}
        >
          <ConsentBody choice={choice} onChoice={setChoice} />
        </FgsWizard>
      )}
    </WithFgsDraft>
  );
}

function ConsentBody({
  choice,
  onChoice,
}: {
  choice: 'yes' | 'no' | undefined;
  onChoice: (c: 'yes' | 'no') => void;
}) {
  const { t } = useTranslation();
  const error = useFgsFieldError('consent');
  return (
    <>
      <p>{t('fgs.consent.readAloud')}</p>
      <ul className={styles.list}>
        {(['what', 'private', 'choice', 'withdraw'] as const).map((k) => (
          <li key={k} className={styles.item}>
            {t(`fgs.consent.points.${k}`)}
          </li>
        ))}
      </ul>
      <ChoiceGroup
        legend={t('fgs.consent.question')}
        name="consent"
        required
        options={[
          { value: 'yes', label: t('fgs.consent.yes') },
          { value: 'no', label: t('fgs.consent.no') },
        ]}
        value={choice}
        error={error}
        onChange={(v) => onChoice(v as 'yes' | 'no')}
      />
      <Notice tone="demo">{t('fgs.consent.demo', { version: CONSENT_TEXT_VERSION })}</Notice>
    </>
  );
}

export function FgsDeclinedScreen() {
  const { t } = useTranslation();
  const clear = useFgsDraft((s) => s.clear);
  useEffect(() => clear(), [clear]);
  return (
    <div className={styles.stack}>
      <h1>{t('fgs.declined.title')}</h1>
      <p>{t('fgs.declined.body')}</p>
      <Notice tone="info">{t('fgs.declined.nothingRecorded')}</Notice>
      <div className={styles.actions}>
        <Link to="/chw">{t('chw.result.dashboard')}</Link>
      </div>
    </div>
  );
}

export function FgsParticipantScreen() {
  const { t } = useTranslation();
  const selectId = useId();
  return (
    <WithFgsDraft>
      {(d) => (
        <FgsWizard step="participant" title={t('fgs.participant.title')}>
          <ParticipantFields draftAge={d.ageBand} community={d.communityId} selectId={selectId} />
        </FgsWizard>
      )}
    </WithFgsDraft>
  );
}

function ParticipantFields({
  draftAge,
  community,
  selectId,
}: {
  draftAge?: string;
  community: string;
  selectId: string;
}) {
  const { t } = useTranslation();
  const update = useFgsDraft((s) => s.update);
  const ageError = useFgsFieldError('ageBand');
  const communityError = useFgsFieldError('community');
  return (
    <>
      <p className={styles.muted}>{t('fgs.participant.noExactAge')}</p>
      <ChoiceGroup
        legend={t('fgs.participant.ageBand')}
        name="ageBand"
        required
        options={AGE_BAND_CONFIG.map((b) => ({
          value: b.id,
          label: t(`fgs.ageBand.${b.id}`),
        }))}
        value={draftAge}
        error={ageError}
        onChange={(v) => update({ ageBand: v as (typeof AGE_BAND_CONFIG)[number]['id'] })}
      />
      {draftAge && isMinorBand(draftAge) ? (
        <Notice tone="demo" title={t('fgs.participant.minorTitle')}>
          {t('fgs.participant.minorNotice')}
        </Notice>
      ) : null}
      <div className={styles.field} id="community">
        <label htmlFor={selectId}>{t('chw.person.community')}</label>
        <span className={styles.muted}>{t('chw.person.communityHint')}</span>
        {communityError ? <span>{communityError}</span> : null}
        <select
          id={selectId}
          className={styles.select}
          value={community}
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
  );
}

export function FgsExposureScreen() {
  const { t } = useTranslation();
  return (
    <WithFgsDraft>
      {() => (
        <FgsWizard step="exposure" title={t('fgs.exposureStep.title')}>
          <ExposureFields />
        </FgsWizard>
      )}
    </WithFgsDraft>
  );
}

function ExposureFields() {
  const { t } = useTranslation();
  const draft = useFgsDraft((s) => s.draft)!;
  const update = useFgsDraft((s) => s.update);
  const error = useFgsFieldError('exposure');
  return (
    <>
      <p className={styles.muted}>{t('fgs.exposureStep.intro')}</p>
      <Notice tone="demo">{t('fgs.clinicalContentNotice')}</Notice>
      <ChoiceGroup
        multiple
        legend={t('fgs.exposureStep.legend')}
        name="exposure"
        required
        options={groupOptions(t, 'EXPOSURE', true)}
        value={draft.exposure}
        error={error}
        onChange={(next) => update({ exposure: nextMulti(draft.exposure, next) })}
      />
    </>
  );
}

export function FgsSignalsScreen() {
  const { t } = useTranslation();
  return (
    <WithFgsDraft>
      {() => (
        <FgsWizard step="signals" title={t('fgs.signalsStep.title')}>
          <SignalFields />
        </FgsWizard>
      )}
    </WithFgsDraft>
  );
}

function SignalFields() {
  const { t } = useTranslation();
  const draft = useFgsDraft((s) => s.draft)!;
  const update = useFgsDraft((s) => s.update);
  const error = useFgsFieldError('signals');
  return (
    <>
      <p className={styles.muted}>{t('fgs.signalsStep.intro')}</p>
      <ChoiceGroup
        multiple
        legend={t('fgs.signalsStep.legend')}
        name="signals"
        required
        options={groupOptions(t, 'HEALTH_SIGNAL', true)}
        value={draft.signals}
        error={error}
        onChange={(next) => update({ signals: nextMulti(draft.signals, next) })}
      />
      <Notice tone="demo">{t('fgs.clinicalContentNotice')}</Notice>
    </>
  );
}

export function FgsContextScreen() {
  const { t } = useTranslation();
  return (
    <WithFgsDraft>
      {() => (
        <FgsWizard step="context" title={t('fgs.contextStep.title')}>
          <ContextFields />
        </FgsWizard>
      )}
    </WithFgsDraft>
  );
}

function ContextFields() {
  const { t } = useTranslation();
  const draft = useFgsDraft((s) => s.draft)!;
  const update = useFgsDraft((s) => s.update);
  const distressError = useFgsFieldError('distress');
  const safeError = useFgsFieldError('safeContact');
  return (
    <>
      <Notice tone="demo">{t('fgs.clinicalContentNotice')}</Notice>
      <ChoiceGroup
        multiple
        legend={t('fgs.contextStep.legend')}
        hint={t('fgs.contextStep.hint')}
        name="context"
        options={groupOptions(t, 'CONTEXT', false)}
        value={draft.context}
        onChange={(next) => update({ context: next })}
      />
      <ChoiceGroup
        legend={t('fgs.contextStep.distress')}
        hint={t('fgs.contextStep.distressHint')}
        name="distress"
        required
        options={triOptions(t)}
        value={draft.distress}
        error={distressError}
        onChange={(v) => update({ distress: v as Tri })}
      />
      <ChoiceGroup
        legend={t('fgs.contextStep.safeContact')}
        hint={t('fgs.contextStep.safeContactHint')}
        name="safeContact"
        required
        options={triOptions(t)}
        value={draft.safeContact}
        error={safeError}
        onChange={(v) => update({ safeContact: v as Tri })}
      />
    </>
  );
}

function Review() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const draft = useFgsDraft((s) => s.draft)!;
  const clear = useFgsDraft((s) => s.clear);
  const [problems, setProblems] = useState<{ step: FgsStep; error: FormError }[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const submitted = useRef(false); // guards a double tap

  const list = (ids: string[], group: FgsGroup) => {
    if (ids.includes(NONE)) return t('fgs.summary.noneReported');
    const real = realChoices(ids);
    if (real.length === 0) return t('chw.summary.notAnswered');
    return real
      .map((id) => itemsOf(group).find((i) => i.id === id))
      .map((i) => (i ? t(i.textKey) : ''))
      .join(', ');
  };
  const tri = (v?: string) =>
    v
      ? v === 'unknown'
        ? t('fgs.preferNotToSay')
        : t(`options.tri.${v}`)
      : t('chw.summary.notAnswered');

  const submit = async () => {
    if (submitted.current) return;
    const found = validateFgsAll(draft);
    setProblems(found);
    setAttempt((n) => n + 1);
    if (found.length > 0) return;
    submitted.current = true;
    setSaving(true);
    setFailed(false);
    try {
      const assessment = buildFgsAssessment(draft);
      await saveAssessment(assessment);
      clear();
      navigate(`/chw/assessments/${assessment.clientKey}/result`, { replace: true });
    } catch {
      submitted.current = false;
      setSaving(false);
      setFailed(true);
    }
  };

  const errors = problems.map((p) => ({
    field: p.error.field,
    message: `${p.error.message} (${t('chw.summary.fixStep', { step: t(`fgs.steps.${p.step}`) })})`,
  }));

  const section = (title: string, step: FgsStep, rows: [string, string][]) => (
    <section className={styles.resultBox}>
      <div className={styles.between}>
        <h2>{title}</h2>
        <Link to={FGS_PATH[step]}>{t('chw.summary.edit')}</Link>
      </div>
      <dl className={styles.dl}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: 'contents' }}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );

  return (
    <div className={styles.stack}>
      <StepProgress
        current={FGS_STEPS.length + 1}
        total={FGS_STEPS.length + 1}
        label={t('chw.step.label', { current: FGS_STEPS.length + 1, total: FGS_STEPS.length + 1 })}
      />
      <h1>{t('chw.summary.title')}</h1>
      <p>{t('fgs.summary.intro')}</p>
      <ErrorSummary title={t('chw.summary.problems')} errors={errors} attempt={attempt} />
      {failed ? <Notice tone="error">{t('chw.summary.saveFailed')}</Notice> : null}
      {section(t('fgs.steps.participant'), 'participant', [
        [t('fgs.summary.caseId'), draft.caseId],
        [
          t('fgs.participant.ageBand'),
          draft.ageBand ? t(`fgs.ageBand.${draft.ageBand}`) : t('chw.summary.notAnswered'),
        ],
        [
          t('chw.summary.community'),
          DEMO_COMMUNITIES.find((c) => c.id === draft.communityId)?.name ?? '',
        ],
      ])}
      {section(t('fgs.steps.exposure'), 'exposure', [
        [t('fgs.exposureStep.legend'), list(draft.exposure, 'EXPOSURE')],
      ])}
      {section(t('fgs.steps.signals'), 'signals', [
        [t('fgs.signalsStep.legend'), list(draft.signals, 'HEALTH_SIGNAL')],
      ])}
      {section(t('fgs.steps.context'), 'context', [
        [
          t('fgs.contextStep.legend'),
          draft.context.length > 0 ? list(draft.context, 'CONTEXT') : t('fgs.summary.noneReported'),
        ],
        [t('fgs.contextStep.distress'), tri(draft.distress)],
        [t('fgs.contextStep.safeContact'), tri(draft.safeContact)],
      ])}
      <Notice tone="demo">{DEMO_RULES_NOTICE}</Notice>
      <div className={styles.actions}>
        <Button block disabled={saving} onClick={() => void submit()}>
          {saving ? t('chw.summary.submitting') : t('fgs.summary.submit')}
        </Button>
        <Link to={FGS_PATH.context}>{t('chw.step.back')}</Link>
      </div>
    </div>
  );
}

export function FgsSummaryScreen() {
  const draft = useFgsDraft((s) => s.draft);
  const [hadDraft, setHadDraft] = useState(false);
  if (draft && !hadDraft) setHadDraft(true);
  // After a successful save the draft is cleared while the move to the result is under way.
  if (!draft && hadDraft) return null;
  if (!draft) return <Navigate to="/chw/fgs" replace />;
  return <Review />;
}
