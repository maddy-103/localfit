/** Admin-facing half of the mock Api. Wired into mockApi by mock.ts. */
import type { AdminApi } from './types';
import { respond } from './mockStore';
import {
  adminGetConfig,
  adminListAudit,
  adminListConfigHistory,
  adminListStaff,
  adminCreateStaff,
  adminRevokeStaff,
  adminSignIn,
  adminSsoAccounts,
  adminUpdateConfig,
} from './mockAdminSetup';
import {
  adminDecideDispute,
  adminGetDispute,
  adminHoldPayout,
  adminListDisputes,
  adminListPayouts,
  adminListRefunds,
  adminReconcilePayout,
  adminResolveRefund,
  adminRunSettlement,
} from './mockAdminOps';
import {
  adminCancelOrder,
  adminFlagProduct,
  adminListRisk,
  adminListRiderReviews,
  adminListShopReviews,
  adminOverrideOrder,
  adminReassignRider,
  adminReviewRider,
  adminReviewShop,
  adminBlockRisk,
  adminSetRiskLimit,
  adminSetRiderZone,
} from './mockAdminReview';

export const mockAdminApi: AdminApi = {
  adminSsoAccounts: () => respond(() => adminSsoAccounts()),
  adminSignIn: (input) => respond(() => adminSignIn(input)),

  adminReassignRider: (orderId, riderId, input) =>
    respond(() => adminReassignRider(orderId, riderId, input)),
  adminCancelOrder: (orderId, input) => respond(() => adminCancelOrder(orderId, input)),
  adminOverrideOrder: (orderId, to, input) => respond(() => adminOverrideOrder(orderId, to, input)),

  adminListShopReviews: () => respond(() => adminListShopReviews()),
  adminReviewShop: (shopId, outcome, input) => respond(() => adminReviewShop(shopId, outcome, input)),
  adminFlagProduct: (shopId, productId, flag, input) =>
    respond(() => adminFlagProduct(shopId, productId, flag, input)),

  adminListDisputes: () => respond(() => adminListDisputes()),
  adminGetDispute: (id, actor) => respond(() => adminGetDispute(id, actor)),
  adminDecideDispute: (id, decision, input) => respond(() => adminDecideDispute(id, decision, input)),

  adminListRefunds: () => respond(() => adminListRefunds()),
  adminResolveRefund: (id, outcome, input) => respond(() => adminResolveRefund(id, outcome, input)),

  adminListPayouts: () => respond(() => adminListPayouts()),
  adminRunSettlement: (input) => respond(() => adminRunSettlement(input)),
  adminHoldPayout: (id, input) => respond(() => adminHoldPayout(id, input)),
  adminReconcilePayout: (id, input) => respond(() => adminReconcilePayout(id, input)),

  adminListRiderReviews: () => respond(() => adminListRiderReviews()),
  adminReviewRider: (riderId, outcome, input) =>
    respond(() => adminReviewRider(riderId, outcome, input)),
  adminSetRiderZone: (riderId, zone, available, input) =>
    respond(() => adminSetRiderZone(riderId, zone, available, input)),

  adminListRisk: () => respond(() => adminListRisk()),
  adminSetRiskLimit: (id, limit, input) => respond(() => adminSetRiskLimit(id, limit, input)),
  adminBlockRisk: (id, blocked, input) => respond(() => adminBlockRisk(id, blocked, input)),

  adminGetConfig: () => respond(() => adminGetConfig()),
  adminListConfigHistory: () => respond(() => adminListConfigHistory()),
  adminUpdateConfig: (patch, input) => respond(() => adminUpdateConfig(patch, input)),

  adminListStaff: () => respond(() => adminListStaff()),
  adminCreateStaff: (input) => respond(() => adminCreateStaff(input)),
  adminRevokeStaff: (id, input) => respond(() => adminRevokeStaff(id, input)),

  adminListAudit: () => respond(() => adminListAudit()),
};
