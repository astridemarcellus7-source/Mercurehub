import { useCallback, useEffect, useState } from 'react';
import {
  Boxes,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  Store,
  X,
} from 'lucide-react';
import { AuthGate } from './components/AuthGate';
import { CatalogView } from './components/CatalogView';
import { CopilotView } from './components/CopilotView';
import { OrdersQueueView } from './components/OrdersQueueView';
import { OverviewView, type WorkspaceTab } from './components/OverviewView';
import { SecurityView } from './components/SecurityView';
import { StoresView } from './components/StoresView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { apiFetch } from './lib/api';
import type {
  GeneratedCatalogDraft,
  OrderItem,
  ProductItem,
  StoreItem,
  SyncJobItem,
  WorkspacePayload,
} from './types/commerce';

const NAV_ITEMS: Array<{
  id: WorkspaceTab;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'overview', label: 'Vue d’ensemble', icon: LayoutDashboard },
  { id: 'stores', label: 'Boutiques', icon: Store },
  { id: 'catalog', label: 'Catalogue & Stock', icon: Boxes },
  { id: 'copilot', label: 'Copilote IA', icon: Sparkles },
  { id: 'orders', label: 'Commandes & File', icon: ListChecks },
  { id: 'security', label: 'Sécurité & Audit', icon: ShieldCheck },
];

function WorkspaceShell() {
  const { firebaseUser, loading: authLoading, logout, getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    if (!firebaseUser) return;
    setLoadingData(true);
    setDataError(null);
    try {
      const payload = await apiFetch<WorkspacePayload>(
        '/api/workspace',
        getToken
      );
      setWorkspace(payload);
    } catch (err: unknown) {
      setDataError(
        err instanceof Error
          ? err.message
          : 'Impossible de charger les données du hub.'
      );
    } finally {
      setLoadingData(false);
    }
  }, [firebaseUser, getToken]);

  useEffect(() => {
    if (firebaseUser) {
      loadWorkspace();
    } else {
      setWorkspace(null);
    }
  }, [firebaseUser, loadWorkspace]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="text-sm text-[#E5C158]">
          Vérification de la session marchand...
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <AuthGate />;
  }

  const handleCreateStore = async (input: {
    name: string;
    platform: string;
    storeUrl: string;
    apiProtocol: string;
    bidirectionalSync: boolean;
  }) => {
    await apiFetch<StoreItem>('/api/stores', getToken, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    await loadWorkspace();
  };

  const handleUpdateStore = async (
    storeId: number,
    updates: {
      bidirectionalSync?: boolean;
      status?: string;
      action?: 'sync_now';
    }
  ) => {
    await apiFetch<StoreItem>(`/api/stores/${storeId}`, getToken, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    await loadWorkspace();
  };

  const handleDeleteStore = async (storeId: number) => {
    await apiFetch<{ deletedId: number }>(`/api/stores/${storeId}`, getToken, {
      method: 'DELETE',
    });
    await loadWorkspace();
  };

  const handleSimulateWebhook = async (input: {
    storeId: number;
    eventType: 'orders/create' | 'inventory/decrement';
    customerName?: string;
    productId?: number;
  }) => {
    const res = await apiFetch<{
      hmacVerified: boolean;
      signatureDigest: string;
    }>('/api/webhooks/simulate', getToken, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    await loadWorkspace();
    return res;
  };

  const handleCreateProduct = async (input: {
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
    marketingScript?: string;
    translations?: GeneratedCatalogDraft['translations'];
  }) => {
    await apiFetch<ProductItem>('/api/products', getToken, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    await loadWorkspace();
  };

  const handleUpdateProduct = async (
    productId: number,
    updates: {
      priceCents?: number;
      stockQuantity?: number;
      channels?: string[];
    }
  ) => {
    await apiFetch<ProductItem>(`/api/products/${productId}`, getToken, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    await loadWorkspace();
  };

  const handleDeleteProduct = async (productId: number) => {
    await apiFetch<{ deletedId: number }>(
      `/api/products/${productId}`,
      getToken,
      {
        method: 'DELETE',
      }
    );
    await loadWorkspace();
  };

  const handleUpdateOrderStatus = async (
    orderId: number,
    fulfillmentStatus: string
  ) => {
    await apiFetch<OrderItem>(`/api/orders/${orderId}`, getToken, {
      method: 'PATCH',
      body: JSON.stringify({ fulfillmentStatus }),
    });
    await loadWorkspace();
  };

  const handleRetryJob = async (jobId: number) => {
    await apiFetch<SyncJobItem>(`/api/jobs/${jobId}/retry`, getToken, {
      method: 'POST',
    });
    await loadWorkspace();
  };

  const activeNavLabel =
    NAV_ITEMS.find((item) => item.id === activeTab)?.label || 'Vue d’ensemble';

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 noir-crimson-aura flex">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0D0D10] border-r border-zinc-800/90 text-zinc-300 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="h-[2px] w-full bg-gradient-to-r from-[#D4AF37] via-[#B91C1C] to-transparent" />
          <div className="h-16 px-6 border-b border-zinc-800/90 flex items-center justify-between">
            <span className="font-display text-lg font-bold tracking-tight text-[#E5C158] whitespace-nowrap">
              MercureHub
            </span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-zinc-400 hover:text-white cursor-pointer"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-zinc-900 text-[#E5C158] border border-[#D4AF37]/30'
                      : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-100 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#D4AF37]' : 'text-zinc-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-800/90 space-y-3">
          <div className="px-2">
            <p className="text-xs font-semibold text-zinc-100 truncate">
              {firebaseUser.displayName || 'Marchand'}
            </p>
            <p className="text-[11px] text-zinc-400 truncate">
              {firebaseUser.email}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-[#0D0D10]/90 backdrop-blur-sm border-b border-zinc-800/90 shrink-0">
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#B91C1C]/80 to-[#D4AF37]" />
          <div className="h-16 px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-1.5 text-zinc-400 hover:text-white cursor-pointer"
                aria-label="Ouvrir le menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <nav
                aria-label="Fil d'Ariane"
                className="flex items-center gap-2 text-sm text-zinc-400 min-w-0"
              >
                <span className="font-medium text-[#E5C158] whitespace-nowrap">
                  MercureHub
                </span>
                <span aria-hidden="true">/</span>
                <span className="truncate text-zinc-200">{activeNavLabel}</span>
              </nav>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('copilot')}
              className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-[#D4AF37] rounded-lg hover:bg-[#E5C158] ring-1 ring-red-700/40 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Nouveau produit IA
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-8">
          {dataError && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl border border-red-800/80 bg-red-950/50 flex items-center justify-between gap-4 text-sm text-red-200"
            >
              <span>{dataError}</span>
              <button
                type="button"
                onClick={loadWorkspace}
                className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 border border-red-700/60 text-red-200 rounded-lg hover:bg-red-900/40 cursor-pointer shrink-0"
              >
                Réessayer
              </button>
            </div>
          )}

          {loadingData && !workspace ? (
            <div className="space-y-4">
              <div className="h-8 w-64 bg-zinc-800 rounded animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-28 bg-[#111114] border border-zinc-800 rounded-xl animate-pulse"
                  />
                ))}
              </div>
              <div className="h-64 bg-[#111114] border border-zinc-800 rounded-xl animate-pulse" />
            </div>
          ) : workspace ? (
            <>
              {activeTab === 'overview' && (
                <OverviewView
                  stores={workspace.stores}
                  products={workspace.products}
                  orders={workspace.orders}
                  syncJobs={workspace.syncJobs}
                  onNavigate={setActiveTab}
                />
              )}
              {activeTab === 'stores' && (
                <StoresView
                  stores={workspace.stores}
                  products={workspace.products}
                  onCreateStore={handleCreateStore}
                  onUpdateStore={handleUpdateStore}
                  onDeleteStore={handleDeleteStore}
                  onSimulateWebhook={handleSimulateWebhook}
                />
              )}
              {activeTab === 'catalog' && (
                <CatalogView
                  products={workspace.products}
                  onCreateProduct={handleCreateProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onOpenCopilot={() => setActiveTab('copilot')}
                />
              )}
              {activeTab === 'copilot' && (
                <CopilotView onSaveDraftToCatalog={handleCreateProduct} />
              )}
              {activeTab === 'orders' && (
                <OrdersQueueView
                  orders={workspace.orders}
                  syncJobs={workspace.syncJobs}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onRetryJob={handleRetryJob}
                />
              )}
              {activeTab === 'security' && (
                <SecurityView
                  user={workspace.user}
                  auditLogs={workspace.auditLogs}
                />
              )}
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceShell />
    </AuthProvider>
  );
}
