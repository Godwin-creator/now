'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { creerCreance } from '@/app/actions/creances'
import { scannerFacture } from '@/app/actions/ocr'
import { UserPlus, Users, AlertCircle, CheckCircle2, Zap, ChevronDown, ChevronUp, Camera, ScanLine, Sparkles, X, FileUp } from 'lucide-react'
import { Client } from '@/types'

export default function CreanceForm({ clientsExistants }: { clientsExistants: Client[] }) {
  const [isNewClient, setIsNewClient]   = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isScanning, setIsScanning]     = useState(false)
  const [isScanOpen, setIsScanOpen]     = useState(false)
  const [montantInput, setMontantInput] = useState('')
  const [dateServiceInput, setDateServiceInput] = useState('')
  const [nomClientInput, setNomClientInput] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [scanSuccess, setScanSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const parsedMontant = Number(montantInput.replace(/[^0-9]/g, '')) || 0

  const handleMontantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permet la saisie manuelle directe, libre et fluide
    const val = e.target.value
    // Garde uniquement les chiffres et espaces pour une saisie naturelle
    setMontantInput(val)
  }

  const setPresetMontant = (amount: number) => {
    setMontantInput(amount.toLocaleString('fr-FR'))
  }

  // ── OCR Scan Handler ──
  const handleScanFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    setErrorMessage(null)
    setScanSuccess(null)

    try {
      const formData = new FormData()
      formData.append('facture', file)
      const result = await scannerFacture(formData)

      if (result.success && result.data) {
        // Auto-remplir les champs
        if (result.data.nomClient) {
          setNomClientInput(result.data.nomClient)
          // Basculer automatiquement sur "nouveau client" si un nom est détecté
          setIsNewClient(true)
        }
        if (result.data.montantFcfa > 0) {
          setMontantInput(result.data.montantFcfa.toLocaleString('fr-FR'))
        }
        if (result.data.dateService) {
          setDateServiceInput(result.data.dateService)
        }

        const filled: string[] = []
        if (result.data.nomClient) filled.push('Nom')
        if (result.data.montantFcfa > 0) filled.push('Montant')
        if (result.data.dateService) filled.push('Date')
        setScanSuccess(`Extraction réussie : ${filled.join(', ')} détecté${filled.length > 1 ? 's' : ''}`)
        setTimeout(() => setScanSuccess(null), 5000)
      } else {
        setErrorMessage(result.error || "Impossible d'analyser la facture.")
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Erreur lors du scan.")
    } finally {
      setIsScanning(false)
      // Reset les file inputs pour permettre de re-scanner le même fichier
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (cameraInputRef.current) cameraInputRef.current.value = ''
    }
  }

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
        setErrorMessage(typeof res.error === 'string' ? res.error : "Une erreur est survenue.")
      } else {
        setSuccessMessage("Créance enregistrée avec succès !")
        formElement.reset()
        setMontantInput('')
        setDateServiceInput('')
        setNomClientInput('')
        setIsNewClient(false)
        setTimeout(() => setSuccessMessage(null), 4000)
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Erreur de communication.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = "input-anim w-full px-4 py-3 text-sm font-medium text-gray-900"
  const selectClass = "input-anim w-full px-4 py-3 text-sm font-semibold text-gray-900 appearance-none"
  const labelClass = "block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5"

  return (
    <div className="bg-white border border-gray-200 w-full relative overflow-hidden">
      {/* Accent top bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#1E4D2B] via-[#F3B229] to-[#1E4D2B]" />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-base font-black text-gray-900 uppercase tracking-wide">Nouvelle Créance</h2>
          <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest mt-0.5">Saisie manuelle · V1</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#F3B229] font-black uppercase tracking-widest border border-[#F3B229]/40 bg-[#F3B229]/8 px-2.5 py-1">
          <Zap size={11} className="animate-pulse" /> IA Prête
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">

        {/* ── Section Scanner Facture (OCR) Rétractable ── */}
        <div className="border border-gray-200 bg-gray-50/50">
          {/* Input caché pour importer un fichier (image ou PDF) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            className="hidden"
            onChange={handleScanFile}
            disabled={isScanning}
          />
          {/* Input caché pour activer la caméra (mobile) */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleScanFile}
            disabled={isScanning}
          />

          {/* Bouton pour Développer / Réduire la section scan */}
          <button
            type="button"
            onClick={() => setIsScanOpen(!isScanOpen)}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-100/80 transition-colors select-none cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Camera size={15} className="text-[#1E4D2B]" />
              <span className="text-[11px] font-black text-gray-800 uppercase tracking-wider">
                Scanner une facture (IA)
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#F3B229]/20 text-[#8A6000] border border-[#F3B229]/40 uppercase tracking-widest hidden sm:inline-block">
                Caméra / PDF
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <span>{isScanOpen || isScanning ? 'Réduire' : 'Développer'}</span>
              {isScanOpen || isScanning ? (
                <ChevronUp size={14} className="text-gray-600" />
              ) : (
                <ChevronDown size={14} className="text-gray-600" />
              )}
            </div>
          </button>

          {/* Contenu rétractable */}
          <AnimatePresence initial={false}>
            {(isScanOpen || isScanning) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden border-t border-gray-200"
              >
                <div className="p-3.5 space-y-3">
                  {/* État de scanning actif */}
                  {isScanning && (
                    <div className="relative overflow-hidden border-2 border-[#F3B229] bg-[#F3B229]/5 py-4 px-6 flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest text-[#F3B229]">
                      <motion.div
                        initial={{ top: 0 }}
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#F3B229] to-transparent z-10"
                      />
                      <ScanLine size={18} className="animate-pulse" />
                      <span>Analyse IA en cours…</span>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-[#F3B229]/30 border-t-[#F3B229]"
                      />
                    </div>
                  )}

                  {/* Deux boutons côte à côte */}
                  {!isScanning && (
                    <div className="grid grid-cols-2 gap-2">
                      {/* Bouton Caméra */}
                      <motion.button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.97 }}
                        className="relative overflow-hidden border-2 border-dashed border-[#1E4D2B]/30 bg-white text-[#1E4D2B] hover:border-[#1E4D2B] hover:bg-[#1E4D2B]/10 transition-all flex flex-col items-center justify-center gap-2 py-4 px-3"
                      >
                        <Camera size={22} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Caméra</span>
                        <span className="text-[8px] font-medium text-gray-400 tracking-wide">Prendre une photo</span>
                      </motion.button>

                      {/* Bouton Importer */}
                      <motion.button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.97 }}
                        className="relative overflow-hidden border-2 border-dashed border-[#F3B229]/40 bg-white text-[#1E4D2B] hover:border-[#F3B229] hover:bg-[#F3B229]/10 transition-all flex flex-col items-center justify-center gap-2 py-4 px-3"
                      >
                        <FileUp size={22} className="text-[#8A6000]" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Importer</span>
                        <span className="text-[8px] font-medium text-gray-400 tracking-wide">Image ou PDF</span>
                      </motion.button>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <Sparkles size={10} className="text-[#F3B229]" />
                    <p className="text-[9px] text-gray-400 text-center font-medium tracking-wide">
                      Extraction automatique par IA (nom, montant, date)
                    </p>
                    <Sparkles size={10} className="text-[#F3B229]" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Alertes */}
        <AnimatePresence>
          {scanSuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between p-4 bg-[#1E4D2B]/5 border-l-4 border-[#1E4D2B] text-[#1E4D2B] text-xs font-bold"
            >
              <div className="flex items-center gap-3">
                <Sparkles size={15} className="shrink-0 text-[#F3B229]" />
                {scanSuccess}
              </div>
              <button type="button" onClick={() => setScanSuccess(null)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </motion.div>
          )}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-3 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 text-xs font-semibold"
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              {errorMessage}
            </motion.div>
          )}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs font-bold"
            >
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle client existant / nouveau */}
        <div className="flex border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => { setIsNewClient(false); setErrorMessage(null) }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-wider transition-all ${
              !isNewClient ? 'bg-[#1E4D2B] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Users size={13} /> Client existant
          </button>
          <button
            type="button"
            onClick={() => { setIsNewClient(true); setErrorMessage(null) }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-wider transition-all ${
              isNewClient ? 'bg-[#1E4D2B] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            <UserPlus size={13} /> Nouveau client
          </button>
        </div>

        {/* Champ input caché pour isNewClient */}
        <input type="hidden" name="isNewClient" value={String(isNewClient)} />

        {/* Client existant — sélection */}
        <AnimatePresence mode="wait">
          {!isNewClient ? (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <label className={labelClass}>Client</label>
              <div className="relative">
                <select name="client_id" required className={selectClass}>
                  <option value="">— Sélectionner un client —</option>
                  {clientsExistants.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="newclient"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nom du client *</label>
                  <input
                    name="nom_client"
                    type="text"
                    required
                    placeholder="ex: Kofi Mensah"
                    value={nomClientInput}
                    onChange={(e) => setNomClientInput(e.target.value)}
                    className={`${inputClass} ${nomClientInput ? 'ring-2 ring-[#1E4D2B]/20 border-[#1E4D2B]/40' : ''}`}
                  />
                </div>
                <div>
                  <label className={labelClass}>WhatsApp / Téléphone</label>
                  <input name="whatsapp" type="tel" placeholder="+228 9X XX XX XX" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input name="email" type="email" placeholder="client@exemple.com" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Profil client</label>
                  <div className="relative">
                    <select name="profil" defaultValue="professionnel" className={selectClass}>
                      <option value="particulier informel">Particulier informel</option>
                      <option value="professionnel">Professionnel</option>
                      <option value="corporate">Corporate</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Secteur d'activité</label>
                  <div className="relative">
                    <select name="secteur" defaultValue="Services" className={selectClass}>
                      {['Services','Commerce','BTP','Agriculture','Santé','Éducation','Transport','Autre'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Retards précédents</label>
                  <input name="retards_precedents" type="number" min="0" defaultValue="0" className={inputClass} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Informations créance */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Informations de la créance</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Montant (FCFA) *
                </label>
                {parsedMontant > 0 && (
                  <span className="text-[10px] font-black text-[#1E4D2B] bg-[#1E4D2B]/10 px-2 py-0.5 border border-[#1E4D2B]/20 font-mono">
                    {parsedMontant.toLocaleString('fr-FR')} FCFA
                  </span>
                )}
              </div>
              <input
                name="montant_fcfa"
                type="text"
                inputMode="numeric"
                required
                value={montantInput}
                onChange={handleMontantChange}
                placeholder="ex: 150000"
                className={`${inputClass} ${montantInput ? 'ring-2 ring-[#1E4D2B]/20 border-[#1E4D2B]/40' : ''}`}
              />
              {/* Raccourcis montants fréquents */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Raccourcis:</span>
                {[50000, 100000, 250000, 500000, 1000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setPresetMontant(amt)}
                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-gray-100 hover:bg-[#1E4D2B] hover:text-white text-gray-700 transition-colors border border-gray-200"
                  >
                    {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}k`}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Date du service rendu *</label>
              <input
                name="date_service"
                type="date"
                required
                value={dateServiceInput}
                onChange={(e) => setDateServiceInput(e.target.value)}
                className={`${inputClass} ${dateServiceInput ? 'ring-2 ring-[#1E4D2B]/20 border-[#1E4D2B]/40' : ''}`}
              />
            </div>
            <div>
              <label className={labelClass}>Délai de paiement accordé</label>
              <div className="relative">
                <select name="delai_paiement_jours" defaultValue="30" className={selectClass}>
                  <option value="0">0 jour (Comptant)</option>
                  <option value="15">15 jours</option>
                  <option value="30">30 jours (Standard)</option>
                  <option value="45">45 jours</option>
                  <option value="60">60 jours</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Type de relation</label>
              <div className="relative">
                <select name="type_relation" defaultValue="regulier" className={selectClass}>
                  <option value="regulier">Client régulier</option>
                  <option value="nouveau">Nouveau client</option>
                  <option value="difficile">Client difficile</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Canal de relance</label>
              <div className="relative">
                <select name="canal_contact" defaultValue="whatsapp" className={selectClass}>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="tel">Appel téléphonique</option>
                  <option value="tous">Tous les canaux (Multi-canal)</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Bouton submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary-sweep w-full py-4 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin" />
              Enregistrement…
            </>
          ) : (
            <>
              <Zap size={15} className="text-[#F3B229]" />
              Enregistrer la créance
            </>
          )}
        </button>
      </form>
    </div>
  )
}