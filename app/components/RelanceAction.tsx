'use client'

import { useState } from 'react'
import { genererMessageIA } from '@/app/actions/creances'
import { Bot, Copy, Mail, MessageCircle, CheckCircle2, PhoneCall, AlertCircle, Sparkles } from 'lucide-react'
import { CanalContact } from '@/types'

interface RelanceActionProps {
  factureId: string;
  canal: CanalContact;
  niveauRisque?: string;
}

export default function RelanceAction({ factureId, canal, niveauRisque }: RelanceActionProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ message: string; client: any } | null>(null)
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await genererMessageIA(factureId)
      if (!res.success) {
        setErrorMsg(res.error || "Erreur lors de la génération de la relance.")
      } else if (res.message) {
        setResult({ message: res.message, client: res.client })
      }
    } catch (error: unknown) {
      console.error(error)
      const errText = error instanceof Error ? error.message : "Erreur de communication avec le serveur."
      setErrorMsg(errText)
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
      {niveauRisque === 'Critique' && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold border border-rose-200">
          <PhoneCall size={16} className="text-rose-600 shrink-0" />
          <span>Appel téléphonique vivement recommandé (Score &gt; 85)</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200">
          <AlertCircle size={15} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!result ? (
        <button 
          onClick={handleGenerate} 
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full bg-[#1E4D2B] hover:bg-[#15381f] text-white py-3.5 rounded-xl font-semibold active:scale-[0.99] transition-all disabled:opacity-70 shadow-sm text-xs md:text-sm cursor-pointer"
        >
          <Sparkles size={16} className="text-[#F3B229]" />
          {loading ? 'Génération IA en cours...' : 'Générer la relance sur-mesure'}
        </button>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 md:p-5 flex flex-col gap-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Bot size={14} className="text-[#1E4D2B]" /> Message de relance IA
            </span>
            <button 
              onClick={handleCopy} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-100 transition-colors shadow-2xs"
            >
              {copied ? <CheckCircle2 size={14} className="text-emerald-600"/> : <Copy size={14} />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>

          <textarea 
            className="w-full h-44 p-3.5 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl outline-none resize-none font-sans leading-relaxed focus:ring-2 focus:ring-[#1E4D2B] focus:border-transparent"
            defaultValue={result.message}
          />
          
          <div className="flex flex-wrap gap-2 pt-1">
            {canal === 'whatsapp' && (
              <a 
                href={`https://wa.me/${result.client?.whatsapp?.replace(/[^0-9]/g, '') || ''}?text=${encodeURIComponent(result.message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#25D366] text-white text-xs md:text-sm font-semibold rounded-xl hover:bg-[#20bd5a] transition-colors shadow-xs"
              >
                <MessageCircle size={17} /> Envoyer sur WhatsApp
              </a>
            )}

            {canal === 'email' && (
              <a 
                href={`mailto:${result.client?.email || ''}?subject=${encodeURIComponent("Relance — Rappel de règlement")}&body=${encodeURIComponent(result.message)}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1E4D2B] text-white text-xs md:text-sm font-semibold rounded-xl hover:bg-[#15381f] transition-colors shadow-xs"
              >
                <Mail size={17} className="text-[#F3B229]" /> Envoyer par Email
              </a>
            )}

            {canal === 'tel' && (
              <a 
                href={`tel:${result.client?.whatsapp || result.client?.telephone || ''}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#F3B229] text-gray-950 text-xs md:text-sm font-bold rounded-xl hover:bg-[#dfa220] transition-colors shadow-xs"
              >
                <PhoneCall size={17} /> Appeler directement
              </a>
            )}

            {canal === 'sms' && (
              <a 
                href={`sms:${result.client?.whatsapp || result.client?.telephone || ''}?body=${encodeURIComponent(result.message)}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-800 text-white text-xs md:text-sm font-semibold rounded-xl hover:bg-gray-900 transition-colors shadow-xs"
              >
                <Mail size={17} /> Envoyer par SMS
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}