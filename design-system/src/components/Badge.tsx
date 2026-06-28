import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'accent' | 'warn' | 'success';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  children?: ReactNode;
};

/** A small, non-interactive status/label tag. */
export function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  const classes = ['ds-badge', `ds-badge--${tone}`, className].filter(Boolean).join(' ');
  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}
