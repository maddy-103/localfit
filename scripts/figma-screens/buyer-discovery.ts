import { en } from '../../src/i18n/en';
import { colors, fontWeights, radii } from '../../src/styles/tokens';
import { Frame } from '../figma-svg';
import { buyerFooter, buyerHeader, copy, productCard } from './buyer-shared';

const pill = Number(radii.pill.replace('px', ''));
const card = Number(radii.card.replace('px', ''));

export function homeFrame(width: number): Frame {
  const mobile = width === 360;
  const frame = new Frame(width, mobile ? 3500 : 2400, 'buyer/home');
  const gutter = mobile ? 16 : 100;
  const content = width - gutter * 2;
  const top = buyerHeader(frame);
  const heroHeight = mobile ? 820 : 520;

  frame.rect('hero-band', 0, top, width, heroHeight, colors.soft);
  frame.text('hero-title', gutter, top + (mobile ? 76 : 108), copy('home.heroTitle'), {
    family: 'heading',
    size: mobile ? 36 : 64,
    weight: Number(fontWeights.heading),
    maxWidth: mobile ? content : 600,
    lineHeight: 1,
    tracking: '-0.32px',
  });
  frame.text('hero-body', gutter, top + (mobile ? 336 : 380), copy('home.heroBody'), {
    size: 16,
    maxWidth: mobile ? content : 540,
    fill: colors.muted,
  });
  frame.button('hero-shop-now', gutter, top + (mobile ? 438 : 462), 210, 52, copy('home.shopNow'));

  const stats = [
    { id: 'partner-shops', value: '200+', label: copy('home.statShops') },
    { id: 'items-in-stock', value: '2,000+', label: copy('home.statItems') },
    { id: 'happy-buyers', value: '30,000+', label: copy('home.statBuyers') },
  ];
  stats.forEach((stat, index) => {
    const x = mobile ? gutter : gutter + index * 240;
    const y = top + (mobile ? 530 + index * 84 : 556);
    frame.text(`hero-stat-${stat.id}-value`, x, y, stat.value, {
      family: 'heading',
      size: mobile ? 24 : 40,
      weight: Number(fontWeights.heading),
    });
    frame.text(`hero-stat-${stat.id}-label`, x, y + 28, stat.label, { size: 16, fill: colors.muted });
    if (index > 0) {
      frame.line(`hero-stat-divider-${index}`, x - 28, y - 36, x - 28, y + 16, colors.line, 1);
    }
  });

  const photoX = mobile ? 100 : 900;
  const photoY = top + (mobile ? 500 : 0);
  frame.photo('hero-photo', photoX, photoY, mobile ? 240 : 440, mobile ? 300 : heroHeight, 'toneSand');
  frame.icon('hero-sparkle-top', 'sparkle', photoX + (mobile ? 196 : 376), photoY + 24, 48);
  frame.icon('hero-sparkle-left', 'sparkle', photoX + 16, photoY + (mobile ? 180 : 300), 40);
  frame.rect('hero-live-stock', photoX + 8, photoY + (mobile ? 236 : 436), 200, 64, colors.bg, { radius: card });
  frame.text('hero-live-stock-label', photoX + 24, photoY + (mobile ? 268 : 468), copy('home.liveStock'), {
    size: 16,
    weight: Number(fontWeights.bold),
  });
  frame.text('hero-live-stock-detail', photoX + 24, photoY + (mobile ? 292 : 492), 'Cotton kurta · Size M', {
    size: 16,
    fill: colors.muted,
  });

  let y = top + heroHeight + 48;
  frame.text('need-today-title', gutter, y, copy('home.needToday'), {
    family: 'heading',
    size: mobile ? 28 : 48,
    weight: Number(fontWeights.heading),
  });
  frame.text('need-today-help', gutter, y + 32, copy('home.needTodayHelp'), { size: 16, fill: colors.muted });
  y += 64;
  const cardWidth = mobile ? (content - 12) / 2 : (content - 3 * 24) / 4;
  const columns = mobile ? 2 : 4;
  for (let index = 0; index < 4; index += 1) {
    productCard(frame, `need-card-${index}`, gutter + (index % columns) * (cardWidth + 16), y + Math.floor(index / columns) * 380, cardWidth);
  }
  y += mobile ? 780 : 400;

  frame.text('occasion-title', gutter, y, copy('home.occasions'), {
    family: 'heading',
    size: mobile ? 28 : 48,
    weight: Number(fontWeights.heading),
  });
  y += 40;
  ['Party tonight', 'Farewell', 'Festive kurta', 'Engagement'].forEach((name, index) => {
    const tileWidth = mobile ? (content - 12) / 2 : (content - 3 * 24) / 4;
    const x = gutter + (index % columns) * (tileWidth + 16);
    const tileY = y + Math.floor(index / columns) * (mobile ? 140 : 180);
    frame.photo(`occasion-tile-${index}`, x, tileY, tileWidth, mobile ? 110 : 150, 'toneSage');
    frame.text(`occasion-label-${index}`, x, tileY + (mobile ? 132 : 174), name, {
      size: 16,
      weight: Number(fontWeights.bold),
    });
  });
  y += mobile ? 300 : 220;

  frame.text('arrivals-title', gutter, y, 'NEW ARRIVALS', {
    family: 'heading',
    size: mobile ? 28 : 48,
    weight: Number(fontWeights.heading),
  });
  y += 40;
  for (let index = 0; index < 4; index += 1) {
    productCard(frame, `arrival-card-${index}`, gutter + (index % columns) * (cardWidth + 16), y + Math.floor(index / columns) * 380, cardWidth);
  }
  y += mobile ? 780 : 400;
  frame.rect('brand-strip', 0, y, width, 140, colors.ink);
  ['Anaya Studio', 'Studio Kadam', 'Niki Collection', 'The Local Fit', 'Rupa House', 'Meera Styles'].forEach((name, index) => {
    frame.text(`brand-name-${index}`, mobile ? 16 + (index % 2) * 180 : 100 + index * 205, y + (mobile ? 40 + Math.floor(index / 2) * 44 : 76), name, {
      size: 16,
      fill: colors.bg,
      maxWidth: 190,
    });
  });
  buyerFooter(frame, y + 140);
  return frame;
}

export function categoryFrame(width: number): Frame {
  const mobile = width === 360;
  const frame = new Frame(width, mobile ? 1700 : 1300, 'buyer/category');
  const gutter = mobile ? 16 : 100;
  const top = buyerHeader(frame);
  frame.text('breadcrumb', gutter, top + 40, 'Home  ›  Casual', { size: 16, fill: colors.muted });
  frame.text('category-title', gutter, top + 100, 'CASUAL', {
    family: 'heading',
    size: mobile ? 36 : 64,
    weight: Number(fontWeights.heading),
  });
  frame.text('result-count', gutter, top + 140, copy('search.resultCount', { count: '10', total: '100' }), {
    size: 16,
    fill: colors.muted,
  });
  frame.text('sort-label', width - gutter - 200, top + 140, copy('search.sort'), { size: 16, fill: colors.muted });
  frame.rect('sort-control', width - gutter - 200, top + 116, 200, 44, colors.field, { radius: pill });
  frame.text('sort-value', width - gutter - 184, top + 144, copy('search.sortRelevance'), { size: 16 });

  let contentX = gutter;
  let y = top + 180;
  if (mobile) {
    frame.button('mobile-filter-button', gutter, y, 160, 44, copy('search.filters'), { outline: true, icon: 'sliders' });
  } else {
    frame.rect('filter-panel', gutter, y, 260, 720, colors.bg, { radius: card, stroke: colors.line });
    frame.icon('filter-panel-icon', 'sliders', gutter + 20, y + 20, 24);
    frame.text('filter-panel-title', gutter + 54, y + 38, copy('search.filters'), {
      size: 20,
      weight: Number(fontWeights.bold),
    });
    ['Price', 'Colour', 'Size', 'Shop distance', 'Delivery window', 'Fit tags'].forEach((label, index) => {
      frame.line(`filter-row-divider-${index}`, gutter + 20, y + 76 + index * 72, gutter + 240, y + 76 + index * 72);
      frame.text(`filter-row-${index}`, gutter + 20, y + 110 + index * 72, label, { size: 16 });
      frame.icon(`filter-chevron-${index}`, 'chevron-down', gutter + 220, y + 92 + index * 72, 16);
    });
    frame.button('apply-filter-button', gutter + 20, y + 624, 220, 48, copy('search.apply'));
    contentX = gutter + 284;
  }
  y += 8;
  const available = width - contentX - gutter;
  const columns = mobile ? 2 : 3;
  const cardWidth = (available - (columns - 1) * 16) / columns;
  for (let index = 0; index < 6; index += 1) {
    productCard(frame, `result-card-${index}`, contentX + (index % columns) * (cardWidth + 16), y + Math.floor(index / columns) * 380, cardWidth);
  }
  buyerFooter(frame, y + (mobile ? 1180 : 800));
  return frame;
}

export function productFrame(width: number): Frame {
  const mobile = width === 360;
  const frame = new Frame(width, mobile ? 1700 : 1260, 'buyer/product');
  const gutter = mobile ? 16 : 100;
  const top = buyerHeader(frame);
  frame.text('breadcrumb', gutter, top + 40, 'Home  ›  Casual  ›  Cotton kurta set', { size: 16, fill: colors.muted });
  const imageTop = top + 72;
  const mainWidth = mobile ? 328 : 560;
  frame.photo('product-main-photo', gutter, imageTop, mainWidth, mobile ? 400 : 620, 'toneRose');
  if (!mobile) {
    [0, 1, 2].forEach((index) => {
      frame.photo(`product-thumb-${index}`, gutter + index * 116, imageTop + 640, 96, 96, 'toneRose');
    });
  }

  const detailX = mobile ? gutter : gutter + mainWidth + 56;
  let detailY = mobile ? imageTop + 440 : imageTop + 40;
  frame.text('product-title', detailX, detailY, 'COTTON KURTA SET', {
    family: 'heading',
    size: mobile ? 28 : 40,
    weight: Number(fontWeights.heading),
    maxWidth: width - detailX - gutter,
  });
  detailY += 44;
  frame.icon('product-rating-star', 'star', detailX, detailY - 18, 18, colors.star);
  frame.text('product-rating', detailX + 26, detailY, '4.5/5 · 128 reviews', { size: 16, fill: colors.muted });
  detailY += 52;
  frame.text('product-price', detailX, detailY, '₹1,299', { size: 24, weight: Number(fontWeights.bold) });
  frame.text('product-mrp', detailX + 110, detailY, '₹1,699', { size: 16, fill: colors.muted });
  frame.rect('product-off-pill', detailX + 210, detailY - 24, 72, 32, colors.saleBg, { radius: pill });
  frame.text('product-off-label', detailX + 246, detailY - 2, '23% off', { size: 16, fill: colors.saleText, anchor: 'middle' });
  detailY += 40;
  frame.text('product-shop', detailX, detailY, 'Anaya Studio · 2 km away', { size: 16, weight: Number(fontWeights.bold) });
  detailY += 32;
  frame.rect('product-stock-badge', detailX, detailY, mobile ? 328 : 480, 48, colors.okBg, { radius: pill });
  frame.text('product-stock-text', detailX + 16, detailY + 31, copy('product.stock', { count: '3', distance: '2 km', time: 'just now' }), {
    size: 16,
    fill: colors.okText,
    maxWidth: mobile ? 296 : 448,
  });
  detailY += 72;
  frame.rect('product-eta-card', detailX, detailY, mobile ? 328 : 480, 64, colors.bg, { radius: card, stroke: colors.line });
  frame.icon('product-eta-icon', 'clock', detailX + 16, detailY + 20, 24);
  frame.text('product-eta', detailX + 52, detailY + 39, copy('product.eta', { window: '45–60 min' }), { size: 16 });
  detailY += 88;
  frame.text('product-colour-label', detailX, detailY, copy('product.selectColour'), { size: 16, weight: Number(fontWeights.bold) });
  [colors.toneSand, colors.toneRose, colors.toneSage].forEach((tone, index) => {
    frame.rect(`product-swatch-${index}-hit-area`, detailX + index * 44 - 6, detailY + 6, 44, 44, 'none');
    frame.rect(`product-swatch-${index}`, detailX + index * 44, detailY + 12, 32, 32, tone, { radius: Number(radii.circle.replace('%', '')) });
  });
  detailY += 68;
  frame.text('product-size-label', detailX, detailY, copy('product.selectSize'), { size: 16, weight: Number(fontWeights.bold) });
  frame.button('product-size-guide', detailX + 140, detailY - 30, 140, 44, copy('product.sizeGuide'), { outline: true, labelSize: 16 });
  detailY += 24;
  ['S', 'M', 'L', 'XL'].forEach((size, index) => {
    const sizeId = size.toLowerCase();
    frame.rect(`product-size-${sizeId}`, detailX + index * 60, detailY, 52, 44, size === 'M' ? colors.ink : colors.field, { radius: pill });
    frame.text(`product-size-${sizeId}-label`, detailX + index * 60 + 26, detailY + 29, size, {
      size: 16,
      fill: size === 'M' ? colors.bg : colors.ink,
      anchor: 'middle',
    });
  });
  detailY += 72;
  frame.rect('product-quantity', detailX, detailY, 132, 48, colors.field, { radius: pill });
  frame.icon('product-quantity-minus', 'minus', detailX + 8, detailY + 12, 24);
  frame.text('product-quantity-value', detailX + 66, detailY + 31, '1', { size: 16, anchor: 'middle' });
  frame.icon('product-quantity-plus', 'plus', detailX + 104, detailY + 12, 24);
  frame.button('product-add-to-bag', detailX + 148, detailY, mobile ? 180 : 300, 48, copy('product.addToBag'), { icon: 'cart' });
  detailY += 80;
  frame.rect('product-try-panel', detailX, detailY, mobile ? 328 : 480, 72, colors.soft, { radius: card });
  frame.text('product-try-title', detailX + 16, detailY + 30, copy('product.tryAtDoor'), { size: 16, weight: Number(fontWeights.bold) });
  frame.text('product-try-hint', detailX + 16, detailY + 56, copy('product.trySheetDefault'), { size: 16, fill: colors.muted, maxWidth: mobile ? 296 : 448 });
  detailY += 96;
  ['detailsTab', 'ratingsTab', 'faqsTab'].forEach((key, index) => {
    frame.text(`product-tab-${index}`, detailX + index * (mobile ? 100 : 150), detailY, copy(`product.${key}` as keyof typeof en), {
      size: 16,
      fill: index === 0 ? colors.ink : colors.muted,
      weight: index === 0 ? Number(fontWeights.bold) : Number(fontWeights.body),
    });
  });
  frame.line('product-tab-underline', detailX, detailY + 12, detailX + 100, detailY + 12, colors.ink, 2);
  buyerFooter(frame, mobile ? 1520 : 1080);
  return frame;
}
