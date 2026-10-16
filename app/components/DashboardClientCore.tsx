'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { enregistrerPaiement } from '@/app/actions/paiements'
import { AlertCircle, CheckCircle, Search } from 'lucide-react'
import { formatFcfa, type CreanceEnrichie } from '@/lib/domain'
import DashboardInvoiceTable from './DashboardInvoiceTable'

export default function DashboardClientCore({ initialFactures }: { initialFactures: CreanceEnrichie[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState('en_attente')
  const [payingId, setPayingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredInvoices = useMemo(() => initialFactures.filter((invoice) => {
    const nameMatches = (invoice.clients?.nom ?? '').toLocaleLowerCase('fr-FR').includes(searchTerm.trim().toLocaleLowerCase('fr-FR'))
    return nameMatches && (filterStatut === 'Tous' || invoice.statut_calcule === filterStatut)
  }), [filterStatut, initialFactures, searchTerm])

  const activeInvoices = useMemo(
    () => initialFactures.filter((invoice) => invoice.statut_calcule !== 'payee' && invoice.statut_calcule !== 'annulee'),
    [initialFactures],
  )
  const totalDue = activeInvoices.reduce((total, invoice) => total + invoice.solde_restant, 0)
  const overdueCount = activeInvoices.filter((invoice) => invoice.jours_retard > 0).length
  const dueTodayCount = activeInvoices.filter((invoice) => invoice.recommandation.aRelancerAujourdhui).length

  const handlePayment = async (invoice: CreanceEnrichie) => {
    if (payingId) return
    const amount = formatFcfa(invoice.solde_restant)
    const clientName = invoice.clients?.nom || 'ce client'
    if (!window.confirm(`Confirmer le règlement de ${amount} pour ${clientName} ?`)) return

    setPayingId(invoice.id)
    setToast(null)
    try {
      const result = await enregistrerPaiement(invoice.id, invoice.solde_restant, new Date().toISOString().slice(0, 10))
      if (!result.ok) setToast({ text: result.error.message, type: 'error' })
      else {
        setToast({ text: `Règlement de ${clientName} (${amount}) archivé.`, type: 'success' })
        window.setTimeout(() => setToast(null), 5_000)
      }
    } catch {
      setToast({ text: 'Le paiement n’a pas pu être enregistré. Réessayez.', type: 'error' })
    } finally {
      setPayingId(null)
    }
  }

  return (
    <div className="flex h-full flex-col space-y-6 overflow-hidden">
      <AnimatePresence>
        {toast && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role={toast.type === 'error' ? 'alert' : 'status'} className={`absolute right-8 top-8 z-50 flex items-center gap-3 border-l-4 p-4 text-sm font-semibold shadow-lg ${toast.type === 'success' ? 'border-green-500 bg-green-50 text-green-900' : 'border-red-500 bg-red-50 text-red-900'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.text}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Fermer">×</button>
        </motion.div>}
      </AnimatePresence>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <Kpi label="Créances actives" value={String(activeInvoices.length)} />
        <Kpi label="Montant dû total" value={formatFcfa(totalDue)} />
        <Kpi label="En retard" value={String(overdueCount)} />
        <Kpi label="À relancer aujourd’hui" value={String(dueTodayCount)} />
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <label htmlFor="dashboard-search" className="sr-only">Rechercher un client</label>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input id="dashboard-search" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Rechercher un client…" className="w-full border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-now-blue focus:outline-none focus:ring-2 focus:ring-now-blue/20" />
        </div>
        <label className="flex items-center gap-3 text-sm font-semibold text-now-blue">
          Statut
          <select value={filterStatut} onChange={(event) => setFilterStatut(event.target.value)} className="min-h-11 border border-gray-300 px-3 py-2 text-sm text-gray-700">
            <option value="en_attente">En attente</option><option value="partielle">Partielles</option><option value="Tous">Tous</option><option value="payee">Réglées</option><option value="annulee">Annulées</option>
          </select>
        </label>
      </div>

      <DashboardInvoiceTable invoices={filteredInvoices} payingId={payingId} expandedId={expandedId} onMarkPaid={handlePayment} onToggle={(id) => setExpandedId((current) => current === id ? null : id)} />
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <div className="border border-gray-100 border-l-4 border-l-now-yellow bg-white p-5 shadow-sm"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-now-blue-light">{label}</p><p className="text-2xl font-extrabold text-now-blue">{value}</p></div>
}