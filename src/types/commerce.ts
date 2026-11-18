export type PlatformId =
  | 'shopify'
  | 'woocommerce'
  | 'tiktok_shop'
  | 'payhip'
  | 'stripe';

export interface ProductVariant {
  name: string;
  sku: string;
  priceCents: number;
  stock: number;
}

export interface ProductTranslation {
  title: string;
  description: string;
}

export interface MerchantUser {
  id: number;
  uid: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
}

export interface StoreItem {
  id: number;
  userId: number;
  name: string;
  platform: PlatformId | string;
  storeUrl: string;
  apiProtocol: string;
  status: string;
  bidirectionalSync: boolean;
  webhookSecretMask: string;
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface ProductItem {
  id: number;
  userId: number;
  sku: string;
  title: string;
  description: string;
  seoTitle: string;
  seoTags: string[];
  priceCents: number;
  currency: string;
  stockQuantity: number;
  variants: ProductVariant[];
  channels: string[];
  imageUrl: string | null;
  aiGenerated: boolean;
  marketingScript: string | null;
  translations: Record<string, ProductTranslation>;
  updatedAt: string;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  userId: number;
  storeId: number | null;
  externalOrderRef: string;
  platform: string;
  customerName: string;
  customerEmail: string;
  itemsCount: number;
  totalCents: number;
  currency: string;
  fulfillmentStatus: string;
  createdAt: string;
}

export interface SyncJobItem {
  id: number;
  userId: number;
  storeId: number | null;
  jobType: string;
  platform: string;
  payloadSummary: string;
  status: string;
  attempts: number;
  latencyMs: number;
  createdAt: string;
}

export interface SecurityAuditItem {
  id: number;
  userId: number;
  actorEmail: string;
  action: string;
  resource: string;
  ipAddress: string;
  hmacVerified: boolean;
  createdAt: string;
}

export interface WorkspacePayload {
  user: MerchantUser | null;
  stores: StoreItem[];
  products: ProductItem[];
  orders: OrderItem[];
  syncJobs: SyncJobItem[];
  auditLogs: SecurityAuditItem[];
}

export interface GeneratedCatalogDraft {
  title: string;
  sku: string;
  seoTitle: string;
  description: string;
  seoTags: string[];
  suggestedPriceCents: number;
  variants: ProductVariant[];
  marketingScript: string;
  translations: {
    en: ProductTranslation;
    es: ProductTranslation;
  };
}

export const PLATFORM_LABELS: Record<string, string> = {
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  tiktok_shop: 'TikTok Shop',
  payhip: 'Payhip',
  stripe: 'Stripe',
};

export function formatEuro(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export function formatRelativeDate(iso: string | null): string {
  if (!iso) return 'Jamais';
  const date = new Date(iso);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
