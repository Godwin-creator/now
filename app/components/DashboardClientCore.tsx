'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { annulerPaiement } from '@/app/actions/paiements'
import { AlertCircle, CheckCircle, ClipboardList } from 'lucide-react'
import { formatFcfa, type CreanceEnrichie } from '@/lib/domain'
import DashboardTodayCard from './DashboardTodayCard'
import PaymentSheet from './PaymentSheet'

export default function DashboardClientCore({
  initialFactures,
  loadError,
}: {
  initialFactures: CreanceEnrichie[]
  loadError?: string
}) {
  const [payingId, setPayingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [paymentInvoice, setPaymentInvoice] = useState<CreanceEnrichie | null>(null)
  const [undo, setUndo] = useState<{ paymentId: string; amount: number } | null>(null)
  const undoTimer = useRef<number | null>(null)
  const router = useRouter()

  const dueToday = useMemo(() => initialFactures
    .filter((invoice) => invoice.recommandation.aRelancerAujourdhui)
    .sort((left, right) => right.score - left.score), [initialFactures])

  const activeInvoices = useMemo(
    () => initialFactures.filter((invoice) => invoice.statut_calcule !== 'payee' && invoice.statut_calcule !== 'annulee'),
    [initialFactures],
  )
  const totalDue = activeInvoices.reduce((total, invoice) => total + invoice.solde_restant, 0)
  const overdueCount = activeInvoices.filter((invoice) => invoice.jours_retard > 0).length
  const dueTodayCount = activeInvoices.filter((invoice) => invoice.recommandation.aRelancerAujourdhui).length

  const handlePaymentSaved = (paymentId: string, amount: number) => {
    if (undoTimer.current !== null) window.clearTimeout(undoTimer.current)
    setPaymentInvoice(null)
    setUndo({ paymentId, amount })
    setToast({ text: `Paiement de ${formatFcfa(amount)} enregistré.`, type: 'success' })
    router.refresh()
    undoTimer.current = window.setTimeout(() => {
      setUndo(null)
      setToast(null)
      undoTimer.current = null
    }, 10_000)
  }

  const handleUndoPayment = async () => {
    if (!undo) return
    setPayingId(undo.paymentId)
    try {
      const result = await annulerPaiement(undo.paymentId)
      if (!result.ok) setToast({ text: result.error.message, type: 'error' })
      else {
        setUndo(null)
        setToast({ text: 'Paiement annulé.', type: 'success' })
        if (undoTimer.current !== null) window.clearTimeout(undoTimer.current)
        undoTimer.current = null
        router.refresh()
      }
    } catch {
      setToast({ text: 'Le paiement n’a pas pu être annulé. Réessayez.', type: 'error' })
    } finally {
      setPayingId(null)
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-col gap-5 overflow-y-auto">
        {toast && <div role={toast.type === 'error' ? 'alert' : 'status'} aria-live="polite" className={`flex flex-wrap items-center gap-3 border-l-4 p-3 text-sm font-semibold ${toast.type === 'success' ? 'border-green-500 bg-green-50 text-green-900' : 'border-red-500 bg-red-50 text-red-900'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.text}</span>
          {undo && <button type="button" onClick={handleUndoPayment} disabled={payingId !== null} className="min-h-11 border border-current px-3 py-2 font-bold disabled:opacity-60">Annuler</button>}
          <button type="button" onClick={() => setToast(null)} aria-label="Fermer" className="min-h-11 min-w-11">×</button>
      </div>}
      {loadError && <p role="alert" className="border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-800">{loadError}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Créances actives" value={String(activeInvoices.length)} />
        <Kpi label="Montant dû total" value={formatFcfa(totalDue)} />
        <Kpi label="En retard" value={String(overdueCount)} />
        <Kpi label="À relancer aujourd’hui" value={String(dueTodayCount)} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-now-blue">À faire aujourd’hui</h3>
        <Link href="/dashboard/creances" className="inline-flex min-h-11 items-center gap-2 border border-now-blue px-3 py-2 text-sm font-semibold text-now-blue hover:bg-now-blue hover:text-white"><ClipboardList size={17} />Toutes les créances</Link>
      </div>

      {dueToday.length === 0 ? (
        <section className="border border-slate-200 bg-white px-5 py-10 text-center">
          <h4 className="text-base font-bold text-now-blue">Aucune relance prévue aujourd’hui</h4>
          <p className="mt-2 text-sm text-slate-600">Les créances actives et leur prochaine échéance restent visibles dans le portefeuille.</p>
          <Link href="/dashboard/creances" className="mt-4 inline-flex min-h-11 items-center justify-center bg-now-blue px-4 py-3 text-sm font-bold text-white">Voir toutes les créances</Link>
        </section>
      ) : (
        <section aria-label="Créances à relancer aujourd’hui" className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
          {dueToday.map((invoice) => <DashboardTodayCard key={invoice.id} invoice={invoice} onMarkPaid={setPaymentInvoice} paying={payingId === invoice.id} />)}
        </section>
      )}
      {paymentInvoice && <PaymentSheet key={paymentInvoice.id} invoice={paymentInvoice} onClose={() => setPaymentInvoice(null)} onSaved={handlePaymentSaved} />}
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 border border-gray-100 border-l-4 border-l-now-yellow bg-white p-3 sm:p-5"><p className="text-xs font-semibold uppercase tracking-wider text-now-blue-light">{label}</p><p className="mt-2 break-words text-lg font-extrabold text-now-blue sm:text-2xl">{value}</p></div>
}
