'use client'

import type { CreanceEnrichie } from '@/lib/domain'
import DashboardTodayCard from './DashboardTodayCard'
import RelanceActionClient from './RelanceActionClient'

const channelLabels: Record<Exclude<CreanceEnrichie['canal_effectif'], null>, string> = {
  whatsapp: 'WhatsApp',
  email: 'e-mail',
  sms: 'SMS',
  tel: 'téléphone',
}

export default function DashboardTodayCardInteractive({
  invoice,
  onMarkPaid,
  paying,
}: {
  invoice: CreanceEnrichie
  onMarkPaid: (invoice: CreanceEnrichie) => void
  paying: boolean
}) {
  const client = invoice.clients
  const phone = client?.telephone || client?.whatsapp
  const callRecommended = invoice.recommandation.appelRecommande
  const label = callRecommended ? 'Appeler' : invoice.canal_effectif
    ? `Relancer par ${channelLabels[invoice.canal_effectif]}` : 'Coordonnée manquante'

  return (
    <DashboardTodayCard invoice={invoice}>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {callRecommended && phone ? <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} className="inline-flex min-h-12 flex-1 items-center justify-center bg-now-yellow px-4 py-3 text-sm font-bold text-now-blue">{label}</a> : <button type="button" onClick={() => document.getElementById(`relance-${invoice.id}-start`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="min-h-12 flex-1 bg-now-yellow px-4 py-3 text-sm font-bold text-now-blue hover:bg-now-yellow-hover">{label}</button>}
        <button type="button" onClick={() => onMarkPaid(invoice)} disabled={paying} className="min-h-12 border border-slate-300 px-4 py-3 text-sm font-semibold text-now-blue disabled:opacity-60">Enregistrer un paiement</button>
      </div>
      <div id={`relance-${invoice.id}-start`} className="mt-4 border-t border-slate-200 pt-4"><RelanceActionClient factureId={invoice.id} canal={invoice.canal_effectif ?? 'tous'} client={client ?? undefined} /></div>
    </DashboardTodayCard>
  )
}
