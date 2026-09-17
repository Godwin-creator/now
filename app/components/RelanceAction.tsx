'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { genererMessageIA } from '@/app/actions/creances'
import { Bot, Copy, Mail, MessageCircle, CheckCircle2, PhoneCall, AlertCircle, Sparkles } from 'lucide-react'
import { CanalContact } from '@/types'

interface RelanceActionProps {
  factureId: string
  canal: CanalContact
  niveauRisque?: string
}

export default function RelanceAction({ factureId, canal, niveauRisque }: RelanceActionProps) {
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<{ message: string; client: any } | null>(null)
  const [copied, setCopied]     = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await genererMessageIA(factureId)
      if (!res.success) {
        setErrorMsg(res.error || "Erreur lors de la génération.")
      } else if (res.message) {
        setResult({ message: res.message, client: res.client })
      }
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : "Erreur de communication.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Alerte critique */}
      {niveauRisque === 'Critique' && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-800 text-xs font-bold border-l-4 border-rose-500 uppercase tracking-wide">
          <PhoneCall size={14} className="text-rose-600 shrink-0" />
          Appel téléphonique recommandé — Score critique
        </div>
      )}

      {/* Erreur */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 text-xs font-semibold border-l-4 border-rose-400"
          >
            <AlertCircle size={13} className="shrink-0" />
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton génération */}
      {!result ? (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-primary-sweep flex items-center justify-center gap-2 w-full py-3.5 text-white font-black text-xs uppercase tracking-widest disabled:opacity-70 transition-all"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white animate-spin" />
              Génération IA en cours…
            </>
          ) : (
            <>
              <Sparkles size={14} className="text-[#F3B229]" />
              Générer la relance IA
            </>
          )}
        </button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-gray-50 border border-gray-200 flex flex-col gap-3"
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 pt-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Bot size={12} className="text-[#1E4D2B]" /> Message IA généré
              </span>
              <button
                onClick={handleCopy}
                className="btn-sweep flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-xs font-bold text-gray-700"
              >
                {copied ? <CheckCircle2 size={12} className="text-emerald-600" /> : <Copy size={12} />}
                {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>

            <textarea
              className="input-anim w-full h-40 px-4 pb-4 text-xs text-gray-800 bg-transparent leading-relaxed resize-none focus:bg-white"
              defaultValue={result.message}
            />

            {/* Actions d'envoi */}
            <div className="flex flex-wrap gap-0 border-t border-gray-200">
              {canal === 'whatsapp' && (
                <a
                  href={`https://wa.me/${result.client?.whatsapp?.replace(/[^0-9]/g, '') || ''}?text=${encodeURIComponent(result.message)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black uppercase tracking-wider transition-colors"
                >
                  <MessageCircle size={15} /> WhatsApp
                </a>
              )}
              {canal === 'email' && (
                <a
                  href={`mailto:${result.client?.email || ''}?subject=${encodeURIComponent('Relance — Rappel règlement')}&body=${encodeURIComponent(result.message)}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1E4D2B] hover:bg-[#15381f] text-white text-xs font-black uppercase tracking-wider transition-colors"
                >
                  <Mail size={15} className="text-[#F3B229]" /> Email
                </a>
              )}
              {canal === 'tel' && (
                <a
                  href={`tel:${result.client?.whatsapp || result.client?.telephone || ''}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#F3B229] hover:bg-[#d99b1f] text-gray-950 text-xs font-black uppercase tracking-wider transition-colors"
                >
                  <PhoneCall size={15} /> Appeler
                </a>
              )}
              {canal === 'sms' && (
                <a
                  href={`sms:${result.client?.whatsapp || ''}?body=${encodeURIComponent(result.message)}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-gray-800 text-white text-xs font-black uppercase tracking-wider transition-colors"
                >
                  <Mail size={15} /> SMS
                </a>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}