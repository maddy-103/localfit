import { httpShopApi } from './httpShopApi';
import { httpRiderApi } from './httpRiderApi';
import { httpAdminApi } from './httpAdminApi';
import type {
  Address,
  Api,
  Bag,
  CheckoutView,
  Order,
  OtpResult,
  PaymentMethodToken,
  PlaceCheckoutInput,
  PlaceCheckoutResult,
  SaveAddressInput,
} from './types';

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

/**
 * HTTP implementation. Screens never import this file; they use `api`.
 * A future backend only has to match these endpoints.
 */
export const httpApi: Api = {
  listProducts(params) {
    const search = new URLSearchParams();
    if (params?.occasion) search.set('occasion', params.occasion);
    if (params?.q) search.set('q', params.q);
    if (params?.shopId) search.set('shopId', params.shopId);
    const query = search.toString();
    return request(`/products${query ? `?${query}` : ''}`);
  },
  getProduct(id) {
    return request(`/products/${encodeURIComponent(id)}`);
  },
  listShops() {
    return request('/shops');
  },
  getShop(id) {
    return request(`/shops/${encodeURIComponent(id)}`);
  },
  listBuyers() {
    return request('/buyers');
  },
  listRiders() {
    return request('/riders');
  },
  listAdmins() {
    return request('/admins');
  },
  listAddresses(buyerId) {
    const query = buyerId ? `?buyerId=${encodeURIComponent(buyerId)}` : '';
    return request(`/addresses${query}`);
  },
  saveAddress(input: SaveAddressInput) {
    const method = input.id ? 'PATCH' : 'POST';
    const path = input.id ? `/addresses/${encodeURIComponent(input.id)}` : '/addresses';
    return request<Address[]>(path, { method, body: JSON.stringify(input) });
  },
  listPaymentMethods() {
    return request<PaymentMethodToken[]>('/payment-methods');
  },
  getBag() {
    return request<Bag>('/bag');
  },
  getCheckout() {
    return request<CheckoutView>('/checkout');
  },
  addToBag(line) {
    return request<Bag>('/bag/lines', { method: 'POST', body: JSON.stringify(line) });
  },
  updateBagLine(id, patch) {
    return request<Bag>(`/bag/lines/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },
  removeBagLine(id) {
    return request<Bag>(`/bag/lines/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  placeCheckout(input: PlaceCheckoutInput) {
    return request<PlaceCheckoutResult>('/checkout', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  listOrders() {
    return request<Order[]>('/orders');
  },
  getOrder(id) {
    return request(`/orders/${encodeURIComponent(id)}`);
  },
  submitOtp(orderId, otp, actor) {
    return request<OtpResult>(`/orders/${encodeURIComponent(orderId)}/otp`, {
      method: 'POST',
      body: JSON.stringify({ otp, actor }),
    });
  },
  setTrialDecision(orderId, lineId, decision, actor) {
    return request<Order>(`/orders/${encodeURIComponent(orderId)}/decisions`, {
      method: 'PATCH',
      body: JSON.stringify({ lineId, decision, actor }),
    });
  },
  requestSizeSwap(orderId, input, actor) {
    return request<Order>(`/orders/${encodeURIComponent(orderId)}/swaps`, {
      method: 'POST',
      body: JSON.stringify({ ...input, actor }),
    });
  },
  lockTrial(orderId, actor, reason = 'buyer') {
    return request<Order>(`/orders/${encodeURIComponent(orderId)}/lock`, {
      method: 'POST',
      body: JSON.stringify({ actor, reason }),
    });
  },
  requestReturn(orderId, input, actor) {
    return request<Order>(`/orders/${encodeURIComponent(orderId)}/return`, {
      method: 'POST',
      body: JSON.stringify({ ...input, actor }),
    });
  },
  ...httpShopApi,
  ...httpRiderApi,
  ...httpAdminApi,

  subscribe(topic, callback) {
    if (typeof EventSource === 'undefined') return () => {};
    const source = new EventSource(`${baseUrl}/events?topic=${encodeURIComponent(topic)}`);
    const handler = (event: MessageEvent) => {
      try {
        callback(JSON.parse(event.data));
      } catch {
        callback(event.data);
      }
    };
    source.addEventListener(topic, handler as EventListener);
    return () => source.close();
  },
};
