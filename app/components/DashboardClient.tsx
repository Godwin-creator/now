'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Check,
  TrendingUp,
  ArrowRight,
  Globe,
  Mail,
  MessageCircle,
  PhoneCall,
} from 'lucide-react'
import { Client, Facture, Relance, Paiement } from '@/types'

interface DashboardClientProps {
  initialClients: Client[]
  initialFactures: Facture[]
  initialRelances: Relance[]
  initialPaiements: Paiement[]
}

// Variants Framer Motion
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as [number,number,number,number] } },
}
const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  exit:   { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

export default function DashboardClient({
  initialClients,
  initialFactures,
  initialRelances,
  initialPaiements,
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'creances' | 'historique'>('creances')
  const [searchTerm, setSearchTerm]     = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('en_attente')
  const [filterRisque, setFilterRisque] = useState<string>('Tous')
  const [filterRetard, setFilterRetard] = useState<string>('Tous')
  const [filterCanal, setFilterCanal]   = useState<string>('Tous')
  const [filterTypeHist, setFilterTypeHist] = useState<'tous' | 'relances' | 'paiements'>('tous')
  const [payingId, setPayingId]   = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const getJoursRetard = (dateEcheance: string) => {
    const diff = new Date().getTime() - new Date(dateEcheance).getTime()
    return Math.max(0, Math.floor(diff / (1000 * 3600 * 24)))
  }

  const facturesFiltrees = useMemo(() => {
    return initialFactures.filter((f) => {
      const nom = f.clients?.nom || ''
      if (!nom.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (filterStatut !== 'Tous' && f.statut !== filterStatut) return false
      if (filterRisque !== 'Tous' && f.niveau_risque !== filterRisque) return false
      if (filterCanal !== 'Tous' && f.canal_contact !== filterCanal) return false
      if (filterRetard !== 'Tous') {
        const jr = getJoursRetard(f.date_echeance)
        if (filterRetard === '1-15'  && (jr < 1  || jr > 15)) return false
        if (filterRetard === '16-30' && (jr < 16 || jr > 30)) return false
        if (filterRetard === '31-45' && (jr < 31 || jr > 45)) return false
        if (filterRetard === 'gt45'  && jr <= 45) return false
      }
      return true
    })
  }, [initialFactures, searchTerm, filterStatut, filterRisque, filterCanal, filterRetard])

  const facturesPayees = useMemo(() =>
    initialFactures.filter(f => f.statut === 'payee'),
  [initialFactures])

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

  // Badge couleur par niveau de risque
  const riskStyle = (niveau: string) => {
    if (niveau === 'Critique') return 'bg-rose-50 text-rose-700 border border-rose-200'
    if (niveau === 'Élevé')   return 'bg-amber-50 text-amber-800 border border-amber-200'
    if (niveau === 'Moyen')   return 'bg-yellow-50 text-yellow-800 border border-yellow-200'
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  }

  return (
    <div className="space-y-6">

      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-4 flex items-center justify-between gap-3 text-xs font-semibold border-l-4 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-500'
                : 'bg-rose-50 text-rose-900 border-rose-500'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toastMessage.type === 'success'
                ? <CheckCircle className="text-emerald-600 shrink-0" size={17} />
                : <AlertCircle className="text-rose-600 shrink-0" size={17} />}
              <span>{toastMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-xs font-bold underline opacity-60 hover:opacity-100"
            >Fermer</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Formulaire nouvelle créance ── */}
      <CreanceForm clientsExistants={initialClients} />

      {/* ── Onglets avec fill border animé ── */}
      <div className="border-b-2 border-gray-200 flex gap-0">
        {([
          { key: 'creances',   icon: <FileText size={15} />,  label: 'Créances', count: facturesFiltrees.length },
          { key: 'historique', icon: <History size={15} />,   label: 'Historique', count: initialRelances.length + initialPaiements.length + facturesPayees.length },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all overflow-hidden ${
              activeTab === tab.key
                ? 'text-[#1E4D2B] bg-white border-t-2 border-x-2 border-gray-200 -mb-px'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`text-[10px] font-black px-1.5 py-0.5 ${
              activeTab === tab.key
                ? 'bg-[#1E4D2B] text-white'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {tab.count}
            </span>
            {/* Accent fill on active */}
            {activeTab === tab.key && (
              <motion.div
                layoutId="tab-accent"
                className="absolute bottom-0 left-0 w-full h-0.5 bg-[#F3B229]"
              />
            )}
          </button>
        ))}
      </div>

      {/* ══ TAB: CRÉANCES ══ */}
      <AnimatePresence mode="wait">
        {activeTab === 'creances' && (
          <motion.section
            key="creances"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-5"
          >
            {/* ── Filtres ── */}
            <div className="bg-white border border-gray-200 p-5 space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 text-gray-400" size={17} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un client…"
                  className="input-anim w-full pl-10 pr-4 py-3 text-sm font-medium"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Statut', value: filterStatut, set: setFilterStatut, options: [
                    ['en_attente','En attente'],['Tous','Tous statuts'],['payee','Réglées'],['annulee','Annulées'],
                  ]},
                  { label: 'Risque', value: filterRisque, set: setFilterRisque, options: [
                    ['Tous','Tous les risques'],['Faible','Faible'],['Moyen','Moyen'],['Élevé','Élevé'],['Critique','Critique'],
                  ]},
                  { label: 'Retard', value: filterRetard, set: setFilterRetard, options: [
                    ['Tous','Toutes durées'],['1-15','1–15 j'],['16-30','16–30 j'],['31-45','31–45 j'],['gt45','> 45 j'],
                  ]},
                  { label: 'Canal', value: filterCanal, set: setFilterCanal, options: [
                    ['Tous','Tous les canaux'],['tous','Multi-canal (Tous)'],['whatsapp','WhatsApp'],['email','Email'],['sms','SMS'],['tel','Téléphone'],
                  ]},
                ].map(({ label, value, set, options }) => (
                  <div key={label}>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
                    <select
                      value={value}
                      onChange={e => set(e.target.value)}
                      className="input-anim w-full px-3 py-2 text-xs font-semibold text-gray-900"
                    >
                      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Liste des créances animées ── */}
            <motion.div
              className="flex flex-col gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {facturesFiltrees.map((facture) => {
                const joursRetard = getJoursRetard(facture.date_echeance)
                const estPayee = facture.statut === 'payee'

                return (
                  <motion.div
                    key={facture.id}
                    variants={cardVariants}
                    className="card-anim p-5 md:p-6 flex flex-col gap-4"
                  >
                    {/* En-tête de carte */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-gray-900 text-base leading-tight">
                            {facture.clients?.nom || 'Client'}
                          </h3>
                          {facture.clients?.profil && (
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 uppercase tracking-wider">
                              {facture.clients.profil}
                            </span>
                          )}
                          {estPayee && (
                            <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 uppercase tracking-wider flex items-center gap-1">
                              <Check size={11} /> Soldée
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-black text-gray-900 mt-1.5 tabular-nums">
                          {Number(facture.montant_fcfa).toLocaleString('fr-FR')}
                          <span className="text-xs font-bold text-gray-400 ml-1">FCFA</span>
                        </p>
                      </div>

                      {/* Badge risque */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[10px] font-black px-2.5 py-1 uppercase tracking-wider flex items-center gap-1 ${riskStyle(estPayee ? '' : facture.niveau_risque)}`}>
                          {estPayee ? (
                            <>
                              <Check size={11} /> Réglée
                            </>
                          ) : (
                            <>
                              {facture.niveau_risque === 'Critique' && <AlertCircle size={11} />}
                              {facture.niveau_risque === 'Élevé' && <TrendingUp size={11} />}
                              {facture.niveau_risque}
                            </>
                          )}
                        </span>
                        {!estPayee && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                            <TrendingUp size={11} />
                            {facture.score_risque}/100
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Métadonnées */}
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 font-bold uppercase tracking-wide ${
                        facture.canal_contact === 'tous'
                          ? 'bg-[#F3B229]/20 text-[#8A6000] border border-[#F3B229]/40'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {facture.canal_contact === 'tous' && <Globe size={12} className="text-[#8A6000]" />}
                        {facture.canal_contact === 'whatsapp' && <MessageCircle size={12} className="text-[#25D366]" />}
                        {facture.canal_contact === 'email' && <Mail size={12} className="text-[#1E4D2B]" />}
                        {facture.canal_contact === 'sms' && <MessageSquare size={12} className="text-gray-900" />}
                        {facture.canal_contact === 'tel' && <PhoneCall size={12} className="text-[#8A6000]" />}
                        <span>{facture.canal_contact === 'tous' ? 'Tous les canaux' : facture.canal_contact}</span>
                      </span>
                      <span className="bg-gray-100 text-gray-700 px-2.5 py-1 font-semibold">
                        Échéance: {new Date(facture.date_echeance).toLocaleDateString('fr-FR')}
                      </span>
                      <span className={`px-2.5 py-1 font-bold ${
                        estPayee
                          ? 'bg-emerald-50 text-emerald-700'
                          : joursRetard > 0
                            ? 'bg-[#F3B229]/15 text-[#8A6000] border border-[#F3B229]/30'
                            : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {estPayee
                          ? 'Soldée'
                          : joursRetard > 0
                            ? `${joursRetard}j de retard`
                            : 'Dans les délais'}
                      </span>
                    </div>

                    {/* Actions */}
                    {facture.statut === 'en_attente' && (
                      <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <ArrowRight size={11} /> Action rapide
                          </span>
                          <button
                            type="button"
                            onClick={() => handleMarquerPayee(facture)}
                            disabled={payingId === facture.id}
                            className="btn-primary-sweep flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold disabled:opacity-60"
                          >
                            <CheckCircle size={13} className="text-[#F3B229]" />
                            {payingId === facture.id ? 'Validation…' : 'Marquer payé'}
                          </button>
                        </div>
                        <RelanceAction
                          factureId={facture.id}
                          canal={facture.canal_contact}
                          niveauRisque={facture.niveau_risque}
                          client={facture.clients}
                        />
                      </div>
                    )}
                  </motion.div>
                )
              })}

              {facturesFiltrees.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 bg-white border border-dashed border-gray-300 flex flex-col items-center gap-3"
                >
                  <CheckCircle2 size={42} className="text-[#1E4D2B] opacity-40" />
                  <p className="font-black text-gray-700 text-sm uppercase tracking-wide">Aucune créance trouvée</p>
                  <p className="text-xs text-gray-400">Réinitialisez les filtres pour voir vos dossiers.</p>
                </motion.div>
              )}
            </motion.div>
          </motion.section>
        )}

        {/* ══ TAB: HISTORIQUE ══ */}
        {activeTab === 'historique' && (
          <motion.section
            key="historique"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
          >
            {/* Sous-filtres */}
            <div className="flex border border-gray-200 overflow-hidden w-fit">
              {([
                ['tous',      'Tous'],
                ['relances',  `Relances (${initialRelances.length})`],
                ['paiements', `Paiements (${initialPaiements.length + facturesPayees.length})`],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilterTypeHist(key)}
                  className={`px-4 py-2 text-xs font-bold transition-all ${
                    filterTypeHist === key
                      ? 'bg-[#1E4D2B] text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <motion.div
              className="flex flex-col gap-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Relances */}
              {(filterTypeHist === 'tous' || filterTypeHist === 'relances') &&
                initialRelances.map(relance => (
                  <motion.div
                    key={relance.id}
                    variants={cardVariants}
                    className="card-anim p-5 flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span className="flex items-center gap-1.5 font-black text-[#1E4D2B] bg-[#1E4D2B]/8 border border-[#1E4D2B]/20 px-2.5 py-1 uppercase tracking-widest">
                        <MessageSquare size={13} /> Relance · {relance.canal.toUpperCase()}
                      </span>
                      <span className="font-mono text-[10px]">
                        {new Date(relance.created_at).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 italic bg-gray-50 border border-gray-100 p-3 leading-relaxed">
                      &ldquo;{relance.message_genere}&rdquo;
                    </p>
                  </motion.div>
                ))}

              {/* Paiements */}
              {(filterTypeHist === 'tous' || filterTypeHist === 'paiements') &&
                initialPaiements.map(p => (
                  <motion.div
                    key={p.id}
                    variants={cardVariants}
                    className="card-anim p-5 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 bg-emerald-600 flex items-center justify-center text-white">
                        <Check size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 uppercase tracking-wide">
                          Règlement — {p.factures?.clients?.nom || 'Client'}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                          {new Date(p.date_paiement).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <p className="font-black text-emerald-600 text-sm tabular-nums">
                      +{Number(p.montant_paye).toLocaleString('fr-FR')} FCFA
                    </p>
                  </motion.div>
                ))}

              {/* Créances soldées (si pas de paiements) */}
              {(filterTypeHist === 'tous' || filterTypeHist === 'paiements') &&
                initialPaiements.length === 0 &&
                facturesPayees.map(f => (
                  <motion.div
                    key={f.id}
                    variants={cardVariants}
                    className="card-anim p-5 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 bg-[#1E4D2B] flex items-center justify-center text-[#F3B229]">
                        <Check size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 uppercase tracking-wide">
                          Créance soldée — {f.clients?.nom || 'Client'}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                          Éch. {new Date(f.date_echeance).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <p className="font-black text-[#1E4D2B] text-sm tabular-nums">
                      {Number(f.montant_fcfa).toLocaleString('fr-FR')} FCFA
                    </p>
                  </motion.div>
                ))}

              {initialRelances.length === 0 && initialPaiements.length === 0 && facturesPayees.length === 0 && (
                <div className="text-center py-12 bg-white border border-dashed border-gray-300 text-gray-400">
                  <History size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold uppercase tracking-wide">Aucun historique enregistré</p>
                </div>
              )}
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
