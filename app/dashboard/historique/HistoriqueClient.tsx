'use client'

import { useEffect, useMemo, useState } from 'react'
import { CreditCard, Mail, MessageCircle, MessageSquare, PhoneCall, RotateCcw, Search } from 'lucide-react'
import type { Paiement, Relance } from '@/types'

type HistoryStatus = 'Réussi' | 'En attente' | 'Échoué'
type HistoryAction = 'whatsapp' | 'email' | 'sms' | 'tel' | 'paiement'

type HistoryRow = {
  id: string
  date: string
  client: string
  action: HistoryAction
  canalLabel: string
  details: string
  status: HistoryStatus
}

interface HistoriqueClientProps {
  initialRelances: Relance[]
  initialPaiements: Paiement[]
}

const actionOptions = [
  { value: 'tous', label: 'Tous' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'tel', label: 'Appel téléphonique' },
  { value: 'paiement', label: 'Paiement' },
] as const

const statusOptions = ['Tous', 'Réussi', 'En attente', 'Échoué'] as const

function formatDateTime(value?: string) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function normalizeStatus(value?: string): HistoryStatus {
  const raw = (value || '').toLowerCase()

  if (raw.includes('echec') || raw.includes('error') || raw.includes('failed') || raw.includes('reject')) return 'Échoué'
  if (raw.includes('attente') || raw.includes('pending') || raw.includes('en_cours')) return 'En attente'
  return 'Réussi'
}

export default function HistoriqueClient({ initialRelances, initialPaiements }: HistoriqueClientProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<(typeof actionOptions)[number]['value']>('tous')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>('Tous')

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsMounted(true)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  const historyRows = useMemo<HistoryRow[]>(() => {
    const relanceRows: HistoryRow[] = initialRelances.map((relance) => {
      const action = (relance.canal || 'whatsapp') as HistoryAction
      const clientName = relance.factures?.clients?.nom || 'Client inconnu'
      const status = normalizeStatus(relance.statut_envoi)

      return {
        id: relance.id,
        date: relance.created_at || new Date().toISOString(),
        client: clientName,
        action,
        canalLabel: action === 'whatsapp' ? 'WhatsApp' : action === 'email' ? 'Email' : action === 'sms' ? 'SMS' : action === 'tel' ? 'Appel téléphonique' : 'WhatsApp',
        details: relance.message_genere || 'Relance générée',
        status,
      }
    })

    const paiementRows: HistoryRow[] = initialPaiements.map((paiement) => ({
      id: paiement.id,
      date: paiement.date_paiement || paiement.created_at || new Date().toISOString(),
      client: paiement.factures?.clients?.nom || 'Client inconnu',
      action: 'paiement',
      canalLabel: 'Paiement',
      details: `Versement enregistré • ${Number(paiement.montant_paye || 0).toLocaleString('fr-FR')} FCFA`,
      status: 'Réussi',
    }))

    return [...relanceRows, ...paiementRows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [initialPaiements, initialRelances])

  const filteredRows = useMemo(() => {
    return historyRows.filter((row) => {
      const matchesSearch = row.client.toLowerCase().includes(searchTerm.trim().toLowerCase())
      const matchesAction = actionFilter === 'tous' || row.action === actionFilter
      const matchesStatus = statusFilter === 'Tous' || row.status === statusFilter

      const rowDate = new Date(row.date)
      const hasStart = startDate ? new Date(`${startDate}T00:00:00`) : null
      const hasEnd = endDate ? new Date(`${endDate}T23:59:59`) : null

      const matchesStart = !hasStart || rowDate >= hasStart
      const matchesEnd = !hasEnd || rowDate <= hasEnd

      return matchesSearch && matchesAction && matchesStatus && matchesStart && matchesEnd
    })
  }, [actionFilter, endDate, historyRows, searchTerm, startDate, statusFilter])

  const resetFilters = () => {
    setSearchTerm('')
    setActionFilter('tous')
    setStartDate('')
    setEndDate('')
    setStatusFilter('Tous')
  }

  const channelStyles = {
    whatsapp: {
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      icon: MessageCircle,
      label: 'WhatsApp',
    },
    email: {
      className: 'bg-blue-50 text-blue-700 border border-blue-200',
      icon: Mail,
      label: 'Email',
    },
    sms: {
      className: 'bg-slate-100 text-slate-700 border border-slate-200',
      icon: MessageSquare,
      label: 'SMS',
    },
    tel: {
      className: 'bg-amber-50 text-amber-700 border border-amber-200',
      icon: PhoneCall,
      label: 'Appel',
    },
    paiement: {
      className: 'bg-violet-50 text-violet-700 border border-violet-200',
      icon: CreditCard,
      label: 'Paiement',
    },
  } as const

  const statusStyles = {
    Réussi: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'En attente': 'bg-amber-50 text-amber-700 border border-amber-200',
    'Échoué': 'bg-red-50 text-red-700 border border-red-200',
  } as const

  if (!isMounted) {
    return <div className="w-full h-[420px] rounded-xl bg-slate-50 animate-pulse border border-slate-200" />
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="bg-now-surface border border-slate-200 shadow-sm rounded-xl p-4">
        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr_1fr_1fr_0.7fr_auto] gap-3 items-end">
          <div className="relative">
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-now-blue-light">
              Recherche
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Nom du client"
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-now-blue focus:outline-none focus:ring-2 focus:ring-now-blue/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-now-blue-light">
              Action
            </label>
            <select
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value as (typeof actionOptions)[number]['value'])}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-now-blue focus:outline-none focus:ring-2 focus:ring-now-blue/10"
            >
              {actionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-now-blue-light">
              Début
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-now-blue focus:outline-none focus:ring-2 focus:ring-now-blue/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-now-blue-light">
              Fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-now-blue focus:outline-none focus:ring-2 focus:ring-now-blue/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-now-blue-light">
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as (typeof statusOptions)[number])}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-now-blue focus:outline-none focus:ring-2 focus:ring-now-blue/10"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-now-blue-light transition-colors hover:text-now-blue hover:border-slate-300"
          >
            <RotateCcw size={14} />
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-now-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-now-blue-light border-b border-slate-200">
                  Date &amp; heure
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-now-blue-light border-b border-slate-200">
                  Client
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-now-blue-light border-b border-slate-200">
                  Action
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-now-blue-light border-b border-slate-200">
                  Détails / message
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-now-blue-light border-b border-slate-200">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                    Aucun historique ne correspond à ces filtres.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const channelMeta = channelStyles[row.action] || channelStyles.whatsapp
                  const Icon = channelMeta.icon

                  return (
                    <tr key={row.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/80">
                      <td className="px-6 py-4 text-sm font-medium text-slate-700 whitespace-nowrap">
                        {formatDateTime(row.date)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-now-blue">{row.client}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-bold ${channelMeta.className}`}>
                          <Icon size={12} />
                          {row.canalLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xl">
                        <div className="leading-6">{row.details}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[row.status]}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
