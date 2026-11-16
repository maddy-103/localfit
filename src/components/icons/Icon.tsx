import type { ReactNode, SVGProps } from 'react';

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

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const filled = {
  fill: 'currentColor',
  stroke: 'none',
} as const;

const tick = {
  fill: 'none',
  stroke: 'var(--bg)',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const PATHS: Record<IconName, ReactNode> = {
  cart: (
    <g {...stroke}>
      <path d="M3 4h2.2l2.3 10.8a1.8 1.8 0 0 0 1.8 1.4h7.9a1.8 1.8 0 0 0 1.8-1.4L21 8H6" />
      <circle cx="10" cy="20" r="1.2" />
      <circle cx="18" cy="20" r="1.2" />
    </g>
  ),
  'user-circle': (
    <g {...stroke}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="9.5" r="3" />
      <path d="M6.4 18.4a6.2 6.2 0 0 1 11.2 0" />
    </g>
  ),
  search: (
    <g {...stroke}>
      <circle cx="11" cy="11" r="7" />
      <path d="m16.4 16.4 4.1 4.1" />
    </g>
  ),
  menu: (
    <g {...stroke}>
      <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />
    </g>
  ),
  close: (
    <g {...stroke}>
      <path d="m6 6 12 12M18 6 6 18" />
    </g>
  ),
  'chevron-down': (
    <g {...stroke}>
      <path d="m6 9 6 6 6-6" />
    </g>
  ),
  'chevron-right': (
    <g {...stroke}>
      <path d="m9 6 6 6-6 6" />
    </g>
  ),
  'arrow-right': (
    <g {...stroke}>
      <path d="M4 12h16M14 6l6 6-6 6" />
    </g>
  ),
  trash: (
    <g {...stroke}>
      <path d="M4 7h16M9 7V5h6v2M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12" />
      <path d="M10 11v5M14 11v5" />
    </g>
  ),
  sliders: (
    <g {...stroke}>
      <path d="M4 7h5M15 7h5M4 17h9M19 17h1" />
      <circle cx="12" cy="7" r="2.3" />
      <circle cx="15.5" cy="17" r="2.3" />
    </g>
  ),
  minus: (
    <g {...stroke}>
      <path d="M5 12h14" />
    </g>
  ),
  plus: (
    <g {...stroke}>
      <path d="M12 5v14M5 12h14" />
    </g>
  ),
  'check-circle': (
    <g>
      <circle cx="12" cy="12" r="10" {...filled} />
      <path d="m7.5 12.3 3 3 6-6.6" {...tick} />
    </g>
  ),
  verified: (
    <g>
      <circle cx="12" cy="12" r="10" {...filled} />
      <path d="m7.5 12.3 3 3 6-6.6" {...tick} />
    </g>
  ),
  star: (
    <path
      d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.4l-5.8 3 1.1-6.4-4.7-4.6 6.5-.9L12 2.6Z"
      {...filled}
    />
  ),
  sparkle: (
    <path d="M12 2c1.1 5.2 4.8 8.9 10 10-5.2 1.1-8.9 4.8-10 10-1.1-5.2-4.8-8.9-10-10 5.2-1.1 8.9-4.8 10-10Z" {...filled} />
  ),
  heart: (
    <g {...stroke}>
      <path d="M12 20.2S3.5 15.3 3.5 9.4A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.5 2.8C20.5 15.3 12 20.2 12 20.2Z" />
    </g>
  ),
  pin: (
    <g {...stroke}>
      <path d="M12 21s6.5-5.7 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15.3 12 21 12 21Z" />
      <circle cx="12" cy="10.3" r="2.4" />
    </g>
  ),
  clock: (
    <g {...stroke}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.3l3.4 2" />
    </g>
  ),
  door: (
    <g {...stroke}>
      <path d="M5 21V3.8h11.5V21M16.5 21H21" />
      <path d="M13 12h.01" />
    </g>
  ),
  camera: (
    <g {...stroke}>
      <path d="M3.5 8.5h3l1.6-2.2h7.8l1.6 2.2h3v10h-17v-10Z" />
      <circle cx="12" cy="13.2" r="3.2" />
    </g>
  ),
  phone: (
    <g {...stroke}>
      <path d="M7.2 3.5 9.6 8 7.5 9.8c1 2.2 2.5 3.7 4.7 4.7l1.8-2.1 4.5 2.4-.5 2.6c-.2 1-1 1.6-2 1.6C9.4 19 5 14.6 4.9 7.9c0-1 .6-1.8 1.6-2l.7-.4Z" />
    </g>
  ),
  shield: (
    <g {...stroke}>
      <path d="M12 3 20 6v5.6c0 4.7-3.3 7.7-8 9.4-4.7-1.7-8-4.7-8-9.4V6l8-3Z" />
      <path d="m8.7 12 2.2 2.2 4.4-4.5" />
    </g>
  ),
  alert: (
    <g {...stroke}>
      <path d="M12 3.5 21 20H3L12 3.5Z" />
      <path d="M12 9v5M12 17h.01" />
    </g>
  ),
  wallet: (
    <g {...stroke}>
      <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h12.5v3" />
      <path d="M3.5 7.5V18a1.5 1.5 0 0 0 1.5 1.5h14A1.5 1.5 0 0 0 20.5 18V9.5h-15A2 2 0 0 1 3.5 7.5Z" />
      <path d="M16.5 13.5h.01" />
    </g>
  ),
  box: (
    <g {...stroke}>
      <path d="m12 3 8 4.3v9.4L12 21l-8-4.3V7.3L12 3Z" />
      <path d="m4 7.3 8 4.3 8-4.3M12 11.6V21" />
    </g>
  ),
  truck: (
    <g {...stroke}>
      <path d="M3 6h10v9H3V6ZM13 9h4l3 3.2V15h-7V9Z" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </g>
  ),
  bell: (
    <g {...stroke}>
      <path d="M18 9.5a6 6 0 1 0-12 0c0 4-1.5 5.2-2 6h16c-.5-.8-2-2-2-6Z" />
      <path d="M10 19a2.2 2.2 0 0 0 4 0" />
    </g>
  ),
  mic: (
    <g {...stroke}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" />
    </g>
  ),
  'wifi-off': (
    <g {...stroke}>
      <path d="M3 9a15 15 0 0 1 6-2.4M15.5 7.2A15 15 0 0 1 21 9M6.5 12.5a10 10 0 0 1 3-1.3M15 11.4a10 10 0 0 1 2.5 1.1M9.2 16a5 5 0 0 1 5.6 0M12 19.5h.01" />
      <path d="m3 3 18 18" />
    </g>
  ),
  sos: (
    <g {...stroke}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.3 14.4c.5.5 1.3.8 2.2.8 1.2 0 2-.6 2-1.5 0-.8-.5-1.2-1.8-1.5-1.5-.4-2.2-1-2.2-2.1 0-1.2 1-2.1 2.6-2.1.8 0 1.5.2 2 .6M17 9.8h-2.4v4.5H17" />
    </g>
  ),
  settings: (
    <g {...stroke}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </g>
  ),
  chart: (
    <g {...stroke}>
      <path d="M4 20V4M4 20h16" />
      <path d="M8 16v-4M12 16V8M16 16v-6" />
    </g>
  ),
  file: (
    <g {...stroke}>
      <path d="M6 3.5h7.5L19 9v11.5H6V3.5Z" />
      <path d="M13.5 3.5V9H19M9 13h6M9 16.5h6" />
    </g>
  ),
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
