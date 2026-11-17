import type { OrderActor, OrderEvent, OrderKind, OrderState } from '@/domain/orderMachine';
import type { PaymentAuthorization, PaymentMethod } from '@/domain/payments';
import type { TrialDecision } from '@/domain/trial';

/** Every image in the API has this shape; url stays null until a shop uploads. */
export type ImageTone = 'sand' | 'rose' | 'sage' | 'sky' | 'lilac' | 'grey';

export interface Image {
  url: string | null;
  alt: string;
  tone: ImageTone;
  width: number;
  height: number;
  /** Optional real responsive candidates from the backend. */
  srcSet?: string;
}

export interface Shop {
  id: string;
  name: string;
  area: string;
  city: string;
  phone: string;
  distanceKm: number;
  /** Shop coordinates power the delivery-radius check at checkout. */
  lat: number;
  lng: number;
  etaMin: [number, number];
  rating: number;
  reviewCount: number;
  verified: boolean;
  tryAtDoor: boolean;
  serviceRadiusKm: number;
  hours: string;
  categories: string[];
  image: Image;
}

export interface SizeGuideRow {
  size: string;
  chestCm?: number;
  waistCm?: number;
  lengthCm?: number;
}

export interface Variant {
  id: string;
  size: string;
  colour: string;
  colourHex: string;
  quantity: number;
  reservedQuantity: number;
  pricePaise: number;
  mrpPaise: number;
}

export interface Product {
  id: string;
  shopId: string;
  title: string;
  description: string;
  category: string;
  occasions: string[];
  images: Image[];
  rating: number;
  reviewCount: number;
  stockLeft: number;
  stockCheckedAt: string;
  tryAtDoorEligible: boolean;
  fitTags: string[];
  sizeGuide: SizeGuideRow[];
  variants: Variant[];
  authenticityVerified: boolean;
}

export interface Buyer {
  id: string;
  name: string;
  phone: string;
  city: string;
  completedOrders: number;
  completedPrepaidOrders: number;
  joinedAt: string;
  riskScore: number;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: 'approved' | 'pending' | 'suspended';
  rating: number;
  trips: number;
  zone: string;
  joinedAt: string;
}

export type AdminRole =
  | 'support_agent'
  | 'verifier'
  | 'finance'
  | 'dispute_lead'
  | 'super_admin';

export interface AdminUser {
  id: string;
  name: string;
  phone: string;
  role: AdminRole;
  permissions: string[];
}

export interface Address {
  id: string;
  buyerId: string;
  label: string;
  line1: string;
  area: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
}

export interface BagLine {
  id: string;
  productId: string;
  variantId: string;
  qty: number;
  tryAtDoor: boolean;
  heldUntil: string;
}

export interface Bag {
  lines: BagLine[];
  reservedUntil: string | null;
}

export interface OrderLine {
  id: string;
  productId: string;
  variantId: string;
  qty: number;
  pricePaise: number;
  decision: 'keep' | 'return' | 'pending' | null;
}

export interface SwapRequest {
  id: string;
  orderId: string;
  lineId: string;
  fromVariantId: string;
  toVariantId: string;
  status: 'requested' | 'confirmed';
  createdAt: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  reason: string;
  note?: string;
  photoIds: string[];
  pickupSlot: string;
  createdAt: string;
}

export interface OrderRider {
  id: string;
  name: string;
  phone: string;
}

export interface RiderLocation {
  lat: number;
  lng: number;
  updatedAt: string;
}

/** The authorization plus the amount refunded or released at decisions lock. */
export interface OrderPayment extends PaymentAuthorization {
  refundPaise: number;
}

export interface Order {
  id: string;
  checkoutId: string;
  buyerId: string;
  shopId: string;
  kind: OrderKind;
  state: OrderState;
  lines: OrderLine[];
  /** Item total before the delivery fee. */
  itemsPaise: number;
  deliveryFeePaise: number;
  totalPaise: number;
  etaMin: [number, number];
  paymentMethod: PaymentMethod;
  payment: OrderPayment;
  createdAt: string;
  events: OrderEvent[];
  /** Stored when the buyer's OTP starts the trial (TRIAL-01/02). */
  trialStartedAt?: string;
  trialEndsAt?: string;
  lockedAt?: string;
  /** Kept internal; only exposed as handoverOtp once the rider has arrived. */
  otp?: string;
  handoverOtp?: string;
  otpAttempts: number;
  rider?: OrderRider;
  riderLocation?: RiderLocation;
  /** 0 at pickup, 1 at the door; added by the API. */
  riderProgress?: number;
  /** Countdown target for live tracking; added by the API. */
  etaEndsAt?: string;
  swapRequests: SwapRequest[];
  returnRequest?: ReturnRequest;
}

export interface PlaceCheckoutInput {
  paymentMethod: Order['paymentMethod'];
  addressId?: string;
}

export interface PlaceCheckoutResult {
  checkoutId: string;
  orders: Order[];
}

export interface OtpResult {
  ok: boolean;
  attempts: number;
  supportRequired: boolean;
  order: Order;
}

export interface SizeSwapInput {
  lineId: string;
  variantId: string;
}

export interface ReturnRequestInput {
  reason: string;
  note?: string;
  photoIds: string[];
  pickupSlot: string;
}

export interface Api {
  listProducts(params?: { occasion?: string; q?: string; shopId?: string }): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  listShops(): Promise<Shop[]>;
  getShop(id: string): Promise<Shop | null>;
  listBuyers(): Promise<Buyer[]>;
  listRiders(): Promise<Rider[]>;
  listAdmins(): Promise<AdminUser[]>;
  listAddresses(buyerId?: string): Promise<Address[]>;
  getBag(): Promise<Bag>;
  addToBag(line: Omit<BagLine, 'id' | 'heldUntil'>): Promise<Bag>;
  updateBagLine(id: string, patch: Partial<Pick<BagLine, 'qty' | 'tryAtDoor'>>): Promise<Bag>;
  removeBagLine(id: string): Promise<Bag>;
  placeCheckout(input: PlaceCheckoutInput): Promise<PlaceCheckoutResult>;
  listOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  /** Rider enters the buyer's 4-digit handover code (BUY-09, RIDE-03). */
  submitOtp(orderId: string, otp: string, actor: OrderActor): Promise<OtpResult>;
  /** Buyer marks one line keep or return. Never locks the trial (BUY-10). */
  setTrialDecision(
    orderId: string,
    lineId: string,
    decision: TrialDecision,
    actor: OrderActor,
  ): Promise<Order>;
  /** Creates a pending request; decisions are untouched until confirmation. */
  requestSizeSwap(orderId: string, input: SizeSwapInput, actor: OrderActor): Promise<Order>;
  /** Buyer confirmation or timer expiry: pending lines default to return. */
  lockTrial(orderId: string, actor: OrderActor, reason?: 'buyer' | 'timer'): Promise<Order>;
  requestReturn(
    orderId: string,
    input: ReturnRequestInput,
    actor: OrderActor,
  ): Promise<Order>;
  subscribe(topic: string, callback: (data: unknown) => void): () => void;
}
