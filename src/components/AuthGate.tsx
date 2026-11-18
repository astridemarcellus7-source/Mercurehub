import { ArrowRight, Layers, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SHOWCASE_PRODUCTS = [
  {
    src: '/src/assets/images/product_ceramic_lamp_1795011694422.jpg',
    title: 'Lampe Grès & Lin',
    channel: 'Shopify · WooCommerce',
  },
  {
    src: '/src/assets/images/product_audio_headphones_1795011695552.jpg',
    title: 'Casque Studio ANC',
    channel: 'TikTok Shop · Stripe',
  },
  {
    src: '/src/assets/images/product_espresso_kettle_1795011696092.jpg',
    title: 'Bouilloire PID Noyer',
    channel: 'Shopify · TikTok Shop',
  },
  {
    src: '/src/assets/images/product_linen_tote_1795011696415.jpg',
    title: 'Cabas Toile Bio',
    channel: 'WooCommerce · Stripe',
  },
];

export function AuthGate() {
  const { signInWithGoogle, authError } = useAuth();

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 noir-crimson-aura flex flex-col">
      <header className="border-b border-zinc-800/90 bg-[#09090B]/90 backdrop-blur-sm">
        <div className="h-[2px] w-full bg-gradient-to-r from-[#D4AF37] via-[#B91C1C] to-transparent" />
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <span className="font-display text-lg font-bold tracking-tight text-[#E5C158] whitespace-nowrap shrink-0">
            MercureHub
          </span>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <a
              href="#architecture"
              className="hover:text-[#E5C158] transition-colors whitespace-nowrap shrink-0"
            >
              Connecteurs
            </a>
            <a
              href="#copilote"
              className="hover:text-[#E5C158] transition-colors whitespace-nowrap shrink-0"
            >
              Copilote IA
            </a>
            <a
              href="#securite"
              className="hover:text-[#E5C158] transition-colors whitespace-nowrap shrink-0"
            >
              Sécurité HMAC
            </a>
            <a
              href="#catalogue"
              className="hover:text-[#E5C158] transition-colors whitespace-nowrap shrink-0"
            >
              Catalogue unifié
            </a>
          </nav>
          <button
            type="button"
            onClick={signInWithGoogle}
            className="px-4 py-2 text-sm font-semibold text-zinc-950 bg-[#D4AF37] rounded-lg hover:bg-[#E5C158] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Accéder à la console
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
            <div className="space-y-5">
              <p className="text-xs font-semibold text-[#E5C158] tracking-wide">
                Plateforme SaaS E-Commerce Multi-Canaux · PostgreSQL &amp; IA
              </p>
              <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.12] [text-wrap:balance]">
                Pilotez vos boutiques et votre catalogue depuis un hub centralisé.
              </h1>
              <p className="text-base text-zinc-300 leading-relaxed max-w-2xl">
                Connectez Shopify, WooCommerce, TikTok Shop, Payhip et Stripe en
                synchronisation bidirectionnelle. Générez vos fiches produits SEO,
                variantes, traductions et scripts marketing en quelques secondes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={signInWithGoogle}
                className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold text-zinc-950 bg-[#D4AF37] rounded-lg hover:bg-[#E5C158] ring-1 ring-red-700/40 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Connexion marchand avec Google</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-zinc-400">
                Espace isolé par tenant · Persistance PostgreSQL Cloud SQL
              </span>
            </div>

            {authError && (
              <div
                role="alert"
                className="p-4 rounded-lg border border-red-800/80 bg-red-950/60 text-sm text-red-200"
              >
                {authError}
              </div>
            )}

            <div
              id="architecture"
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-zinc-800"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
                  <Layers className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>Connecteurs natifs</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Shopify GraphQL, WooCommerce REST, TikTok Shop, Payhip et Stripe
                  avec file asynchrone.
                </p>
              </div>
              <div id="copilote" className="space-y-2">
                <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
                  <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>Copilote catalogue</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Descriptions persuasives, balises SEO, variantes, traductions et
                  scripts TikTok générés par IA.
                </p>
              </div>
              <div id="securite" className="space-y-2">
                <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
                  <ShieldCheck className="w-4 h-4 text-red-500 shrink-0" />
                  <span>Intégrité HMAC-SHA256</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Vérification cryptographique des webhooks entrants et journal
                  d’audit par marchand.
                </p>
              </div>
            </div>
          </div>

          <div
            id="catalogue"
            className="lg:col-span-5 bg-[#111114] border border-zinc-800 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <h2 className="font-display text-sm font-semibold text-white">
                  Aperçu du catalogue unifié
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Synchronisation multi-boutiques en temps réel
                </p>
              </div>
              <span className="text-xs font-mono text-[#E5C158] tabular-nums">
                4 canaux
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 my-5">
              {SHOWCASE_PRODUCTS.map((item) => (
                <div
                  key={item.title}
                  className="border border-zinc-800 hover:border-red-700/60 transition-colors rounded-lg overflow-hidden bg-zinc-950"
                >
                  <div className="aspect-square bg-zinc-900 overflow-hidden">
                    <img
                      src={item.src}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 bg-[#141418]">
                    <p className="text-xs font-semibold text-zinc-100 truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {item.channel}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <span>Shopify · WooCommerce · TikTok · Stripe</span>
              <span className="font-mono text-[#E5C158]">PostgreSQL</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
