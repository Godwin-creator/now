'use client'

import { useState } from 'react'
import { creerCreance } from '@/app/actions/creances'
import { UserPlus, Users, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Client } from '@/types'

export default function CreanceForm({ clientsExistants }: { clientsExistants: Client[] }) {
  const [isNewClient, setIsNewClient] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const formElement = e.currentTarget
      const formData = new FormData(formElement)
      const res = await creerCreance(formData)

      if (!res.success) {
        // Affichage strict d'un message textuel pour éviter toute erreur de sérialisation React
        const errText = typeof res.error === 'string' ? res.error : "Une erreur est survenue lors de l'enregistrement."
        setErrorMessage(errText)
      } else {
        setSuccessMessage("La créance a été enregistrée avec succès !")
        formElement.reset()
        setIsNewClient(false)
        setTimeout(() => setSuccessMessage(null), 4000)
      }
    } catch (err: unknown) {
      console.error("Erreur côté client :", err)
      const errText = err instanceof Error ? err.message : "Erreur de communication avec le serveur."
      setErrorMessage(errText)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-lg mx-auto">
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-xl font-bold text-gray-800">Nouvelle Créance</h2>
        <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">V1 Manuel</span>
      </div>

      {/* Messages d'alerte propres et sérialisables */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold animate-in fade-in">
          <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2.5 p-3.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-semibold animate-in fade-in">
          <CheckCircle2 size={16} className="shrink-0 text-green-600" />
          <span>{successMessage}</span>
        </div>
      )}
      
      {/* Toggle Client Existant / Nouveau */}
      <div className="flex bg-gray-100 p-1 rounded-xl">
        <button 
          type="button" 
          onClick={() => {
            setIsNewClient(false)
            setErrorMessage(null)
          }} 
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${!isNewClient ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Users size={16} /> Client existant
        </button>
        <button 
          type="button" 
          onClick={() => {
            setIsNewClient(true)
            setErrorMessage(null)
          }} 
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${isNewClient ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <UserPlus size={16} /> Nouveau client
        </button>
      </div>

      <input type="hidden" name="isNewClient" value={isNewClient.toString()} />

      {isNewClient ? (
        <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Nom du client / Entreprise *</label>
            <input required name="nom_client" placeholder="Ex: Kofi Agence, Cabinet Sika..." className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">WhatsApp</label>
              <input name="whatsapp" placeholder="Ex: +22890000000" className="w-full p-3 border border-gray-200 rounded-xl outline-none text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Email</label>
              <input name="email" type="email" placeholder="client@domaine.com" className="w-full p-3 border border-gray-200 rounded-xl outline-none text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Profil client *</label>
              <select name="profil" className="w-full p-3 border border-gray-200 rounded-xl bg-white outline-none text-sm">
                <option value="professionnel">Professionnel (PME/Commerçant)</option>
                <option value="corporate">Corporate / Institutionnel</option>
                <option value="particulier informel">Particulier / Informel</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Secteur d'activité</label>
              <select name="secteur" className="w-full p-3 border border-gray-200 rounded-xl bg-white outline-none text-sm">
                <option value="Services">Services & Consulting</option>
                <option value="Commerce">Commerce & Distribution</option>
                <option value="BTP">BTP & Construction</option>
                <option value="Informel">Secteur Informel</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Retards de paiement précédents (nombre)</label>
            <input 
              name="retards_precedents" 
              type="number" 
              min="0" 
              defaultValue="0" 
              placeholder="0" 
              className="w-full p-3 border border-gray-200 rounded-xl outline-none text-sm"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Sélectionner un client *</label>
          <select name="client_id" required className="w-full p-3 border border-gray-200 rounded-xl bg-white outline-none text-sm font-medium">
            <option value="">-- Choisir parmi les clients enregistrés --</option>
            {clientsExistants?.map(c => (
              <option key={c.id} value={c.id}>
                {c.nom} ({c.profil} - {c.retards_precedents || 0} retard(s))
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="h-px bg-gray-100 my-1"></div>

      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1">Montant dû (FCFA) *</label>
        <input 
          required 
          name="montant_fcfa" 
          type="number" 
          min="100" 
          placeholder="Ex: 45000" 
          className="w-full p-3.5 border border-gray-200 rounded-xl outline-none font-bold text-lg text-blue-950 focus:ring-2 focus:ring-blue-500" 
        />
      </div>
      
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-600">Date du service rendu * (Échéance calculée à J+30)</label>
        <input 
          required 
          name="date_service" 
          type="date" 
          defaultValue={new Date().toISOString().split('T')[0]} 
          className="w-full p-3 border border-gray-200 rounded-xl outline-none text-sm" 
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Relation client</label>
          <select name="type_relation" className="w-full p-3 border border-gray-200 rounded-xl bg-white outline-none text-sm">
            <option value="regulier">Client régulier</option>
            <option value="nouveau">Nouveau client</option>
            <option value="difficile">Client difficile</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Canal de contact</label>
          <select name="canal_contact" className="w-full p-3 border border-gray-200 rounded-xl bg-white outline-none text-sm">
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="tel">Appel téléphonique</option>
          </select>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="mt-2 w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-60 shadow-md shadow-blue-500/20"
      >
        {isSubmitting ? 'Enregistrement...' : 'Enregistrer la créance'}
      </button>
    </form>
  )
}