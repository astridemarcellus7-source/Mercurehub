import React, { useState } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import {
  formatEuro,
  PLATFORM_LABELS,
  type GeneratedCatalogDraft,
} from '../types/commerce';

interface CopilotViewProps {
  onSaveDraftToCatalog: (input: {
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
    aiGenerated: boolean;
    marketingScript: string;
    translations: GeneratedCatalogDraft['translations'];
  }) => Promise<void>;
}

const PRESET_SOURCES = [
  {
    label: 'Lien fournisseur · Lampe sans fil laiton',
    type: 'supplier_url' as const,
    text: 'https://fournisseur-nord.eu/catalogue/lampe-nomade-laiton-usb-c-autonomie-36h-2700k',
  },
  {
    label: 'Brief · Montre mécanique automatique',
    type: 'product_brief' as const,
    text: 'Montre automatique acier 316L cadran soleillé bleu nuit, verre saphir bombé, étanche 10 ATM, bracelet cuir italien interchangeable.',
  },
  {
    label: 'Brief · Diffuseur céramique ultrasonique',
    type: 'product_brief' as const,
    text: 'Diffuseur d’huiles essentielles en céramique poreuse mate, réservoir 200ml silencieux 22dB, arrêt automatique et minuterie 4h.',
  },
];

const AVAILABLE_CHANNELS = [
  'shopify',
  'woocommerce',
  'tiktok_shop',
  'payhip',
  'stripe',
];

export function CopilotView({ onSaveDraftToCatalog }: CopilotViewProps) {
  const { getToken } = useAuth();
  const [sourceType, setSourceType] = useState<'supplier_url' | 'product_brief'>(
    'supplier_url'
  );
  const [sourceInput, setSourceInput] = useState(PRESET_SOURCES[0].text);
  const [targetChannels, setTargetChannels] = useState<string[]>([
    'shopify',
    'woocommerce',
    'tiktok_shop',
  ]);
  const [tone, setTone] = useState('Premium, précis et orienté conversion');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<GeneratedCatalogDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const toggleChannel = (ch: string) => {
    setTargetChannels((prev) =>
      prev.includes(ch) ? prev.filter((item) => item !== ch) : [...prev, ch]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedSuccess(false);
    setGenerating(true);
    try {
      const result = await apiFetch<GeneratedCatalogDraft>(
        '/api/ai/generate',
        getToken,
        {
          method: 'POST',
          body: JSON.stringify({
            sourceInput,
            sourceType,
            targetChannels,
            tone,
          }),
        }
      );
      setDraft(result);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la génération par le Copilote IA.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const totalStock =
        draft.variants.reduce((acc, v) => acc + v.stock, 0) || 25;
      await onSaveDraftToCatalog({
        sku: draft.sku,
        title: draft.title,
        description: draft.description,
        seoTitle: draft.seoTitle,
        seoTags: draft.seoTags,
        priceCents: draft.suggestedPriceCents,
        stockQuantity: totalStock,
        variants: draft.variants,
        channels:
          targetChannels.length > 0 ? targetChannels : ['shopify', 'woocommerce'],
        aiGenerated: true,
        marketingScript: draft.marketingScript,
        translations: draft.translations,
      });
      setSavedSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible d’enregistrer la fiche dans le catalogue.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white [text-wrap:balance]">
          Copilote IA de lancement &amp; catalogue
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Transformez un lien fournisseur ou un brief produit en fiche SEO
          complète, variantes chiffrées, script TikTok et traductions multilingues.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleGenerate}
          className="lg:col-span-5 bg-[#111114] border border-zinc-800 rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-lg">
            <button
              type="button"
              onClick={() => setSourceType('supplier_url')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                sourceType === 'supplier_url'
                  ? 'bg-[#D4AF37] text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              Lien fournisseur
            </button>
            <button
              type="button"
              onClick={() => setSourceType('product_brief')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                sourceType === 'product_brief'
                  ? 'bg-[#D4AF37] text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              Brief produit libre
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-300">
              {sourceType === 'supplier_url'
                ? 'URL ou référence fournisseur'
                : 'Caractéristiques et positionnement'}
            </label>
            <textarea
              rows={4}
              required
              value={sourceInput}
              onChange={(e) => setSourceInput(e.target.value)}
              placeholder="Collez un lien fournisseur ou décrivez votre produit..."
              className="w-full px-3 py-2.5 text-sm border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]"
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_SOURCES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setSourceType(preset.type);
                    setSourceInput(preset.text);
                  }}
                  className="text-[11px] font-medium text-[#E5C158] hover:text-amber-300 hover:underline cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-300">
              Canaux de diffusion cibles
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_CHANNELS.map((ch) => (
                <label
                  key={ch}
                  className="flex items-center gap-2 px-3 py-2 border border-zinc-800 rounded-lg text-xs text-zinc-200 cursor-pointer hover:border-[#D4AF37]/40 bg-zinc-950/60"
                >
                  <input
                    type="checkbox"
                    checked={targetChannels.includes(ch)}
                    onChange={() => toggleChannel(ch)}
                    className="rounded border-zinc-600 bg-zinc-950 accent-[#D4AF37]"
                  />
                  <span>{PLATFORM_LABELS[ch] || ch}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Ton éditorial
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-100"
            >
              <option value="Premium, précis et orienté conversion">
                Premium &amp; architectural
              </option>
              <option value="Dynamique, direct et adapté aux réseaux sociaux">
                Direct &amp; conversion TikTok Shop
              </option>
              <option value="Technique, factuel et rassurant B2B">
                Technique &amp; spécifications B2B
              </option>
            </select>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg border border-red-800/80 bg-red-950/50 text-xs text-red-200"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={generating}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-zinc-950 bg-[#D4AF37] rounded-lg hover:bg-[#E5C158] ring-1 ring-red-700/40 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Génération de la fiche complète...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Générer la fiche multi-canaux</span>
              </>
            )}
          </button>
        </form>

        <section className="lg:col-span-7 bg-[#111114] border border-zinc-800 rounded-xl p-6 min-h-[420px]">
          {!draft && !generating && (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4 space-y-2">
              <Sparkles className="w-6 h-6 text-[#D4AF37]" />
              <h2 className="font-display text-base font-semibold text-white">
                Prêt pour la génération de catalogue
              </h2>
              <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
                Sélectionnez un exemple ou saisissez votre propre produit à
                gauche. Le Copilote IA structurera le titre SEO, les variantes,
                le script vidéo et les traductions.
              </p>
            </div>
          )}

          {generating && (
            <div className="space-y-4 py-8">
              <div className="h-6 bg-zinc-800 rounded w-2/3 animate-pulse" />
              <div className="h-4 bg-zinc-800 rounded w-1/3 animate-pulse" />
              <div className="h-24 bg-zinc-900 rounded w-full animate-pulse" />
              <div className="h-28 bg-zinc-900 rounded w-full animate-pulse" />
            </div>
          )}

          {draft && !generating && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-zinc-800">
                <div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="font-mono text-zinc-200 font-semibold">
                      {draft.sku}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-[#E5C158] font-semibold tabular-nums">
                      {formatEuro(draft.suggestedPriceCents)}
                    </span>
                  </div>
                  <h2 className="font-display text-lg font-bold text-white mt-1">
                    {draft.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={saving || savedSuccess}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    savedSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#B91C1C] text-white hover:bg-red-600 ring-1 ring-[#D4AF37]/40'
                  }`}
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Publié au catalogue</span>
                    </>
                  ) : saving ? (
                    <span>Enregistrement...</span>
                  ) : (
                    <span>Publier dans le catalogue</span>
                  )}
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-400">
                  Titre SEO (&lt; 65 car.)
                </p>
                <p className="text-sm font-medium text-[#E5C158]">
                  {draft.seoTitle}
                </p>
                <p className="text-xs text-zinc-400">
                  Balises : {draft.seoTags.join(' · ')}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-400 mb-1">
                  Description persuasive
                </p>
                <p className="text-sm text-zinc-200 leading-relaxed">
                  {draft.description}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-400 mb-2">
                  Variantes &amp; dotation initiale
                </p>
                <div className="border border-zinc-800 rounded-lg divide-y divide-zinc-800">
                  {draft.variants.map((v) => (
                    <div
                      key={v.sku}
                      className="px-3.5 py-2 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-zinc-100">
                        {v.name}
                      </span>
                      <span className="font-mono text-[#E5C158] tabular-nums">
                        {v.sku} · {formatEuro(v.priceCents)} · {v.stock} u.
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-400 mb-1.5">
                  Script marketing vidéo (TikTok Shop / Reels)
                </p>
                <p className="text-xs text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 leading-relaxed">
                  {draft.marketingScript}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
                <div>
                  <p className="text-[11px] font-semibold text-zinc-400">
                    Traduction EN
                  </p>
                  <p className="text-xs font-semibold text-white mt-1">
                    {draft.translations.en.title}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    {draft.translations.en.description}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-zinc-400">
                    Traduction ES
                  </p>
                  <p className="text-xs font-semibold text-white mt-1">
                    {draft.translations.es.title}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    {draft.translations.es.description}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
