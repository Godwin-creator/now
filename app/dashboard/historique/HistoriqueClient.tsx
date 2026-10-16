'use client'

import { useEffect, useMemo, useState } from 'react'
import { RotateCcw, Search } from 'lucide-react'
import type { Paiement, Relance } from '@/types'
import type { HistoryAction, HistoryRow, HistoryStatus } from './history-types'
import HistoriqueTable from './HistoriqueTable'

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

const statusOptions = ['Tous', 'Générée', 'Copiée', 'Envoyée', 'Réussi', 'En attente', 'Échoué'] as const

function normalizeStatus(value?: string): HistoryStatus {
  switch (value) {
    case 'generee': return 'Générée'
    case 'copiee': return 'Copiée'
    case 'envoyee': return 'Envoyée'
    default: return 'En attente'
  }
}

function normalizeAction(value?: string): HistoryAction {
  switch (value) {
    case 'email': return 'email'
    case 'sms': return 'sms'
    case 'tel': return 'tel'
    case 'whatsapp': return 'whatsapp'
    default: return 'whatsapp'
  }
}

function actionFilterValue(value: string): (typeof actionOptions)[number]['value'] {
  return actionOptions.find((option) => option.value === value)?.value ?? 'tous'
}

function statusFilterValue(value: string): (typeof statusOptions)[number] {
  return statusOptions.find((option) => option === value) ?? 'Tous'
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
      const action = normalizeAction(relance.canal)
      const clientName = relance.factures?.clients?.nom || 'Client inconnu'
      const status = normalizeStatus(relance.statut_envoi)

      return {
        id: relance.id,
        date: relance.envoyee_at || relance.created_at || '',
        client: clientName,
        action,
        canalLabel: action === 'whatsapp' ? 'WhatsApp' : action === 'email' ? 'Email' : action === 'sms' ? 'SMS' : action === 'tel' ? 'Appel téléphonique' : 'WhatsApp',
        details: relance.message_genere || 'Relance générée',
        status,
      }
    })

    const paiementRows: HistoryRow[] = initialPaiements.map((paiement) => ({
      id: paiement.id,
      date: paiement.date_paiement || paiement.created_at || '',
      client: paiement.factures?.clients?.nom || 'Client inconnu',
      action: 'paiement',
      canalLabel: 'Paiement',
      details: `Versement enregistré • ${Number(paiement.montant_paye || 0).toLocaleString('fr-FR')} FCFA`,
      status: 'Réussi',
    }))

    return [...relanceRows, ...paiementRows].sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0))
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
              onChange={(event) => setActionFilter(actionFilterValue(event.target.value))}
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
              onChange={(event) => setStatusFilter(statusFilterValue(event.target.value))}
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

      <HistoriqueTable rows={filteredRows} />
    </div>
  )
}
