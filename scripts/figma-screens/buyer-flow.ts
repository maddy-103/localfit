import { colors, fontWeights, radii } from '../../src/styles/tokens';
import { Frame } from '../figma-svg';
import { buyerFooter, buyerHeader, copy } from './buyer-shared';

const card = Number(radii.card.replace('px', ''));
const pill = Number(radii.pill.replace('px', ''));

export function cartFrame(width: number, empty = false): Frame {
  const mobile = width === 360;
  const frame = new Frame(width, mobile ? 1350 : 850, empty ? 'buyer/cart empty' : 'buyer/cart');
  const gutter = mobile ? 16 : 100;
  const top = buyerHeader(frame);
  frame.text('cart-title', gutter, top + 64, 'YOUR CART', {
    family: 'heading',
    size: mobile ? 36 : 48,
    weight: Number(fontWeights.heading),
  });

  if (empty) {
    frame.rect('cart-empty-card', gutter, top + 110, width - gutter * 2, 320, colors.bg, { radius: card, stroke: colors.line });
    frame.icon('cart-empty-icon', 'cart', gutter + 24, top + 150, 48, colors.muted);
    frame.text('cart-empty-title', gutter + 24, top + 240, copy('bag.emptyTitle'), {
      family: 'heading',
      size: 24,
      weight: Number(fontWeights.heading),
    });
    frame.text('cart-empty-body', gutter + 24, top + 288, copy('bag.emptyBody'), { size: 16, fill: colors.muted, maxWidth: width - gutter * 2 - 48 });
    frame.button('cart-empty-action', gutter + 24, top + 344, 200, 48, copy('bag.emptyAction'));
    return frame;
  }

  const listWidth = mobile ? width - gutter * 2 : (width - gutter * 2) * 0.62;
  const summaryX = mobile ? gutter : gutter + listWidth + 24;
  const summaryWidth = mobile ? width - gutter * 2 : width - gutter * 2 - listWidth - 24;
  [0, 1].forEach((index) => {
    const rowY = top + 110 + index * 208;
    frame.rect(`cart-row-${index}`, gutter, rowY, listWidth, 192, colors.bg, { radius: card, stroke: colors.line });
    frame.photo(`cart-row-${index}-photo`, gutter + 16, rowY + 16, 120, 120, index === 0 ? 'toneRose' : 'toneSage');
    frame.text(`cart-row-${index}-name`, gutter + 152, rowY + 44, index === 0 ? 'Cotton kurta set' : 'Linen shirt', {
      size: 20,
      weight: Number(fontWeights.bold),
    });
    frame.text(`cart-row-${index}-variant`, gutter + 152, rowY + 78, copy('bag.lineSize', { size: index === 0 ? 'M' : 'L', colour: index === 0 ? 'Rose' : 'White' }), {
      size: 16,
      fill: colors.muted,
    });
    frame.text(`cart-row-${index}-price`, gutter + 152, rowY + 116, index === 0 ? '₹1,299' : '₹1,099', { size: 24, weight: Number(fontWeights.bold) });
    frame.icon(`cart-row-${index}-trash`, 'trash', gutter + listWidth - 44, rowY + 16, 24, colors.sale);
    frame.rect(`cart-row-${index}-stepper`, gutter + listWidth - 148, rowY + 128, 132, 48, colors.field, { radius: pill });
    frame.icon(`cart-row-${index}-minus`, 'minus', gutter + listWidth - 140, rowY + 140, 24);
    frame.text(`cart-row-${index}-quantity`, gutter + listWidth - 82, rowY + 159, '1', { size: 16, anchor: 'middle' });
    frame.icon(`cart-row-${index}-plus`, 'plus', gutter + listWidth - 44, rowY + 140, 24);
    frame.text(`cart-row-${index}-hold`, gutter + 152, rowY + 164, copy('bag.hold'), { size: 16, fill: colors.muted });
  });

  const summaryY = mobile ? top + 550 : top + 110;
  frame.rect('order-summary', summaryX, summaryY, summaryWidth, 340, colors.bg, { radius: card, stroke: colors.line });
  frame.text('order-summary-title', summaryX + 24, summaryY + 44, copy('bag.summary'), {
    family: 'heading',
    size: 24,
    weight: Number(fontWeights.heading),
  });
  [
    { id: 'subtotal', label: 'Subtotal', value: '₹2,398' },
    { id: 'discount', label: 'Discount', value: '−₹200' },
    { id: 'delivery', label: 'Delivery fee', value: copy('bag.free') },
  ].forEach((row, index) => {
    frame.text(`summary-${row.id}-label`, summaryX + 24, summaryY + 96 + index * 40, row.label, { size: 16, fill: colors.muted });
    frame.text(`summary-${row.id}-value`, summaryX + summaryWidth - 24, summaryY + 96 + index * 40, row.value, {
      size: 16,
      fill: row.id === 'discount' ? colors.saleText : colors.ink,
      anchor: 'end',
    });
  });
  frame.line('summary-divider', summaryX + 24, summaryY + 220, summaryX + summaryWidth - 24, summaryY + 220);
  frame.text('summary-total-label', summaryX + 24, summaryY + 260, copy('bag.total'), { size: 16, weight: Number(fontWeights.bold) });
  frame.text('summary-total-value', summaryX + summaryWidth - 24, summaryY + 260, '₹2,198', {
    size: 24,
    weight: Number(fontWeights.bold),
    anchor: 'end',
  });
  frame.button('checkout-button', summaryX + 24, summaryY + 276, summaryWidth - 48, 48, copy('bag.checkout'), { icon: 'arrow-right' });
  buyerFooter(frame, mobile ? 1150 : 620);
  return frame;
}

export function checkoutFrame(width: number, enabled: boolean): Frame {
  const mobile = width === 360;
  const frame = new Frame(width, mobile ? 1950 : 1750, enabled ? 'buyer/checkout pay enabled' : 'buyer/checkout pay disabled');
  const gutter = mobile ? 16 : 100;
  const top = buyerHeader(frame);
  frame.text('checkout-title', gutter, top + 64, 'CHECKOUT', {
    family: 'heading',
    size: mobile ? 36 : 48,
    weight: Number(fontWeights.heading),
  });
  const panelWidth = Math.min(width - gutter * 2, 840);

  frame.rect('address-card', gutter, top + 100, panelWidth, 130, colors.bg, { radius: card, stroke: colors.line });
  frame.icon('address-pin', 'pin', gutter + 20, top + 124, 24);
  frame.text('address-title', gutter + 56, top + 144, copy('checkout.deliveryTo'), { size: 16, weight: Number(fontWeights.bold) });
  frame.text('address-lines', gutter + 56, top + 178, '42, Second Cross, Indiranagar, Bengaluru 560038', { size: 16, maxWidth: panelWidth - 96 });
  frame.text('address-inside-area', gutter + 56, top + 210, copy('checkout.insideArea'), { size: 16, fill: colors.okText });

  frame.rect('payment-card', gutter, top + 250, panelWidth, 200, colors.bg, { radius: card, stroke: colors.line });
  frame.text('payment-title', gutter + 24, top + 292, copy('checkout.payment'), { size: 20, weight: Number(fontWeights.bold) });
  [
    { id: 'upi', label: copy('checkout.upi'), selected: true },
    { id: 'card', label: copy('checkout.card'), selected: false },
    { id: 'wallet', label: copy('checkout.wallet'), selected: false },
    { id: 'cod', label: copy('checkout.cod'), selected: false },
  ].forEach((method, index) => {
    const x = gutter + 24 + (index % 2) * (panelWidth / 2 - 12);
    const y = top + 320 + Math.floor(index / 2) * 60;
    frame.rect(`payment-radio-${method.id}`, x, y, panelWidth / 2 - 36, 48, method.selected ? colors.soft : colors.bg, {
      radius: pill,
      stroke: method.selected ? colors.ink : colors.line,
    });
    frame.text(`payment-radio-${method.id}-label`, x + 20, y + 31, method.label, { size: 16 });
  });
  frame.text('checkout-split-note', gutter, top + 476, copy('checkout.split', { count: '2' }), {
    size: 16,
    fill: colors.muted,
    maxWidth: panelWidth,
  });

  const termsTop = top + 520;
  frame.rect('trial-terms-block', gutter, termsTop, panelWidth, mobile ? 860 : 660, colors.bg, { radius: card, stroke: colors.line });
  frame.text('trial-terms-title', gutter + 24, termsTop + 42, copy('trialTerms.title'), {
    family: 'heading',
    size: 28,
    weight: Number(fontWeights.heading),
  });
  frame.text('trial-terms-copy', gutter + 24, termsTop + 82, copy('trialTerms.copy'), {
    size: 16,
    maxWidth: panelWidth - 48,
  });
  frame.text('trial-terms-default-title', gutter + 24, termsTop + 176, copy('trial.notMarked'), {
    size: 16,
    weight: Number(fontWeights.bold),
  });
  frame.text('trial-terms-default', gutter + 24, termsTop + 208, copy('trialTerms.defaultOutcome'), {
    size: 16,
    maxWidth: panelWidth - 48,
  });
  frame.text('trial-terms-payment-title', gutter + 24, termsTop + 308, copy('trialTerms.paymentTitle'), {
    size: 16,
    weight: Number(fontWeights.bold),
  });
  frame.text('trial-terms-card', gutter + 24, termsTop + 340, copy('trialTerms.card'), { size: 16, maxWidth: panelWidth - 48 });
  frame.text('trial-terms-upi', gutter + 24, termsTop + 456, copy('trialTerms.upi'), { size: 16, maxWidth: panelWidth - 48 });
  frame.text('trial-terms-wallet', gutter + 24, termsTop + 540, copy('trialTerms.wallet'), { size: 16, maxWidth: panelWidth - 48 });
  frame.text('trial-terms-cod', gutter + 24, termsTop + 624, copy('trialTerms.cod'), {
    size: 16,
    fill: colors.saleText,
    maxWidth: panelWidth - 48,
  });

  const checkboxY = termsTop + (mobile ? 876 : 690);
  frame.rect(enabled ? 'terms-checkbox-checked' : 'terms-checkbox-unchecked', gutter, checkboxY, 44, 44, enabled ? colors.ink : colors.bg, {
    radius: 8,
    stroke: colors.ink,
  });
  if (enabled) frame.icon('terms-checkbox-tick', 'check-circle', gutter + 10, checkboxY + 10, 24, colors.bg);
  frame.text('terms-checkbox-label', gutter + 60, checkboxY + 30, copy('checkout.tick'), { size: 16 });
  const payId = enabled ? 'pay-button-enabled' : 'pay-button-disabled';
  frame.button(payId, gutter, checkboxY + 68, panelWidth, 52, copy('checkout.pay', { amount: '₹2,198' }), { disabled: !enabled });
  buyerFooter(frame, mobile ? 1720 : 1520);
  return frame;
}

export function trackFrame(width: number): Frame {
  const mobile = width === 360;
  const frame = new Frame(width, 1950, 'buyer/track');
  const gutter = mobile ? 16 : 100;
  const top = buyerHeader(frame);
  frame.text('track-title', gutter, top + 64, 'TRACK ORDER', {
    family: 'heading',
    size: mobile ? 36 : 48,
    weight: Number(fontWeights.heading),
  });
  const mapWidth = Math.min(width - gutter * 2, 760);
  frame.photo('track-map', gutter, top + 100, mapWidth, mobile ? 260 : 320, 'toneSky');
  frame.icon('track-map-pin', 'pin', gutter + mapWidth / 2 - 24, top + (mobile ? 200 : 240), 48, colors.ink);
  frame.text('track-live-note', gutter, top + (mobile ? 388 : 448), copy('track.live'), { size: 16, fill: colors.muted });

  frame.rect('track-eta-card', gutter, top + 430, mapWidth, 112, colors.bg, { radius: card, stroke: colors.line });
  frame.text('track-eta-label', gutter + 24, top + 470, copy('track.etaLabel'), { size: 16, fill: colors.muted });
  frame.text('track-eta-value', gutter + 24, top + 516, '45–60 min', {
    family: 'heading',
    size: mobile ? 28 : 40,
    weight: Number(fontWeights.heading),
  });
  frame.text('track-promised-window', gutter + mapWidth - 24, top + 516, copy('track.window', { window: '45–60 min' }), {
    size: 16,
    fill: colors.muted,
    anchor: 'end',
  });

  frame.rect('track-rider-card', gutter, top + 566, mapWidth, 96, colors.bg, { radius: card, stroke: colors.line });
  frame.text('track-rider-label', gutter + 24, top + 604, copy('track.rider'), { size: 16, fill: colors.muted });
  frame.text('track-rider-name', gutter + 24, top + 638, 'Karthik R.', { size: 16, weight: Number(fontWeights.bold) });
  frame.button('track-call-rider', gutter + mapWidth - 180, top + 590, 160, 48, copy('track.callRider'), { outline: true, icon: 'phone' });

  frame.rect('track-otp-card', gutter, top + 686, mapWidth, 132, colors.soft, { radius: card });
  frame.text('track-otp-title', gutter + 24, top + 726, copy('track.otpTitle'), { size: 16, weight: Number(fontWeights.bold) });
  frame.text('track-otp-body', gutter + 24, top + 758, copy('track.otpBody'), { size: 16, fill: colors.muted });
  frame.text('track-otp-code', gutter + mapWidth - 180, top + 770, '4832', {
    family: 'mono',
    size: 32,
    weight: Number(fontWeights.bold),
    tracking: '4.8px',
  });

  frame.text('track-timeline-title', gutter, top + 862, copy('track.timeline'), {
    family: 'heading',
    size: 24,
    weight: Number(fontWeights.heading),
  });
  ['PLACED', 'SHOP_ACCEPTED', 'PACKED', 'OUT_FOR_DELIVERY'].forEach((step, index) => {
    const y = top + 910 + index * 84;
    if (index < 3) frame.line(`timeline-line-${index}`, gutter + 20, y + 16, gutter + 20, y + 84, colors.line, 2);
    frame.rect(`timeline-dot-${index}`, gutter + 8, y, 24, 24, index < 3 ? colors.ink : colors.field, { radius: 12 });
    frame.text(`timeline-label-${index}`, gutter + 48, y + 19, step, { size: 16, fill: index < 3 ? colors.ink : colors.muted });
  });
  frame.button('track-support', gutter, top + 1340, 220, 48, copy('track.support'), { outline: true, icon: 'shield' });
  buyerFooter(frame, 1720);
  return frame;
}

export function trialFrame(width: number, ending: boolean): Frame {
  const mobile = width === 360;
  const frame = new Frame(width, mobile ? 1150 : 1150, ending ? 'buyer/trial timer ending' : 'buyer/trial timer normal');
  const gutter = mobile ? 16 : 100;
  const top = buyerHeader(frame);
  frame.text('trial-title', gutter, top + 64, 'TRY WINDOW', {
    family: 'heading',
    size: mobile ? 36 : 48,
    weight: Number(fontWeights.heading),
  });
  frame.text('trial-intro', gutter, top + 112, copy('trial.intro'), { size: 16, fill: colors.muted, maxWidth: width - gutter * 2 });

  frame.rect('trial-timer-panel', gutter, top + 160, width - gutter * 2, 116, ending ? colors.saleBg : colors.soft, { radius: card });
  frame.icon('trial-timer-icon', ending ? 'alert' : 'clock', gutter + 24, top + 190, 32, ending ? colors.saleText : colors.ink);
  frame.text('trial-timer-label', gutter + 72, top + 204, copy('trial.remaining'), { size: 16, fill: colors.muted });
  frame.text('timer-remaining', gutter + 72, top + 252, ending ? '01:38' : '12:04', {
    family: 'mono',
    size: ending ? 32 : 40,
    weight: Number(fontWeights.bold),
    fill: ending ? colors.saleText : colors.ink,
    tracking: '1.92px',
  });
  frame.text('trial-timer-notice', gutter, top + 304, ending ? copy('trial.urgent') : copy('trial.notice'), {
    size: 16,
    fill: ending ? colors.saleText : colors.muted,
    maxWidth: width - gutter * 2,
  });

  const rowY = top + 360;
  frame.rect('trial-items-card', gutter, rowY, width - gutter * 2, 320, colors.bg, { radius: card, stroke: colors.line });
  [0, 1].forEach((index) => {
    const itemY = rowY + 20 + index * 148;
    frame.photo(`trial-item-${index}-photo`, gutter + 16, itemY, 96, 96, index === 0 ? 'toneRose' : 'toneSage');
    frame.text(`trial-item-${index}-name`, gutter + 128, itemY + 30, index === 0 ? 'Cotton kurta set · M' : 'Linen shirt · L', { size: 16, weight: Number(fontWeights.bold) });
    frame.text(`trial-item-${index}-default`, gutter + 128, itemY + 60, copy('trial.notMarked'), { size: 16, fill: colors.muted });
    frame.button(`trial-item-${index}-keep`, gutter + 128, itemY + 88, mobile ? 96 : 116, 44, copy('trial.keep'), { outline: true });
    frame.button(`trial-item-${index}-return`, gutter + (mobile ? 232 : 252), itemY + 88, mobile ? 96 : 116, 44, copy('trial.return'), { outline: true });
  });

  frame.button('size-swap-button', gutter, rowY + 356, mobile ? 328 : 300, 48, copy('trial.swapButton'), { outline: true, icon: 'sliders' });
  frame.button('confirm-decisions-button', gutter, rowY + 420, mobile ? 328 : 300, 48, copy('trial.confirm'));
  buyerFooter(frame, 970);
  return frame;
}
