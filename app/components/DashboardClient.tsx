'use client'

import { useState, useMemo } from 'react'
import CreanceForm from '@/app/components/CreanceForm'
import RelanceAction from '@/app/components/RelanceAction'
import { marquerCommePayee } from '@/app/actions/paiements'
import { 
  Search, 
  Clock, 
  CheckCircle, 
  CheckCircle2, 
  History, 
  FileText, 
  MessageSquare,
  AlertCircle,
  Filter,
  Check
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

  // State pour l'action de paiement
  const [payingId, setPayingId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Calcul des jours de retard pour chaque facture
  const getJoursRetard = (dateEcheance: string) => {
    const echeance = new Date(dateEcheance)
    const diff = new Date().getTime() - echeance.getTime()
    return Math.max(0, Math.floor(diff / (1000 * 3600 * 24)))
  }

  // Filtrage dynamique des créances
  const facturesFiltrees = useMemo(() => {
    return initialFactures.filter((f) => {
      const nomClient = f.clients?.nom || ''
      const matchSearch = nomClient.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchSearch) return false

      if (filterStatut !== 'Tous' && f.statut !== filterStatut) return false
      if (filterRisque !== 'Tous' && f.niveau_risque !== filterRisque) return false
      if (filterCanal !== 'Tous' && f.canal_contact !== filterCanal) return false

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

  // Gestion du règlement
  const handleMarquerPayee = async (facture: Facture) => {
    if (payingId) return
    const nomClient = facture.clients?.nom || 'ce client'
    const montantFormate = Number(facture.montant_fcfa).toLocaleString('fr-FR')
    
    if (!window.confirm(`Confirmer que la créance de ${montantFormate} FCFA pour ${nomClient} a été réglée ?`)) {
      return
    }

    setPayingId(facture.id)
    setToastMessage(null)

    try {
      const res = await marquerCommePayee(facture.id, Number(facture.montant_fcfa) || 0)
      if (!res.success) {
        setToastMessage({ text: res.error || "Erreur lors du règlement.", type: 'error' })
      } else {
        setToastMessage({ 
          text: `La créance de ${nomClient} (${montantFormate} FCFA) a été marquée comme réglée et archivée !`, 
          type: 'success' 
        })
        setTimeout(() => setToastMessage(null), 5000)
      }
    } catch (err: unknown) {
      console.error("Erreur marquerCommePayee :", err)
      setToastMessage({ text: "Erreur de communication avec le serveur.", type: 'error' })
    } finally {
      setPayingId(null)
    }
  }

  // Liste des factures réglées
  const facturesPayees = useMemo(() => {
    return initialFactures.filter(f => f.statut === 'payee')
  }, [initialFactures])

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs md:text-sm font-semibold shadow-md animate-in fade-in slide-in-from-top-3 ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'success' ? (
              <CheckCircle className="text-emerald-700 shrink-0" size={18} />
            ) : (
              <AlertCircle className="text-rose-600 shrink-0" size={18} />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)} 
            className="text-xs font-bold underline opacity-70 hover:opacity-100"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Formulaire de création */}
      <section>
        <CreanceForm clientsExistants={initialClients} />
      </section>

      {/* Onglets de navigation */}
      <div className="flex border-b border-gray-200 gap-6 px-1">
        <button
          onClick={() => setActiveTab('creances')}
          className={`flex items-center gap-2 pb-3 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'creances' 
              ? 'border-[#1E4D2B] text-[#1E4D2B]' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileText size={18} /> Créances ({facturesFiltrees.length})
        </button>
        <button
          onClick={() => setActiveTab('historique')}
          className={`flex items-center gap-2 pb-3 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'historique' 
              ? 'border-[#1E4D2B] text-[#1E4D2B]' 
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <History size={18} /> Historique &amp; Règlements ({initialRelances.length + initialPaiements.length + facturesPayees.length})
        </button>
      </div>

      {activeTab === 'creances' && (
        <section className="space-y-4">
          {/* Barre de Recherche et Filtres épurés */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom de client ou entreprise..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-[#1E4D2B] focus:border-transparent focus:bg-white outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Statut</label>
                <select
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#1E4D2B] focus:bg-white outline-none"
                >
                  <option value="en_attente">En attente (Actives)</option>
                  <option value="Tous">Tous les statuts</option>
                  <option value="payee">Réglées / Payées</option>
                  <option value="annulee">Annulées</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Niveau de Risque</label>
                <select
                  value={filterRisque}
                  onChange={(e) => setFilterRisque(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#1E4D2B] focus:bg-white outline-none"
                >
                  <option value="Tous">Tous les risques</option>
                  <option value="Faible">🟢 Faible</option>
                  <option value="Moyen">🟡 Moyen</option>
                  <option value="Élevé">🟠 Élevé</option>
                  <option value="Critique">🔴 Critique</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Jours de Retard</label>
                <select
                  value={filterRetard}
                  onChange={(e) => setFilterRetard(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#1E4D2B] focus:bg-white outline-none"
                >
                  <option value="Tous">Toutes durées</option>
                  <option value="1-15">1 à 15 jours</option>
                  <option value="16-30">16 à 30 jours</option>
                  <option value="31-45">31 à 45 jours</option>
                  <option value="gt45">+ de 45 jours</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Canal de contact</label>
                <select
                  value={filterCanal}
                  onChange={(e) => setFilterCanal(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#1E4D2B] focus:bg-white outline-none"
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
              const estPayee = facture.statut === 'payee'

              return (
                <div key={facture.id} className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4 hover:border-gray-200 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                        {facture.clients?.nom || 'Client'}
                        {facture.clients?.profil && (
                          <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full capitalize">
                            {facture.clients.profil}
                          </span>
                        )}
                        {estPayee && (
                          <span className="text-[11px] font-bold bg-[#1E4D2B]/10 text-[#1E4D2B] px-2.5 py-0.5 rounded-full border border-[#1E4D2B]/20">
                            Payée
                          </span>
                        )}
                      </h3>
                      <p className="text-xl font-black text-gray-900 mt-1">
                        {Number(facture.montant_fcfa).toLocaleString('fr-FR')} <span className="text-xs font-bold text-gray-500">FCFA</span>
                      </p>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      estPayee ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      facture.niveau_risque === 'Critique' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      facture.niveau_risque === 'Élevé' ? 'bg-[#F3B229]/20 text-[#8A6000] border border-[#F3B229]/40' :
                      facture.niveau_risque === 'Moyen' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {estPayee ? '✓ Réglée' : `Risque ${facture.niveau_risque} (${facture.score_risque}/100)`}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 flex flex-wrap gap-2.5 items-center">
                    <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg font-medium capitalize">
                      Canal: {facture.canal_contact}
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg font-medium">
                      Échéance: {new Date(facture.date_echeance).toLocaleDateString('fr-FR')}
                    </span>
                    
                    {/* Badge de statut avec accent Or #F3B229 pour les retards */}
                    <span className={`px-2.5 py-1 rounded-lg font-semibold ${
                      estPayee ? 'bg-emerald-50 text-emerald-700' :
                      joursRetard > 0 
                        ? 'bg-[#F3B229]/15 text-[#8A6000] border border-[#F3B229]/30' 
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {estPayee ? 'Facture soldée' : joursRetard > 0 ? `${joursRetard} jour(s) de retard` : 'Dans les délais'}
                    </span>
                  </div>

                  {/* Bouton de Règlement et Relance IA */}
                  {facture.statut === 'en_attente' && (
                    <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">Action rapide</span>
                        <button
                          type="button"
                          onClick={() => handleMarquerPayee(facture)}
                          disabled={payingId === facture.id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1E4D2B] hover:bg-[#15381f] text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                        >
                          <CheckCircle size={14} className="text-[#F3B229]" />
                          {payingId === facture.id ? "Validation..." : "Marquer comme payé"}
                        </button>
                      </div>

                      <RelanceAction 
                        factureId={facture.id} 
                        canal={facture.canal_contact} 
                        niveauRisque={facture.niveau_risque} 
                      />
                    </div>
                  )}
                </div>
              )
            })}
            
            {facturesFiltrees.length === 0 && (
              <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-200 text-gray-400 flex flex-col items-center">
                <CheckCircle2 size={44} className="mb-2 text-[#1E4D2B]" />
                <p className="font-semibold text-gray-700">Aucune créance ne correspond à vos filtres.</p>
                <p className="text-xs text-gray-400 mt-1">Réinitialisez les critères pour revoir vos dossiers.</p>
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
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                filterTypeHist === 'tous' ? 'bg-white shadow-xs text-[#1E4D2B]' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterTypeHist('relances')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                filterTypeHist === 'relances' ? 'bg-white shadow-xs text-[#1E4D2B]' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Relances ({initialRelances.length})
            </button>
            <button
              onClick={() => setFilterTypeHist('paiements')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                filterTypeHist === 'paiements' ? 'bg-white shadow-xs text-[#1E4D2B]' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Paiements ({initialPaiements.length + facturesPayees.length})
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {/* Relances IA */}
            {(filterTypeHist === 'tous' || filterTypeHist === 'relances') && initialRelances.map((relance) => (
              <div key={relance.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span className="flex items-center gap-1.5 font-bold text-[#1E4D2B] bg-[#1E4D2B]/10 px-2.5 py-1 rounded-lg">
                    <MessageSquare size={14} /> Relance générée ({relance.canal.toUpperCase()})
                  </span>
                  <span>{new Date(relance.created_at).toLocaleString('fr-FR')}</span>
                </div>
                <p className="text-xs text-gray-700 italic bg-gray-50 p-3 rounded-lg border border-gray-100 font-sans leading-relaxed">
                  "{relance.message_genere}"
                </p>
              </div>
            ))}

            {/* Paiements enregistrés */}
            {(filterTypeHist === 'tous' || filterTypeHist === 'paiements') && initialPaiements.map((p) => {
              const nomClient = p.factures?.clients?.nom || 'Client'

              return (
                <div key={p.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
                      <Check size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Règlement reçu — {nomClient}</p>
                      <p className="text-[11px] text-gray-500">{new Date(p.date_paiement).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <p className="font-extrabold text-[#1E4D2B] text-sm">
                    +{Number(p.montant_paye).toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
              )
            })}

            {/* Créances soldées directes */}
            {(filterTypeHist === 'tous' || filterTypeHist === 'paiements') && initialPaiements.length === 0 && facturesPayees.map((f) => (
              <div key={f.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
                    <Check size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Créance soldée — {f.clients?.nom || 'Client'}</p>
                    <p className="text-[11px] text-gray-500">Échéance: {new Date(f.date_echeance).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <p className="font-extrabold text-[#1E4D2B] text-sm">
                  {Number(f.montant_fcfa).toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            ))}

            {initialRelances.length === 0 && initialPaiements.length === 0 && facturesPayees.length === 0 && (
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
