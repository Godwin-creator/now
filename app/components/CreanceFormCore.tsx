'use client'

import { useState } from 'react'
import { creerCreance } from '@/app/actions/creances-create'
import { CheckCircle2, ChevronDown } from 'lucide-react'
import type { Client, ProfilClient } from '@/types'
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
  const [clientId, setClientId] = useState('')
  const [profile, setProfile] = useState<ProfilClient>('professionnel')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleExtracted = (data: InvoiceOcr) => {
    setClientName(data.nomClient)
    setClientId('')
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
        setClientId('')
        setProfile('professionnel')
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
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-black uppercase tracking-wide text-now-blue">Nouvelle créance</h2>
          <p className="mt-1 text-sm text-slate-700">Saisie manuelle d’une créance</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-5 sm:px-6">
        <details className="border border-slate-200 bg-slate-50">
          <summary className="flex min-h-11 cursor-pointer items-center justify-between px-3 py-2 text-sm font-bold text-now-blue">Autres façons d’ajouter<ChevronDown size={17} /></summary>
          <div className="space-y-3 border-t border-slate-200 p-3"><CreanceOcrPanel onExtracted={handleExtracted} /><ImportCSV /></div>
        </details>

        {error && <p role="alert" className="border-l-4 border-red-500 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
        {success && <p role="status" className="flex items-center gap-2 border-l-4 border-emerald-500 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"><CheckCircle2 size={16} />{success}</p>}

        <input type="hidden" name="isNewClient" value={String(isNewClient)} />
        <input type="hidden" name="client_id" value={clientId} />
        <div><label htmlFor="client-name" className="mb-1 block text-sm font-semibold text-slate-800">Client *</label><input id="client-name" name="nom_client" required maxLength={150} list="existing-client-names" value={clientName} onChange={(event) => { const value = event.target.value; const match = clientsExistants.find((client) => client.nom.toLocaleLowerCase('fr-FR') === value.trim().toLocaleLowerCase('fr-FR')); setClientName(value); setClientId(match?.id ?? ''); setIsNewClient(!match); if (match && (match.profil === 'particulier informel' || match.profil === 'professionnel' || match.profil === 'corporate')) setProfile(match.profil) }} className="min-h-12 w-full border border-slate-300 px-3 py-3 text-base" placeholder="Nom du client" /><datalist id="existing-client-names">{clientsExistants.map((client) => <option key={client.id} value={client.nom} />)}</datalist><p className="mt-1 text-sm text-slate-600">Saisissez un nom ou choisissez une suggestion. Un nom existant réutilise sa fiche client.</p></div>

        <CreanceInvoiceFields amount={amount} serviceDate={serviceDate} profile={profile} onProfileChange={setProfile} onAmountChange={setAmount} onServiceDateChange={setServiceDate} />
        {isNewClient && <details className="border-t border-slate-200 pt-3"><summary className="flex min-h-11 cursor-pointer items-center justify-between text-sm font-semibold text-now-blue">Options avancées du client<ChevronDown size={17} /></summary><div className="grid grid-cols-1 gap-4 pt-3 sm:grid-cols-2"><div><label htmlFor="client-whatsapp" className="mb-1 block text-sm font-semibold text-slate-800">WhatsApp / téléphone</label><input id="client-whatsapp" name="whatsapp" type="tel" maxLength={40} className="min-h-11 w-full border border-slate-300 px-3 py-2 text-sm" /></div><div><label htmlFor="client-email" className="mb-1 block text-sm font-semibold text-slate-800">E-mail</label><input id="client-email" name="email" type="email" maxLength={254} className="min-h-11 w-full border border-slate-300 px-3 py-2 text-sm" /></div><div><label htmlFor="client-sector" className="mb-1 block text-sm font-semibold text-slate-800">Secteur</label><input id="client-sector" name="secteur" maxLength={100} defaultValue="Services" className="min-h-11 w-full border border-slate-300 px-3 py-2 text-sm" /></div></div></details>}
        <button type="submit" disabled={isSubmitting} className="min-h-12 w-full bg-now-yellow px-4 py-3 text-sm font-black uppercase tracking-wide text-now-blue disabled:opacity-60">{isSubmitting ? 'Enregistrement…' : 'Enregistrer la créance'}</button>
      </form>
    </section>
  )
}
