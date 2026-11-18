import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import {
  createProduct,
  createStore,
  deleteProduct,
  deleteStore,
  getWorkspaceData,
  logAiGeneration,
  retrySyncJob,
  simulateInboundWebhook,
  updateOrderStatus,
  updateProduct,
  updateStore,
} from './src/db/repository.ts';
import { generateCatalogDraft } from './src/lib/gemini.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mercurehub-api' });
});

app.get('/api/workspace', requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = await getWorkspaceData(
      req.dbUserId!,
      req.user?.email || 'marchand@mercurehub.app'
    );
    res.json(data);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Erreur chargement espace.';
    res.status(500).json({ error: msg });
  }
});

app.post('/api/stores', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, platform, storeUrl, apiProtocol, bidirectionalSync } =
      req.body ?? {};
    if (!name || !platform || !storeUrl) {
      return res.status(400).json({
        error: 'Le nom, la plateforme et l’URL de la boutique sont requis.',
      });
    }
    const store = await createStore(
      req.dbUserId!,
      req.user?.email || 'marchand@mercurehub.app',
      {
        name: String(name),
        platform: String(platform),
        storeUrl: String(storeUrl),
        apiProtocol: String(apiProtocol || 'REST API + Webhooks'),
        bidirectionalSync: Boolean(bidirectionalSync ?? true),
      }
    );
    res.status(201).json(store);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Erreur connexion boutique.';
    res.status(500).json({ error: msg });
  }
});

app.patch('/api/stores/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const storeId = Number(req.params.id);
    if (!Number.isFinite(storeId)) {
      return res.status(400).json({ error: 'Identifiant boutique invalide.' });
    }
    const updated = await updateStore(
      req.dbUserId!,
      req.user?.email || 'marchand@mercurehub.app',
      storeId,
      req.body ?? {}
    );
    if (!updated) {
      return res.status(404).json({ error: 'Boutique introuvable.' });
    }
    res.json(updated);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Erreur mise à jour boutique.';
    res.status(500).json({ error: msg });
  }
});

app.delete('/api/stores/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const storeId = Number(req.params.id);
    if (!Number.isFinite(storeId)) {
      return res.status(400).json({ error: 'Identifiant boutique invalide.' });
    }
    const deleted = await deleteStore(
      req.dbUserId!,
      req.user?.email || 'marchand@mercurehub.app',
      storeId
    );
    if (!deleted) {
      return res.status(404).json({ error: 'Boutique introuvable.' });
    }
    res.json({ deletedId: deleted.id });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Erreur suppression boutique.';
    res.status(500).json({ error: msg });
  }
});

app.post('/api/products', requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = req.body ?? {};
    if (!body.title || !body.sku) {
      return res
        .status(400)
        .json({ error: 'Le titre et le SKU produit sont requis.' });
    }
    const product = await createProduct(
      req.dbUserId!,
      req.user?.email || 'marchand@mercurehub.app',
      {
        sku: String(body.sku),
        title: String(body.title),
        description: String(body.description || ''),
        seoTitle: String(body.seoTitle || body.title),
        seoTags: Array.isArray(body.seoTags) ? body.seoTags : [],
        priceCents: Number(body.priceCents ?? 0),
        stockQuantity: Number(body.stockQuantity ?? 0),
        variants: Array.isArray(body.variants) ? body.variants : [],
        channels: Array.isArray(body.channels) ? body.channels : ['shopify'],
        imageUrl: body.imageUrl ? String(body.imageUrl) : null,
        aiGenerated: Boolean(body.aiGenerated),
        marketingScript: body.marketingScript
          ? String(body.marketingScript)
          : null,
        translations: body.translations ?? {},
      }
    );
    res.status(201).json(product);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Erreur création produit.';
    res.status(500).json({ error: msg });
  }
});

app.patch('/api/products/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const productId = Number(req.params.id);
    if (!Number.isFinite(productId)) {
      return res.status(400).json({ error: 'Identifiant produit invalide.' });
    }
    const updated = await updateProduct(
      req.dbUserId!,
      req.user?.email || 'marchand@mercurehub.app',
      productId,
      req.body ?? {}
    );
    if (!updated) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }
    res.json(updated);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Erreur mise à jour produit.';
    res.status(500).json({ error: msg });
  }
});

app.delete('/api/products/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const productId = Number(req.params.id);
    if (!Number.isFinite(productId)) {
      return res.status(400).json({ error: 'Identifiant produit invalide.' });
    }
    const deleted = await deleteProduct(
      req.dbUserId!,
      req.user?.email || 'marchand@mercurehub.app',
      productId
    );
    if (!deleted) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }
    res.json({ deletedId: deleted.id });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Erreur suppression produit.';
    res.status(500).json({ error: msg });
  }
});

app.patch('/api/orders/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const orderId = Number(req.params.id);
    const { fulfillmentStatus } = req.body ?? {};
    if (!Number.isFinite(orderId) || !fulfillmentStatus) {
      return res
        .status(400)
        .json({ error: 'Identifiant et statut de commande requis.' });
    }
    const updated = await updateOrderStatus(
      req.dbUserId!,
      req.user?.email || 'marchand@mercurehub.app',
      orderId,
      String(fulfillmentStatus)
    );
    if (!updated) {
      return res.status(404).json({ error: 'Commande introuvable.' });
    }
    res.json(updated);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Erreur mise à jour commande.';
    res.status(500).json({ error: msg });
  }
});

app.post(
  '/api/webhooks/simulate',
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const { storeId, eventType, customerName, productId } = req.body ?? {};
      if (!storeId || !eventType) {
        return res
          .status(400)
          .json({ error: 'Boutique et type d’événement webhook requis.' });
      }
      const result = await simulateInboundWebhook(
        req.dbUserId!,
        req.user?.email || 'marchand@mercurehub.app',
        {
          storeId: Number(storeId),
          eventType:
            eventType === 'inventory/decrement'
              ? 'inventory/decrement'
              : 'orders/create',
          customerName: customerName ? String(customerName) : undefined,
          productId: productId ? Number(productId) : undefined,
        }
      );
      res.status(201).json(result);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Erreur simulation webhook.';
      res.status(500).json({ error: msg });
    }
  }
);

app.post('/api/jobs/:id/retry', requireAuth, async (req: AuthRequest, res) => {
  try {
    const jobId = Number(req.params.id);
    if (!Number.isFinite(jobId)) {
      return res.status(400).json({ error: 'Identifiant tâche invalide.' });
    }
    const updated = await retrySyncJob(
      req.dbUserId!,
      req.user?.email || 'marchand@mercurehub.app',
      jobId
    );
    if (!updated) {
      return res.status(404).json({ error: 'Tâche introuvable.' });
    }
    res.json(updated);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : 'Erreur relance tâche.';
    res.status(500).json({ error: msg });
  }
});

app.post('/api/ai/generate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { sourceInput, sourceType, targetChannels, tone } = req.body ?? {};
    if (!sourceInput || String(sourceInput).trim().length < 4) {
      return res.status(400).json({
        error:
          'Veuillez saisir un lien fournisseur ou une description produit (minimum 4 caractères).',
      });
    }
    const channels = Array.isArray(targetChannels)
      ? targetChannels.map(String)
      : ['shopify', 'woocommerce'];

    const draft = await generateCatalogDraft({
      sourceInput: String(sourceInput).trim(),
      sourceType:
        sourceType === 'supplier_url' ? 'supplier_url' : 'product_brief',
      targetChannels: channels,
      tone: String(tone || 'Premium & orienté conversion'),
    });

    await logAiGeneration(
      req.dbUserId!,
      req.user?.email || 'marchand@mercurehub.app',
      draft.sku,
      channels
    );

    res.json(draft);
  } catch (error: unknown) {
    console.error('Gemini AI generation failed:', error);
    const msg =
      error instanceof Error
        ? error.message
        : 'Erreur lors de la génération IA.';
    res.status(500).json({ error: msg });
  }
});

async function startServer() {
  const port = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`MercureHub server running on http://0.0.0.0:${port}`);
  });
}

startServer();
