/** Registration, Snap & List drafts and shop settings for the mock API. */
import { nowIso } from '@/lib/clock';
import { analyzePhotoName, ownerIdError } from '@/domain/shop';
import type {
  ConflictRecord,
  Image,
  ListingDraft,
  ListingSuggestion,
  Product,
  RegistrationStage,
  SaveListingDraftInput,
  SaveShopRegistrationInput,
  SaveShopSettingsInput,
  ShopRegistration,
  ShopSettings,
} from './types';
import {
  defaultShopSettings,
  getState,
  notify,
  setState,
  uid,
} from './mockStore';

const online = (): boolean => typeof navigator === 'undefined' || navigator.onLine;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const shopIdOf = (): string =>
  getState().registration?.shopId ?? defaultShopSettings().shopId;

function put<K extends 'registration' | 'drafts' | 'settings' | 'conflicts'>(
  key: K,
  value: MockValue<K>,
  topic: string,
): void {
  setState({ ...getState(), [key]: value });
  notify(topic, value);
}

type MockValue<K> = K extends 'registration'
  ? ShopRegistration | null
  : K extends 'drafts'
    ? ListingDraft[]
    : K extends 'settings'
      ? ShopSettings
      : ConflictRecord[];

/* --------------------------- Registration ---------------------------- */

export function readRegistration(): ShopRegistration | null {
  const registration = getState().registration;
  return registration ? clone(registration) : null;
}

export function writeRegistration(input: SaveShopRegistrationInput): ShopRegistration {
  if (input.hasGst && !input.gstNumber?.trim()) {
    throw new Error('Enter your GST number or turn off the GST toggle.');
  }
  if (!input.ownerName.trim() || !input.shopName.trim()) {
    throw new Error('Enter the shop and owner names.');
  }
  if (input.ownerId) {
    const error = ownerIdError(input.ownerId);
    if (error === 'type') throw new Error('Owner ID must be a JPG, PNG or PDF.');
    if (error === 'size') throw new Error('Owner ID must be 5 MB or smaller.');
  }

  const previous = getState().registration;
  const correction = previous?.stage === 'correction_needed';
  const registration: ShopRegistration = {
    ...clone(input),
    shopId: previous?.shopId ?? shopIdOf(),
    stage: correction ? 'submitted' : (previous?.stage ?? 'submitted'),
    submittedAt: correction ? previous?.submittedAt : nowIso(),
    updatedAt: nowIso(),
  };
  put('registration', registration, 'registration');
  return registration;
}

export function setRegistrationStage(
  stage: RegistrationStage,
  note?: string,
): ShopRegistration {
  const previous = getState().registration ?? writeRegistration({
    shopName: 'New shop',
    ownerName: 'Shop owner',
    phone: '',
    hasGst: false,
    gstNumber: null,
    ownerId: null,
    bank: { accountMasked: '', ifsc: '', holder: '' },
    taxDetails: '',
    categories: [],
    sampleVisitSlot: 'tomorrow-10',
  });
  const registration: ShopRegistration = {
    ...previous,
    stage,
    ...(note ? { note } : {}),
    updatedAt: nowIso(),
  };
  put('registration', registration, 'registration');
  return registration;
}

/* ------------------------- Snap & List drafts ------------------------- */

export function analyzePhoto(name: string): ListingSuggestion {
  return analyzePhotoName(name);
}

export function listDrafts(): ListingDraft[] {
  return clone(getState().drafts);
}

function productFromDraft(draft: ListingDraft): Product {
  const variants = draft.sizes
    .filter((entry) => entry.qty > 0)
    .map((entry) => ({
      id: `${draft.id}-${entry.size.toLowerCase().replace(/\s+/g, '-')}`,
      size: entry.size,
      colour: draft.colour,
      colourHex: '#d8d3c8',
      quantity: entry.qty,
      reservedQuantity: 0,
      pricePaise: draft.pricePaise,
      mrpPaise: draft.pricePaise,
    }));
  const image: Image = {
    url: draft.photo?.dataUrl ?? null,
    alt: draft.title,
    tone: 'sand',
    width: 800,
    height: 800,
  };
  return {
    id: draft.id,
    shopId: draft.shopId,
    title: draft.title,
    description: `${draft.fabric} ${draft.category}. Listed by the shop.`,
    category: draft.category,
    occasions: [],
    images: [image],
    rating: 0,
    reviewCount: 0,
    stockLeft: variants.reduce((sum, variant) => sum + variant.quantity, 0),
    stockCheckedAt: nowIso(),
    tryAtDoorEligible: false,
    fitTags: [],
    sizeGuide: [],
    variants,
    authenticityVerified: false,
  };
}

function publishNow(draft: ListingDraft): ListingDraft {
  const state = getState();
  const published: ListingDraft = {
    ...draft,
    status: 'published',
    updatedAt: nowIso(),
    publishedAt: nowIso(),
  };
  setState({
    ...state,
    drafts: state.drafts.map((entry) => (entry.id === draft.id ? published : entry)),
    publishedProducts: [
      productFromDraft(published),
      ...state.publishedProducts.filter((entry) => entry.id !== draft.id),
    ],
  });
  notify('drafts', getState().drafts);
  notify('inventory', getState().publishedProducts);
  return published;
}

export function saveDraft(input: SaveListingDraftInput): ListingDraft {
  if (!input.title.trim()) throw new Error('Give the item a name.');
  if (input.pricePaise <= 0) throw new Error('Enter a price.');
  if (!input.sizes.some((entry) => entry.qty > 0)) {
    throw new Error('Add a quantity for at least one size.');
  }

  const state = getState();
  const previous = input.id ? state.drafts.find((entry) => entry.id === input.id) : undefined;
  const at = nowIso();
  const draft: ListingDraft = {
    ...clone(input),
    id: previous?.id ?? input.id ?? uid('draft'),
    shopId: previous?.shopId ?? shopIdOf(),
    status: previous?.status === 'published' ? 'draft' : (previous?.status ?? 'draft'),
    createdAt: previous?.createdAt ?? at,
    updatedAt: at,
    ...(previous?.publishedAt ? { publishedAt: previous.publishedAt } : {}),
  };
  const drafts = previous
    ? state.drafts.map((entry) => (entry.id === draft.id ? draft : entry))
    : [draft, ...state.drafts];
  put('drafts', drafts, 'drafts');
  return draft;
}

export function publishDraft(id: string): ListingDraft {
  const draft = getState().drafts.find((entry) => entry.id === id);
  if (!draft) throw new Error('That draft no longer exists.');
  if (!online()) {
    const queued: ListingDraft = { ...draft, status: 'queued', updatedAt: nowIso() };
    put(
      'drafts',
      getState().drafts.map((entry) => (entry.id === id ? queued : entry)),
      'drafts',
    );
    return queued;
  }
  return publishNow(draft);
}

export function deleteDraft(id: string): void {
  const state = getState();
  setState({
    ...state,
    drafts: state.drafts.filter((entry) => entry.id !== id),
    publishedProducts: state.publishedProducts.filter((entry) => entry.id !== id),
  });
  notify('drafts', getState().drafts);
  notify('inventory', allPublished());
}

function allPublished() {
  return getState().publishedProducts;
}

export function syncQueuedDrafts(): ListingDraft[] {
  if (!online()) return listDrafts().filter((entry) => entry.status === 'queued');
  const queued = getState().drafts.filter((entry) => entry.status === 'queued');
  return queued.map((entry) => publishNow(entry));
}

/* ------------------------------ Settings ----------------------------- */

export function readSettings(): ShopSettings {
  return clone(getState().settings);
}

export function writeSettings(input: SaveShopSettingsInput): ShopSettings {
  if (input.serviceRadiusKm < 1 || input.serviceRadiusKm > 30) {
    throw new Error('Service radius must be between 1 and 30 km.');
  }
  if (!input.hours.trim()) throw new Error('Enter the service hours.');
  const settings: ShopSettings = { ...clone(input), shopId: shopIdOf() };
  put('settings', settings, 'settings');
  return settings;
}
