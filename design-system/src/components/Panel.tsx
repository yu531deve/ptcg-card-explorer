import type { HTMLAttributes, ReactNode } from 'react';

export type PanelProps = HTMLAttributes<HTMLDivElement> & {
  /** Heading shown in the panel header. Omit for a header-less panel. */
  title?: ReactNode;
  /** Optional controls aligned to the right of the header. */
  actions?: ReactNode;
  children?: ReactNode;
};

/** A titled container with an optional header actions slot and a padded body. */
export function Panel({ title, actions, className, children, ...rest }: PanelProps) {
  const classes = ['ds-panel', className].filter(Boolean).join(' ');
  return (
    <div className={classes} {...rest}>
      {title != null || actions != null ? (
        <div className="ds-panel__head">
          {title != null ? <h3 className="ds-panel__title">{title}</h3> : <span />}
          {actions}
        </div>
      ) : null}
      <div className="ds-panel__body">{children}</div>
    </div>
  );
}
