'use client'

import { AlertCircle, Mail, MessageCircle, MessageSquare, PhoneCall } from 'lucide-react'
import { formatFcfa, type CreanceEnrichie } from '@/lib/domain'
import RelanceActionClient from '@/app/components/RelanceActionClient'

const levelClass: Record<CreanceEnrichie['niveau'], string> = {
  Faible: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  Moyen: 'border-amber-300 bg-amber-50 text-amber-950',
  Élevé: 'border-orange-300 bg-orange-50 text-orange-950',
  Critique: 'border-red-300 bg-red-50 text-red-900',
}

export default function CreanceMobileCard({
  invoice,
  onPay,
  paying,
}: {
  invoice: CreanceEnrichie
  onPay: (invoice: CreanceEnrichie) => void
  paying: boolean
}) {
  const contact = invoice.clients?.telephone || invoice.clients?.whatsapp || invoice.clients?.email
  const phone = invoice.clients?.telephone || invoice.clients?.whatsapp
  const channelIcon = invoice.canal_effectif === 'whatsapp' ? <MessageCircle size={16} />
    : invoice.canal_effectif === 'email' ? <Mail size={16} />
      : invoice.canal_effectif === 'sms' ? <MessageSquare size={16} />
        : invoice.canal_effectif === 'tel' ? <PhoneCall size={16} />
          : <AlertCircle size={16} />

  return (
    <article className="min-w-0 border border-slate-200 border-l-4 border-l-now-yellow bg-white p-4 shadow-sm">
      <header className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0"><h2 className="break-words text-base font-bold text-now-blue">{invoice.clients?.nom || 'Client inconnu'}</h2><p className="mt-1 break-all text-sm text-slate-600">{contact || 'Coordonnée manquante'}</p></div>
        <span className={`shrink-0 border px-2 py-1 text-xs font-bold ${levelClass[invoice.niveau]}`}>{invoice.niveau}</span>
      </header>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-xs font-semibold text-slate-500">Solde</dt><dd className="mt-1 font-bold text-now-blue">{formatFcfa(invoice.solde_restant)}</dd></div>
        <div><dt className="text-xs font-semibold text-slate-500">Retard</dt><dd className="mt-1 font-bold text-now-blue">{invoice.jours_retard} j</dd></div>
        <div><dt className="text-xs font-semibold text-slate-500">Statut</dt><dd className="mt-1 font-semibold text-slate-800">{invoice.statut_calcule === 'partielle' ? 'Partielle' : invoice.statut_calcule === 'payee' ? 'Soldée' : invoice.statut_calcule === 'annulee' ? 'Annulée' : 'En attente'}</dd></div>
        <div><dt className="text-xs font-semibold text-slate-500">Canal effectif</dt><dd className="mt-1 flex items-center gap-1.5 font-semibold text-slate-800">{channelIcon}{invoice.canal_effectif ?? 'Manquant'}</dd></div>
      </dl>
      {!['payee', 'annulee'].includes(invoice.statut_calcule) && <div className="mt-4 grid grid-cols-2 gap-2">
        <a href={`#relance-${invoice.id}`} className="inline-flex min-h-12 items-center justify-center bg-now-blue px-3 py-3 text-sm font-bold text-white">{invoice.recommandation.appelRecommande ? 'Préparer l’appel' : invoice.canal_effectif ? `Relancer · ${invoice.canal_effectif}` : 'Coordonnée manquante'}</a>
        <button type="button" onClick={() => onPay(invoice)} disabled={paying} className="min-h-12 border border-slate-300 px-3 py-3 text-sm font-semibold text-now-blue disabled:opacity-60">Paiement</button>
        {invoice.recommandation.appelRecommande && phone && <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} className="col-span-2 inline-flex min-h-12 items-center justify-center gap-2 bg-now-yellow px-3 py-3 text-sm font-bold text-now-blue"><PhoneCall size={17} />Appeler</a>}
      </div>}
      <div id={`relance-${invoice.id}`} className="mt-4 border-t border-slate-200 pt-4"><RelanceActionClient factureId={invoice.id} canal={invoice.canal_effectif ?? 'tous'} client={invoice.clients ?? undefined} /></div>
    </article>
  )
}
