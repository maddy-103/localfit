/**
 * Static defaults that a backend admin config replaces. Kept pure so screens
 * do not need to know where configuration comes from.
 */
export const CITIES = ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune'] as const;

export const OCCASION_SLUGS = [
  'party-tonight',
  'farewell',
  'festive-kurta',
  'engagement',
  'office',
] as const;

export const OTP_RESEND_MS = 30_000;
export const WHATSAPP_OFFER_MS = 60_000;
export const DEMO_OTP = '123456';
