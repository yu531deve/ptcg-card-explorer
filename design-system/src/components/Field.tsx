import type { ReactNode } from 'react';

export type FieldProps = {
  /** Field label rendered above the control. */
  label?: ReactNode;
  /** The input/select/textarea element. */
  children: ReactNode;
  /** Optional helper text shown below the control. */
  hint?: ReactNode;
  className?: string;
};

/** A labelled form control wrapper that applies consistent label styling and a
 *  focus ring to the contained input/select/textarea. */
export function Field({ label, children, hint, className }: FieldProps) {
  const classes = ['ds-field', className].filter(Boolean).join(' ');
  return (
    <label className={classes}>
      {label != null ? <span className="ds-field__label">{label}</span> : null}
      <span className="ds-field__control">{children}</span>
      {hint != null ? <span className="ds-field__hint">{hint}</span> : null}
    </label>
  );
}
