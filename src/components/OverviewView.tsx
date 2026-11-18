import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  formatEuro,
  formatRelativeDate,
  PLATFORM_LABELS,
  type OrderItem,
  type ProductItem,
  type StoreItem,
  type SyncJobItem,
} from '../types/commerce';
import { ProductThumbnail } from './ProductThumbnail';

export type WorkspaceTab =
  | 'overview'
  | 'stores'
  | 'catalog'
  | 'copilot'
  | 'orders'
  | 'security';

interface OverviewViewProps {
  stores: StoreItem[];
  products: ProductItem[];
  orders: OrderItem[];
  syncJobs: SyncJobItem[];
  onNavigate: (tab: WorkspaceTab) => void;
}

export function OverviewView({
  stores,
  products,
  orders,
  syncJobs,
  onNavigate,
}: OverviewViewProps) {
  const totalRevenueCents = orders.reduce((sum, o) => sum + o.totalCents, 0);
  const connectedStoresCount = stores.filter(
    (s) => s.status === 'connected'
  ).length;
  const totalUnitsInStock = products.reduce(
    (sum, p) => sum + p.stockQuantity,
    0
  );
  const failedJobsCount = syncJobs.filter((j) => j.status === 'failed').length;

  const revenueByPlatform = stores.map((store) => {
    const channelOrders = orders.filter((o) => o.platform === store.platform);
    const amountCents = channelOrders.reduce((s, o) => s + o.totalCents, 0);
    return {
      storeId: store.id,
      name: store.name,
      platform: PLATFORM_LABELS[store.platform] || store.platform,
      orderCount: channelOrders.length,
      amountCents,
      bidirectionalSync: store.bidirectionalSync,
    };
  });

  const maxChannelRevenue = Math.max(
    1,
    ...revenueByPlatform.map((c) => c.amountCents)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white [text-wrap:balance]">
            Vue d’ensemble multi-canaux
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Activité commerciale consolidée, état des connecteurs et file de
            synchronisation en temps réel.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('copilot')}
            className="px-4 py-2 text-sm font-semibold text-zinc-950 bg-[#D4AF37] rounded-lg hover:bg-[#E5C158] ring-1 ring-red-700/40 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Lancer le Copilote IA
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#111114] border border-zinc-800 hover:border-[#D4AF37]/40 transition-colors rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-400">
            Volume de commandes consolidé
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-[#E5C158] tabular-nums">
            {formatEuro(totalRevenueCents)}
          </p>
          <p className="mt-1.5 text-xs text-zinc-400 tabular-nums">
            {orders.length} commandes multi-canaux enregistrées
          </p>
        </div>

        <div className="bg-[#111114] border border-zinc-800 hover:border-[#D4AF37]/40 transition-colors rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-400">Boutiques actives</p>
          <p className="mt-2 font-display text-2xl font-bold text-white tabular-nums">
            {connectedStoresCount} / {stores.length}
          </p>
          <p className="mt-1.5 text-xs text-zinc-400">
            Connecteurs OAuth &amp; Webhooks vérifiés
          </p>
        </div>

        <div className="bg-[#111114] border border-zinc-800 hover:border-[#D4AF37]/40 transition-colors rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-400">
            Catalogue &amp; inventaire unifié
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-white tabular-nums">
            {products.length} SKUs
          </p>
          <p className="mt-1.5 text-xs text-zinc-400 tabular-nums">
            {totalUnitsInStock} unités disponibles tous canaux
          </p>
        </div>

        <div className="bg-[#111114] border border-zinc-800 hover:border-red-700/60 transition-colors rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-400">
            File de synchronisation asynchrone
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-white tabular-nums">
            {syncJobs.length} tâches
          </p>
          <p
            className={`mt-1.5 text-xs font-medium ${
              failedJobsCount > 0 ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {failedJobsCount > 0
              ? `${failedJobsCount} tâche à relancer`
              : 'File nominale sans erreur'}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-[#111114] border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h2 className="font-display text-base font-semibold text-white">
                Répartition par canal de vente
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Chiffre d’affaires généré et mode de synchronisation par boutique
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('stores')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#E5C158] hover:text-amber-300 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Gérer les boutiques</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-zinc-800/80 mt-2">
            {revenueByPlatform.map((channel) => {
              const pct = Math.round(
                (channel.amountCents / maxChannelRevenue) * 100
              );
              return (
                <div key={channel.storeId} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-zinc-100 truncate">
                        {channel.name}
                      </span>
                      <span className="text-xs text-zinc-600" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-xs text-zinc-400 whitespace-nowrap">
                        {channel.platform}
                      </span>
                      <span className="text-xs text-zinc-600" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-xs text-zinc-400 whitespace-nowrap">
                        {channel.bidirectionalSync
                          ? 'Sync bidirectionnelle'
                          : 'Lecture seule'}
                      </span>
                    </div>
                    <span className="font-mono text-sm font-semibold text-[#E5C158] tabular-nums shrink-0">
                      {formatEuro(channel.amountCents)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#D4AF37] to-[#DC2626] rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {revenueByPlatform.length === 0 && (
              <p className="py-8 text-sm text-zinc-400 text-center">
                Aucune boutique connectée pour le moment.
              </p>
            )}
          </div>
        </section>

        <section className="lg:col-span-5 bg-[#111114] border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <h2 className="font-display text-base font-semibold text-white">
                Journal de file asynchrone
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Derniers webhooks et mises à jour de stock
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#E5C158] hover:text-amber-300 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Voir la file</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-zinc-800/80 mt-2">
            {syncJobs.slice(0, 5).map((job) => (
              <div
                key={job.id}
                className="py-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    {job.status === 'failed' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    ) : job.status === 'queued' ? (
                      <RefreshCw className="w-3.5 h-3.5 text-[#E5C158] shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    <span className="font-medium text-zinc-100">
                      {PLATFORM_LABELS[job.platform] || job.platform}
                    </span>
                    <span className="text-zinc-600" aria-hidden="true">
                      ·
                    </span>
                    <span
                      className={
                        job.status === 'failed'
                          ? 'text-red-400 font-medium'
                          : 'text-zinc-400'
                      }
                    >
                      {job.status === 'failed' ? 'Échec' : 'Terminée'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {job.payloadSummary}
                  </p>
                </div>
                <span className="font-mono text-[11px] text-zinc-500 tabular-nums shrink-0">
                  {job.latencyMs} ms
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-[#111114] border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-white">
              Produits récemment synchronisés
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Catalogue maître partagé entre vos boutiques connectées
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#E5C158] hover:text-amber-300 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Ouvrir le catalogue</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-semibold text-zinc-400">
                <th className="py-2.5 px-6">Produit</th>
                <th className="py-2.5 px-4">SKU</th>
                <th className="py-2.5 px-4">Canaux publiés</th>
                <th className="py-2.5 px-4 text-right">Stock</th>
                <th className="py-2.5 px-6 text-right">Tarif TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-sm">
              {products.slice(0, 4).map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-zinc-900/60 transition-colors"
                >
                  <td className="py-2.5 px-6">
                    <div className="flex items-center gap-3 min-w-0">
                      <ProductThumbnail
                        src={product.imageUrl}
                        alt={product.title}
                        sizeClass="w-10 h-10"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-100 truncate max-w-xs">
                          {product.title}
                        </p>
                        <p className="text-xs text-zinc-400 truncate">
                          {product.aiGenerated
                            ? 'Généré par Copilote IA'
                            : 'Catalogue importé'}{' '}
                          · Maj {formatRelativeDate(product.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-xs text-zinc-400 whitespace-nowrap">
                    {product.sku}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-zinc-300 whitespace-nowrap">
                    {product.channels
                      .map((c) => PLATFORM_LABELS[c] || c)
                      .join(' · ')}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-xs tabular-nums">
                    <span
                      className={
                        product.stockQuantity <= 10
                          ? 'text-red-400 font-semibold'
                          : 'text-zinc-200'
                      }
                    >
                      {product.stockQuantity} u.
                    </span>
                  </td>
                  <td className="py-2.5 px-6 text-right font-mono text-sm font-medium text-[#E5C158] tabular-nums whitespace-nowrap">
                    {formatEuro(product.priceCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
