'use client'

import { useState } from 'react'
import { creerCreance } from '@/app/actions/creances'
import { UserPlus, Users } from 'lucide-react'

export default function CreanceForm({ clientsExistants }: { clientsExistants: any[] }) {
  const [isNewClient, setIsNewClient] = useState(false)

  return (
    <form action={creerCreance} className="flex flex-col gap-4 p-4 bg-white rounded-xl shadow-sm w-full max-w-md mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Nouvelle Créance</h2>
      
      {/* Toggle Client Existant / Nouveau */}
      <div className="flex bg-gray-100 p-1 rounded-lg">
        <button type="button" onClick={() => setIsNewClient(false)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${!isNewClient ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>
          <Users size={16} /> Existant
        </button>
        <button type="button" onClick={() => setIsNewClient(true)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${isNewClient ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>
          <UserPlus size={16} /> Nouveau
        </button>
      </div>

      <input type="hidden" name="isNewClient" value={isNewClient.toString()} />

      {isNewClient ? (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <input required name="nom_client" placeholder="Nom du client / Entreprise" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          <input name="whatsapp" placeholder="Numéro WhatsApp (ex: +228...)" className="w-full p-3 border rounded-lg outline-none" />
          <input name="email" type="email" placeholder="Email du client" className="w-full p-3 border rounded-lg outline-none" />
          <select name="profil" className="w-full p-3 border rounded-lg bg-white outline-none">
            <option value="particulier informel">Particulier / Informel</option>
            <option value="professionnel">Professionnel</option>
            <option value="corporate">Corporate / Institutionnel</option>
          </select>
        </div>
      ) : (
        <select name="client_id" required className="w-full p-3 border rounded-lg bg-white outline-none">
          <option value="">Sélectionner un client...</option>
          {clientsExistants.map(c => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
      )}

      <div className="h-px bg-gray-200 my-2"></div>

      <input required name="montant" type="number" placeholder="Montant (FCFA)" className="w-full p-3 border rounded-lg outline-none font-semibold text-lg" />
      
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium">Date du service rendu</label>
        <input required name="date_service" type="date" className="w-full p-3 border rounded-lg outline-none" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <select name="type_relation" className="p-3 border rounded-lg bg-white outline-none text-sm">
          <option value="regulier">Client régulier</option>
          <option value="nouveau">Nouveau client</option>
          <option value="difficile">Client difficile</option>
        </select>
        <select name="canal_contact" className="p-3 border rounded-lg bg-white outline-none text-sm">
          <option value="whatsapp">WhatsApp</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="tel">Appel</option>
        </select>
      </div>

      <button type="submit" className="mt-4 w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 active:scale-95 transition-all">
        Enregistrer la créance
      </button>
    </form>
  )
}