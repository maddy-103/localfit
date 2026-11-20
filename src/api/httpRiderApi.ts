/** HTTP implementation of the rider half of Api. Mirrors mockRiderApi. */
import type { RiderApi } from './types';

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

const orderPath = (id: string) => `/rider/tasks/${encodeURIComponent(id)}`;

export const httpRiderApi: RiderApi = {
  getRiderRegistration: () => request('/rider/registration'),
  saveRiderRegistration: (input) => post('/rider/registration', input),
  matchRiderSelfie: (name) => post('/rider/selfie/match', { name }),
  setRiderRegistrationStatus: (status, note) =>
    request('/rider/registration/status', {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),
  getRiderPresence: () => request('/rider/presence'),
  setRiderOnline: (online) =>
    request('/rider/presence', { method: 'PUT', body: JSON.stringify({ online }) }),
  getRiderConfig: () => request('/rider/config'),
  getRiderProfile: () => request('/rider/profile'),
  listRiderTasks: () => request('/rider/tasks'),
  getRiderTask: (id) => request(orderPath(id)),
  collectPickup: (orderId, input, actor) => post(`${orderPath(orderId)}/pickup`, { ...input, actor }),
  markArrived: (orderId, actor, gps) => post(`${orderPath(orderId)}/arrive`, { actor, gps }),
  getWaitingSession: (orderId) => request(`${orderPath(orderId)}/waiting`),
  claimCompensation: (orderId, actor) => post(`${orderPath(orderId)}/claim`, { actor }),
  recordHandoverPhoto: (orderId, photoId, actor) =>
    post(`${orderPath(orderId)}/photo`, { photoId, actor }),
  confirmRiderDecisions: (orderId, actor, note) =>
    post(`${orderPath(orderId)}/confirm`, { actor, note }),
  scanReturnedItems: (orderId, scanCodes, actor) =>
    post(`${orderPath(orderId)}/returns/scan`, { scanCodes, actor }),
  closeTrip: (orderId, actor, photoId) => post(`${orderPath(orderId)}/close`, { actor, photoId }),
  handOverReturnAtShop: (orderId, actor) => post(`${orderPath(orderId)}/returns/handover`, { actor }),
  getRiderEarnings: () => request('/rider/earnings'),
  sendSos: (input, actor) => post('/rider/sos', { ...input, actor }),
  queueRiderAction: (action) => post('/rider/queue', action),
  listQueuedRiderActions: () => request('/rider/queue'),
  markRiderActionSynced: (id) =>
    request(`/rider/queue/${encodeURIComponent(id)}/sync`, { method: 'POST' }),
};
