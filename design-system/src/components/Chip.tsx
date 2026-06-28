import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /** Whether the chip is selected. */
  active?: boolean;
  /** Optional trailing count (e.g. number of matches in a filter). */
  count?: number;
  children?: ReactNode;
};

/** A pill-shaped toggle, typically used for filters/facets. */
export function Chip({ active = false, count, className, children, ...rest }: ChipProps) {
  const classes = ['ds-chip', active ? 'ds-chip--active' : '', className].filter(Boolean).join(' ');
  return (
    <button type="button" className={classes} aria-pressed={active} {...rest}>
      <span>{children}</span>
      {count != null ? <span className="ds-chip__count">{count}</span> : null}
    </button>
  );
}
