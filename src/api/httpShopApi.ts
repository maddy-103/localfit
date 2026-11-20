/** HTTP implementation of the shop half of Api. Mirrors mockShopApi routes. */
import type { ShopApi } from './types';

const baseUrl = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `Request failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

const post = <T,>(path: string, body: unknown = {}) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const httpShopApi: ShopApi = {
  getShopRegistration: () => request('/shop/registration'),
  saveShopRegistration: (input) => post('/shop/registration', input),
  setShopRegistrationStage: (stage, note) =>
    request('/shop/registration/stage', {
      method: 'PATCH',
      body: JSON.stringify({ stage, note }),
    }),

  analyzeListingPhoto: (name) => post('/shop/listings/analyze', { name }),
  listListingDrafts: () => request('/shop/listings/drafts'),
  saveListingDraft: (input) => post('/shop/listings/drafts', input),
  publishListingDraft: (id) => post(`/shop/listings/drafts/${encodeURIComponent(id)}/publish`),
  deleteListingDraft: (id) =>
    request(`/shop/listings/drafts/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  syncQueuedListings: () => post('/shop/listings/drafts/sync'),

  listShopProducts: (shopId) =>
    request(`/shop/inventory${shopId ? `?shopId=${encodeURIComponent(shopId)}` : ''}`),
  sellInShop: (productId, variantId, qty) =>
    post(`/shop/inventory/${encodeURIComponent(productId)}/${encodeURIComponent(variantId)}/sell`, { qty }),
  updateVariant: (productId, variantId, patch) =>
    request(`/shop/inventory/${encodeURIComponent(productId)}/${encodeURIComponent(variantId)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  listConflicts: () => request('/shop/conflicts'),

  listShopOrders: (shopId) =>
    request(`/shop/orders${shopId ? `?shopId=${encodeURIComponent(shopId)}` : ''}`),
  acceptOrder: (orderId, actor) => post(`/shop/orders/${encodeURIComponent(orderId)}/accept`, { actor }),
  declineOrder: (orderId, reason, actor) =>
    post(`/shop/orders/${encodeURIComponent(orderId)}/decline`, { reason, actor }),
  packOrder: (orderId, actor) => post(`/shop/orders/${encodeURIComponent(orderId)}/pack`, { actor }),
  readyOrder: (orderId, actor) => post(`/shop/orders/${encodeURIComponent(orderId)}/ready`, { actor }),
  handoverOrder: (orderId, input, actor) =>
    post(`/shop/orders/${encodeURIComponent(orderId)}/handover`, { ...input, actor }),
  markInTransit: (orderId, actor) =>
    post(`/shop/orders/${encodeURIComponent(orderId)}/transit`, { actor }),
  releaseExpiredOrders: (atMs) =>
    post('/shop/orders/release-expired', atMs === undefined ? {} : { atMs }),
  getShopSummary: (shopId) =>
    request(`/shop/summary${shopId ? `?shopId=${encodeURIComponent(shopId)}` : ''}`),

  listReturnOrders: (shopId) =>
    request(`/shop/returns${shopId ? `?shopId=${encodeURIComponent(shopId)}` : ''}`),
  inspectReturn: (orderId, input, actor) =>
    post(`/shop/returns/${encodeURIComponent(orderId)}/inspect`, { ...input, actor }),
  getSettlementReport: (shopId) =>
    request(`/shop/payouts${shopId ? `?shopId=${encodeURIComponent(shopId)}` : ''}`),
  getShopSettings: (shopId) =>
    request(`/shop/settings${shopId ? `?shopId=${encodeURIComponent(shopId)}` : ''}`),
  saveShopSettings: (input) =>
    request('/shop/settings', { method: 'PUT', body: JSON.stringify(input) }),
};
