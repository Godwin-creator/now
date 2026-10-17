'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteAccount, exportCreancesCsv } from '@/app/actions/account'

export default function AccountSettings({ companyName }: { companyName: string }) {
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function handleExport() {
    setBusy(true)
    setMessage('')
    try {
      const result = await exportCreancesCsv()
      if (!result.ok) { setMessage(result.error.message); return }
      const url = URL.createObjectURL(new Blob([result.data.csv], { type: 'text/csv;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'nowpay-creances.csv'
      link.click()
      URL.revokeObjectURL(url)
      setMessage('Export CSV téléchargé.')
    } catch {
      setMessage('L’export est temporairement indisponible.')
    } finally { setBusy(false) }
  }

  async function handleDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const result = await deleteAccount(confirmation)
      if (!result.ok) { setMessage(result.error.message); return }
      router.replace('/')
      router.refresh()
    } catch {
      setMessage('La suppression est temporairement indisponible.')
    } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header><h1 className="text-3xl font-black text-now-blue">Paramètres</h1><p className="mt-2 text-base text-slate-700">Exportez vos créances ou supprimez votre compte NowPay.</p></header>
      <section className="rounded-2xl border border-now-border bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold">Exporter vos créances</h2>
        <p className="mt-2 text-base text-slate-700">Téléchargez les créances et les coordonnées associées au format CSV.</p>
        <button type="button" disabled={busy} onClick={handleExport} className="mt-4 min-h-12 rounded-xl bg-now-blue px-5 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 disabled:opacity-60">Télécharger l’export CSV</button>
      </section>
      <section className="rounded-2xl border border-red-300 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-bold text-red-900">Supprimer le compte</h2>
        <p className="mt-2 text-base leading-7 text-slate-800">Cette action supprime votre compte, l’entreprise « {companyName} » et toutes les créances, coordonnées, relances et paiements associés. Elle est définitive.</p>
        <form onSubmit={handleDelete} className="mt-5 space-y-3">
          <label htmlFor="delete-confirmation" className="block text-sm font-semibold text-slate-800">Pour confirmer, saisissez le nom exact de votre entreprise : <span className="font-bold">{companyName}</span></label>
          <input id="delete-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required maxLength={120} autoComplete="off" className="min-h-12 w-full rounded-xl border border-slate-300 px-3 text-base focus-visible:outline-2 focus-visible:outline-blue-800" />
          <button type="submit" disabled={busy || confirmation !== companyName} className="min-h-12 rounded-xl bg-red-800 px-5 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800 disabled:cursor-not-allowed disabled:opacity-50">Supprimer définitivement mon compte</button>
        </form>
      </section>
      <p role="status" aria-live="polite" className="min-h-6 text-sm font-medium text-slate-800">{message}</p>
    </div>
  )
}
