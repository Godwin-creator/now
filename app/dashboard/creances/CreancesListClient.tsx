'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { annulerPaiement } from '@/app/actions/paiements'
import { AlertCircle, ChevronDown } from 'lucide-react'
import type { NiveauRisque } from '@/lib/domain'
import type { CreanceEnrichie } from '@/lib/domain'
import DashboardInvoiceTable from '@/app/components/DashboardInvoiceTable'
import CreanceMobileCard from './CreanceMobileCard'
import PaymentSheet from '@/app/components/PaymentSheet'

const levels: NiveauRisque[] = ['Faible', 'Moyen', 'Élevé', 'Critique']
const statusOptions = [
  ['Tous', 'Tous les statuts'],
  ['en_attente', 'En attente'],
  ['partielle', 'Partielle'],
  ['payee', 'Payée'],
  ['annulee', 'Annulée'],
] as const
const delayOptions = [
  ['Tous', 'Tous les retards'],
  ['0', 'Pas en retard'],
  ['1-7', '1 à 7 jours'],
  ['8-30', '8 à 30 jours'],
  ['31-45', '31 à 45 jours'],
  ['46+', '46 jours et plus'],
] as const
const channelOptions = [
  ['Tous', 'Tous les canaux'],
  ['whatsapp', 'WhatsApp'],
  ['email', 'E-mail'],
  ['sms', 'SMS'],
  ['tel', 'Appel'],
  ['missing', 'Coordonnée manquante'],
] as const

function matchesDelay(days: number, range: string): boolean {
  if (range === 'Tous') return true
  if (range === '0') return days === 0
  if (range === '1-7') return days >= 1 && days <= 7
  if (range === '8-30') return days >= 8 && days <= 30
  if (range === '31-45') return days >= 31 && days <= 45
  return days >= 46
}

function matchesChannel(invoice: CreanceEnrichie, channel: string): boolean {
  if (channel === 'Tous') return true
  if (channel === 'missing') return invoice.canal_effectif === null
  return invoice.canal_effectif === channel
}

export default function CreancesListClient({
  invoices,
  loadError,
}: {
  invoices: CreanceEnrichie[]
  loadError?: string
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Tous')
  const [level, setLevel] = useState('Tous')
  const [delay, setDelay] = useState('Tous')
  const [channel, setChannel] = useState('Tous')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [paymentInvoice, setPaymentInvoice] = useState<CreanceEnrichie | null>(null)
  const [undo, setUndo] = useState<{ id: string; amount: number } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(loadError ?? null)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const undoTimer = useRef<number | null>(null)
  const router = useRouter()

  const filtered = useMemo(() => invoices.filter((invoice) => {
    const normalizedQuery = query.trim().toLocaleLowerCase('fr-FR')
    const name = (invoice.clients?.nom ?? '').toLocaleLowerCase('fr-FR')
    return name.includes(normalizedQuery)
      && (status === 'Tous' || invoice.statut_calcule === status)
      && (level === 'Tous' || invoice.niveau === level)
      && matchesDelay(invoice.jours_retard, delay)
      && matchesChannel(invoice, channel)
  }).sort((left, right) => right.score - left.score), [channel, delay, invoices, level, query, status])

  const handleSaved = (id: string, amount: number) => {
    if (undoTimer.current !== null) window.clearTimeout(undoTimer.current)
    setPaymentInvoice(null)
    setUndo({ id, amount })
    setNotice('Paiement enregistré. Vous pouvez l’annuler pendant 10 secondes.')
    setError(null)
    router.refresh()
    undoTimer.current = window.setTimeout(() => { setUndo(null); setNotice(null); undoTimer.current = null }, 10_000)
  }

  const undoPayment = async () => {
    if (!undo) return
    setWorkingId(undo.id)
    try {
      const result = await annulerPaiement(undo.id)
      if (!result.ok) setError(result.error.message)
      else {
        if (undoTimer.current !== null) window.clearTimeout(undoTimer.current)
        undoTimer.current = null
        setUndo(null)
        setNotice('Paiement annulé.')
        router.refresh()
      }
    } catch {
      setError('Le paiement n’a pas pu être annulé.')
    } finally {
      setWorkingId(null)
    }
  }

  const selectClass = 'min-h-11 w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus-visible:outline-2 focus-visible:outline-now-blue'

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="flex items-center gap-2 border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-800"><AlertCircle size={16} />{error}</p>}
      {notice && <div role="status" aria-live="polite" className="flex flex-wrap items-center gap-3 border-l-4 border-emerald-500 bg-emerald-50 p-3 text-sm text-emerald-900"><span>{notice}</span>{undo && <button type="button" onClick={undoPayment} disabled={workingId !== null} className="min-h-11 border border-emerald-700 px-3 py-2 font-bold disabled:opacity-60">Annuler</button>}</div>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard" className="inline-flex min-h-11 items-center border border-now-blue px-3 py-2 text-sm font-semibold text-now-blue">Retour à la file du jour</Link>
        <button type="button" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} className="inline-flex min-h-11 items-center gap-2 border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 md:hidden">Filtres<ChevronDown size={16} /></button>
      </div>
      <section aria-label="Filtres des créances" className={`grid grid-cols-1 gap-3 border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-5 ${filtersOpen ? 'grid' : 'hidden md:grid'}`}>
        <div><label htmlFor="creance-search" className="mb-1 block text-sm font-semibold text-slate-800">Recherche client</label><input id="creance-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} className={selectClass} placeholder="Nom du client" /></div>
        <div><label htmlFor="creance-status" className="mb-1 block text-sm font-semibold text-slate-800">Statut</label><select id="creance-status" value={status} onChange={(event) => setStatus(event.target.value)} className={selectClass}>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div><label htmlFor="creance-level" className="mb-1 block text-sm font-semibold text-slate-800">Niveau de risque</label><select id="creance-level" value={level} onChange={(event) => setLevel(event.target.value)} className={selectClass}><option value="Tous">Tous les niveaux</option>{levels.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
        <div><label htmlFor="creance-delay" className="mb-1 block text-sm font-semibold text-slate-800">Jours de retard</label><select id="creance-delay" value={delay} onChange={(event) => setDelay(event.target.value)} className={selectClass}>{delayOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div><label htmlFor="creance-channel" className="mb-1 block text-sm font-semibold text-slate-800">Canal</label><select id="creance-channel" value={channel} onChange={(event) => setChannel(event.target.value)} className={selectClass}>{channelOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      </section>
      <p className="text-sm text-slate-600" aria-live="polite">{filtered.length} créance{filtered.length === 1 ? '' : 's'}</p>
      <div className="grid min-w-0 grid-cols-1 gap-3 md:hidden">
        {filtered.map((invoice) => <CreanceMobileCard key={invoice.id} invoice={invoice} onPay={setPaymentInvoice} paying={workingId === invoice.id} />)}
        {filtered.length === 0 && <p className="border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">Aucune créance ne correspond à ces filtres.</p>}
      </div>
      <div className="hidden min-w-0 md:flex md:min-h-0 md:flex-1">
        <DashboardInvoiceTable invoices={filtered} payingId={workingId} expandedId={expandedId} onMarkPaid={setPaymentInvoice} onToggle={(id) => setExpandedId((current) => current === id ? null : id)} />
      </div>
      {paymentInvoice && <PaymentSheet key={paymentInvoice.id} invoice={paymentInvoice} onClose={() => setPaymentInvoice(null)} onSaved={handleSaved} />}
    </div>
  )
}
