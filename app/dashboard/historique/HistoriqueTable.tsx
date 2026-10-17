'use client'

import { CreditCard, Mail, MessageCircle, MessageSquare, PhoneCall } from 'lucide-react'
import type { HistoryAction, HistoryRow, HistoryStatus } from './history-types'

const channelStyles: Record<HistoryAction, { className: string; icon: typeof CreditCard }> = {
  whatsapp: { className: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: MessageCircle },
  email: { className: 'bg-blue-50 text-blue-700 border border-blue-200', icon: Mail },
  sms: { className: 'bg-slate-100 text-slate-700 border border-slate-200', icon: MessageSquare },
  tel: { className: 'bg-amber-50 text-amber-700 border border-amber-200', icon: PhoneCall },
  paiement: { className: 'bg-violet-50 text-violet-700 border border-violet-200', icon: CreditCard },
}

const statusStyles: Record<HistoryStatus, string> = {
  Réussi: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Générée: 'bg-slate-100 text-slate-700 border border-slate-200',
  Copiée: 'bg-sky-50 text-sky-700 border border-sky-200',
  Envoyée: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'En attente': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Échoué': 'bg-red-50 text-red-700 border border-red-200',
}

function formatDateTime(value: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lome' })
}

export default function HistoriqueTable({ rows }: { rows: HistoryRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-now-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/80"><tr>
            <th className="border-b border-slate-200 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-now-blue-light">Date &amp; heure</th>
            <th className="border-b border-slate-200 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-now-blue-light">Client</th>
            <th className="border-b border-slate-200 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-now-blue-light">Action</th>
            <th className="border-b border-slate-200 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-now-blue-light">Détails / message</th>
            <th className="border-b border-slate-200 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-now-blue-light">Statut</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">Aucun historique ne correspond à ces filtres.</td></tr> : rows.map((row) => {
              const channel = channelStyles[row.action]
              const Icon = channel.icon
              return <tr key={row.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/80">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-700">{formatDateTime(row.date)}</td>
                <td className="px-6 py-4"><span className="text-sm font-semibold text-now-blue">{row.client}</span></td>
                <td className="px-6 py-4"><span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-bold ${channel.className}`}><Icon size={12} />{row.canalLabel}</span></td>
                <td className="max-w-xl px-6 py-4 text-sm text-slate-600"><div className="leading-6">{row.details}</div></td>
                <td className="px-6 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[row.status]}`}>{row.status}</span></td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
