/** Static choices for the shop console. No free text where a choice works. */

export const DECLINE_REASONS = [
  'out_of_stock',
  'customer_request',
  'address_outside_radius',
  'shop_closed',
] as const;
export type DeclineReason = (typeof DECLINE_REASONS)[number];

export const RETURN_DISPUTE_REASONS = [
  'item_not_returned',
  'damaged_by_buyer',
  'tags_removed',
  'wrong_item_returned',
] as const;

export const SHOP_CATEGORIES = [
  'Kurtas',
  'Sarees',
  'Dupattas',
  'Shirts',
  'Denim',
  'Jackets',
  'Dresses',
  'Ethnic sets',
] as const;

export const SAMPLE_VISIT_SLOTS = [
  'tomorrow-10',
  'tomorrow-14',
  'tomorrow-17',
  'day-after-11',
] as const;

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free'] as const;

/** AUTH-04: JPG and PNG only, maximum 5 MB. */
export const OWNER_ID_MAX_BYTES = 5 * 1024 * 1024;
export const OWNER_ID_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;

export function ownerIdError(file: { type: string; size: number }): string | null {
  if (!(OWNER_ID_TYPES as readonly string[]).includes(file.type)) return 'type';
  if (file.size > OWNER_ID_MAX_BYTES) return 'size';
  return null;
}

/** SHOP-01: the six interactions of the happy path, counted by the step script. */
export const LISTING_HAPPY_PATH_STEPS = [
  'capture_photo',
  'review_suggestions',
  'choose_colour_and_fabric',
  'add_sizes_and_quantities',
  'set_price',
  'save_listing',
] as const;

export const LISTING_STEP_LIMIT = 8;

/** Mock photo analysis maps common garment names to editable suggestions. */
export function analyzePhotoName(name: string): {
  category: string;
  colour: string;
  fabric: string;
} {
  const value = name.toLowerCase();
  if (value.includes('kurta')) return { category: 'Kurtas', colour: 'Ivory', fabric: 'Cotton' };
  if (value.includes('saree')) return { category: 'Sarees', colour: 'Rose', fabric: 'Georgette' };
  if (value.includes('shirt')) return { category: 'Shirts', colour: 'Blue', fabric: 'Linen' };
  if (value.includes('jacket') || value.includes('denim'))
    return { category: 'Jackets', colour: 'Indigo', fabric: 'Denim' };
  if (value.includes('dress')) return { category: 'Dresses', colour: 'Sage', fabric: 'Cotton' };
  return { category: 'Kurtas', colour: 'Ivory', fabric: 'Cotton' };
}
