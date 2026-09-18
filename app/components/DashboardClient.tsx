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

  const handleMarquerPayee = async (facture: Facture) => {
    if (payingId) return
    const nomClient = facture.clients?.nom || 'ce client'
    const montantFormate = Number(facture.montant_fcfa).toLocaleString('fr-FR')
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
    if (niveau === 'Critique') return 'bg-rose-50 text-rose-700 border border-rose-200'
    if (niveau === 'Élevé')   return 'bg-amber-50 text-amber-800 border border-amber-200'
    if (niveau === 'Moyen')   return 'bg-yellow-50 text-yellow-800 border border-yellow-200'
    return 'bg-now-bg text-now-green border border-gray-200'
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
              toastMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-500' : 'bg-rose-50 text-rose-900 border-rose-500'
            }`}
          >
            {toastMessage.type === 'success' ? <CheckCircle size={18} className="text-emerald-600" /> : <AlertCircle size={18} className="text-rose-600" />}
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
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-now-green/20 focus:border-now-green transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-500 uppercase">Statut :</span>
          <select 
            value={filterStatut} 
            onChange={(e) => setFilterStatut(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none"
          >
            <option value="en_attente">En attente</option>
            <option value="Tous">Tous</option>
            <option value="payee">Réglées</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto border border-gray-100 rounded-2xl bg-white">
        <table className="w-full text-left border-collapse">
          <thead className="bg-now-bg/50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Client</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Montant (FCFA)</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Échéance</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Risque</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Canal</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {facturesFiltrees.map((facture) => {
              const estPayee = facture.statut === 'payee'
              const joursRetard = getJoursRetard(facture.date_echeance)
              const isExpanded = expandedRow === facture.id
              
              return (
                <React.Fragment key={facture.id}>
                  <tr className="group hover:bg-gray-50/80 hover:shadow-sm transition-all duration-200">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{facture.clients?.nom || 'Client Inconnu'}</p>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">{facture.clients?.telephone || 'Sans numéro'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-gray-900 tabular-nums">{Number(facture.montant_fcfa).toLocaleString('fr-FR')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{new Date(facture.date_echeance).toLocaleDateString('fr-FR')}</p>
                      {joursRetard > 0 && !estPayee && (
                         <span className="inline-block mt-1 text-[10px] font-bold text-now-gold bg-now-gold/10 px-2 py-0.5 rounded-sm">
                           {joursRetard}j retard
                         </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {estPayee ? (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Soldée</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                           <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${riskStyle(facture.niveau_risque)}`}>
                             {facture.niveau_risque}
                           </span>
                           <span className="text-[10px] text-gray-400 font-mono">{facture.score_risque}/100</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg w-fit">
                        {facture.canal_contact === 'whatsapp' && <MessageCircle size={14} className="text-[#25D366]" />}
                        {facture.canal_contact === 'email' && <Mail size={14} />}
                        {facture.canal_contact === 'sms' && <MessageSquare size={14} />}
                        {facture.canal_contact === 'tel' && <PhoneCall size={14} />}
                        {facture.canal_contact === 'tous' && <Globe size={14} className="text-now-gold" />}
                        <span className="capitalize">{facture.canal_contact}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!estPayee && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleMarquerPayee(facture)}
                            disabled={payingId === facture.id}
                            className="text-xs font-bold bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-colors disabled:opacity-50"
                          >
                            Payé
                          </button>
                          <button
                            onClick={() => setExpandedRow(isExpanded ? null : facture.id)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-now-green text-white' : 'bg-now-gold text-now-green hover:bg-now-gold/90'}`}
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
                        <td colSpan={6} className="bg-gray-50/50 p-0 border-b border-gray-100">
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
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  <p className="font-semibold">Aucune créance trouvée.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
