'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { marquerCommePayee } from '@/app/actions/paiements'
import {
  Search,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Globe,
  Mail,
  MessageCircle,
  MessageSquare,
  PhoneCall,
  ChevronDown,
} from 'lucide-react'
import { Client, Facture, Relance, Paiement } from '@/types'
import RelanceAction from './RelanceAction'

interface DashboardClientProps {
  initialClients: Client[]
  initialFactures: Facture[]
  initialRelances: Relance[]
  initialPaiements: Paiement[]
}

export default function DashboardClient({
  initialClients,
  initialFactures,
  initialRelances,
  initialPaiements,
}: DashboardClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('en_attente')
  const [payingId, setPayingId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const getJoursRetard = (dateEcheance: string) => {
    const diff = new Date().getTime() - new Date(dateEcheance).getTime()
    return Math.max(0, Math.floor(diff / (1000 * 3600 * 24)))
  }

  const facturesFiltrees = useMemo(() => {
    return initialFactures.filter((f) => {
      const nom = f.clients?.nom || ''
      if (!nom.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (filterStatut !== 'Tous' && f.statut !== filterStatut) return false
      return true
    })
  }, [initialFactures, searchTerm, filterStatut])

  const formatMontant = (montant: number) => {
    return montant.toLocaleString('fr-FR', { useGrouping: true, minimumFractionDigits: 0 })
  }

  const handleMarquerPayee = async (facture: Facture) => {
    if (payingId) return
    const nomClient = facture.clients?.nom || 'ce client'
    const montantFormate = formatMontant(Number(facture.montant_fcfa))
    if (!window.confirm(`Confirmer le règlement de ${montantFormate} FCFA pour ${nomClient} ?`)) return

    setPayingId(facture.id)
    setToastMessage(null)
    try {
      const res = await marquerCommePayee(facture.id, Number(facture.montant_fcfa) || 0)
      if (!res.success) {
        setToastMessage({ text: res.error || 'Erreur lors du règlement.', type: 'error' })
      } else {
        setToastMessage({ text: `Règlement de ${nomClient} (${montantFormate} FCFA) archivé !`, type: 'success' })
        setTimeout(() => setToastMessage(null), 5000)
      }
    } catch {
      setToastMessage({ text: 'Erreur de communication avec le serveur.', type: 'error' })
    } finally {
      setPayingId(null)
    }
  }

  const riskStyle = (niveau: string) => {
    if (niveau === 'Critique') return 'bg-red-50 text-red-700 border border-red-200'
    if (niveau === 'Élevé')   return 'bg-orange-50 text-orange-800 border border-orange-200'
    if (niveau === 'Moyen')   return 'bg-yellow-50 text-yellow-800 border border-yellow-200'
    return 'bg-green-50 text-green-700 border border-green-200'
  }

  return (
    <div className="flex flex-col h-full space-y-6 overflow-hidden">
      
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`absolute top-8 right-8 z-50 p-4 rounded-xl shadow-lg border-l-4 flex items-center gap-3 text-sm font-semibold ${
              toastMessage.type === 'success' ? 'bg-green-50 text-green-900 border-green-500' : 'bg-red-50 text-red-900 border-red-500'
            }`}
          >
            {toastMessage.type === 'success' ? <CheckCircle size={18} className="text-green-600" /> : <AlertCircle size={18} className="text-red-600" />}
            <span>{toastMessage.text}</span>
            <button onClick={() => setToastMessage(null)} className="ml-4 opacity-50 hover:opacity-100">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex justify-between items-center shrink-0">
        <div className="relative w-80">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher un client..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-now-blue/20 focus:border-now-blue transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-now-blue uppercase">Statut :</span>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-now-blue/20 focus:border-now-blue"
          >
            <option value="en_attente">En attente</option>
            <option value="Tous">Tous</option>
            <option value="payee">Réglées</option>
            <option value="annulee">Annulées</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto border border-gray-200 rounded-xl bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-xs text-now-blue uppercase tracking-wider font-semibold border-b">Client</th>
              <th className="px-6 py-4 text-xs text-now-blue uppercase tracking-wider font-semibold border-b text-right">Montant (FCFA)</th>
              <th className="px-6 py-4 text-xs text-now-blue uppercase tracking-wider font-semibold border-b">Échéance</th>
              <th className="px-6 py-4 text-xs text-now-blue uppercase tracking-wider font-semibold border-b">Risque</th>
              <th className="px-6 py-4 text-xs text-now-blue uppercase tracking-wider font-semibold border-b">Canal</th>
              <th className="px-6 py-4 text-xs text-now-blue uppercase tracking-wider font-semibold border-b text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {facturesFiltrees.map((facture) => {
              const estPayee = facture.statut === 'payee'
              const joursRetard = getJoursRetard(facture.date_echeance)
              const isExpanded = expandedRow === facture.id
              
              return (
                <React.Fragment key={facture.id}>
                  <tr className={`group transition-colors border-b border-gray-100 ${isExpanded ? 'bg-blue-100' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{facture.clients?.nom || 'Client Inconnu'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{facture.clients?.telephone || 'Sans numéro'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-gray-900 tabular-nums">{formatMontant(Number(facture.montant_fcfa))}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{new Date(facture.date_echeance).toLocaleDateString('fr-FR')}</p>
                      {joursRetard > 0 && !estPayee && (
                         <span className="inline-block mt-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                           {joursRetard}j retard
                         </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {estPayee ? (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-green-100 text-green-700">Soldée</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                             <span className={`text-xs font-semibold px-2.5 py-1 rounded ${riskStyle(facture.niveau_risque)}`}>
                               {facture.niveau_risque}
                             </span>
                             <span className="text-xs text-gray-400">{facture.score_risque}/100</span>
                          </div>
                          {facture.statut === 'en_attente' && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">En attente</span>
                          )}
                          {facture.statut === 'annulee' && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">Annulée</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded w-fit">
                        {facture.canal_contact === 'whatsapp' && <MessageCircle size={14} className="text-green-500" />}
                        {facture.canal_contact === 'email' && <Mail size={14} className="text-blue-500" />}
                        {facture.canal_contact === 'sms' && <MessageSquare size={14} className="text-purple-500" />}
                        {facture.canal_contact === 'tel' && <PhoneCall size={14} className="text-orange-500" />}
                        {facture.canal_contact === 'tous' && <Globe size={14} className="text-blue-500" />}
                        <span className="capitalize">{facture.canal_contact}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!estPayee && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleMarquerPayee(facture)}
                            disabled={payingId === facture.id}
                            className="text-xs font-semibold bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded hover:bg-green-50 hover:border-green-500 hover:text-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Payé
                          </button>
                          <button
                            onClick={() => setExpandedRow(isExpanded ? null : facture.id)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors ${isExpanded ? 'bg-now-blue text-white' : 'bg-now-yellow text-now-blue hover:bg-now-yellow-hover'}`}
                          >
                            {isExpanded ? 'Fermer' : 'Relancer IA'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  
                  {/* Expanded Row for RelanceAction */}
                  <AnimatePresence>
                    {isExpanded && !estPayee && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <td colSpan={6} className="bg-blue-50/30 p-0 border-b border-gray-200">
                          <div className="p-6">
                            <RelanceAction
                              factureId={facture.id}
                              canal={facture.canal_contact}
                              niveauRisque={facture.niveau_risque}
                              client={facture.clients}
                            />
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              )
            })}
            
            {facturesFiltrees.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">
                  <p className="font-medium">Aucune créance trouvée.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
