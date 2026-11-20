/** Shop-facing half of the mock Api. Wired into mockApi by mock.ts. */
import type { ShopApi } from './types';
import { respond } from './mockStore';
import {
  analyzePhoto,
  listDrafts,
  publishDraft,
  readRegistration,
  readSettings,
  saveDraft,
  deleteDraft,
  setRegistrationStage,
  syncQueuedDrafts,
  writeRegistration,
  writeSettings,
} from './mockShopSetup';
import {
  acceptOrder,
  declineOrder,
  handoverOrder,
  listConflicts,
  markInTransit,
  packOrder,
  readyOrder,
  sellInShop,
  shopOrders,
  shopProducts,
  updateVariant,
} from './mockShopOps';
import {
  inspectReturn,
  releaseExpiredOrders,
  returnOrders,
  settlementReport,
  shopSummary,
} from './mockShopReports';

export const mockShopApi: ShopApi = {
  getShopRegistration: () => respond(() => readRegistration()),
  saveShopRegistration: (input) => respond(() => writeRegistration(input)),
  setShopRegistrationStage: (stage, note) =>
    respond(() => setRegistrationStage(stage, note)),

  analyzeListingPhoto: (name) => respond(() => analyzePhoto(name)),
  listListingDrafts: () => respond(() => listDrafts()),
  saveListingDraft: (input) => respond(() => saveDraft(input)),
  publishListingDraft: (id) => respond(() => publishDraft(id)),
  deleteListingDraft: (id) => respond(() => deleteDraft(id)),
  syncQueuedListings: () => respond(() => syncQueuedDrafts()),

  listShopProducts: (shopId) => respond(() => shopProducts(shopId)),
  sellInShop: (productId, variantId, qty) =>
    respond(() => sellInShop(productId, variantId, qty)),
  updateVariant: (productId, variantId, patch) =>
    respond(() => updateVariant(productId, variantId, patch)),
  listConflicts: () => respond(() => listConflicts()),

  listShopOrders: (shopId) => respond(() => shopOrders(shopId)),
  acceptOrder: (orderId, actor) => respond(() => acceptOrder(orderId, actor)),
  declineOrder: (orderId, reason, actor) =>
    respond(() => declineOrder(orderId, reason, actor)),
  packOrder: (orderId, actor) => respond(() => packOrder(orderId, actor)),
  readyOrder: (orderId, actor) => respond(() => readyOrder(orderId, actor)),
  handoverOrder: (orderId, input, actor) =>
    respond(() => handoverOrder(orderId, input, actor)),
  markInTransit: (orderId, actor) => respond(() => markInTransit(orderId, actor)),
  releaseExpiredOrders: (atMs) => respond(() => releaseExpiredOrders(atMs)),
  getShopSummary: (shopId) => respond(() => shopSummary(shopId)),

  listReturnOrders: (shopId) => respond(() => returnOrders(shopId)),
  inspectReturn: (orderId, input, actor) =>
    respond(() => inspectReturn(orderId, input, actor)),
  getSettlementReport: (shopId) => respond(() => settlementReport(shopId)),
  getShopSettings: (shopId) => respond(() => {
    const settings = readSettings();
    return shopId ? { ...settings, shopId } : settings;
  }),
  saveShopSettings: (input) => respond(() => writeSettings(input)),
};
