'use client'

import { useState, useMemo } from 'react'
import CreanceForm from '@/app/components/CreanceForm'
import RelanceAction from '@/app/components/RelanceAction'
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  History, 
  FileText, 
  Calendar, 
  User, 
  MessageSquare,
  XCircle,
  TrendingUp,
  Building
} from 'lucide-react'
import { Client, Facture, Relance, Paiement } from '@/types'

interface DashboardClientProps {
  initialClients: Client[];
  initialFactures: Facture[];
  initialRelances: Relance[];
  initialPaiements: Paiement[];
}

export default function DashboardClient({
  initialClients,
  initialFactures,
  initialRelances,
  initialPaiements
}: DashboardClientProps) {
  // Navigation Tabs: 'creances' | 'historique'
  const [activeTab, setActiveTab] = useState<'creances' | 'historique'>('creances')

  // State Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('en_attente')
  const [filterRisque, setFilterRisque] = useState<string>('Tous')
  const [filterRetard, setFilterRetard] = useState<string>('Tous')
  const [filterCanal, setFilterCanal] = useState<string>('Tous')

  // Filtre Historique
  const [filterTypeHist, setFilterTypeHist] = useState<'tous' | 'relances' | 'paiements'>('tous')

  // Calcul des jours de retard pour chaque facture
  const getJoursRetard = (dateEcheance: string) => {
    const echeance = new Date(dateEcheance)
    const diff = new Date().getTime() - echeance.getTime()
    return Math.max(0, Math.floor(diff / (1000 * 3600 * 24)))
  }

  // Filtrage dynamique des créances
  const facturesFiltrees = useMemo(() => {
    return initialFactures.filter((f) => {
      // 1. Recherche globale par nom de client
      const nomClient = f.clients?.nom || ''
      const matchSearch = nomClient.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchSearch) return false

      // 2. Filtre statut
      if (filterStatut !== 'Tous' && f.statut !== filterStatut) return false

      // 3. Filtre risque
      if (filterRisque !== 'Tous' && f.niveau_risque !== filterRisque) return false

      // 4. Filtre canal
      if (filterCanal !== 'Tous' && f.canal_contact !== filterCanal) return false

      // 5. Filtre tranche de retard
      if (filterRetard !== 'Tous') {
        const jr = getJoursRetard(f.date_echeance)
        if (filterRetard === '1-15' && (jr < 1 || jr > 15)) return false
        if (filterRetard === '16-30' && (jr < 16 || jr > 30)) return false
        if (filterRetard === '31-45' && (jr < 31 || jr > 45)) return false
        if (filterRetard === 'gt45' && jr <= 45) return false
      }

      return true
    })
  }, [initialFactures, searchTerm, filterStatut, filterRisque, filterCanal, filterRetard])

  return (
    <div className="space-y-8">
      {/* Formulaire de création de créance */}
      <section>
        <CreanceForm clientsExistants={initialClients} />
      </section>

      {/* Navigation Onglets (Créances / Historique) */}
      <div className="flex border-b border-gray-200 gap-6 px-2">
        <button
          onClick={() => setActiveTab('creances')}
          className={`flex items-center gap-2 pb-3 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'creances' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <FileText size={18} /> Créances ({facturesFiltrees.length})
        </button>
        <button
          onClick={() => setActiveTab('historique')}
          className={`flex items-center gap-2 pb-3 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'historique' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <History size={18} /> Historique &amp; Relances ({initialRelances.length + initialPaiements.length})
        </button>
      </div>

      {activeTab === 'creances' && (
        <section className="space-y-4">
          {/* Barre de Recherche et Filtres */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom de client..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div>
                <label className="text-[11px] font-bold text-gray-500 block mb-1">Statut</label>
                <select
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold outline-none"
                >
                  <option value="en_attente">En attente (Actives)</option>
                  <option value="Tous">Tous les statuts</option>
                  <option value="payee">Réglées / Payées</option>
                  <option value="annulee">Annulées</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 block mb-1">Niveau de Risque</label>
                <select
                  value={filterRisque}
                  onChange={(e) => setFilterRisque(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold outline-none"
                >
                  <option value="Tous">Tous les risques</option>
                  <option value="Faible">🟢 Faible</option>
                  <option value="Moyen">🟡 Moyen</option>
                  <option value="Élevé">🟠 Élevé</option>
                  <option value="Critique">🔴 Critique</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 block mb-1">Jours de Retard</label>
                <select
                  value={filterRetard}
                  onChange={(e) => setFilterRetard(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold outline-none"
                >
                  <option value="Tous">Toutes durées</option>
                  <option value="1-15">1 à 15 jours</option>
                  <option value="16-30">16 à 30 jours</option>
                  <option value="31-45">31 à 45 jours</option>
                  <option value="gt45">+ de 45 jours</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 block mb-1">Canal de contact</label>
                <select
                  value={filterCanal}
                  onChange={(e) => setFilterCanal(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold outline-none"
                >
                  <option value="Tous">Tous les canaux</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="tel">Appel téléphonique</option>
                </select>
              </div>
            </div>
          </div>

          {/* Liste des créances */}
          <div className="flex flex-col gap-4">
            {facturesFiltrees.map((facture) => {
              const joursRetard = getJoursRetard(facture.date_echeance)
              return (
                <div key={facture.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3.5 hover:border-gray-200 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                        {facture.clients?.nom || 'Client sans nom'}
                        {facture.clients?.profil && (
                          <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                            {facture.clients.profil}
                          </span>
                        )}
                      </h3>
                      <p className="text-lg font-extrabold text-blue-950 mt-0.5">
                        {Number(facture.montant_fcfa).toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      facture.niveau_risque === 'Critique' ? 'bg-red-100 text-red-700 border border-red-200' :
                      facture.niveau_risque === 'Élevé' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                      facture.niveau_risque === 'Moyen' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      Risque {facture.niveau_risque} ({facture.score_risque}/100)
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 flex flex-wrap gap-2 items-center">
                    <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-semibold capitalize">
                      Canal: {facture.canal_contact}
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-semibold">
                      Échéance: {new Date(facture.date_echeance).toLocaleDateString('fr-FR')}
                    </span>
                    <span className={`px-2.5 py-1 rounded-md font-bold ${joursRetard > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {joursRetard > 0 ? `${joursRetard} jour(s) de retard` : 'Dans les délais'}
                    </span>
                  </div>

                  {/* Composant Génération et Action de Relance */}
                  {facture.statut === 'en_attente' && (
                    <RelanceAction 
                      factureId={facture.id} 
                      canal={facture.canal_contact} 
                      niveauRisque={facture.niveau_risque} 
                    />
                  )}
                </div>
              )
            })}
            
            {facturesFiltrees.length === 0 && (
              <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 flex flex-col items-center">
                <CheckCircle2 size={44} className="mb-2 text-green-500" />
                <p className="font-semibold text-gray-600">Aucune créance ne correspond à vos filtres.</p>
                <p className="text-xs text-gray-400 mt-1">Essayez de réinitialiser vos critères de recherche.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'historique' && (
        <section className="space-y-4">
          <div className="flex bg-gray-100 p-1 rounded-xl max-w-xs">
            <button
              onClick={() => setFilterTypeHist('tous')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTypeHist === 'tous' ? 'bg-white shadow-xs text-blue-600' : 'text-gray-500'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterTypeHist('relances')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTypeHist === 'relances' ? 'bg-white shadow-xs text-blue-600' : 'text-gray-500'
              }`}
            >
              Relances IA ({initialRelances.length})
            </button>
            <button
              onClick={() => setFilterTypeHist('paiements')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTypeHist === 'paiements' ? 'bg-white shadow-xs text-blue-600' : 'text-gray-500'
              }`}
            >
              Paiements ({initialPaiements.length})
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {(filterTypeHist === 'tous' || filterTypeHist === 'relances') && initialRelances.map((relance) => (
              <div key={relance.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span className="flex items-center gap-1.5 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    <MessageSquare size={14} /> Relance générée ({relance.canal.toUpperCase()})
                  </span>
                  <span>{new Date(relance.created_at).toLocaleString('fr-FR')}</span>
                </div>
                <p className="text-xs text-gray-700 italic bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono">
                  "{relance.message_genere}"
                </p>
              </div>
            ))}

            {(filterTypeHist === 'tous' || filterTypeHist === 'paiements') && initialPaiements.map((p) => (
              <div key={p.id} className="bg-white p-4 rounded-xl border border-green-100 shadow-2xs flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-green-600" />
                  <div>
                    <p className="text-xs font-bold text-gray-800">Règlement reçu</p>
                    <p className="text-xs text-gray-500">{new Date(p.date_paiement).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <p className="font-extrabold text-green-600 text-sm">
                  +{Number(p.montant_paye).toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            ))}

            {initialRelances.length === 0 && initialPaiements.length === 0 && (
              <div className="text-center p-8 bg-white rounded-xl border border-dashed border-gray-200 text-gray-400">
                Aucun historique enregistré pour le moment.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
