import { AlertCircle, Mail, MessageCircle, MessageSquare, PhoneCall } from 'lucide-react'
import { formatFcfa, formatIsoDate, type CreanceEnrichie } from '@/lib/domain'

const levelStyles: Record<CreanceEnrichie['niveau'], string> = {
  Faible: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  Moyen: 'border-amber-300 bg-amber-50 text-amber-950',
  Élevé: 'border-orange-300 bg-orange-50 text-orange-950',
  Critique: 'border-red-300 bg-red-50 text-red-900',
}

const channelLabels: Record<Exclude<CreanceEnrichie['canal_effectif'], null>, string> = {
  whatsapp: 'WhatsApp',
  email: 'e-mail',
  sms: 'SMS',
  tel: 'téléphone',
}

export default function DashboardTodayCard({
  invoice,
  children,
}: {
  invoice: CreanceEnrichie
  children?: React.ReactNode
}) {
  const client = invoice.clients
  const phone = client?.telephone || client?.whatsapp

  return (
    <article className="min-w-0 border border-slate-200 border-l-4 border-l-now-yellow bg-white p-4 shadow-sm sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-base font-bold text-now-blue">{client?.nom || 'Client inconnu'}</h3>
          <p className="mt-1 break-all text-sm text-slate-600">{phone || client?.email || 'Aucune coordonnée renseignée'}</p>
        </div>
        <span className={`shrink-0 border px-2.5 py-1 text-xs font-bold ${levelStyles[invoice.niveau]}`}>{invoice.niveau} · {invoice.score}/100</span>
      </header>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div><p className="text-xs font-semibold uppercase text-slate-500">Solde dû</p><p className="mt-1 font-bold tabular-nums text-now-blue">{formatFcfa(invoice.solde_restant)}</p></div>
        <div><p className="text-xs font-semibold uppercase text-slate-500">Retard</p><p className="mt-1 font-bold text-now-blue">{invoice.jours_retard} jour{invoice.jours_retard === 1 ? '' : 's'}</p></div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          {invoice.canal_effectif === 'whatsapp' && <MessageCircle size={15} className="text-emerald-700" />}
          {invoice.canal_effectif === 'email' && <Mail size={15} className="text-blue-700" />}
          {invoice.canal_effectif === 'sms' && <MessageSquare size={15} />}
          {invoice.canal_effectif === 'tel' && <PhoneCall size={15} />}
          {invoice.canal_effectif === null && <AlertCircle size={15} className="text-red-700" />}
          {invoice.canal_effectif ? `Canal : ${channelLabels[invoice.canal_effectif]}` : 'Coordonnée manquante'}
        </span>
        <span aria-hidden>·</span>
        <span>Échéance : {formatIsoDate(invoice.date_echeance)}</span>
      </div>
      {children}
    </article>
  )
}
