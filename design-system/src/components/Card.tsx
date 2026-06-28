import type { HTMLAttributes, ReactNode } from 'react';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Adds hover elevation + pointer cursor for clickable cards. */
  interactive?: boolean;
  /** Apply default inner padding. Defaults to true. */
  padded?: boolean;
  children?: ReactNode;
};

/** A surface for grouping content. Set `interactive` when the whole card is
 *  clickable. */
export function Card({ interactive = false, padded = true, className, children, ...rest }: CardProps) {
  const classes = [
    'ds-card',
    padded ? 'ds-card--padded' : '',
    interactive ? 'ds-card--interactive' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
