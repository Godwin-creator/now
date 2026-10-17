'use client'

import { Fragment } from 'react'
import { AlertCircle, Mail, MessageCircle, MessageSquare, PhoneCall } from 'lucide-react'
import type { CreanceEnrichie } from '@/lib/domain'
import { formatIsoDate } from '@/lib/domain'
import RelanceActionClient from './RelanceActionClient'

interface DashboardInvoiceTableProps {
  invoices: CreanceEnrichie[]
  payingId: string | null
  expandedId: string | null
  onMarkPaid: (invoice: CreanceEnrichie) => void
  onToggle: (invoiceId: string) => void
}

export default function DashboardInvoiceTable({
  invoices,
  payingId,
  expandedId,
  onMarkPaid,
  onToggle,
}: DashboardInvoiceTableProps) {
  return (
    <div className="flex-1 overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-gray-50">
          <tr>
            <th className="border-b px-6 py-4 text-xs font-semibold uppercase text-now-blue">Client</th>
            <th className="border-b px-6 py-4 text-right text-xs font-semibold uppercase text-now-blue">Montant (FCFA)</th>
            <th className="border-b px-6 py-4 text-xs font-semibold uppercase text-now-blue">Échéance</th>
            <th className="border-b px-6 py-4 text-xs font-semibold uppercase text-now-blue">Risque</th>
            <th className="border-b px-6 py-4 text-xs font-semibold uppercase text-now-blue">Canal</th>
            <th className="border-b px-6 py-4 text-right text-xs font-semibold uppercase text-now-blue">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {invoices.map((invoice) => {
            const isPaid = invoice.statut_calcule === 'payee'
            const isCanceled = invoice.statut_calcule === 'annulee'
            const isExpanded = expandedId === invoice.id
            return (
              <Fragment key={invoice.id}>
              <tr className={`border-b border-gray-100 transition-colors ${isExpanded ? 'bg-blue-100' : 'hover:bg-gray-50'}`}>
                <td className="px-6 py-4">
                  <p className="font-semibold text-gray-900">{invoice.clients?.nom || 'Client inconnu'}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{invoice.clients?.telephone || invoice.clients?.whatsapp || 'Sans numéro'}</p>
                </td>
                <td className="px-6 py-4 text-right font-semibold tabular-nums text-gray-900">{invoice.solde_restant.toLocaleString('fr-FR')} FCFA</td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-700">{formatIsoDate(invoice.date_echeance)}</p>
                  {invoice.jours_retard > 0 && !isPaid && <span className="mt-1 inline-block rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">{invoice.jours_retard} j de retard</span>}
                </td>
                <td className="px-6 py-4">
                  {isPaid ? <span className="rounded bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">Soldée</span> : isCanceled ? <span className="rounded bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">Annulée</span> : <div className="flex flex-col gap-1"><span className="text-xs font-semibold text-gray-700">{invoice.niveau} · {invoice.score}/100</span><span className="rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">{invoice.statut_calcule === 'partielle' ? 'Partielle' : 'En attente'}</span></div>}
                </td>
                <td className="px-6 py-4">
                  <span className="flex w-fit items-center gap-1.5 rounded bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    {invoice.canal_effectif === 'whatsapp' && <MessageCircle size={14} className="text-green-500" />}
                    {invoice.canal_effectif === 'email' && <Mail size={14} className="text-blue-500" />}
                    {invoice.canal_effectif === 'sms' && <MessageSquare size={14} className="text-slate-700" />}
                    {invoice.canal_effectif === 'tel' && <PhoneCall size={14} className="text-orange-500" />}
                    {invoice.canal_effectif === null && <AlertCircle size={14} className="text-red-500" />}
                    <span className="capitalize">{invoice.canal_effectif ?? 'Coordonnée manquante'}</span>
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {!isPaid && !isCanceled && <div className="flex items-center justify-end gap-2">
                    <button type="button" onClick={() => onMarkPaid(invoice)} disabled={payingId === invoice.id} className="min-h-11 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-green-500 hover:bg-green-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50">Payé</button>
                    <button type="button" onClick={() => onToggle(invoice.id)} className={`min-h-11 rounded px-3 py-1.5 text-xs font-semibold transition-colors ${isExpanded ? 'bg-now-blue text-white' : 'bg-now-yellow text-now-blue hover:bg-now-yellow-hover'}`}>{isExpanded ? 'Fermer' : 'Relancer'}</button>
                  </div>}
                </td>
              </tr>
              {isExpanded && !isPaid && !isCanceled && <tr><td colSpan={6} className="bg-blue-50/30 p-4"><RelanceActionClient factureId={invoice.id} canal={invoice.canal_effectif ?? 'tous'} client={invoice.clients ?? undefined} /></td></tr>}
              </Fragment>
            )
          })}
          {invoices.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-gray-500">Aucune créance trouvée.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
