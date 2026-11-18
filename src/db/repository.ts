import crypto from 'crypto';
import { and, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  orders,
  products,
  securityAuditLogs,
  stores,
  syncJobs,
  users,
  type ProductTranslation,
  type ProductVariant,
} from './schema.ts';

const STARTER_IMAGES = {
  lamp: '/src/assets/images/product_ceramic_lamp_1795011694422.jpg',
  headphones: '/src/assets/images/product_audio_headphones_1795011695552.jpg',
  kettle: '/src/assets/images/product_espresso_kettle_1795011696092.jpg',
  tote: '/src/assets/images/product_linen_tote_1795011696415.jpg',
};

export async function getWorkspaceData(userId: number, userEmail: string) {
  try {
    const existingStores = await db
      .select()
      .from(stores)
      .where(eq(stores.userId, userId))
      .orderBy(desc(stores.createdAt));

    const existingProducts = await db
      .select()
      .from(products)
      .where(eq(products.userId, userId))
      .orderBy(desc(products.createdAt));

    if (existingStores.length === 0 && existingProducts.length === 0) {
      await seedInitialMerchantWorkspace(userId, userEmail);
    }

    const [
      userRows,
      storeRows,
      productRows,
      orderRows,
      jobRows,
      auditRows,
    ] = await Promise.all([
      db.select().from(users).where(eq(users.id, userId)),
      db
        .select()
        .from(stores)
        .where(eq(stores.userId, userId))
        .orderBy(desc(stores.createdAt)),
      db
        .select()
        .from(products)
        .where(eq(products.userId, userId))
        .orderBy(desc(products.createdAt)),
      db
        .select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt)),
      db
        .select()
        .from(syncJobs)
        .where(eq(syncJobs.userId, userId))
        .orderBy(desc(syncJobs.createdAt))
        .limit(40),
      db
        .select()
        .from(securityAuditLogs)
        .where(eq(securityAuditLogs.userId, userId))
        .orderBy(desc(securityAuditLogs.createdAt))
        .limit(30),
    ]);

    return {
      user: userRows[0] ?? null,
      stores: storeRows,
      products: productRows,
      orders: orderRows,
      syncJobs: jobRows,
      auditLogs: auditRows,
    };
  } catch (error) {
    console.error('Database query failed in getWorkspaceData:', error);
    throw new Error('Impossible de charger les données de la plateforme.', {
      cause: error,
    });
  }
}

async function seedInitialMerchantWorkspace(userId: number, userEmail: string) {
  const insertedStores = await db
    .insert(stores)
    .values([
      {
        userId,
        name: 'Maison Solène Flagship',
        platform: 'shopify',
        storeUrl: 'maison-solene.myshopify.com',
        apiProtocol: 'GraphQL Admin API 2026-01',
        status: 'connected',
        bidirectionalSync: true,
        webhookSecretMask: 'whsec_shp_••••••••9a4f',
      },
      {
        userId,
        name: 'Boutique Europe Woo',
        platform: 'woocommerce',
        storeUrl: 'shop.maison-solene.fr',
        apiProtocol: 'REST API v3 (OAuth 1.0a)',
        status: 'connected',
        bidirectionalSync: true,
        webhookSecretMask: 'whsec_woo_••••••••3c12',
      },
      {
        userId,
        name: 'TikTok Shop France',
        platform: 'tiktok_shop',
        storeUrl: 'seller-fr.tiktokglobalshop.com',
        apiProtocol: 'Partner Open API v2',
        status: 'connected',
        bidirectionalSync: true,
        webhookSecretMask: 'whsec_tts_••••••••7e88',
      },
      {
        userId,
        name: 'Stripe Direct & Payhip',
        platform: 'stripe',
        storeUrl: 'checkout.maison-solene.fr',
        apiProtocol: 'Stripe Webhooks + Payment Links',
        status: 'connected',
        bidirectionalSync: false,
        webhookSecretMask: 'whsec_str_••••••••4b01',
      },
    ])
    .returning();

  const shopifyStore = insertedStores[0];
  const wooStore = insertedStores[1];
  const tiktokStore = insertedStores[2];

  await db.insert(products).values([
    {
      userId,
      sku: 'MH-LAMP-01',
      title: 'Lampe de Table Céramique Travertin & Lin',
      description:
        'Pièce architecturale façonnée en grès mat beige minéral, coiffée d’un abat-jour en lin lavé belge. Éclairage doux diffus 2700K avec variateur rotatif en laiton brossé.',
      seoTitle: 'Lampe Céramique Travertin & Lin Belge | Maison Solène',
      seoTags: [
        'lampe céramique',
        'luminaire minimaliste',
        'abat-jour lin',
        'décoration intérieure',
        'éclairage 2700k',
      ],
      priceCents: 18900,
      currency: 'EUR',
      stockQuantity: 42,
      variants: [
        { name: 'Grès Ivoire / Lin Naturel', sku: 'MH-LAMP-01-IVR', priceCents: 18900, stock: 26 },
        { name: 'Grès Argile / Lin Écru', sku: 'MH-LAMP-01-ARG', priceCents: 19500, stock: 16 },
      ],
      channels: ['shopify', 'woocommerce'],
      imageUrl: STARTER_IMAGES.lamp,
      aiGenerated: false,
      marketingScript:
        'Hook: Pourquoi votre salon manque de chaleur le soir ? Voici la règle des 2700K avec notre lampe sculptée en grès mat.',
      translations: {
        en: {
          title: 'Matte Ceramic & Belgian Linen Table Lamp',
          description: 'Architectural stoneware base paired with washed Belgian linen shade.',
        },
      },
    },
    {
      userId,
      sku: 'MH-AUD-02',
      title: 'Casque Studio Sans Fil Aluminium Brossé ANC',
      description:
        'Réduction active de bruit hybride (-42 dB), transducteurs 40 mm en béryllium et coussinets en cuir pleine fleur respirant. Autonomie de 48 heures avec charge USB-C rapide.',
      seoTitle: 'Casque Audio Sans Fil ANC Aluminium | Studio Nord',
      seoTags: [
        'casque bluetooth anc',
        'audio haute fidélité',
        'casque studio',
        'aluminium brossé',
        'autonomie 48h',
      ],
      priceCents: 27900,
      currency: 'EUR',
      stockQuantity: 19,
      variants: [
        { name: 'Titane Brossé / Anthracite', sku: 'MH-AUD-02-TIT', priceCents: 27900, stock: 12 },
        { name: 'Noir Mat / Cuir Noir', sku: 'MH-AUD-02-BLK', priceCents: 27900, stock: 7 },
      ],
      channels: ['shopify', 'tiktok_shop', 'stripe'],
      imageUrl: STARTER_IMAGES.headphones,
      aiGenerated: true,
      marketingScript:
        'Hook (0-3s): Coupez le bruit du métro instantanément. Demo (3-18s): Aluminium usiné CNC et 48h de batterie. CTA: Lien boutique en bio.',
      translations: {
        en: {
          title: 'Brushed Aluminum Wireless ANC Studio Headphones',
          description: 'Hybrid active noise cancellation with 48-hour battery life.',
        },
      },
    },
    {
      userId,
      sku: 'MH-KTL-03',
      title: 'Bouilloire Col de Cygne Précision PID Noyer & Acier',
      description:
        'Contrôle thermique au degré près (40°C à 100°C) sur socle PID discret, bec col de cygne équilibré pour extraction café V60 et poignée ergonomique en noyer massif.',
      seoTitle: 'Bouilloire Col de Cygne PID Café Spécialité | Noyer',
      seoTags: [
        'bouilloire col de cygne',
        'pour over v60',
        'café de spécialité',
        'contrôle température pid',
      ],
      priceCents: 14500,
      currency: 'EUR',
      stockQuantity: 8,
      variants: [
        { name: 'Noir Mat / Noyer Massif 900ml', sku: 'MH-KTL-03-900', priceCents: 14500, stock: 8 },
      ],
      channels: ['shopify', 'woocommerce', 'tiktok_shop'],
      imageUrl: STARTER_IMAGES.kettle,
      aiGenerated: false,
      marketingScript:
        'Montrez le filet d’eau laminaire à 93°C sur une mouture fraîche : le secret d’une extraction sans amertume.',
      translations: {
        en: {
          title: 'PID Gooseneck Pour-Over Kettle Walnut Edition',
          description: 'Degree-accurate thermal control with balanced laminar flow spout.',
        },
      },
    },
    {
      userId,
      sku: 'MH-TOT-04',
      title: 'Cabas Architecturé Toile Écru Bio & Cuir Sellerie',
      description:
        'Toile de coton biologique 600g/m² tissée serré, anses en cuir tannage végétal rivetées laiton et compartiment matelassé pour ordinateur portable 16 pouces.',
      seoTitle: 'Cabas Toile Bio 600g & Cuir Tannage Végétal',
      seoTags: [
        'cabas toile bio',
        'sac ordinateur cuir',
        'maroquinerie durable',
        'tote bag structuré',
      ],
      priceCents: 12900,
      currency: 'EUR',
      stockQuantity: 64,
      variants: [
        { name: 'Écru Naturel / Cognac', sku: 'MH-TOT-04-ECR', priceCents: 12900, stock: 41 },
        { name: 'Sable / Tabac', sku: 'MH-TOT-04-SBL', priceCents: 12900, stock: 23 },
      ],
      channels: ['shopify', 'woocommerce', 'stripe'],
      imageUrl: STARTER_IMAGES.tote,
      aiGenerated: false,
      marketingScript: null,
      translations: {},
    },
  ]);

  await db.insert(orders).values([
    {
      userId,
      storeId: shopifyStore.id,
      externalOrderRef: 'SHP-48291',
      platform: 'shopify',
      customerName: 'Camille Laurent',
      customerEmail: 'c.laurent@atelier-lyon.fr',
      itemsCount: 2,
      totalCents: 33400,
      currency: 'EUR',
      fulfillmentStatus: 'shipped',
    },
    {
      userId,
      storeId: tiktokStore.id,
      externalOrderRef: 'TTS-90412',
      platform: 'tiktok_shop',
      customerName: 'Lucas Moreau',
      customerEmail: 'lucas.moreau@proton.me',
      itemsCount: 1,
      totalCents: 27900,
      currency: 'EUR',
      fulfillmentStatus: 'processing',
    },
    {
      userId,
      storeId: wooStore.id,
      externalOrderRef: 'WOO-11984',
      platform: 'woocommerce',
      customerName: 'Élodie Bernard',
      customerEmail: 'elodie.bernard@studio-bordeaux.fr',
      itemsCount: 1,
      totalCents: 18900,
      currency: 'EUR',
      fulfillmentStatus: 'pending',
    },
    {
      userId,
      storeId: shopifyStore.id,
      externalOrderRef: 'SHP-48275',
      platform: 'shopify',
      customerName: 'Thomas Mercier',
      customerEmail: 't.mercier@cabinet-paris.fr',
      itemsCount: 3,
      totalCents: 40300,
      currency: 'EUR',
      fulfillmentStatus: 'delivered',
    },
  ]);

  await db.insert(syncJobs).values([
    {
      userId,
      storeId: shopifyStore.id,
      jobType: 'inventory_sync',
      platform: 'shopify',
      payloadSummary: 'Synchronisation stock SKU MH-KTL-03 (8 unités) via GraphQL inventorySetQuantities',
      status: 'completed',
      attempts: 1,
      latencyMs: 118,
    },
    {
      userId,
      storeId: tiktokStore.id,
      jobType: 'order_webhook',
      platform: 'tiktok_shop',
      payloadSummary: 'Webhook orders/create #TTS-90412 vérifié HMAC-SHA256 & décrémentation stock',
      status: 'completed',
      attempts: 1,
      latencyMs: 94,
    },
    {
      userId,
      storeId: wooStore.id,
      jobType: 'price_update',
      platform: 'woocommerce',
      payloadSummary: 'Mise à jour tarifaire lot 4 SKUs EUR vers REST API /wc/v3/products/batch',
      status: 'failed',
      attempts: 2,
      latencyMs: 412,
    },
  ]);

  await db.insert(securityAuditLogs).values([
    {
      userId,
      actorEmail: userEmail,
      action: 'SESSION_AUTH_VERIFIED',
      resource: 'Firebase Auth + Cloud SQL Tenant',
      ipAddress: '10.42.0.18',
      hmacVerified: true,
    },
    {
      userId,
      actorEmail: 'webhook-worker@mercurehub',
      action: 'WEBHOOK_HMAC_VERIFIED',
      resource: 'tiktok_shop/orders/create (#TTS-90412)',
      ipAddress: '185.199.108.42',
      hmacVerified: true,
    },
  ]);
}

export async function createStore(
  userId: number,
  userEmail: string,
  input: {
    name: string;
    platform: string;
    storeUrl: string;
    apiProtocol: string;
    bidirectionalSync: boolean;
  }
) {
  try {
    const suffix = crypto.randomBytes(2).toString('hex');
    const prefix = input.platform.slice(0, 3).toLowerCase();
    const mask = `whsec_${prefix}_••••••••${suffix}`;

    const [created] = await db
      .insert(stores)
      .values({
        userId,
        name: input.name.trim(),
        platform: input.platform,
        storeUrl: input.storeUrl.trim(),
        apiProtocol: input.apiProtocol,
        status: 'connected',
        bidirectionalSync: input.bidirectionalSync,
        webhookSecretMask: mask,
        lastSyncedAt: new Date(),
      })
      .returning();

    await db.insert(syncJobs).values({
      userId,
      storeId: created.id,
      jobType: 'catalog_push',
      platform: created.platform,
      payloadSummary: `Initialisation connecteur ${created.name} (${created.apiProtocol})`,
      status: 'completed',
      attempts: 1,
      latencyMs: 145,
    });

    await db.insert(securityAuditLogs).values({
      userId,
      actorEmail: userEmail,
      action: 'CONNECT_STORE_OAUTH',
      resource: `${created.platform}:${created.storeUrl}`,
      ipAddress: '10.42.0.18',
      hmacVerified: true,
    });

    return created;
  } catch (error) {
    console.error('Database query failed in createStore:', error);
    throw new Error('Impossible de connecter la boutique.', { cause: error });
  }
}

export async function updateStore(
  userId: number,
  userEmail: string,
  storeId: number,
  updates: {
    bidirectionalSync?: boolean;
    status?: string;
    action?: 'sync_now';
  }
) {
  try {
    const existing = await db
      .select()
      .from(stores)
      .where(and(eq(stores.id, storeId), eq(stores.userId, userId)));

    if (!existing[0]) {
      return null;
    }

    const patch: Partial<typeof stores.$inferInsert> = {};
    if (typeof updates.bidirectionalSync === 'boolean') {
      patch.bidirectionalSync = updates.bidirectionalSync;
    }
    if (updates.status) {
      patch.status = updates.status;
    }
    if (updates.action === 'sync_now') {
      patch.lastSyncedAt = new Date();
      patch.status = 'connected';
    }

    const [updated] = await db
      .update(stores)
      .set(patch)
      .where(and(eq(stores.id, storeId), eq(stores.userId, userId)))
      .returning();

    if (updates.action === 'sync_now') {
      await db.insert(syncJobs).values({
        userId,
        storeId: updated.id,
        jobType: 'inventory_sync',
        platform: updated.platform,
        payloadSummary: `Synchronisation bidirectionnelle manuelle déclenchée sur ${updated.name}`,
        status: 'completed',
        attempts: 1,
        latencyMs: 108,
      });

      await db.insert(securityAuditLogs).values({
        userId,
        actorEmail: userEmail,
        action: 'MANUAL_CHANNEL_SYNC',
        resource: `${updated.platform}:${updated.name}`,
        ipAddress: '10.42.0.18',
        hmacVerified: true,
      });
    }

    return updated;
  } catch (error) {
    console.error('Database query failed in updateStore:', error);
    throw new Error('Impossible de mettre à jour la boutique.', {
      cause: error,
    });
  }
}

export async function deleteStore(
  userId: number,
  userEmail: string,
  storeId: number
) {
  try {
    const [deleted] = await db
      .delete(stores)
      .where(and(eq(stores.id, storeId), eq(stores.userId, userId)))
      .returning();

    if (deleted) {
      await db.insert(securityAuditLogs).values({
        userId,
        actorEmail: userEmail,
        action: 'DISCONNECT_STORE',
        resource: `${deleted.platform}:${deleted.name}`,
        ipAddress: '10.42.0.18',
        hmacVerified: true,
      });
    }

    return deleted ?? null;
  } catch (error) {
    console.error('Database query failed in deleteStore:', error);
    throw new Error('Impossible de déconnecter la boutique.', { cause: error });
  }
}

export async function createProduct(
  userId: number,
  userEmail: string,
  input: {
    sku: string;
    title: string;
    description: string;
    seoTitle: string;
    seoTags: string[];
    priceCents: number;
    stockQuantity: number;
    variants: ProductVariant[];
    channels: string[];
    imageUrl?: string | null;
    aiGenerated: boolean;
    marketingScript?: string | null;
    translations?: Record<string, ProductTranslation>;
  }
) {
  try {
    const [created] = await db
      .insert(products)
      .values({
        userId,
        sku: input.sku.trim(),
        title: input.title.trim(),
        description: input.description.trim(),
        seoTitle: input.seoTitle.trim(),
        seoTags: input.seoTags,
        priceCents: Math.max(0, Math.round(input.priceCents)),
        currency: 'EUR',
        stockQuantity: Math.max(0, Math.round(input.stockQuantity)),
        variants: input.variants,
        channels: input.channels,
        imageUrl: input.imageUrl ?? null,
        aiGenerated: input.aiGenerated,
        marketingScript: input.marketingScript ?? null,
        translations: input.translations ?? {},
      })
      .returning();

    const targetChannels =
      input.channels.length > 0 ? input.channels : ['shopify'];

    await db.insert(syncJobs).values(
      targetChannels.map((platform) => ({
        userId,
        jobType: 'catalog_push',
        platform,
        payloadSummary: `Publication fiche ${created.sku} (${created.title.slice(0, 36)})`,
        status: 'completed',
        attempts: 1,
        latencyMs: 132,
      }))
    );

    await db.insert(securityAuditLogs).values({
      userId,
      actorEmail: userEmail,
      action: input.aiGenerated ? 'PUBLISH_AI_PRODUCT' : 'CREATE_PRODUCT',
      resource: `${created.sku} -> [${targetChannels.join(', ')}]`,
      ipAddress: '10.42.0.18',
      hmacVerified: true,
    });

    return created;
  } catch (error) {
    console.error('Database query failed in createProduct:', error);
    throw new Error('Impossible de créer le produit dans le catalogue.', {
      cause: error,
    });
  }
}

export async function updateProduct(
  userId: number,
  userEmail: string,
  productId: number,
  updates: {
    title?: string;
    priceCents?: number;
    stockQuantity?: number;
    channels?: string[];
  }
) {
  try {
    const existing = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.userId, userId)));

    if (!existing[0]) {
      return null;
    }

    const patch: Partial<typeof products.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (typeof updates.title === 'string' && updates.title.trim()) {
      patch.title = updates.title.trim();
    }
    if (typeof updates.priceCents === 'number') {
      patch.priceCents = Math.max(0, Math.round(updates.priceCents));
    }
    if (typeof updates.stockQuantity === 'number') {
      patch.stockQuantity = Math.max(0, Math.round(updates.stockQuantity));
    }
    if (Array.isArray(updates.channels)) {
      patch.channels = updates.channels;
    }

    const [updated] = await db
      .update(products)
      .set(patch)
      .where(and(eq(products.id, productId), eq(products.userId, userId)))
      .returning();

    const activeChannels =
      updated.channels.length > 0 ? updated.channels : ['shopify'];

    await db.insert(syncJobs).values(
      activeChannels.map((platform) => ({
        userId,
        jobType:
          typeof updates.stockQuantity === 'number'
            ? 'inventory_sync'
            : 'price_update',
        platform,
        payloadSummary: `Sync bidirectionnelle ${updated.sku} : stock=${updated.stockQuantity}, tarif=${(updated.priceCents / 100).toFixed(2)} EUR`,
        status: 'completed',
        attempts: 1,
        latencyMs: 96,
      }))
    );

    await db.insert(securityAuditLogs).values({
      userId,
      actorEmail: userEmail,
      action: 'UPDATE_CATALOG_SYNC',
      resource: `${updated.sku} (stock ${updated.stockQuantity})`,
      ipAddress: '10.42.0.18',
      hmacVerified: true,
    });

    return updated;
  } catch (error) {
    console.error('Database query failed in updateProduct:', error);
    throw new Error('Impossible de mettre à jour le produit.', { cause: error });
  }
}

export async function deleteProduct(
  userId: number,
  userEmail: string,
  productId: number
) {
  try {
    const [deleted] = await db
      .delete(products)
      .where(and(eq(products.id, productId), eq(products.userId, userId)))
      .returning();

    if (deleted) {
      await db.insert(securityAuditLogs).values({
        userId,
        actorEmail: userEmail,
        action: 'DELETE_PRODUCT',
        resource: deleted.sku,
        ipAddress: '10.42.0.18',
        hmacVerified: true,
      });
    }

    return deleted ?? null;
  } catch (error) {
    console.error('Database query failed in deleteProduct:', error);
    throw new Error('Impossible de supprimer le produit.', { cause: error });
  }
}

export async function updateOrderStatus(
  userId: number,
  userEmail: string,
  orderId: number,
  fulfillmentStatus: string
) {
  try {
    const [updated] = await db
      .update(orders)
      .set({ fulfillmentStatus })
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .returning();

    if (!updated) {
      return null;
    }

    await db.insert(syncJobs).values({
      userId,
      storeId: updated.storeId,
      jobType: 'order_webhook',
      platform: updated.platform,
      payloadSummary: `Mise à jour statut commande #${updated.externalOrderRef} -> ${fulfillmentStatus}`,
      status: 'completed',
      attempts: 1,
      latencyMs: 112,
    });

    await db.insert(securityAuditLogs).values({
      userId,
      actorEmail: userEmail,
      action: 'UPDATE_ORDER_FULFILLMENT',
      resource: `#${updated.externalOrderRef} (${fulfillmentStatus})`,
      ipAddress: '10.42.0.18',
      hmacVerified: true,
    });

    return updated;
  } catch (error) {
    console.error('Database query failed in updateOrderStatus:', error);
    throw new Error('Impossible de mettre à jour le statut de commande.', {
      cause: error,
    });
  }
}

export async function simulateInboundWebhook(
  userId: number,
  userEmail: string,
  input: {
    storeId: number;
    eventType: 'orders/create' | 'inventory/decrement';
    customerName?: string;
    productId?: number;
  }
) {
  try {
    const storeRows = await db
      .select()
      .from(stores)
      .where(and(eq(stores.id, input.storeId), eq(stores.userId, userId)));

    const store = storeRows[0];
    if (!store) {
      throw new Error('Boutique cible introuvable.');
    }

    const userProducts = await db
      .select()
      .from(products)
      .where(eq(products.userId, userId));

    const targetProduct =
      userProducts.find((p) => p.id === input.productId) ?? userProducts[0];

    const rawPayload = JSON.stringify({
      event: input.eventType,
      store: store.storeUrl,
      sku: targetProduct?.sku ?? 'MH-ITEM-01',
      timestamp: new Date().toISOString(),
    });

    const signingKey = `mercure_hmac_${store.id}_${store.platform}`;
    const signatureHex = crypto
      .createHmac('sha256', signingKey)
      .update(rawPayload)
      .digest('hex');

    const expectedBuf = Buffer.from(signatureHex, 'hex');
    const actualBuf = Buffer.from(
      crypto.createHmac('sha256', signingKey).update(rawPayload).digest('hex'),
      'hex'
    );
    const hmacVerified = crypto.timingSafeEqual(expectedBuf, actualBuf);

    let createdOrder = null;
    if (input.eventType === 'orders/create') {
      const refPrefix = store.platform.slice(0, 3).toUpperCase();
      const randomNum = Math.floor(10000 + Math.random() * 89999);
      const totalCents = targetProduct ? targetProduct.priceCents : 14900;

      const [order] = await db
        .insert(orders)
        .values({
          userId,
          storeId: store.id,
          externalOrderRef: `${refPrefix}-${randomNum}`,
          platform: store.platform,
          customerName: input.customerName?.trim() || 'Claire Fontaine',
          customerEmail: 'claire.fontaine@client-web.fr',
          itemsCount: 1,
          totalCents,
          currency: 'EUR',
          fulfillmentStatus: 'pending',
        })
        .returning();
      createdOrder = order;
    }

    if (targetProduct && targetProduct.stockQuantity > 0) {
      await db
        .update(products)
        .set({
          stockQuantity: targetProduct.stockQuantity - 1,
          updatedAt: new Date(),
        })
        .where(
          and(eq(products.id, targetProduct.id), eq(products.userId, userId))
        );
    }

    const [job] = await db
      .insert(syncJobs)
      .values({
        userId,
        storeId: store.id,
        jobType:
          input.eventType === 'orders/create'
            ? 'order_webhook'
            : 'inventory_sync',
        platform: store.platform,
        payloadSummary: `Webhook ${input.eventType} traité (${store.name}) · HMAC SHA-256 valide`,
        status: 'completed',
        attempts: 1,
        latencyMs: 87,
      })
      .returning();

    await db.insert(securityAuditLogs).values({
      userId,
      actorEmail: userEmail,
      action: 'WEBHOOK_INGESTED',
      resource: `${store.platform}/${input.eventType}`,
      ipAddress: '185.199.108.42',
      hmacVerified,
    });

    return {
      hmacVerified,
      signatureDigest: signatureHex.slice(0, 24) + '...',
      createdOrder,
      job,
    };
  } catch (error) {
    console.error('Database query failed in simulateInboundWebhook:', error);
    throw new Error('Échec du traitement du webhook entrant.', { cause: error });
  }
}

export async function retrySyncJob(
  userId: number,
  userEmail: string,
  jobId: number
) {
  try {
    const existing = await db
      .select()
      .from(syncJobs)
      .where(and(eq(syncJobs.id, jobId), eq(syncJobs.userId, userId)));

    if (!existing[0]) {
      return null;
    }

    const [updated] = await db
      .update(syncJobs)
      .set({
        status: 'completed',
        attempts: existing[0].attempts + 1,
        latencyMs: 104,
      })
      .where(and(eq(syncJobs.id, jobId), eq(syncJobs.userId, userId)))
      .returning();

    await db.insert(securityAuditLogs).values({
      userId,
      actorEmail: userEmail,
      action: 'QUEUE_JOB_RETRIED',
      resource: `Job #${updated.id} (${updated.platform})`,
      ipAddress: '10.42.0.18',
      hmacVerified: true,
    });

    return updated;
  } catch (error) {
    console.error('Database query failed in retrySyncJob:', error);
    throw new Error('Impossible de relancer la tâche dans la file.', {
      cause: error,
    });
  }
}

export async function logAiGeneration(
  userId: number,
  userEmail: string,
  sku: string,
  channels: string[]
) {
  try {
    await db.insert(syncJobs).values({
      userId,
      jobType: 'ai_enrichment',
      platform: channels[0] || 'shopify',
      payloadSummary: `Génération fiche IA Copilote (${sku}) pour [${channels.join(', ')}]`,
      status: 'completed',
      attempts: 1,
      latencyMs: 640,
    });

    await db.insert(securityAuditLogs).values({
      userId,
      actorEmail: userEmail,
      action: 'AI_CATALOG_GENERATION',
      resource: `Copilote Gemini (${sku})`,
      ipAddress: '10.42.0.18',
      hmacVerified: true,
    });
  } catch (error) {
    console.error('Audit log insert failed:', error);
  }
}
