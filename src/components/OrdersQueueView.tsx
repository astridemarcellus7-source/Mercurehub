import { useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import {
  formatEuro,
  formatRelativeDate,
  PLATFORM_LABELS,
  type OrderItem,
  type SyncJobItem,
} from '../types/commerce';

interface OrdersQueueViewProps {
  orders: OrderItem[];
  syncJobs: SyncJobItem[];
  onUpdateOrderStatus: (orderId: number, status: string) => Promise<void>;
  onRetryJob: (jobId: number) => Promise<void>;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  processing: 'En préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  refunded: 'Remboursée',
};

const JOB_TYPE_LABELS: Record<string, string> = {
  inventory_sync: 'Sync stock',
  price_update: 'Mise à jour tarif',
  order_webhook: 'Webhook commande',
  catalog_push: 'Publication fiche',
  ai_enrichment: 'Enrichissement IA',
};

export function OrdersQueueView({
  orders,
  syncJobs,
  onUpdateOrderStatus,
  onRetryJob,
}: OrdersQueueViewProps) {
  const [subTab, setSubTab] = useState<'orders' | 'queue'>('orders');
  const [retryingId, setRetryingId] = useState<number | null>(null);

  const handleRetry = async (jobId: number) => {
    setRetryingId(jobId);
    try {
      await onRetryJob(jobId);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white [text-wrap:balance]">
            Commandes &amp; file de webhooks
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Suivi centralisé des expéditions multi-boutiques et supervision de la
            file asynchrone des tâches de synchronisation.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('orders')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'orders'
                ? 'bg-[#D4AF37] text-zinc-950 font-semibold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Commandes ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('queue')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'queue'
                ? 'bg-[#D4AF37] text-zinc-950 font-semibold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            File asynchrone ({syncJobs.length})
          </button>
        </div>
      </div>

      {subTab === 'orders' ? (
        <section className="bg-[#111114] border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-semibold text-zinc-400">
                  <th className="py-3 px-6">Référence</th>
                  <th className="py-3 px-4">Canal</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4 text-right">Articles</th>
                  <th className="py-3 px-4 text-right">Montant TTC</th>
                  <th className="py-3 px-6 text-right">Statut logistique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-sm">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-zinc-900/60 transition-colors"
                  >
                    <td className="py-3 px-6 font-mono text-xs font-semibold text-[#E5C158] whitespace-nowrap">
                      #{order.externalOrderRef}
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-300 whitespace-nowrap">
                      {PLATFORM_LABELS[order.platform] || order.platform}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium text-zinc-100">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {order.customerEmail} ·{' '}
                        {formatRelativeDate(order.createdAt)}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-zinc-300 tabular-nums">
                      {order.itemsCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm font-medium text-[#E5C158] tabular-nums whitespace-nowrap">
                      {formatEuro(order.totalCents)}
                    </td>
                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      <select
                        value={order.fulfillmentStatus}
                        aria-label={`Statut commande ${order.externalOrderRef}`}
                        onChange={(e) =>
                          onUpdateOrderStatus(order.id, e.target.value)
                        }
                        className="px-2.5 py-1.5 text-xs font-medium border border-zinc-700 rounded-lg bg-zinc-950 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                      >
                        {Object.entries(ORDER_STATUS_LABELS).map(
                          ([val, label]) => (
                            <option key={val} value={val}>
                              {label}
                            </option>
                          )
                        )}
                      </select>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 px-6 text-center text-sm text-zinc-400"
                    >
                      Aucune commande enregistrée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="bg-[#111114] border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-semibold text-zinc-400">
                  <th className="py-3 px-6">Type &amp; Canal</th>
                  <th className="py-3 px-4">Charge utile</th>
                  <th className="py-3 px-4 text-right">Tentatives</th>
                  <th className="py-3 px-4 text-right">Latence</th>
                  <th className="py-3 px-6 text-right">État</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-sm">
                {syncJobs.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-zinc-900/60 transition-colors"
                  >
                    <td className="py-3 px-6 whitespace-nowrap">
                      <p className="text-xs font-semibold text-zinc-100">
                        {JOB_TYPE_LABELS[job.jobType] || job.jobType}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {PLATFORM_LABELS[job.platform] || job.platform} ·{' '}
                        {formatRelativeDate(job.createdAt)}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-300 max-w-md">
                      {job.payloadSummary}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-zinc-300 tabular-nums">
                      {job.attempts}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-zinc-300 tabular-nums whitespace-nowrap">
                      {job.latencyMs} ms
                    </td>
                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      {job.status === 'failed' ? (
                        <div className="inline-flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Échec</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRetry(job.id)}
                            disabled={retryingId === job.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-[#B91C1C] rounded hover:bg-red-600 ring-1 ring-[#D4AF37]/40 cursor-pointer"
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${
                                retryingId === job.id ? 'animate-spin' : ''
                              }`}
                            />
                            <span>Relancer</span>
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Terminée</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
