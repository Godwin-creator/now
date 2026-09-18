'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { genererMessageIA } from '@/app/actions/creances'
import {
  Bot,
  Copy,
  Mail,
  MessageCircle,
  CheckCircle2,
  PhoneCall,
  AlertCircle,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Send,
  MessageSquare,
  Globe,
  UserCheck,
  UserX,
  HeartHandshake,
  Scale,
  AlertTriangle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { CanalContact, Client } from '@/types'

interface RelanceActionProps {
  factureId: string
  canal: CanalContact
  niveauRisque?: string
  client?: Client
}

const CANAUX_CONFIG = [
  { id: 'tous',     label: 'Multi-canal', icon: Globe,         color: '#FFC000', desc: 'Pack complet 4 formats' },
  { id: 'whatsapp', label: 'WhatsApp',    icon: MessageCircle, color: '#25D366', desc: 'Message direct & structuré' },
  { id: 'email',    label: 'Email',       icon: Mail,          color: '#15274D', desc: 'Objet + corps + formule' },
  { id: 'sms',      label: 'SMS',         icon: MessageSquare, color: '#111827', desc: 'Court ≤ 160 caractères' },
  { id: 'tel',      label: 'Appel (Script)', icon: PhoneCall,  color: '#8A6000', desc: 'Guide conversationnel' },
] as const

const TONS_CONFIG = [
  { id: 'courtois', label: 'Courtois', icon: HeartHandshake },
  { id: 'factuel',  label: 'Factuel',  icon: Scale },
  { id: 'ferme',    label: 'Ferme',    icon: AlertTriangle },
  { id: 'urgent',   label: 'Dernier avis', icon: ShieldAlert },
] as const

export default function RelanceAction({ factureId, canal, niveauRisque, client }: RelanceActionProps) {
  const [selectedCanal, setSelectedCanal] = useState<CanalContact>(canal || 'tous')
  const [selectedTon, setSelectedTon]     = useState<string>('factuel')
  const [showOptions, setShowOptions]     = useState(false)
  const [loading, setLoading]             = useState(false)
  const [result, setResult]               = useState<{
    message: string
    canalUtilise?: string
    client?: any
  } | null>(null)
  const [copied, setCopied]               = useState(false)
  const [errorMsg, setErrorMsg]           = useState<string | null>(null)
  const [editedMessage, setEditedMessage] = useState<string>('')

  const handleGenerate = async (canalToUse?: CanalContact, tonToUse?: string) => {
    const c = canalToUse || selectedCanal
    const t = tonToUse || selectedTon
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await genererMessageIA(factureId, c, t)
      if (!res.success) {
        setErrorMsg(res.error || "Erreur lors de la génération.")
      } else if (res.message) {
        setResult({
          message: res.message,
          canalUtilise: res.canalUtilise || c,
          client: res.client || client,
        })
        setEditedMessage(res.message)
      }
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : "Erreur de communication.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (editedMessage) {
      navigator.clipboard.writeText(editedMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const effectiveClient = result?.client || client
  const rawWa = effectiveClient?.whatsapp?.replace(/[^0-9]/g, '') || ''
  const emailAddr = effectiveClient?.email || ''
  const telNum = effectiveClient?.telephone || effectiveClient?.whatsapp || ''

  const charCount = editedMessage.length
  const smsCount = Math.ceil(charCount / 160) || 1

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Alerte risque critique */}
      {niveauRisque === 'Critique' && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-800 text-xs font-bold border-l-4 border-rose-500 uppercase tracking-wide">
          <PhoneCall size={14} className="text-rose-600 shrink-0" />
          Appel téléphonique ou dernier avis recommandé — Score critique
        </div>
      )}

      {/* Erreur de génération */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 text-xs font-semibold border-l-4 border-rose-400"
          >
            <AlertCircle size={13} className="shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PANNEAU DE CONFIGURATION PRÉ-GÉNÉRATION ── */}
      <div className="bg-gray-50 border border-gray-200">
        {/* En-tête cliquable pour développer/réduire */}
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-100/80 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-black text-gray-800 uppercase tracking-wider">
              <SlidersHorizontal size={13} className="text-[#15274D]" />
              Préciser le canal avant génération IA
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#15274D]/10 text-[#15274D] uppercase">
              {CANAUX_CONFIG.find(c => c.id === selectedCanal)?.label} · {TONS_CONFIG.find(t => t.id === selectedTon)?.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {client?.whatsapp ? (
              <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200">
                <UserCheck size={10} /> WA: {client.whatsapp}
              </span>
            ) : null}
            {client?.email ? (
              <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 border border-blue-200">
                <UserCheck size={10} /> Email
              </span>
            ) : null}
            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">
              <span>{showOptions ? 'Réduire' : 'Développer'}</span>
              {showOptions ? <ChevronUp size={14} className="text-gray-600" /> : <ChevronDown size={14} className="text-gray-600" />}
            </div>
          </div>
        </button>

        {/* Contenu rétractable */}
        <AnimatePresence initial={false}>
          {showOptions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden border-t border-gray-200"
            >
              <div className="p-3.5 space-y-3">
                {/* Sélecteur de canal (Pills dynamiques) */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {CANAUX_CONFIG.map((cfg) => {
                    const Icon = cfg.icon
                    const isSelected = selectedCanal === cfg.id
                    return (
                      <button
                        key={cfg.id}
                        type="button"
                        onClick={() => setSelectedCanal(cfg.id as CanalContact)}
                        className={`flex flex-col items-center justify-center p-2 text-center transition-all ${
                          isSelected
                            ? 'bg-[#15274D] text-white border-2 border-[#FFC000] shadow-sm'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <Icon size={12} style={{ color: isSelected ? '#FFC000' : cfg.color }} />
                          <span className="text-[11px] font-black uppercase tracking-wider">{cfg.label}</span>
                        </div>
                        <span className={`text-[9px] line-clamp-1 ${isSelected ? 'text-gray-200' : 'text-gray-400'}`}>
                          {cfg.desc}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Sélecteur de ton (Amélioration auxiliaire) */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-gray-200">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ton :</span>
                  <div className="flex gap-1 flex-wrap">
                    {TONS_CONFIG.map((t) => {
                      const TonIcon = t.icon
                      const isSelected = selectedTon === t.id
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTon(t.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                            isSelected
                              ? 'bg-gray-900 text-white border border-gray-900'
                              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <TonIcon size={11} className={isSelected ? 'text-[#FFC000]' : 'text-gray-500'} />
                          <span>{t.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Bouton de génération principal */}
                <button
                  onClick={() => handleGenerate()}
                  disabled={loading}
                  className="btn-primary-sweep flex items-center justify-center gap-2 w-full py-3 text-white font-black text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white animate-spin" />
                      Génération IA ({CANAUX_CONFIG.find(c => c.id === selectedCanal)?.label})…
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="text-[#FFC000]" />
                      {result ? 'Régénérer avec ce canal' : `Générer la relance (${CANAUX_CONFIG.find(c => c.id === selectedCanal)?.label})`}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── ZONE DE RÉSULTAT GÉNÉRÉ ── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-white border-2 border-[#15274D] flex flex-col gap-3 relative overflow-hidden"
          >
            {/* Barre d'accentuation haute */}
            <div className="h-1 w-full bg-gradient-to-r from-[#15274D] via-[#FFC000] to-[#15274D]" />

            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 pt-1 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5 bg-gray-100 px-2 py-0.5">
                  <Bot size={12} className="text-[#15274D]" /> Canal : {result.canalUtilise?.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  {charCount} car. {result.canalUtilise === 'sms' ? `(${smsCount} SMS)` : ''}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn-sweep flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-xs font-bold text-gray-700"
                >
                  {copied ? <CheckCircle2 size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>
            </div>

            {/* Zone de texte éditable */}
            <div className="px-4">
              <textarea
                className="input-anim w-full h-44 px-3.5 py-3 text-xs text-gray-800 bg-gray-50 border border-gray-200 leading-relaxed resize-y font-sans focus:bg-white focus:ring-2 focus:ring-now-yellow/20 focus:border-now-yellow"
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                placeholder="Votre message généré apparaîtra ici…"
              />
            </div>

            {/* ── BARRE D'ENVOI DIRECT RAPIDE ── */}
            <div className="border-t border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1.5 items-center">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1">
                <Send size={10} /> Envoi rapide :
              </span>

              {/* Bouton WhatsApp */}
              {(result.canalUtilise === 'whatsapp' || result.canalUtilise === 'tous' || rawWa) && (
                <a
                  href={`https://wa.me/${rawWa}?text=${encodeURIComponent(editedMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] font-black uppercase tracking-wider transition-colors"
                >
                  <MessageCircle size={13} /> WhatsApp
                </a>
              )}

              {/* Bouton Email */}
              {(result.canalUtilise === 'email' || result.canalUtilise === 'tous' || emailAddr) && (
                <a
                  href={`mailto:${emailAddr}?subject=${encodeURIComponent('Rappel règlement de créance')}&body=${encodeURIComponent(editedMessage)}`}
                  className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#15274D] hover:bg-[#0f1f3a] text-white text-[11px] font-black uppercase tracking-wider transition-colors"
                >
                  <Mail size={13} className="text-[#FFC000]" /> Email
                </a>
              )}

              {/* Bouton Appel */}
              {(result.canalUtilise === 'tel' || result.canalUtilise === 'tous' || telNum) && (
                <a
                  href={`tel:${telNum}`}
                  className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#FFC000] hover:bg-[#E6AD00] text-[#15274D] text-[11px] font-black uppercase tracking-wider transition-colors"
                >
                  <PhoneCall size={13} /> Appeler
                </a>
              )}

              {/* Bouton SMS */}
              {(result.canalUtilise === 'sms' || result.canalUtilise === 'tous' || rawWa) && (
                <a
                  href={`sms:${rawWa}?body=${encodeURIComponent(editedMessage)}`}
                  className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gray-900 hover:bg-gray-800 text-white text-[11px] font-black uppercase tracking-wider transition-colors"
                >
                  <MessageSquare size={13} /> SMS
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}