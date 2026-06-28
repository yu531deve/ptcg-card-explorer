import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'ghost' | 'subtle';
export type ButtonSize = 'sm' | 'md';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Visual emphasis. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
};

/** Primary action control. Use `primary` for the main action, `ghost` for
 *  secondary, and `subtle` for low-emphasis toolbar actions. */
export function Button({ variant = 'primary', size = 'md', className, children, ...rest }: ButtonProps) {
  const classes = ['ds-btn', `ds-btn--${variant}`, `ds-btn--${size}`, className].filter(Boolean).join(' ');
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
