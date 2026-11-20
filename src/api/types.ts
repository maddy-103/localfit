import type { GpsPoint, OrderActor, OrderEvent, OrderKind, OrderState } from '@/domain/orderMachine';
import type { PaymentAuthorization, PaymentMethod } from '@/domain/payments';
import type { RiderEarnings, RiderTask, WaitingEvidence } from '@/domain/rider';
import type { SettlementReport } from '@/domain/settlements';
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
  /** Shop-console visibility; absent on legacy/buyer payloads means visible. */
  visible?: boolean;
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
  /** AUTH-06: only accounts created by a super admin may sign in. */
  createdBy: string;
}

/** The signed-in admin passed with every action; the mock checks its role. */
export interface AdminActor {
  id: string;
  name: string;
  adminRole: AdminRole;
}

export interface AdminActionInput {
  actor: AdminActor;
  reason: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  actor: AdminActor;
  timestamp: string;
  reason: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

export interface AdminConfig {
  serviceRadiusKm: number;
  commissionBps: number;
  trialWindowMs: number;
  reservationHoldMs: number;
  acceptTimeoutMs: number;
  compensationThresholdMs: number;
  codMinPrepaidOrders: number;
  codCapPaise: number;
  codCapUntilOrders: number;
  codTryAtDoorAllowed: boolean;
}

export interface ConfigChange extends AdminActionInput {
  id: string;
  timestamp: string;
  before: AdminConfig;
  after: AdminConfig;
}

export type StaffStatus = 'active' | 'pending_approval' | 'revoked';

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  adminRole: AdminRole;
  status: StaffStatus;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffInput extends AdminActionInput {
  name: string;
  phone: string;
  adminRole: AdminRole;
}

export interface AdminAccount {
  id: string;
  name: string;
  phone: string;
  adminRole: AdminRole;
  status: StaffStatus;
  createdBy: string;
}

export type DisputeDecision = 'buyer_favoured' | 'shop_favoured' | 'split';

/** NFR-10: this whole block is withheld from roles without evidence:view. */
export interface DisputeEvidence {
  photos: Image[];
  gps?: GpsPoint;
  otpAttempts: number;
  checkedAt: string;
  events: OrderEvent[];
}

export interface DisputeCase {
  id: string;
  orderId: string;
  shopId: string;
  buyerId: string;
  openedAt: string;
  valuePaise: number;
  reason: string;
  status: 'open' | 'escalated' | 'decided';
  escalatedAt?: string;
  escalatedTo?: string;
  decision?: DisputeDecision;
  decisionReason?: string;
  decidedAt?: string;
  evidence?: DisputeEvidence;
}

export interface RefundCase {
  id: string;
  orderId: string;
  buyerName: string;
  amountPaise: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  decidedAt?: string;
  decisionReason?: string;
}

export interface PayoutCase {
  id: string;
  shopId: string;
  shopName: string;
  amountPaise: number;
  period: string;
  status: 'ready' | 'held' | 'paid';
  createdAt: string;
  note?: string;
}

export interface ShopReview {
  id: string;
  shopId: string;
  shopName: string;
  ownerName: string;
  hasGst: boolean;
  gstNumber?: string;
  ownerIdVerified: boolean;
  sampleVisitNotes: string;
  productChecks: string[];
  authenticityFlags: string[];
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  updatedAt: string;
}

export interface RiderReview {
  id: string;
  riderId: string;
  name: string;
  zone: string;
  available: boolean;
  verified: boolean;
  rating: number;
  incidents: number;
  penalties: number;
  status: 'pending' | 'approved' | 'suspended';
}

export interface RiskEntry {
  id: string;
  kind: 'account' | 'address';
  label: string;
  score: number;
  orderValuePaise: number;
  completedOrders: number;
  codLimitPaise: number;
  blocked: boolean;
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
  isDefault?: boolean;
}

/** Gateway tokens only. No card number is ever returned by the platform. */
export interface PaymentMethodToken {
  id: string;
  brand: 'upi' | 'card' | 'wallet';
  label: string;
  token: string;
  isDefault: boolean;
}

export type SaveAddressInput = Omit<Address, 'id' | 'buyerId'> &
  Partial<Pick<Address, 'id' | 'buyerId'>>;

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
  /** Shop acceptance deadline (resolved ambiguity 3). */
  acceptsUntil?: string;
  /** Code the rider shows at pickup (SHOP-07). Hidden from buyer orders. */
  pickupOtp?: string;
  /** Rider handover and return evidence (RIDE-02, RIDE-03, RIDE-09). */
  handoverPhotoId?: string;
  returnedScanCodes?: string[];
  riderConfirmedAt?: string;
  swapRequests: SwapRequest[];
  returnRequest?: ReturnRequest;
}

export interface PlaceCheckoutInput {
  paymentMethod: Order['paymentMethod'];
  addressId?: string;
  /** The UI cannot submit until the terms have been shown and ticked (BUY-08). */
  termsAccepted?: boolean;
}

export interface PlaceCheckoutResult {
  checkoutId: string;
  orders: Order[];
  orderIds: string[];
}

/** One bag group per shop, with the ETA and totals shown before paying. */
export interface CheckoutGroup {
  shop: Shop;
  lines: BagLine[];
  products: Product[];
  kind: OrderKind;
  etaMin: [number, number];
  itemsPaise: number;
  deliveryFeePaise: number;
  totalPaise: number;
}

export interface CheckoutView {
  groups: CheckoutGroup[];
  addresses: Address[];
  buyer: Buyer | null;
  itemsPaise: number;
  deliveryFeePaise: number;
  totalPaise: number;
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

/* ------------------------------------------------------------------ */
/* Shop console (AUTH-04, SHOP-01 to SHOP-10)                          */
/* ------------------------------------------------------------------ */

export type RegistrationStage =
  | 'not_started'
  | 'submitted'
  | 'correction_needed'
  | 'sample_visit_scheduled'
  | 'approved'
  | 'rejected';

export interface ShopRegistration {
  shopId: string;
  shopName: string;
  ownerName: string;
  phone: string;
  hasGst: boolean;
  gstNumber: string | null;
  ownerId: { name: string; type: string; size: number } | null;
  bank: { accountMasked: string; ifsc: string; holder: string };
  taxDetails: string;
  categories: string[];
  sampleVisitSlot: string;
  stage: RegistrationStage;
  note?: string;
  submittedAt?: string;
  updatedAt: string;
}

export type SaveShopRegistrationInput = Omit<
  ShopRegistration,
  'shopId' | 'stage' | 'submittedAt' | 'updatedAt'
>;

export interface ListingSuggestion {
  category: string;
  colour: string;
  fabric: string;
}

export interface ListingDraft {
  id: string;
  shopId: string;
  title: string;
  photo: { dataUrl: string; name: string; mime: string } | null;
  suggestions: ListingSuggestion | null;
  category: string;
  colour: string;
  fabric: string;
  sizes: { size: string; qty: number }[];
  pricePaise: number;
  /** draft = saved, queued = waiting for connection, published = live. */
  status: 'draft' | 'queued' | 'published';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export type SaveListingDraftInput = Omit<
  ListingDraft,
  'id' | 'shopId' | 'status' | 'createdAt' | 'updatedAt' | 'publishedAt'
> &
  Partial<Pick<ListingDraft, 'id'>>;

export interface ConflictRecord {
  id: string;
  shopId: string;
  productId: string;
  variantId: string;
  note: string;
  orderId?: string;
  createdAt: string;
  resolved: boolean;
}

export interface ShopStaff {
  id: string;
  name: string;
  phone: string;
  role: 'manager' | 'packer' | 'accountant';
}

export interface ShopSettings {
  shopId: string;
  serviceRadiusKm: number;
  hours: string;
  bankAccountMasked: string;
  ifsc: string;
  taxId: string;
  staff: ShopStaff[];
}

export type SaveShopSettingsInput = Omit<ShopSettings, 'shopId'>;

export interface ShopSummary {
  awaiting: number;
  lowStock: number;
  conflicts: number;
  salesPaise: number;
  earningsPaise: number;
  returns: number;
}

export interface PickupInput {
  /** Rider's pickup code, scan code (variant id or SKU) and photo id. */
  pickupOtp: string;
  scanCode: string;
  photoId: string;
}

export interface ReturnInspectionInput {
  decision: 'accept' | 'dispute';
  reason?: string;
  photoIds: string[];
}

export interface CounterSaleResultApi {
  product: Product | null;
  conflict: ConflictRecord | null;
  releasedBagLines: string[];
}

/* ------------------------------------------------------------------ */
/* Rider console (AUTH-05, RIDE-01 to RIDE-09, NFR-04)                */
/* ------------------------------------------------------------------ */

export type RiderDocumentKind = 'idProof' | 'licence' | 'selfie';
export type RiderApprovalStatus = 'not_started' | 'submitted' | 'pending' | 'approved' | 'rejected';

export interface RiderDocument {
  name: string;
  type: string;
  size: number;
}

export interface RiderRegistration {
  riderId: string;
  fullName: string;
  phone: string;
  city: string;
  vehicleType: 'bike' | 'scooter' | 'cycle';
  vehicleNumber: string;
  documents: Record<RiderDocumentKind, RiderDocument | null>;
  selfieMatched: boolean;
  status: RiderApprovalStatus;
  note?: string;
  submittedAt?: string;
  updatedAt: string;
}

export type SaveRiderRegistrationInput = Pick<
  RiderRegistration,
  'fullName' | 'phone' | 'city' | 'vehicleType' | 'vehicleNumber' | 'documents' | 'selfieMatched'
> &
  Partial<Pick<RiderRegistration, 'status' | 'note'>>;

export interface SelfieMatchResult {
  matched: boolean;
  score: number;
}

export interface RiderPresence {
  online: boolean;
  updatedAt: string;
}

export interface WaitingSession {
  orderId: string;
  riderId: string;
  startedAt: string;
  arrivedAt: string;
  gps?: GpsPoint;
  otpAttempts: number;
  claimed: boolean;
}

export interface CompensationClaim {
  id: string;
  orderId: string;
  riderId: string;
  amountPaise: number;
  createdAt: string;
  status: 'pending' | 'approved';
  evidence: WaitingEvidence;
}

export interface RiderConfig {
  waitingCompensationMs: number;
  compensationPaise: number;
  lateNightHour: number;
  lateNightBonusPaise: number;
  tryAtDoorBonusPaise: number;
  supportPhone: string;
}

export interface SosAlert {
  id: string;
  riderId: string;
  orderId?: string;
  gps?: GpsPoint;
  note?: string;
  createdAt: string;
  status: 'sent';
}

export interface QueuedRiderAction {
  id: string;
  orderId: string;
  kind: 'pickup' | 'drop' | 'handoverPhoto';
  payload: {
    pickupOtp?: string;
    scanCode?: string;
    photoId?: string;
    otp?: string;
    actor: OrderActor;
  };
  createdAt: string;
  status: 'pending' | 'synced';
}

export interface RiderTaskDetail {
  task: RiderTask;
  order: Order;
}

export interface RiderProfileView {
  rider: Rider;
  registration: RiderRegistration;
  language: string;
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
  saveAddress(input: SaveAddressInput): Promise<Address[]>;
  listPaymentMethods(): Promise<PaymentMethodToken[]>;
  getBag(): Promise<Bag>;
  /** Bag groups, saved addresses and buyer eligibility for checkout. */
  getCheckout(): Promise<CheckoutView>;
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

  /* Shop registration and status (AUTH-04). */
  getShopRegistration(): Promise<ShopRegistration | null>;
  saveShopRegistration(input: SaveShopRegistrationInput): Promise<ShopRegistration>;
  setShopRegistrationStage(
    stage: RegistrationStage,
    note?: string,
  ): Promise<ShopRegistration>;

  /* Snap & List drafts (SHOP-01, SHOP-02, NFR-04). */
  analyzeListingPhoto(name: string): Promise<ListingSuggestion>;
  listListingDrafts(): Promise<ListingDraft[]>;
  saveListingDraft(input: SaveListingDraftInput): Promise<ListingDraft>;
  publishListingDraft(id: string): Promise<ListingDraft>;
  deleteListingDraft(id: string): Promise<void>;
  syncQueuedListings(): Promise<ListingDraft[]>;

  /* Inventory and counter sales (SHOP-03 to SHOP-05, NFR-03). */
  listShopProducts(shopId?: string): Promise<Product[]>;
  sellInShop(
    productId: string,
    variantId: string,
    qty?: number,
  ): Promise<CounterSaleResultApi>;
  updateVariant(
    productId: string,
    variantId: string,
    patch: { quantity?: number; pricePaise?: number; visible?: boolean },
  ): Promise<Product>;
  listConflicts(): Promise<ConflictRecord[]>;

  /* Shop order lifecycle (SHOP-06, SHOP-07). */
  listShopOrders(shopId?: string): Promise<Order[]>;
  acceptOrder(orderId: string, actor: OrderActor): Promise<Order>;
  declineOrder(orderId: string, reason: string, actor: OrderActor): Promise<Order>;
  packOrder(orderId: string, actor: OrderActor): Promise<Order>;
  /** PACKED -> RIDER_ASSIGNED so the shop can show the rider's pickup code. */
  readyOrder(orderId: string, actor: OrderActor): Promise<Order>;
  handoverOrder(orderId: string, input: PickupInput, actor: OrderActor): Promise<Order>;
  markInTransit(orderId: string, actor: OrderActor): Promise<Order>;
  releaseExpiredOrders(atMs?: number): Promise<Order[]>;
  getShopSummary(shopId?: string): Promise<ShopSummary>;

  /* Returns, payouts and settings (SHOP-08, SHOP-09, SHOP-05). */
  listReturnOrders(shopId?: string): Promise<Order[]>;
  inspectReturn(
    orderId: string,
    input: ReturnInspectionInput,
    actor: OrderActor,
  ): Promise<Order>;
  getSettlementReport(shopId?: string): Promise<SettlementReport>;
  getShopSettings(shopId?: string): Promise<ShopSettings>;
  saveShopSettings(input: SaveShopSettingsInput): Promise<ShopSettings>;

  /* Rider registration, tasks and safety (AUTH-05, RIDE-01 to RIDE-09). */
  getRiderRegistration(): Promise<RiderRegistration | null>;
  saveRiderRegistration(input: SaveRiderRegistrationInput): Promise<RiderRegistration>;
  matchRiderSelfie(name: string): Promise<SelfieMatchResult>;
  setRiderRegistrationStatus(
    status: RiderApprovalStatus,
    note?: string,
  ): Promise<RiderRegistration>;
  getRiderPresence(): Promise<RiderPresence>;
  setRiderOnline(online: boolean): Promise<RiderPresence>;
  getRiderConfig(): Promise<RiderConfig>;
  getRiderProfile(): Promise<RiderProfileView>;
  listRiderTasks(): Promise<RiderTask[]>;
  getRiderTask(id: string): Promise<RiderTaskDetail | null>;
  collectPickup(orderId: string, input: PickupInput, actor: OrderActor): Promise<Order>;
  markArrived(orderId: string, actor: OrderActor, gps?: GpsPoint): Promise<Order>;
  getWaitingSession(orderId: string): Promise<WaitingSession | null>;
  claimCompensation(orderId: string, actor: OrderActor): Promise<CompensationClaim>;
  recordHandoverPhoto(orderId: string, photoId: string, actor: OrderActor): Promise<Order>;
  confirmRiderDecisions(orderId: string, actor: OrderActor, note?: string): Promise<Order>;
  scanReturnedItems(orderId: string, scanCodes: string[], actor: OrderActor): Promise<Order>;
  closeTrip(orderId: string, actor: OrderActor, photoId?: string): Promise<Order>;
  handOverReturnAtShop(orderId: string, actor: OrderActor): Promise<Order>;
  getRiderEarnings(): Promise<RiderEarnings>;
  sendSos(
    input: { orderId?: string; gps?: GpsPoint; note?: string },
    actor: OrderActor,
  ): Promise<SosAlert>;
  /* NFR-04: actions made offline are kept locally until sync. */
  queueRiderAction(
    action: Omit<QueuedRiderAction, 'id' | 'createdAt' | 'status'>,
  ): Promise<QueuedRiderAction[]>;
  listQueuedRiderActions(): Promise<QueuedRiderAction[]>;
  markRiderActionSynced(id: string): Promise<QueuedRiderAction[]>;

  /* Admin console (AUTH-06, ADM-01 to ADM-09, NFR-10, NFR-12). */
  adminSsoAccounts(): Promise<AdminAccount[]>;
  adminSignIn(input: { accountId: string; code: string }): Promise<AdminAccount>;

  adminReassignRider(orderId: string, riderId: string, input: AdminActionInput): Promise<Order>;
  adminCancelOrder(orderId: string, input: AdminActionInput): Promise<Order>;
  adminOverrideOrder(orderId: string, to: OrderState, input: AdminActionInput): Promise<Order>;

  adminListShopReviews(): Promise<ShopReview[]>;
  adminReviewShop(
    shopId: string,
    outcome: 'approve' | 'reject' | 'suspend',
    input: AdminActionInput,
  ): Promise<ShopReview>;
  adminFlagProduct(
    shopId: string,
    productId: string,
    flag: string,
    input: AdminActionInput,
  ): Promise<ShopReview>;

  adminListDisputes(): Promise<DisputeCase[]>;
  adminGetDispute(id: string, actor: AdminActor): Promise<DisputeCase | null>;
  adminDecideDispute(
    id: string,
    decision: DisputeDecision,
    input: AdminActionInput,
  ): Promise<DisputeCase>;

  adminListRefunds(): Promise<RefundCase[]>;
  adminResolveRefund(
    id: string,
    outcome: 'approve' | 'reject',
    input: AdminActionInput,
  ): Promise<RefundCase>;

  adminListPayouts(): Promise<PayoutCase[]>;
  adminRunSettlement(input: AdminActionInput): Promise<PayoutCase[]>;
  adminHoldPayout(id: string, input: AdminActionInput): Promise<PayoutCase>;
  adminReconcilePayout(id: string, input: AdminActionInput): Promise<PayoutCase>;

  adminListRiderReviews(): Promise<RiderReview[]>;
  adminReviewRider(
    riderId: string,
    outcome: 'verify' | 'penalize' | 'suspend',
    input: AdminActionInput,
  ): Promise<RiderReview>;
  adminSetRiderZone(
    riderId: string,
    zone: string,
    available: boolean,
    input: AdminActionInput,
  ): Promise<RiderReview>;

  adminListRisk(): Promise<RiskEntry[]>;
  adminSetRiskLimit(id: string, codLimitPaise: number, input: AdminActionInput): Promise<RiskEntry>;
  adminBlockRisk(id: string, blocked: boolean, input: AdminActionInput): Promise<RiskEntry>;

  adminGetConfig(): Promise<AdminConfig>;
  adminListConfigHistory(): Promise<ConfigChange[]>;
  adminUpdateConfig(patch: Partial<AdminConfig>, input: AdminActionInput): Promise<AdminConfig>;

  adminListStaff(): Promise<StaffMember[]>;
  adminCreateStaff(input: CreateStaffInput): Promise<StaffMember>;
  adminApproveStaff(id: string, actor: AdminActor): Promise<StaffMember>;
  adminRevokeStaff(id: string, input: AdminActionInput): Promise<StaffMember>;

  adminListAudit(): Promise<AuditEntry[]>;

  subscribe(topic: string, callback: (data: unknown) => void): () => void;
}

/** The admin half of Api, shared by the mock and HTTP adapters. */
export type AdminApi = Pick<
  Api,
  | 'adminSsoAccounts'
  | 'adminSignIn'
  | 'adminReassignRider'
  | 'adminCancelOrder'
  | 'adminOverrideOrder'
  | 'adminListShopReviews'
  | 'adminReviewShop'
  | 'adminFlagProduct'
  | 'adminListDisputes'
  | 'adminGetDispute'
  | 'adminDecideDispute'
  | 'adminListRefunds'
  | 'adminResolveRefund'
  | 'adminListPayouts'
  | 'adminRunSettlement'
  | 'adminHoldPayout'
  | 'adminReconcilePayout'
  | 'adminListRiderReviews'
  | 'adminReviewRider'
  | 'adminSetRiderZone'
  | 'adminListRisk'
  | 'adminSetRiskLimit'
  | 'adminBlockRisk'
  | 'adminGetConfig'
  | 'adminListConfigHistory'
  | 'adminUpdateConfig'
  | 'adminListStaff'
  | 'adminCreateStaff'
  | 'adminApproveStaff'
  | 'adminRevokeStaff'
  | 'adminListAudit'
>;

/** The shop half of Api, shared by the mock and HTTP adapters. */
export type ShopApi = Pick<
  Api,
  | 'getShopRegistration'
  | 'saveShopRegistration'
  | 'setShopRegistrationStage'
  | 'analyzeListingPhoto'
  | 'listListingDrafts'
  | 'saveListingDraft'
  | 'publishListingDraft'
  | 'deleteListingDraft'
  | 'syncQueuedListings'
  | 'listShopProducts'
  | 'sellInShop'
  | 'updateVariant'
  | 'listConflicts'
  | 'listShopOrders'
  | 'acceptOrder'
  | 'declineOrder'
  | 'packOrder'
  | 'readyOrder'
  | 'handoverOrder'
  | 'markInTransit'
  | 'releaseExpiredOrders'
  | 'getShopSummary'
  | 'listReturnOrders'
  | 'inspectReturn'
  | 'getSettlementReport'
  | 'getShopSettings'
  | 'saveShopSettings'
>;

/** The rider half of Api, shared by the mock and HTTP adapters. */
export type RiderApi = Pick<
  Api,
  | 'getRiderRegistration'
  | 'saveRiderRegistration'
  | 'matchRiderSelfie'
  | 'setRiderRegistrationStatus'
  | 'getRiderPresence'
  | 'setRiderOnline'
  | 'getRiderConfig'
  | 'getRiderProfile'
  | 'listRiderTasks'
  | 'getRiderTask'
  | 'collectPickup'
  | 'markArrived'
  | 'getWaitingSession'
  | 'claimCompensation'
  | 'recordHandoverPhoto'
  | 'confirmRiderDecisions'
  | 'scanReturnedItems'
  | 'closeTrip'
  | 'handOverReturnAtShop'
  | 'getRiderEarnings'
  | 'sendSos'
  | 'queueRiderAction'
  | 'listQueuedRiderActions'
  | 'markRiderActionSynced'
>;
