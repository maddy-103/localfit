import type { SVGProps } from 'react';
import { PATHS } from './iconPaths';

/**
 * LocalFit's inline icon set. 24px grid, 1.5px rounded stroke, no icon package.
 * Filled exceptions follow docs/THEME.md: star (gold), sparkle (black),
 * check-circle (black with white tick) and verified (green with white tick).
 */
export const ICON_NAMES = [
  'cart',
  'user-circle',
  'search',
  'menu',
  'close',
  'chevron-down',
  'chevron-right',
  'arrow-right',
  'trash',
  'sliders',
  'minus',
  'plus',
  'check-circle',
  'verified',
  'star',
  'sparkle',
  'heart',
  'pin',
  'clock',
  'door',
  'camera',
  'phone',
  'shield',
  'alert',
  'wallet',
  'box',
  'truck',
  'bell',
  'mic',
  'wifi-off',
  'sos',
  'settings',
  'chart',
  'file',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

type Props = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: IconName;
  size?: number;
  /** Accessible label. Omit for decorative icons. */
  title?: string;
};

export function Icon({ name, size = 24, title, className, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  );
}
