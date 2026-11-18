import React, { useState } from 'react';
import {
  CheckCircle2,
  Plus,
  RefreshCw,
  Trash2,
  Webhook,
  X,
} from 'lucide-react';
import {
  formatRelativeDate,
  PLATFORM_LABELS,
  type ProductItem,
  type StoreItem,
} from '../types/commerce';

interface StoresViewProps {
  stores: StoreItem[];
  products: ProductItem[];
  onCreateStore: (input: {
    name: string;
    platform: string;
    storeUrl: string;
    apiProtocol: string;
    bidirectionalSync: boolean;
  }) => Promise<void>;
  onUpdateStore: (
    storeId: number,
    updates: {
      bidirectionalSync?: boolean;
      status?: string;
      action?: 'sync_now';
    }
  ) => Promise<void>;
  onDeleteStore: (storeId: number) => Promise<void>;
  onSimulateWebhook: (input: {
    storeId: number;
    eventType: 'orders/create' | 'inventory/decrement';
    customerName?: string;
    productId?: number;
  }) => Promise<{ hmacVerified: boolean; signatureDigest: string }>;
}

const PROTOCOL_BY_PLATFORM: Record<string, string> = {
  shopify: 'GraphQL Admin API 2026-01',
  woocommerce: 'REST API v3 (OAuth 1.0a)',
  tiktok_shop: 'Partner Open API v2',
  payhip: 'Payhip Webhooks v2',
  stripe: 'Stripe Webhooks + Checkout',
};

export function StoresView({
  stores,
  products,
  onCreateStore,
  onUpdateStore,
  onDeleteStore,
  onSimulateWebhook,
}: StoresViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('shopify');
  const [storeUrl, setStoreUrl] = useState('');
  const [bidirectionalSync, setBidirectionalSync] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const [simStoreId, setSimStoreId] = useState<number>(stores[0]?.id ?? 0);
  const [simEventType, setSimEventType] = useState<
    'orders/create' | 'inventory/decrement'
  >('orders/create');
  const [simCustomer, setSimCustomer] = useState('Claire Fontaine');
  const [simProductId, setSimProductId] = useState<number>(
    products[0]?.id ?? 0
  );
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{
    hmacVerified: boolean;
    signatureDigest: string;
  } | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !storeUrl.trim()) return;
    setSubmitting(true);
    try {
      await onCreateStore({
        name: name.trim(),
        platform,
        storeUrl: storeUrl.trim(),
        apiProtocol: PROTOCOL_BY_PLATFORM[platform] || 'REST API + Webhooks',
        bidirectionalSync,
      });
      setName('');
      setStoreUrl('');
      setShowAddForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSync = async (storeId: number) => {
    setSyncingId(storeId);
    try {
      await onUpdateStore(storeId, { action: 'sync_now' });
    } finally {
      setSyncingId(null);
    }
  };

  const handleWebhookTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStoreId = simStoreId || stores[0]?.id;
    if (!targetStoreId) return;
    setSimulating(true);
    try {
      const result = await onSimulateWebhook({
        storeId: targetStoreId,
        eventType: simEventType,
        customerName: simCustomer,
        productId: simProductId || products[0]?.id,
      });
      setSimResult(result);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white [text-wrap:balance]">
            Hub de connexion multi-boutiques
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Connecteurs natifs OAuth et webhooks bidirectionnels pour Shopify,
            WooCommerce, TikTok Shop, Payhip et Stripe.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-zinc-950 bg-[#D4AF37] rounded-lg hover:bg-[#E5C158] ring-1 ring-red-700/40 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          {showAddForm ? (
            <X className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>{showAddForm ? 'Fermer' : 'Connecter une boutique'}</span>
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleConnect}
          className="bg-[#111114] border border-[#D4AF37]/40 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h2 className="font-display text-base font-semibold text-white">
              Nouveau connecteur OAuth / API
            </h2>
            <span className="text-xs font-mono text-[#E5C158]">
              {PROTOCOL_BY_PLATFORM[platform]}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Plateforme
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]"
              >
                <option value="shopify">Shopify (GraphQL Admin)</option>
                <option value="woocommerce">WooCommerce (REST API v3)</option>
                <option value="tiktok_shop">TikTok Shop (Partner API)</option>
                <option value="payhip">Payhip (Webhooks v2)</option>
                <option value="stripe">Stripe (Payment Links)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Nom de la boutique
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Atelier Nord Paris"
                className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Domaine / URL boutique
              </label>
              <input
                type="text"
                required
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                placeholder="atelier-nord.myshopify.com"
                className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
            <label className="inline-flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={bidirectionalSync}
                onChange={(e) => setBidirectionalSync(e.target.checked)}
                className="rounded border-zinc-600 bg-zinc-950 accent-[#D4AF37]"
              />
              <span>
                Activer la synchronisation bidirectionnelle des stocks et prix
              </span>
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-zinc-950 bg-[#D4AF37] rounded-lg hover:bg-[#E5C158] disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {submitting ? 'Connexion...' : 'Enregistrer le connecteur'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stores.map((store) => (
          <article
            key={store.id}
            className="bg-[#111114] border border-zinc-800 hover:border-red-700/50 transition-colors rounded-xl p-5 flex flex-col justify-between gap-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="font-semibold text-[#E5C158]">
                    {PLATFORM_LABELS[store.platform] || store.platform}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{store.apiProtocol}</span>
                </div>
                <h2 className="font-display text-base font-semibold text-white mt-1 truncate">
                  {store.name}
                </h2>
                <p className="font-mono text-xs text-zinc-400 mt-0.5 truncate">
                  {store.storeUrl}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>Connectée</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/80 text-xs">
              <div>
                <p className="text-zinc-500">Clé signature HMAC</p>
                <p className="font-mono text-zinc-200 mt-0.5">
                  {store.webhookSecretMask}
                </p>
              </div>
              <div>
                <p className="text-zinc-500">Dernière synchronisation</p>
                <p className="font-mono text-zinc-200 mt-0.5 tabular-nums">
                  {formatRelativeDate(store.lastSyncedAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={store.bidirectionalSync}
                  onChange={() =>
                    onUpdateStore(store.id, {
                      bidirectionalSync: !store.bidirectionalSync,
                    })
                  }
                  className="rounded border-zinc-600 bg-zinc-950 accent-[#D4AF37]"
                />
                <span>Sync bidirectionnelle</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleManualSync(store.id)}
                  disabled={syncingId === store.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 bg-zinc-900 border border-zinc-700 hover:border-[#D4AF37]/60 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-[#E5C158] ${
                      syncingId === store.id ? 'animate-spin' : ''
                    }`}
                  />
                  <span>Synchroniser</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteStore(store.id)}
                  aria-label={`Déconnecter ${store.name}`}
                  className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {stores.length > 0 && (
        <section className="bg-[#111114] border border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <Webhook className="w-4 h-4 text-red-500" />
                <h2 className="font-display text-base font-semibold text-white">
                  Testeur de webhook entrant &amp; signature HMAC-SHA256
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Simule un événement réel depuis une boutique connectée, vérifie
                l’empreinte HMAC côté serveur et met à jour commandes et stocks
                en base PostgreSQL.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleWebhookTest}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
          >
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Boutique émettrice
              </label>
              <select
                value={simStoreId || stores[0]?.id}
                onChange={(e) => setSimStoreId(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-100"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({PLATFORM_LABELS[s.platform] || s.platform})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Événement webhook
              </label>
              <select
                value={simEventType}
                onChange={(e) =>
                  setSimEventType(
                    e.target.value as 'orders/create' | 'inventory/decrement'
                  )
                }
                className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-100"
              >
                <option value="orders/create">
                  orders/create (Nouvelle commande)
                </option>
                <option value="inventory/decrement">
                  inventory/decrement (-1 unité stock)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Client / Produit cible
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={simCustomer}
                  onChange={(e) => setSimCustomer(e.target.value)}
                  placeholder="Nom client"
                  className="w-1/2 px-3 py-2 text-sm border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-100"
                />
                <select
                  value={simProductId || products[0]?.id || 0}
                  onChange={(e) => setSimProductId(Number(e.target.value))}
                  className="w-1/2 px-2 py-2 text-xs border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-100"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={simulating}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#B91C1C] rounded-lg hover:bg-red-600 ring-1 ring-[#D4AF37]/40 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {simulating ? 'Traitement...' : 'Émettre le webhook'}
            </button>
          </form>

          {simResult && (
            <div className="p-3.5 rounded-lg bg-emerald-950/50 border border-emerald-700/60 text-xs text-emerald-200 flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">
                Signature HMAC-SHA256 vérifiée (
                {simResult.hmacVerified ? 'Valide' : 'Échec'}) · Commande &amp;
                file d’attente persistées en PostgreSQL.
              </span>
              <span className="font-mono text-[#E5C158]">
                digest: {simResult.signatureDigest}
              </span>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
