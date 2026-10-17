import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'sm';
  block?: boolean;
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
