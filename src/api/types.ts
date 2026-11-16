import type { OrderEvent, OrderKind, OrderState } from '@/domain/orderMachine';

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
  productId: string;
  variantId: string;
  qty: number;
  pricePaise: number;
  decision: 'keep' | 'return' | 'pending' | null;
}

export interface Order {
  id: string;
  checkoutId: string;
  buyerId: string;
  shopId: string;
  kind: OrderKind;
  state: OrderState;
  lines: OrderLine[];
  totalPaise: number;
  etaMin: [number, number];
  paymentMethod: 'upi' | 'card' | 'wallet' | 'cod';
  createdAt: string;
  events: OrderEvent[];
}

export interface PlaceCheckoutInput {
  paymentMethod: Order['paymentMethod'];
  addressId?: string;
}

export interface PlaceCheckoutResult {
  checkoutId: string;
  orders: Order[];
}

export interface Api {
  listProducts(params?: { occasion?: string; q?: string; shopId?: string }): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  listShops(): Promise<Shop[]>;
  getShop(id: string): Promise<Shop | null>;
  listBuyers(): Promise<Buyer[]>;
  listRiders(): Promise<Rider[]>;
  listAdmins(): Promise<AdminUser[]>;
  getBag(): Promise<Bag>;
  addToBag(line: Omit<BagLine, 'id' | 'heldUntil'>): Promise<Bag>;
  updateBagLine(id: string, patch: Partial<Pick<BagLine, 'qty' | 'tryAtDoor'>>): Promise<Bag>;
  removeBagLine(id: string): Promise<Bag>;
  placeCheckout(input: PlaceCheckoutInput): Promise<PlaceCheckoutResult>;
  listOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  subscribe(topic: string, callback: (data: unknown) => void): () => void;
}
