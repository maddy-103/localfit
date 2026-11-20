import { en } from '../../src/i18n/en';
import { colors, fontWeights, radii } from '../../src/styles/tokens';
import { Frame } from '../figma-svg';

const pill = Number(radii.pill.replace('px', ''));

export function copy(key: keyof typeof en, vars: Record<string, string> = {}): string {
  return (en[key] as string).replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? '');
}

export function buyerHeader(frame: Frame): number {
  const { width } = frame;
  const mobile = width === 360;
  const left = mobile ? 16 : Math.max(16, (width - 1240) / 2);

  const announcementHeight = 64;
  frame.rect('announcement-bar', 0, 0, width, announcementHeight, colors.ink);
  frame.text(
    'announcement-copy',
    mobile ? 16 : left,
    29,
    `${copy('announcement.text')} ${copy('announcement.cta')}`,
    { size: 16, fill: colors.bg, maxWidth: width - 90 },
  );
  frame.icon('announcement-close', 'close', width - 40, (announcementHeight - 24) / 2, 24, colors.bg);

  const top = announcementHeight;
  frame.rect('site-header', 0, top, width, 72, colors.bg);
  frame.text('header-logo', left, top + 46, 'LOCALFIT', {
    family: 'heading',
    size: 24,
    weight: Number(fontWeights.heading),
    tracking: '-0.32px',
  });

  if (mobile) {
    frame.icon('header-menu', 'menu', width - 176, top + 24, 24);
    frame.icon('header-search', 'search', width - 132, top + 24, 24);
    frame.icon('header-cart', 'cart', width - 88, top + 24, 24);
    frame.icon('header-account', 'user-circle', width - 44, top + 24, 24);
  } else {
    const nav = ['Shop', 'Occasions', 'Near you'];
    nav.forEach((item, index) => {
      frame.text(`header-nav-${index}`, left + 180 + index * 120, top + 46, item, { size: 16 });
      if (index === 0) frame.icon('header-nav-chevron', 'chevron-down', left + 264, top + 38, 16);
    });
    frame.rect('header-search-field', left + 600, top + 12, 420, 48, colors.field, { radius: pill });
    frame.icon('header-search-icon', 'search', left + 616, top + 24, 24, colors.muted);
    frame.text('header-search-placeholder', left + 650, top + 43, copy('home.searchEntry'), {
      size: 16,
      fill: colors.muted,
      maxWidth: 350,
    });
    frame.icon('header-cart', 'cart', width - left - 88, top + 24, 24);
    frame.icon('header-account', 'user-circle', width - left - 44, top + 24, 24);
  }
  frame.line('header-divider', 0, top + 72, width, top + 72);
  return top + 72;
}

export function buyerFooter(frame: Frame, top: number): void {
  frame.rect('site-footer', 0, top, frame.width, 176, colors.ink);
  frame.text('footer-brand', 16, top + 48, 'LOCALFIT', {
    family: 'heading',
    size: 24,
    weight: Number(fontWeights.heading),
    fill: colors.bg,
  });
  frame.text('footer-tagline', 16, top + 88, copy('footer.tagline'), {
    size: 16,
    fill: colors.onInkSoft,
    maxWidth: frame.width - 32,
  });
  frame.text('footer-legal', 16, top + 132, copy('footer.legal'), {
    size: 16,
    fill: colors.onInkMuted,
    maxWidth: frame.width - 32,
  });
}

export function productCard(frame: Frame, id: string, x: number, y: number, w: number): void {
  const imageHeight = w < 220 ? 176 : 220;
  frame.photo(`${id}-photo`, x, y, w, imageHeight, 'toneRose');
  frame.rect(`${id}-try-pill`, x + 12, y + 12, 116, 32, colors.ink, { radius: pill });
  frame.text(`${id}-try-pill-label`, x + 70, y + 34, copy('product.tryAtDoor'), {
    size: 16,
    fill: colors.bg,
    anchor: 'middle',
    maxWidth: 108,
  });
  frame.rect(`${id}-discount-pill`, x + w - 70, y + 12, 58, 32, colors.saleBg, { radius: pill });
  frame.text(`${id}-discount-label`, x + w - 41, y + 34, '20% off', {
    size: 16,
    fill: colors.saleText,
    anchor: 'middle',
    maxWidth: 56,
  });
  frame.text(`${id}-name`, x, y + imageHeight + 28, 'Cotton kurta set', {
    size: 20,
    weight: Number(fontWeights.bold),
    maxWidth: w,
  });
  frame.icon(`${id}-star`, 'star', x, y + imageHeight + 42, 18, colors.star);
  frame.text(`${id}-rating`, x + 26, y + imageHeight + 57, '4.5/5', { size: 16, fill: colors.muted });
  frame.text(`${id}-price`, x, y + imageHeight + 94, '₹1,299', { size: 24, weight: Number(fontWeights.bold) });
  frame.text(`${id}-mrp`, x + 108, y + imageHeight + 94, '₹1,699', { size: 16, fill: colors.muted });
  frame.text(`${id}-eta`, x, y + imageHeight + 126, '2 km away · Arrives in 45–60 min', {
    size: 16,
    fill: colors.muted,
    maxWidth: w,
  });
}
