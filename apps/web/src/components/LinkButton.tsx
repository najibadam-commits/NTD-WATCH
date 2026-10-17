import { Link, type LinkProps } from 'react-router-dom';
import { buttonClass, type ButtonStyle } from '@ntd-watch/design-system';

/** A real link (it navigates) that looks like a button. */
export function LinkButton({ variant, size, block, className, ...rest }: LinkProps & ButtonStyle) {
  return (
    <Link
      {...rest}
      className={[buttonClass({ variant, size, block }), className].filter(Boolean).join(' ')}
    />
  );
}
