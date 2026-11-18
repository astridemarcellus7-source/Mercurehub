import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

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

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull().default('Marchand'),
  role: text('role').notNull().default('admin'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const stores = pgTable('stores', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  platform: text('platform').notNull(),
  storeUrl: text('store_url').notNull(),
  apiProtocol: text('api_protocol').notNull(),
  status: text('status').notNull().default('connected'),
  bidirectionalSync: boolean('bidirectional_sync').notNull().default(true),
  webhookSecretMask: text('webhook_secret_mask').notNull(),
  lastSyncedAt: timestamp('last_synced_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  sku: text('sku').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  seoTitle: text('seo_title').notNull(),
  seoTags: jsonb('seo_tags').$type<string[]>().notNull().default([]),
  priceCents: integer('price_cents').notNull(),
  currency: text('currency').notNull().default('EUR'),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  variants: jsonb('variants').$type<ProductVariant[]>().notNull().default([]),
  channels: jsonb('channels').$type<string[]>().notNull().default([]),
  imageUrl: text('image_url'),
  aiGenerated: boolean('ai_generated').notNull().default(false),
  marketingScript: text('marketing_script'),
  translations: jsonb('translations')
    .$type<Record<string, ProductTranslation>>()
    .notNull()
    .default({}),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  storeId: integer('store_id').references(() => stores.id, {
    onDelete: 'set null',
  }),
  externalOrderRef: text('external_order_ref').notNull(),
  platform: text('platform').notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  itemsCount: integer('items_count').notNull().default(1),
  totalCents: integer('total_cents').notNull(),
  currency: text('currency').notNull().default('EUR'),
  fulfillmentStatus: text('fulfillment_status').notNull().default('processing'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const syncJobs = pgTable('sync_jobs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  storeId: integer('store_id').references(() => stores.id, {
    onDelete: 'set null',
  }),
  jobType: text('job_type').notNull(),
  platform: text('platform').notNull(),
  payloadSummary: text('payload_summary').notNull(),
  status: text('status').notNull().default('completed'),
  attempts: integer('attempts').notNull().default(1),
  latencyMs: integer('latency_ms').notNull().default(120),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const securityAuditLogs = pgTable('security_audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  actorEmail: text('actor_email').notNull(),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  ipAddress: text('ip_address').notNull(),
  hmacVerified: boolean('hmac_verified').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  stores: many(stores),
  products: many(products),
  orders: many(orders),
  syncJobs: many(syncJobs),
  securityAuditLogs: many(securityAuditLogs),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  owner: one(users, {
    fields: [stores.userId],
    references: [users.id],
  }),
  orders: many(orders),
  syncJobs: many(syncJobs),
}));

export const productsRelations = relations(products, ({ one }) => ({
  owner: one(users, {
    fields: [products.userId],
    references: [users.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  owner: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  store: one(stores, {
    fields: [orders.storeId],
    references: [stores.id],
  }),
}));

export const syncJobsRelations = relations(syncJobs, ({ one }) => ({
  owner: one(users, {
    fields: [syncJobs.userId],
    references: [users.id],
  }),
  store: one(stores, {
    fields: [syncJobs.storeId],
    references: [stores.id],
  }),
}));

export const securityAuditLogsRelations = relations(
  securityAuditLogs,
  ({ one }) => ({
    owner: one(users, {
      fields: [securityAuditLogs.userId],
      references: [users.id],
    }),
  })
);
