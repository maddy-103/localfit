/** HTTP implementation of the admin half of Api. Mirrors mockAdminApi. */
import type { AdminApi } from './types';

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

const enc = (value: string) => encodeURIComponent(value);

export const httpAdminApi: AdminApi = {
  adminSsoAccounts: () => request('/admin/sso/accounts'),
  adminSignIn: (input) => post('/admin/sso/verify', input),

  adminReassignRider: (orderId, riderId, input) =>
    post(`/admin/orders/${enc(orderId)}/reassign`, { riderId, ...input }),
  adminCancelOrder: (orderId, input) => post(`/admin/orders/${enc(orderId)}/cancel`, input),
  adminOverrideOrder: (orderId, to, input) =>
    post(`/admin/orders/${enc(orderId)}/override`, { to, ...input }),

  adminListShopReviews: () => request('/admin/shops/reviews'),
  adminReviewShop: (shopId, outcome, input) =>
    post(`/admin/shops/${enc(shopId)}/${outcome}`, input),
  adminFlagProduct: (shopId, productId, flag, input) =>
    post(`/admin/shops/${enc(shopId)}/products/${enc(productId)}/flag`, { flag, ...input }),

  adminListDisputes: () => request('/admin/disputes'),
  adminGetDispute: (id, actor) => post(`/admin/disputes/${enc(id)}/view`, { actor }),
  adminDecideDispute: (id, decision, input) =>
    post(`/admin/disputes/${enc(id)}/decide`, { decision, ...input }),

  adminListRefunds: () => request('/admin/refunds'),
  adminResolveRefund: (id, outcome, input) => post(`/admin/refunds/${enc(id)}/${outcome}`, input),

  adminListPayouts: () => request('/admin/payouts'),
  adminRunSettlement: (input) => post('/admin/payouts/settle', input),
  adminHoldPayout: (id, input) => post(`/admin/payouts/${enc(id)}/hold`, input),
  adminReconcilePayout: (id, input) => post(`/admin/payouts/${enc(id)}/reconcile`, input),

  adminListRiderReviews: () => request('/admin/riders/reviews'),
  adminReviewRider: (riderId, outcome, input) =>
    post(`/admin/riders/${enc(riderId)}/${outcome}`, input),
  adminSetRiderZone: (riderId, zone, available, input) =>
    post(`/admin/riders/${enc(riderId)}/zone`, { zone, available, ...input }),

  adminListRisk: () => request('/admin/risk'),
  adminSetRiskLimit: (id, limit, input) =>
    request(`/admin/risk/${enc(id)}/limit`, {
      method: 'PUT',
      body: JSON.stringify({ codLimitPaise: limit, ...input }),
    }),
  adminBlockRisk: (id, blocked, input) =>
    request(`/admin/risk/${enc(id)}/block`, {
      method: 'PUT',
      body: JSON.stringify({ blocked, ...input }),
    }),

  adminGetConfig: () => request('/admin/config'),
  adminListConfigHistory: () => request('/admin/config/history'),
  adminUpdateConfig: (patch, input) =>
    request('/admin/config', { method: 'PATCH', body: JSON.stringify({ patch, ...input }) }),

  adminListStaff: () => request('/admin/staff'),
  adminCreateStaff: (input) => post('/admin/staff', input),
  adminApproveStaff: (id, actor) => post(`/admin/staff/${enc(id)}/approve`, { actor }),
  adminRevokeStaff: (id, input) => post(`/admin/staff/${enc(id)}/revoke`, input),

  adminListAudit: () => request('/admin/audit'),
};
