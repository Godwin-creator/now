'use client'

import { useState } from 'react'
import { creerCreance } from '@/app/actions/creances'
import { UserPlus, Users, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react'
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
        const errText = typeof res.error === 'string' ? res.error : "Une erreur est survenue lors de l'enregistrement."
        setErrorMessage(errText)
      } else {
        setSuccessMessage("Créance enregistrée avec succès !")
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
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 w-full max-w-xl mx-auto transition-all">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Nouvelle Créance
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Saisie rapide d'un impayé client</p>
        </div>
        <span className="text-xs bg-[#F3B229]/15 text-[#8A6000] font-semibold px-3 py-1 rounded-full border border-[#F3B229]/30 flex items-center gap-1.5">
          <Sparkles size={13} className="text-[#F3B229]" /> V1 Manuel
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Messages d'alerte */}
        {errorMessage && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium animate-in fade-in">
            <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold animate-in fade-in">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
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
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              !isNewClient 
                ? 'bg-white shadow-sm text-[#1E4D2B]' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Users size={16} /> Client existant
          </button>
          <button 
            type="button" 
            onClick={() => {
              setIsNewClient(true)
              setErrorMessage(null)
            }} 
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              isNewClient 
                ? 'bg-white shadow-sm text-[#1E4D2B]' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <UserPlus size={16} /> Nouveau client
          </button>
        </div>

        <input type="hidden" name="isNewClient" value={isNewClient.toString()} />

        {isNewClient ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                Nom du client / Entreprise <span className="text-[#1E4D2B]">*</span>
              </label>
              <input 
                required 
                name="nom_client" 
                placeholder="Ex: Kofi Agence, Cabinet Sika..." 
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#1E4D2B] focus:border-transparent focus:bg-white outline-none transition-all" 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Numéro WhatsApp</label>
                <input 
                  name="whatsapp" 
                  placeholder="Ex: +22890000000" 
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#1E4D2B] focus:border-transparent focus:bg-white outline-none transition-all" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Adresse Email</label>
                <input 
                  name="email" 
                  type="email" 
                  placeholder="client@domaine.com" 
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#1E4D2B] focus:border-transparent focus:bg-white outline-none transition-all" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  Profil du client <span className="text-[#1E4D2B]">*</span>
                </label>
                <select 
                  name="profil" 
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#1E4D2B] focus:border-transparent focus:bg-white outline-none transition-all"
                >
                  <option value="professionnel">Professionnel (PME / Commerçant)</option>
                  <option value="corporate">Corporate / Institutionnel</option>
                  <option value="particulier informel">Particulier / Informel</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Secteur d'activité</label>
                <select 
                  name="secteur" 
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#1E4D2B] focus:border-transparent focus:bg-white outline-none transition-all"
                >
                  <option value="Services">Services & Consulting</option>
                  <option value="Commerce">Commerce & Distribution</option>
                  <option value="BTP">BTP & Construction</option>
                  <option value="Informel">Secteur Informel</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                Retards de paiement antérieurs (nombre)
              </label>
              <input 
                name="retards_precedents" 
                type="number" 
                min="0" 
                defaultValue="0" 
                placeholder="0" 
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#1E4D2B] focus:border-transparent focus:bg-white outline-none transition-all"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">
              Sélectionner le client <span className="text-[#1E4D2B]">*</span>
            </label>
            <select 
              name="client_id" 
              required 
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#1E4D2B] focus:border-transparent focus:bg-white outline-none transition-all"
            >
              <option value="">-- Choisir parmi les clients enregistrés --</option>
              {clientsExistants?.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.profil} — {c.retards_precedents || 0} retard(s))
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="h-px bg-gray-100 my-1"></div>

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1.5">
            Montant dû (FCFA) <span className="text-[#1E4D2B]">*</span>
          </label>
          <input 
            required 
            name="montant_fcfa" 
            type="number" 
            min="100" 
            placeholder="Ex: 45000" 
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold text-gray-900 focus:ring-2 focus:ring-[#1E4D2B] focus:border-transparent focus:bg-white outline-none transition-all" 
          />
        </div>
        
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1.5">
            Date du service rendu <span className="text-[#1E4D2B]">*</span> 
            <span className="text-[11px] text-gray-400 font-normal ml-1">(Échéance calculée à J+30)</span>
          </label>
          <input 
            required 
            name="date_service" 
            type="date" 
            defaultValue={new Date().toISOString().split('T')[0]} 
            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#1E4D2B] focus:border-transparent focus:bg-white outline-none transition-all" 
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">Relation client</label>
            <select 
              name="type_relation" 
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#1E4D2B] focus:border-transparent focus:bg-white outline-none transition-all"
            >
              <option value="regulier">Client régulier</option>
              <option value="nouveau">Nouveau client</option>
              <option value="difficile">Client difficile</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">Canal de relance</label>
            <select 
              name="canal_contact" 
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#1E4D2B] focus:border-transparent focus:bg-white outline-none transition-all"
            >
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
          className="mt-2 w-full bg-[#1E4D2B] hover:bg-[#15381f] text-white font-semibold py-4 rounded-xl active:scale-[0.99] transition-all disabled:opacity-60 shadow-md shadow-[#1E4D2B]/20 text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? 'Enregistrement en cours...' : 'Enregistrer la créance'}
        </button>
      </form>
    </div>
  )
}