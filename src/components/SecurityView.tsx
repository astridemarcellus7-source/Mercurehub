import { CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import {
  formatRelativeDate,
  type MerchantUser,
  type SecurityAuditItem,
} from '../types/commerce';

interface SecurityViewProps {
  user: MerchantUser | null;
  auditLogs: SecurityAuditItem[];
}

export function SecurityView({ user, auditLogs }: SecurityViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white [text-wrap:balance]">
          Sécurité, isolation &amp; journal d’audit
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Contrôles d’accès RBAC par locataire, vérification cryptographique
          des webhooks entrants et traçabilité PostgreSQL.
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111114] border border-zinc-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>Authentification &amp; RBAC</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Jetons Firebase ID vérifiés côté serveur sur chaque route API.
            Isolation stricte des requêtes SQL par identifiant utilisateur.
          </p>
          <p className="text-xs font-mono text-[#E5C158] pt-1">
            Rôle actif : {user?.role || 'admin'} · {user?.email}
          </p>
        </div>

        <div className="bg-[#111114] border border-zinc-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Lock className="w-4 h-4 text-red-500" />
            <span>Webhooks HMAC-SHA256</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Validation à temps constant (
            <code className="font-mono text-zinc-200">timingSafeEqual</code>)
            des signatures entrantes Shopify, WooCommerce, TikTok Shop et Stripe.
          </p>
          <p className="text-xs font-medium text-emerald-400 pt-1">
            Vérification active sur tous les connecteurs
          </p>
        </div>

        <div className="bg-[#111114] border border-zinc-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
            <span>Clés &amp; secrets serveur</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Les appels au moteur IA et les secrets de signature restent
            strictement confinés dans l’environnement Express côté serveur.
          </p>
          <p className="text-xs font-mono text-zinc-300 pt-1">
            Secrets masqués côté client
          </p>
        </div>
      </section>

      <section className="bg-[#111114] border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="font-display text-base font-semibold text-white">
            Journal d’audit de sécurité
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Événements d’authentification, mutations catalogue et vérifications
            HMAC persistés en base
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-semibold text-zinc-400">
                <th className="py-2.5 px-6">Horodatage</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Ressource</th>
                <th className="py-2.5 px-4">Acteur</th>
                <th className="py-2.5 px-6 text-right">Intégrité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-xs">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-900/60">
                  <td className="py-2.5 px-6 font-mono text-zinc-400 tabular-nums whitespace-nowrap">
                    {formatRelativeDate(log.createdAt)}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-[#E5C158] whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-4 text-zinc-200">{log.resource}</td>
                  <td className="py-2.5 px-4 text-zinc-400 whitespace-nowrap">
                    {log.actorEmail}
                  </td>
                  <td className="py-2.5 px-6 text-right whitespace-nowrap">
                    <span
                      className={
                        log.hmacVerified
                          ? 'text-emerald-400 font-medium'
                          : 'text-red-400 font-medium'
                      }
                    >
                      {log.hmacVerified ? 'Vérifié' : 'Rejeté'}
                    </span>
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
