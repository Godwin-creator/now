'use client'

import { useState } from 'react'
import { PencilLine, X } from 'lucide-react'
import { updateClient } from '@/app/actions/clients'
import type { Client } from '@/types'
import type { Facture } from '@/types'
import { formatFcfa, formatIsoDate } from '@/lib/domain'

interface ClientDetailsPanelProps {
  selectedClient: Client | null
  editingClient: Client | null
  onClose: () => void
  onStartEditing: (client: Client) => void
  onEditingChange: (client: Client) => void
  onSaved: (client: Client) => void
  factures: Facture[]
}

function profileValue(value: string): Client['profil'] {
  if (value === 'particulier informel' || value === 'corporate') return value
  return 'professionnel'
}

const labelClass = 'mb-1 block text-sm font-bold text-slate-800'
const inputClass = 'min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-now-blue'

export default function ClientDetailsPanel({
  selectedClient,
  editingClient,
  onClose,
  onStartEditing,
  onEditingChange,
  onSaved,
  factures,
}: ClientDetailsPanelProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!selectedClient && !editingClient) return null

  const update = (patch: Partial<Client>) => {
    if (editingClient) onEditingChange({ ...editingClient, ...patch })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingClient || saving) return
    setSaving(true)
    setError(null)
    try {
      const result = await updateClient(editingClient)
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      onSaved(result.data)
    } catch {
      setError('Impossible de mettre à jour le client. Réessayez.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/25 backdrop-blur-[1px]">
      <section className="h-full w-full max-w-lg overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl" aria-label={editingClient ? 'Modifier le client' : 'Profil du client'}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-black text-now-blue">{editingClient ? 'Modifier le client' : 'Profil du client'}</h3>
          <button type="button" onClick={onClose} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {editingClient ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && <p role="alert" className="border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div><label htmlFor="client-name" className={labelClass}>Nom</label><input id="client-name" value={editingClient.nom} onChange={(event) => update({ nom: event.target.value })} className={inputClass} /></div>
            <div><label htmlFor="client-email" className={labelClass}>E-mail</label><input id="client-email" type="email" value={editingClient.email ?? ''} onChange={(event) => update({ email: event.target.value })} className={inputClass} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="client-phone" className={labelClass}>Téléphone</label><input id="client-phone" value={editingClient.telephone ?? ''} onChange={(event) => update({ telephone: event.target.value })} className={inputClass} /></div>
              <div><label htmlFor="client-whatsapp" className={labelClass}>WhatsApp</label><input id="client-whatsapp" value={editingClient.whatsapp ?? ''} onChange={(event) => update({ whatsapp: event.target.value })} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="client-profile" className={labelClass}>Profil</label><select id="client-profile" value={editingClient.profil} onChange={(event) => update({ profil: profileValue(event.target.value) })} className={inputClass}><option value="particulier informel">Particulier informel</option><option value="professionnel">Professionnel</option><option value="corporate">Corporate</option></select></div>
              <div><label htmlFor="client-sector" className={labelClass}>Secteur</label><input id="client-sector" value={editingClient.secteur ?? ''} onChange={(event) => update({ secteur: event.target.value })} className={inputClass} /></div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Annuler</button>
              <button type="submit" disabled={saving} className="min-h-11 rounded-xl bg-now-yellow px-4 py-2 text-sm font-bold text-now-blue disabled:opacity-60">{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          </form>
        ) : (
          <div className="space-y-5 text-sm text-slate-700">
            <div><p className={labelClass}>Nom</p><p className="mt-1 font-semibold text-now-blue">{selectedClient?.nom}</p></div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className={labelClass}>Téléphone</p><p>{selectedClient?.telephone || 'Non renseigné'}</p></div>
              <div><p className={labelClass}>WhatsApp</p><p>{selectedClient?.whatsapp || 'Non renseigné'}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className={labelClass}>Profil</p><p>{selectedClient?.profil}</p></div>
              <div><p className={labelClass}>Secteur</p><p>{selectedClient?.secteur || 'Non renseigné'}</p></div>
            </div>
            <div><p className={labelClass}>E-mail</p><p>{selectedClient?.email || 'Non renseigné'}</p></div>
            <section aria-labelledby="client-invoices-title" className="border-t border-slate-200 pt-4"><h4 id="client-invoices-title" className="mb-2 text-sm font-bold text-now-blue">Créances du client</h4>{factures.length ? <ul className="divide-y divide-slate-200">{factures.map((facture) => <li key={facture.id} className="flex flex-wrap justify-between gap-2 py-3"><span>Échéance : {formatIsoDate(facture.date_echeance)}</span><span className="font-semibold">{formatFcfa(facture.montant_fcfa)}</span></li>)}</ul> : <p>Aucune créance enregistrée.</p>}</section>
            {selectedClient && <button type="button" onClick={() => onStartEditing(selectedClient)} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-now-yellow px-4 py-3 font-bold text-now-blue hover:bg-now-yellow-hover"><PencilLine className="h-4 w-4" />Modifier le client</button>}
          </div>
        )}
      </section>
    </div>
  )
}
