import { colors, fontWeights, radii } from '../../src/styles/tokens';
import { Frame, consoleChrome } from '../figma-svg';
import { copy } from './buyer-shared';

const card = Number(radii.card.replace('px', ''));
const pill = Number(radii.pill.replace('px', ''));

function contentBounds(frame: Frame): { x: number; width: number; top: number } {
  const mobile = frame.width === 360;
  return { x: mobile ? 16 : 280, width: mobile ? 328 : 880, top: mobile ? 88 : 128 };
}

export function riderDropFrame(width: number, trialActive: boolean): Frame {
  const mobile = width === 360;
  const frame = new Frame(width, mobile ? 1500 : 1400, trialActive ? 'rider/drop trial active' : 'rider/drop otp pending');
  const { x, width: inner, top } = contentBounds(frame);
  consoleChrome(frame, 'rider', copy('rider.tasksTitle'));

  frame.rect('drop-task-card', x, top + 16, inner, 190, colors.bg, { radius: card, stroke: colors.line });
  frame.rect('drop-type-pill', x + 16, top + 32, 96, 32, colors.ink, { radius: pill });
  frame.text('drop-type-label', x + 64, top + 54, copy('rider.task.drop'), { size: 16, fill: colors.bg, anchor: 'middle' });
  frame.text('drop-order-id', x + 128, top + 55, copy('rider.task.order', { id: 'ORD-2481' }), { size: 16, weight: Number(fontWeights.bold) });
  frame.text('drop-address-label', x + 16, top + 106, copy('rider.task.buyer'), { size: 16, fill: colors.muted });
  frame.text('drop-address', x + 16, top + 140, '42, Second Cross, Indiranagar, Bengaluru', { size: 16, maxWidth: inner - 32 });
  frame.button('drop-navigate', x + inner - 180, top + 36, 164, 44, copy('rider.task.navigate'), { outline: true, icon: 'pin', labelSize: 16 });

  frame.photo('drop-map', x, top + 224, inner, mobile ? 200 : 240, 'toneSky');
  frame.icon('drop-map-pin', 'pin', x + inner / 2 - 24, top + (mobile ? 288 : 312), 48);

  frame.button('drop-arrived', x, top + 452, inner, 48, copy('rider.task.arrived'));
  frame.rect('drop-otp-card', x, top + 520, inner, 160, colors.bg, { radius: card, stroke: colors.line });
  frame.text('drop-otp-label', x + 16, top + 558, copy('rider.task.buyerOtp'), { size: 16, weight: Number(fontWeights.bold) });
  frame.text('drop-otp-hint', x + 16, top + 590, copy('rider.task.otpHint'), { size: 16, fill: colors.muted, maxWidth: inner - 32 });
  frame.rect('drop-otp-input', x + 16, top + 616, inner - 32, 48, colors.field, { radius: pill });
  frame.text('drop-otp-digits', x + 32, top + 648, '4 8 3 2', {
    family: 'mono',
    size: 20,
    tracking: '4.8px',
    fill: trialActive ? colors.ink : colors.muted,
  });
  frame.button('drop-verify-otp', x, top + 696, inner, 48, copy('rider.task.verifyOtp'), { disabled: !trialActive });
  frame.button('drop-handover-photo', x, top + 760, inner, 48, copy('rider.task.handoverPhoto'), { outline: true, icon: 'camera' });

  if (trialActive) {
    frame.rect('rider-trial-timer', x, top + 828, inner, 100, colors.saleBg, { radius: card });
    frame.icon('rider-trial-alert', 'alert', x + 16, top + 856, 24, colors.saleText);
    frame.text('rider-trial-label', x + 52, top + 874, copy('rider.task.trialTimer'), { size: 16 });
    frame.text('rider-timer-remaining', x + 52, top + 910, '01:38', {
      family: 'mono',
      size: 24,
      weight: Number(fontWeights.bold),
      fill: colors.saleText,
      tracking: '1.92px',
    });
    frame.text('rider-decisions-label', x, top + 956, copy('rider.task.decisions'), { size: 16, weight: Number(fontWeights.bold) });
    frame.text('rider-decision-keep', x, top + 992, copy('rider.task.decision.keep'), { size: 16, fill: colors.okText });
    frame.text('rider-decision-return', x + 160, top + 992, copy('rider.task.decision.return'), { size: 16, fill: colors.saleText });
    frame.button('rider-confirm-decisions', x, top + 1020, inner, 48, copy('rider.task.confirmDecisions'));
  }
  frame.rect('rider-action-bar', 0, frame.height - 80, width, 80, colors.ink);
  frame.button('rider-primary-action', x, frame.height - 68, inner, 48, trialActive ? copy('rider.task.closeTrip') : copy('rider.task.arrived'));
  return frame;
}

export function shopListingFrame(width: number, offline: boolean): Frame {
  const mobile = width === 360;
  const frame = new Frame(width, mobile ? 1600 : 1300, offline ? 'shop/listing-new offline draft' : 'shop/listing-new publish ready');
  const { x, width: inner, top } = contentBounds(frame);
  consoleChrome(frame, 'shop', copy('shop.listing.title'));

  if (offline) {
    frame.rect('listing-offline-banner', x, top + 12, inner, 64, colors.field, { radius: card });
    frame.icon('listing-offline-icon', 'wifi-off', x + 16, top + 28, 24);
    frame.text('listing-offline-copy', x + 52, top + 52, copy('shop.listing.offlineHint'), { size: 16, maxWidth: inner - 72 });
  }
  const start = top + (offline ? 96 : 16);
  frame.text('listing-step', x, start + 28, copy('shop.listing.stepHint', { step: '1', total: '3', label: copy('shop.listing.capture') }), {
    size: 16,
    fill: colors.muted,
  });
  frame.photo('listing-photo', x, start + 56, inner, mobile ? 260 : 300, 'toneSand');
  frame.button('listing-capture', x, start + (mobile ? 336 : 376), inner, 48, copy('shop.listing.capture'), { icon: 'camera' });
  frame.rect('listing-suggested-card', x, start + (mobile ? 404 : 444), inner, 240, colors.bg, { radius: card, stroke: colors.line });
  frame.text('listing-suggested-title', x + 20, start + (mobile ? 444 : 484), copy('shop.listing.suggested'), {
    size: 16,
    weight: Number(fontWeights.bold),
    fill: colors.okText,
  });
  ['Cotton kurta set', 'Ethnic sets', 'Rose', 'Cotton'].forEach((value, index) => {
    frame.text(`listing-field-${index}`, x + 20, start + (mobile ? 486 : 526) + index * 36, value, { size: 16 });
  });
  frame.text('listing-sizes-label', x, start + (mobile ? 676 : 716), copy('shop.listing.sizes'), { size: 16, weight: Number(fontWeights.bold) });
  ['S', 'M', 'L', 'XL'].forEach((size, index) => {
    const sizeId = size.toLowerCase();
    frame.rect(`listing-size-${sizeId}`, x + index * 76, start + (mobile ? 698 : 738), 68, 48, colors.field, { radius: pill });
    frame.text(`listing-size-${sizeId}-label`, x + index * 76 + 34, start + (mobile ? 730 : 770), size, { size: 16, anchor: 'middle' });
  });
  frame.button('listing-save', x, start + (mobile ? 772 : 812), inner, 48, offline ? copy('shop.listing.save') : copy('shop.listing.published'), { disabled: !offline });
  frame.text('listing-drafts-title', x, start + (mobile ? 860 : 900), copy('shop.listing.drafts'), {
    family: 'heading',
    size: 24,
    weight: Number(fontWeights.heading),
  });
  frame.rect('listing-draft-row', x, start + (mobile ? 886 : 926), inner, 84, colors.bg, { radius: card, stroke: colors.line });
  frame.text('listing-draft-name', x + 20, start + (mobile ? 924 : 964), 'Cotton kurta set · 3 sizes', { size: 16 });
  frame.text('listing-draft-state', x + 20, start + (mobile ? 954 : 994), offline ? copy('shop.listing.queued') : copy('shop.listing.published'), {
    size: 16,
    fill: offline ? colors.saleText : colors.okText,
  });
  if (offline) frame.button('listing-sync-now', x + inner - 160, start + 904, 144, 48, copy('shop.listing.sync'), { outline: true });
  return frame;
}

export function disputesDetailFrame(width: number, restricted: boolean): Frame {
  const mobile = width === 360;
  const frame = new Frame(width, mobile ? 1700 : 1250, restricted ? 'admin/disputes-detail restricted' : 'admin/disputes-detail evidence');
  const { x, width: inner, top } = contentBounds(frame);
  consoleChrome(frame, 'admin', copy('admin.disputes.title'));

  frame.text('disputes-subtitle', x, top + 32, copy('admin.disputes.subtitle'), { size: 16, fill: colors.muted, maxWidth: inner });
  const tableTop = top + 64;
  frame.rect('disputes-table-header', x, tableTop, inner, 48, colors.field, { radius: Number(radii.xs.replace('px', '')) });
  ['Case', 'Order', 'Value', 'Decision SLA'].forEach((heading, index) => {
    frame.text(`disputes-column-${index}`, x + 12 + index * (inner / 4), tableTop + 31, heading, {
      size: 16,
      weight: Number(fontWeights.bold),
    });
  });
  [
    { id: 'D-1042', order: 'ORD-2481', value: '₹1,299', sla: copy('admin.disputes.breached'), urgent: true },
    { id: 'D-1041', order: 'ORD-2477', value: '₹899', sla: copy('admin.disputes.remaining', { time: '6h' }), urgent: false },
    { id: 'D-1040', order: 'ORD-2469', value: '₹2,198', sla: copy('admin.disputes.remaining', { time: '19h' }), urgent: false },
  ].forEach((row, index) => {
    const y = tableTop + 48 + index * 56;
    frame.rect(`dispute-row-${index}`, x, y, inner, 56, colors.bg, { stroke: colors.line });
    frame.text(`dispute-row-${index}-case`, x + 12, y + 34, row.id, { size: 16 });
    frame.text(`dispute-row-${index}-order`, x + inner / 4 + 12, y + 34, row.order, { size: 16 });
    frame.text(`dispute-row-${index}-value`, x + inner / 2 + 12, y + 34, row.value, { size: 16 });
    frame.text(`dispute-row-${index}-sla`, x + (inner * 3) / 4 + 12, y + 34, row.sla, { size: 16, fill: row.urgent ? colors.saleText : colors.ink });
  });

  const sheetX = mobile ? 0 : 340;
  const sheetY = mobile ? 520 : 120;
  const sheetW = mobile ? width : 900;
  const sheetH = mobile ? 1140 : 1080;
  frame.rect('evidence-sheet-overlay', 0, 0, width, frame.height, colors.overlay);
  frame.rect('evidence-sheet', sheetX, sheetY, sheetW, sheetH, colors.bg, { radius: card });
  frame.text('evidence-sheet-title', sheetX + 24, sheetY + 48, copy('admin.disputes.evidenceTitle'), {
    family: 'heading',
    size: 28,
    weight: Number(fontWeights.heading),
  });
  frame.text('evidence-case-line', sheetX + 24, sheetY + 84, 'D-1042 · ORD-2481 · ₹1,299', { size: 16, fill: colors.muted });
  if (restricted) {
    frame.rect('evidence-restricted-note', sheetX + 24, sheetY + 120, sheetW - 48, 96, colors.field, { radius: card });
    frame.text('evidence-restricted-copy', sheetX + 44, sheetY + 164, copy('admin.disputes.restricted'), {
      size: 16,
      maxWidth: sheetW - 88,
    });
  } else {
    frame.text('evidence-photos-label', sheetX + 24, sheetY + 128, copy('admin.disputes.photos'), { size: 16, weight: Number(fontWeights.bold) });
    [0, 1].forEach((index) => {
      frame.photo(`evidence-photo-${index}`, sheetX + 24 + index * 148, sheetY + 148, 132, 132, index === 0 ? 'toneRose' : 'toneSage');
    });
    frame.text('evidence-gps', sheetX + 24, sheetY + 316, `${copy('admin.disputes.gps')}: 12.9716, 77.5946`, { size: 16 });
    frame.text('evidence-otp', sheetX + 24, sheetY + 352, `${copy('admin.disputes.otpAttempts')}: 0`, { size: 16 });
    frame.text('evidence-checked', sheetX + 24, sheetY + 388, `${copy('admin.disputes.checkedAt')}: 16:42`, { size: 16 });
    frame.text('evidence-events-title', sheetX + 24, sheetY + 440, copy('admin.disputes.events'), {
      size: 16,
      weight: Number(fontWeights.bold),
    });
    ['PLACED → SHOP_ACCEPTED', 'SHOP_ACCEPTED → PACKED', 'ARRIVED → OTP_VERIFIED'].forEach((event, index) => {
      frame.text(`evidence-event-${index}`, sheetX + 24, sheetY + 480 + index * 40, event, { size: 16, fill: colors.muted });
    });
    frame.button('evidence-decide', sheetX + 24, sheetY + (mobile ? 616 : 620), sheetW - 48, 48, copy('admin.disputes.decide'));
  }
  return frame;
}
