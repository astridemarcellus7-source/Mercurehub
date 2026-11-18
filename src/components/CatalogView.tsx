import React, { useMemo, useState } from 'react';
import { Plus, Search, Trash2, X } from 'lucide-react';
import {
  formatEuro,
  PLATFORM_LABELS,
  type ProductItem,
} from '../types/commerce';
import { ProductThumbnail } from './ProductThumbnail';

interface CatalogViewProps {
  products: ProductItem[];
  onCreateProduct: (input: {
    sku: string;
    title: string;
    description: string;
    seoTitle: string;
    seoTags: string[];
    priceCents: number;
    stockQuantity: number;
    variants: Array<{
      name: string;
      sku: string;
      priceCents: number;
      stock: number;
    }>;
    channels: string[];
    imageUrl?: string | null;
    aiGenerated: boolean;
  }) => Promise<void>;
  onUpdateProduct: (
    productId: number,
    updates: {
      priceCents?: number;
      stockQuantity?: number;
      channels?: string[];
    }
  ) => Promise<void>;
  onDeleteProduct: (productId: number) => Promise<void>;
  onOpenCopilot: () => void;
}

const CHANNEL_FILTERS = [
  { id: 'all', label: 'Tous les canaux' },
  { id: 'shopify', label: 'Shopify' },
  { id: 'woocommerce', label: 'WooCommerce' },
  { id: 'tiktok_shop', label: 'TikTok Shop' },
  { id: 'stripe', label: 'Stripe' },
];

export function CatalogView({
  products,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onOpenCopilot,
}: CatalogViewProps) {
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(
    null
  );
  const [showManualForm, setShowManualForm] = useState(false);

  const [newSku, setNewSku] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newPriceEur, setNewPriceEur] = useState('89.00');
  const [newStock, setNewStock] = useState('25');
  const [newDescription, setNewDescription] = useState('');
  const [savingNew, setSavingNew] = useState(false);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesChannel =
        channelFilter === 'all' || p.channels.includes(channelFilter);
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.seoTags.some((t) => t.toLowerCase().includes(q));
      return matchesChannel && matchesSearch;
    });
  }, [products, search, channelFilter]);

  const handleAdjustStock = async (product: ProductItem, delta: number) => {
    const nextStock = Math.max(0, product.stockQuantity + delta);
    await onUpdateProduct(product.id, { stockQuantity: nextStock });
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku.trim() || !newTitle.trim()) return;
    setSavingNew(true);
    try {
      const priceCents = Math.round(
        parseFloat(newPriceEur.replace(',', '.')) * 100
      );
      await onCreateProduct({
        sku: newSku.trim().toUpperCase(),
        title: newTitle.trim(),
        description:
          newDescription.trim() ||
          'Produit ajouté au catalogue unifié MercureHub.',
        seoTitle: newTitle.trim(),
        seoTags: ['catalogue', 'e-commerce'],
        priceCents: Number.isFinite(priceCents) ? priceCents : 4900,
        stockQuantity: Math.max(0, parseInt(newStock, 10) || 0),
        variants: [],
        channels: ['shopify', 'woocommerce'],
        aiGenerated: false,
      });
      setNewSku('');
      setNewTitle('');
      setNewDescription('');
      setShowManualForm(false);
    } finally {
      setSavingNew(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white [text-wrap:balance]">
            Catalogue &amp; stocks multi-canaux
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Toute modification de stock ou de tarif déclenche une synchronisation
            bidirectionnelle vers vos canaux publiés.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowManualForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-zinc-200 bg-zinc-900 border border-zinc-700 rounded-lg hover:border-[#D4AF37]/60 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {showManualForm ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4 text-[#E5C158]" />
            )}
            <span>{showManualForm ? 'Annuler' : 'Ajout manuel'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenCopilot}
            className="px-4 py-2 text-sm font-semibold text-zinc-950 bg-[#D4AF37] rounded-lg hover:bg-[#E5C158] ring-1 ring-red-700/40 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Générer via IA
          </button>
        </div>
      </div>

      {showManualForm && (
        <form
          onSubmit={handleManualSubmit}
          className="bg-[#111114] border border-[#D4AF37]/40 rounded-xl p-6 space-y-4"
        >
          <h2 className="font-display text-base font-semibold text-white">
            Nouveau SKU catalogue
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                SKU
              </label>
              <input
                type="text"
                required
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                placeholder="MH-ART-09"
                className="w-full px-3 py-2 text-sm font-mono border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Titre produit
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Vase Sculpté Grès Chamotté"
                className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Prix (EUR)
                </label>
                <input
                  type="text"
                  value={newPriceEur}
                  onChange={(e) => setNewPriceEur(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Stock
                </label>
                <input
                  type="number"
                  min={0}
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-100"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Description commerciale
            </label>
            <textarea
              rows={2}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description courte pour Shopify & WooCommerce..."
              className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-100"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingNew}
              className="px-4 py-2 text-sm font-semibold text-zinc-950 bg-[#D4AF37] rounded-lg hover:bg-[#E5C158] disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {savingNew ? 'Enregistrement...' : 'Ajouter au catalogue'}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre, SKU ou mot-clé SEO..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#111114] border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg overflow-x-auto">
          {CHANNEL_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setChannelFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                channelFilter === f.id
                  ? 'bg-[#D4AF37] text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <section className="bg-[#111114] border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-semibold text-zinc-400">
                <th className="py-3 px-6">Produit</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Canaux synchronisés</th>
                <th className="py-3 px-4 text-right">Stock en direct</th>
                <th className="py-3 px-4 text-right">Prix unitaire</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-sm">
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-zinc-900/60 transition-colors"
                >
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-3 min-w-0">
                      <ProductThumbnail
                        src={product.imageUrl}
                        alt={product.title}
                      />
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(product)}
                          className="font-medium text-zinc-100 hover:text-[#E5C158] text-left truncate max-w-xs block cursor-pointer"
                        >
                          {product.title}
                        </button>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                          {product.variants.length > 0
                            ? `${product.variants.length} variantes`
                            : 'SKU simple'}{' '}
                          · {product.seoTags.slice(0, 2).join(' · ')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-zinc-400 whitespace-nowrap">
                    {product.sku}
                  </td>
                  <td className="py-3 px-4 text-xs text-zinc-300 whitespace-nowrap">
                    {product.channels
                      .map((c) => PLATFORM_LABELS[c] || c)
                      .join(' · ')}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => handleAdjustStock(product, -1)}
                        aria-label={`Diminuer le stock de ${product.title}`}
                        className="w-7 h-7 rounded border border-zinc-700 bg-zinc-950 text-zinc-200 hover:border-red-600/70 text-xs font-semibold cursor-pointer"
                      >
                        -
                      </button>
                      <span
                        className={`w-12 text-center font-mono text-xs tabular-nums ${
                          product.stockQuantity <= 10
                            ? 'text-red-400 font-semibold'
                            : 'text-zinc-100'
                        }`}
                      >
                        {product.stockQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdjustStock(product, 1)}
                        aria-label={`Augmenter le stock de ${product.title}`}
                        className="w-7 h-7 rounded border border-zinc-700 bg-zinc-950 text-zinc-200 hover:border-[#D4AF37]/70 text-xs font-semibold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm font-medium text-[#E5C158] tabular-nums whitespace-nowrap">
                    {formatEuro(product.priceCents)}
                  </td>
                  <td className="py-3 px-6 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(product)}
                        className="text-xs font-medium text-[#E5C158] hover:text-amber-300 cursor-pointer"
                      >
                        Détails
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(product.id)}
                        aria-label={`Supprimer ${product.title}`}
                        className="p-1.5 text-zinc-500 hover:text-red-400 rounded hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 px-6 text-center text-sm text-zinc-400"
                  >
                    Aucun produit ne correspond aux filtres sélectionnés.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#111114] border border-[#D4AF37]/40 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <ProductThumbnail
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.title}
                  sizeClass="w-12 h-12"
                />
                <div>
                  <h2 className="font-display text-lg font-semibold text-white">
                    {selectedProduct.title}
                  </h2>
                  <p className="text-xs font-mono text-[#E5C158] mt-0.5">
                    {selectedProduct.sku} ·{' '}
                    {formatEuro(selectedProduct.priceCents)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium text-zinc-400">
                  Balise Title SEO
                </p>
                <p className="text-[#E5C158] font-medium mt-0.5">
                  {selectedProduct.seoTitle}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-400">
                  Description commerciale
                </p>
                <p className="text-zinc-200 leading-relaxed mt-0.5">
                  {selectedProduct.description}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-400">
                  Mots-clés SEO
                </p>
                <p className="text-xs text-zinc-300 mt-0.5">
                  {selectedProduct.seoTags.join(' · ') || 'Aucun tag'}
                </p>
              </div>
              {selectedProduct.marketingScript && (
                <div>
                  <p className="text-xs font-medium text-zinc-400">
                    Script vidéo TikTok / Meta Ads
                  </p>
                  <p className="text-xs text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg p-3 mt-1 leading-relaxed">
                    {selectedProduct.marketingScript}
                  </p>
                </div>
              )}
              {selectedProduct.variants.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-zinc-400 mb-1.5">
                    Variantes actives
                  </p>
                  <div className="border border-zinc-800 rounded-lg divide-y divide-zinc-800">
                    {selectedProduct.variants.map((v) => (
                      <div
                        key={v.sku}
                        className="px-3 py-2 flex items-center justify-between text-xs"
                      >
                        <span className="text-zinc-100 font-medium">
                          {v.name}
                        </span>
                        <span className="font-mono text-[#E5C158] tabular-nums">
                          {v.sku} · {formatEuro(v.priceCents)} · {v.stock} u.
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
