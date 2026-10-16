'use client'

import { useState } from 'react'
import { creerCreance } from '@/app/actions/creances-create'
import { CheckCircle2, Users, UserPlus } from 'lucide-react'
import type { Client } from '@/types'
import type { InvoiceOcr } from '@/lib/ai/contracts'
import ImportCSV from '@/app/components/ImportCSV'
import CreanceInvoiceFields from './CreanceInvoiceFields'
import CreanceOcrPanel from './CreanceOcrPanel'

export default function CreanceFormCore({ clientsExistants }: { clientsExistants: Client[] }) {
  const [isNewClient, setIsNewClient] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [amount, setAmount] = useState('')
  const [serviceDate, setServiceDate] = useState('')
  const [clientName, setClientName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleExtracted = (data: InvoiceOcr) => {
    setClientName(data.nomClient)
    setAmount(data.montantFcfa.toLocaleString('fr-FR'))
    setServiceDate(data.dateService)
    setIsNewClient(true)
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const form = event.currentTarget
      const result = await creerCreance(new FormData(form))
      if (!result.ok) {
        setError(result.error.message)
      } else {
        setSuccess('Créance enregistrée avec succès.')
        form.reset()
        setAmount('')
        setServiceDate('')
        setClientName('')
        setIsNewClient(false)
      }
    } catch {
      setError('Impossible d’enregistrer la créance. Réessayez.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative w-full overflow-auto border border-gray-200 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
        <div>
          <h2 className="text-base font-black uppercase tracking-wide text-now-blue">Nouvelle créance</h2>
          <p className="mt-1 text-sm text-now-blue-light">Saisie manuelle ou import CSV</p>
        </div>
        <ImportCSV />
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5">
        <CreanceOcrPanel onExtracted={handleExtracted} />

        {error && <p role="alert" className="border-l-4 border-red-500 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
        {success && <p role="status" className="flex items-center gap-2 border-l-4 border-emerald-500 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"><CheckCircle2 size={16} />{success}</p>}

        <input type="hidden" name="isNewClient" value={String(isNewClient)} />
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="sr-only">Type de client</legend>
          <button type="button" aria-pressed={!isNewClient} onClick={() => setIsNewClient(false)} className={`inline-flex min-h-11 items-center justify-center gap-2 border px-3 py-2 text-sm font-bold ${!isNewClient ? 'border-now-blue bg-now-yellow text-now-blue' : 'border-slate-200 bg-white text-slate-700'}`}><Users size={16} />Client existant</button>
          <button type="button" aria-pressed={isNewClient} onClick={() => setIsNewClient(true)} className={`inline-flex min-h-11 items-center justify-center gap-2 border px-3 py-2 text-sm font-bold ${isNewClient ? 'border-now-blue bg-now-yellow text-now-blue' : 'border-slate-200 bg-white text-slate-700'}`}><UserPlus size={16} />Nouveau client</button>
        </fieldset>

        {isNewClient ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label htmlFor="client-name" className="mb-1 block text-sm font-semibold text-now-blue-light">Nom du client *</label><input id="client-name" name="nom_client" required maxLength={150} value={clientName} onChange={(event) => setClientName(event.target.value)} className="w-full border border-slate-300 px-3 py-3 text-sm" /></div>
            <div><label htmlFor="client-whatsapp" className="mb-1 block text-sm font-semibold text-now-blue-light">WhatsApp / téléphone</label><input id="client-whatsapp" name="whatsapp" type="tel" maxLength={40} className="w-full border border-slate-300 px-3 py-3 text-sm" /></div>
            <div><label htmlFor="client-email" className="mb-1 block text-sm font-semibold text-now-blue-light">E-mail</label><input id="client-email" name="email" type="email" maxLength={254} className="w-full border border-slate-300 px-3 py-3 text-sm" /></div>
            <div><label htmlFor="client-profile" className="mb-1 block text-sm font-semibold text-now-blue-light">Profil</label><select id="client-profile" name="profil" defaultValue="professionnel" className="w-full border border-slate-300 px-3 py-3 text-sm"><option value="particulier informel">Particulier informel</option><option value="professionnel">Professionnel</option><option value="corporate">Corporate</option></select></div>
            <div><label htmlFor="client-sector" className="mb-1 block text-sm font-semibold text-now-blue-light">Secteur</label><input id="client-sector" name="secteur" maxLength={100} defaultValue="Services" className="w-full border border-slate-300 px-3 py-3 text-sm" /></div>
          </div>
        ) : (
          <div><label htmlFor="client-id" className="mb-1 block text-sm font-semibold text-now-blue-light">Client *</label><select id="client-id" name="client_id" required defaultValue="" className="w-full border border-slate-300 px-3 py-3 text-sm"><option value="" disabled>Sélectionner un client</option>{clientsExistants.map((client) => <option key={client.id} value={client.id}>{client.nom}</option>)}</select></div>
        )}

        <CreanceInvoiceFields amount={amount} serviceDate={serviceDate} onAmountChange={setAmount} onServiceDateChange={setServiceDate} />
        <button type="submit" disabled={isSubmitting} className="min-h-12 w-full bg-now-yellow px-4 py-3 text-sm font-black uppercase tracking-wide text-now-blue disabled:opacity-60">{isSubmitting ? 'Enregistrement…' : 'Enregistrer la créance'}</button>
      </form>
    </section>
  )
}
