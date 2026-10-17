import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'sm';
  block?: boolean;
}

export interface ButtonStyle {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'sm';
  block?: boolean;
}

/** Class names for a link that should look like a button (a link navigates, a button acts). */
export function buttonClass({ variant = 'primary', size = 'md', block = false }: ButtonStyle = {}) {
  return [styles.button, styles[variant], size === 'sm' ? styles.sm : '', block ? styles.block : '']
    .filter(Boolean)
    .join(' ');
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  const cls = [
    styles.button,
    styles[variant],
    size === 'sm' ? styles.sm : '',
    block ? styles.block : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <button type={type} className={cls} {...rest} />;
}
