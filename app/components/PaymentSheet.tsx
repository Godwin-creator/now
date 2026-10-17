'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { enregistrerPaiement } from '@/app/actions/paiements'
import { formatFcfa, type CreanceEnrichie } from '@/lib/domain'

export default function PaymentSheet({
  invoice,
  onClose,
  onSaved,
}: {
  invoice: CreanceEnrichie
  onClose: () => void
  onSaved: (paymentId: string, amount: number) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [amount, setAmount] = useState(String(invoice.solde_restant))
  const [date, setDate] = useState(today)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    const numericAmount = Number(amount)
    if (!Number.isSafeInteger(numericAmount) || numericAmount <= 0 || numericAmount > invoice.solde_restant) {
      setError('Saisissez un montant positif qui ne dépasse pas le solde.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const result = await enregistrerPaiement(invoice.id, numericAmount, date)
      if (!result.ok) {
        setError(result.error.message)
      } else {
        onSaved(result.data.id, numericAmount)
      }
    } catch {
      setError('Le paiement n’a pas pu être enregistré. Réessayez.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 sm:items-center" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="payment-title" className="w-full max-w-lg border border-slate-200 border-t-4 border-t-now-yellow bg-white p-5 shadow-2xl sm:p-6">
        <header className="mb-5 flex items-start justify-between gap-4">
          <div><h2 id="payment-title" className="text-lg font-bold text-now-blue">Enregistrer un paiement</h2><p className="mt-1 text-sm text-slate-600">{invoice.clients?.nom || 'Client'} · solde {formatFcfa(invoice.solde_restant)}</p></div>
          <button type="button" onClick={onClose} aria-label="Fermer la fenêtre de paiement" className="inline-flex min-h-11 min-w-11 items-center justify-center border border-slate-300 text-slate-700"><X size={18} /></button>
        </header>
        <form onSubmit={submit} className="space-y-4">
          {error && <p role="alert" className="border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <div><label htmlFor="payment-amount" className="mb-1 block text-sm font-semibold text-slate-800">Montant versé (FCFA)</label><input id="payment-amount" type="number" inputMode="numeric" min={1} max={invoice.solde_restant} step={1} required value={amount} onChange={(event) => setAmount(event.target.value)} className="min-h-12 w-full border border-slate-300 px-3 py-3 text-base text-slate-900 focus-visible:outline-2 focus-visible:outline-now-blue" /></div>
          <div><label htmlFor="payment-date" className="mb-1 block text-sm font-semibold text-slate-800">Date du paiement</label><input id="payment-date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} className="min-h-12 w-full border border-slate-300 px-3 py-3 text-base text-slate-900 focus-visible:outline-2 focus-visible:outline-now-blue" /></div>
          <p className="text-sm text-slate-600">Le solde restant sera recalculé après confirmation.</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="min-h-12 border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700">Annuler</button>
            <button type="submit" disabled={saving} className="min-h-12 bg-now-blue px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Enregistrement…' : 'Confirmer le paiement'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
