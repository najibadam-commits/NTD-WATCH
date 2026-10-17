import { useEffect, useId, useRef, type ReactNode } from 'react';
import styles from './Form.module.css';

export interface ChoiceOption {
  value: string;
  label: string;
  hint?: string;
}

interface BaseProps {
  legend: string;
  name: string;
  options: readonly ChoiceOption[];
  hint?: string;
  error?: string;
  required?: boolean;
}

export interface SingleChoiceProps extends BaseProps {
  multiple?: false;
  value: string | undefined;
  onChange: (value: string) => void;
}

export interface MultiChoiceProps extends BaseProps {
  multiple: true;
  value: readonly string[];
  onChange: (value: string[]) => void;
}

/**
 * Radio group (single) or checkbox group (multiple) with a legend, hint and error that
 * assistive technology reads together. Large touch targets for field use.
 */
export function ChoiceGroup(props: SingleChoiceProps | MultiChoiceProps) {
  const { legend, name, options, hint, error, required } = props;
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <fieldset
      id={name}
      className={`${styles.fieldset} ${error ? styles.invalid : ''}`}
      aria-describedby={describedBy || undefined}
    >
      <legend className={styles.legend}>
        {legend}
        {required ? (
          <span className={styles.required} aria-hidden="true">
            {' *'}
          </span>
        ) : null}
      </legend>
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      ) : null}
      <div className={styles.options}>
        {options.map((o) => {
          const checked = props.multiple ? props.value.includes(o.value) : props.value === o.value;
          return (
            <label key={o.value} className={styles.option}>
              <input
                type={props.multiple ? 'checkbox' : 'radio'}
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => {
                  if (props.multiple) {
                    props.onChange(
                      checked
                        ? props.value.filter((v) => v !== o.value)
                        : [...props.value, o.value],
                    );
                  } else {
                    props.onChange(o.value);
                  }
                }}
              />
              <span>
                {o.label}
                {o.hint ? <span className={styles.optionHint}>{o.hint}</span> : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export interface FormError {
  /** Id of the field (fieldset) the message refers to, so the link can jump to it. */
  field: string;
  message: string;
}

/**
 * Lists every problem at the top of a form and moves keyboard focus to it each time the
 * form is submitted with errors (`attempt` changes).
 */
export function ErrorSummary({
  title,
  errors,
  attempt,
}: {
  title: string;
  errors: readonly FormError[];
  attempt: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (errors.length > 0) ref.current?.focus();
    // Only when a new attempt is made, not on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);
  if (errors.length === 0) return null;
  return (
    <div ref={ref} className={styles.summary} role="alert" tabIndex={-1}>
      <h2>{title}</h2>
      <ul>
        {errors.map((e) => (
          <li key={e.field}>
            <a
              href={`#${e.field}`}
              onClick={(ev) => {
                const el = document.getElementById(e.field);
                if (el) {
                  ev.preventDefault();
                  const target = el.querySelector<HTMLElement>('input,select,textarea') ?? el;
                  target.focus();
                }
              }}
            >
              {e.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StepProgress({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: ReactNode;
}) {
  return (
    <div className={styles.progress}>
      <p>{label}</p>
      <progress
        className={styles.bar}
        max={total}
        value={current}
        aria-label="Assessment progress"
      />
    </div>
  );
}
