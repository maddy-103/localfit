/** Seed data for the admin queues. Kept separate so mockStore stays readable. */
import { DEFAULT_ADMIN_CONFIG } from '@/domain/admin';
import { admins, buyers, riders, shops } from './seed';
import type {
  AdminConfig,
  ConfigChange,
  DisputeCase,
  PayoutCase,
  RefundCase,
  RiskEntry,
  RiderReview,
  ShopReview,
  StaffMember,
} from './types';

const AT = '2026-11-16T09:00:00.000Z';

export const seedShopReviews = (): ShopReview[] =>
  shops.map((shop, index) => ({
    id: `review-${shop.id}`,
    shopId: shop.id,
    shopName: shop.name,
    ownerName: index === 1 ? 'Riya Sharma' : `${shop.name} owner`,
    hasGst: index !== 2,
    gstNumber: index === 2 ? undefined : `29AABCU${9600 + index}K1Z${index}`,
    ownerIdVerified: index !== 2,
    sampleVisitNotes:
      index === 0
        ? 'Shopfront and stock room inspected; staff present, labels in place.'
        : index === 1
          ? 'Visit scheduled for Tuesday; owner sent shopfront photos.'
          : 'Awaiting sample visit; identity document is blurred.',
    productChecks:
      index === 0
        ? ['Brand tags match invoice', 'Size labels consistent', 'No counterfeit stitching found']
        : ['Invoice pending', 'Photo check pending'],
    authenticityFlags: index === 1 ? ['Similar stitching reported by a buyer'] : [],
    status: index === 0 ? 'approved' : index === 2 ? 'pending' : 'pending',
    updatedAt: AT,
  }));

export const seedRiderReviews = (): RiderReview[] =>
  riders.map((rider, index) => ({
    id: `rider-review-${rider.id}`,
    riderId: rider.id,
    name: rider.name,
    zone: rider.zone,
    available: index !== 2,
    verified: rider.status === 'approved',
    rating: rider.rating,
    incidents: index === 1 ? 1 : 0,
    penalties: index === 1 ? 1 : 0,
    status: rider.status === 'approved' ? 'approved' : 'pending',
  }));

export const seedRiskEntries = (): RiskEntry[] => [
  ...buyers.map((buyer, index) => ({
    id: `risk-${buyer.id}`,
    kind: 'account' as const,
    label: buyer.name,
    score: buyer.riskScore,
    orderValuePaise: index === 0 ? 249_900 : 89_900,
    completedOrders: buyer.completedOrders,
    codLimitPaise: index === 0 ? 300_000 : 150_000,
    blocked: false,
  })),
  {
    id: 'risk-addr-pg',
    kind: 'address',
    label: 'PG block, 12th Main, Indiranagar',
    score: 78,
    orderValuePaise: 412_000,
    completedOrders: 3,
    codLimitPaise: 0,
    blocked: true,
  },
];

export const seedDisputes = (): DisputeCase[] => [
  {
    id: 'dispute-1',
    orderId: 'order-1',
    shopId: shops[0]?.id ?? 'shop-kiran',
    buyerId: buyers[0]?.id ?? 'buyer-ananya',
    openedAt: AT,
    valuePaise: 249_900,
    reason: 'Stitching defect reported after the trial window closed.',
    status: 'open',
    evidence: {
      photos: [
        {
          url: null,
          alt: 'Buyer photo of the stitching defect',
          tone: 'rose',
          width: 640,
          height: 480,
        },
      ],
      gps: { lat: 12.9784, lng: 77.6408 },
      otpAttempts: 1,
      checkedAt: AT,
      events: [],
    },
  },
  {
    id: 'dispute-2',
    orderId: 'order-2',
    shopId: shops[1]?.id ?? 'shop-meera',
    buyerId: buyers[0]?.id ?? 'buyer-ananya',
    openedAt: '2026-11-16T07:30:00.000Z',
    valuePaise: 89_900,
    reason: 'Shop disputes the return; item arrived with tags removed.',
    status: 'open',
    evidence: {
      photos: [],
      gps: { lat: 12.9352, lng: 77.6245 },
      otpAttempts: 0,
      checkedAt: '2026-11-16T07:30:00.000Z',
      events: [],
    },
  },
];

export const seedRefunds = (): RefundCase[] => [
  {
    id: 'refund-1',
    orderId: 'order-1',
    buyerName: buyers[0]?.name ?? 'Ananya Rao',
    amountPaise: 249_900,
    reason: 'Returned item not accepted by the shop.',
    status: 'pending',
    createdAt: AT,
  },
];

export const seedPayouts = (): PayoutCase[] =>
  shops.slice(0, 2).map((shop, index) => ({
    id: `payout-${shop.id}`,
    shopId: shop.id,
    shopName: shop.name,
    amountPaise: index === 0 ? 1_240_000 : 860_000,
    period: 'Week 47 · 2026',
    status: index === 0 ? 'ready' : 'held',
    createdAt: AT,
    note: index === 1 ? 'Held for an open dispute.' : undefined,
  }));

export const seedStaff = (): StaffMember[] =>
  admins.map((admin) => ({
    id: admin.id,
    name: admin.name,
    phone: admin.phone,
    adminRole: admin.role,
    status: 'active' as const,
    createdBy: admin.createdBy,
    createdAt: AT,
    updatedAt: AT,
  }));

export const seedAdminConfig = (): AdminConfig => ({ ...DEFAULT_ADMIN_CONFIG });

export const seedConfigHistory = (): ConfigChange[] => [];
