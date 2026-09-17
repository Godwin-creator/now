'use client'

import { useState } from 'react'
import { genererMessageIA } from '@/app/actions/creances'
import { Bot, Copy, Mail, MessageCircle, CheckCircle2, PhoneCall } from 'lucide-react'
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

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await genererMessageIA(factureId)
      setResult(res)
    } catch (error) {
      console.error(error)
      alert("Erreur lors de la génération de la relance.")
    }
    setLoading(false)
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
        <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-800 rounded-lg text-xs font-semibold border border-red-100">
          <PhoneCall size={16} className="text-red-600 shrink-0" />
          <span>Appel téléphonique vivement recommandé (Score &gt; 85)</span>
        </div>
      )}

      {!result ? (
        <button 
          onClick={handleGenerate} 
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.99] transition-all disabled:opacity-70 shadow-sm"
        >
          <Bot size={18} />
          {loading ? 'Génération IA en cours...' : 'Générer la relance sur-mesure'}
        </button>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Message généré</span>
            <button 
              onClick={handleCopy} 
              className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-100 transition-colors shadow-2xs"
            >
              {copied ? <CheckCircle2 size={14} className="text-green-600"/> : <Copy size={14} />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>

          <textarea 
            className="w-full h-44 p-3 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl outline-none resize-none font-sans leading-relaxed focus:ring-1 focus:ring-indigo-500"
            defaultValue={result.message}
          />
          
          <div className="flex flex-wrap gap-2 pt-1">
            {canal === 'whatsapp' && (
              <a 
                href={`https://wa.me/${result.client?.whatsapp?.replace(/[^0-9]/g, '') || ''}?text=${encodeURIComponent(result.message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#25D366] text-white text-sm font-semibold rounded-xl hover:bg-[#20bd5a] transition-colors shadow-xs"
              >
                <MessageCircle size={18} /> WhatsApp
              </a>
            )}

            {canal === 'email' && (
              <a 
                href={`mailto:${result.client?.email || ''}?subject=${encodeURIComponent("Relance — Rappel de règlement")}&body=${encodeURIComponent(result.message)}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-xs"
              >
                <Mail size={18} /> Email
              </a>
            )}

            {canal === 'tel' && (
              <a 
                href={`tel:${result.client?.whatsapp || result.client?.telephone || ''}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 transition-colors shadow-xs"
              >
                <PhoneCall size={18} /> Appeler le client
              </a>
            )}

            {canal === 'sms' && (
              <a 
                href={`sms:${result.client?.whatsapp || result.client?.telephone || ''}?body=${encodeURIComponent(result.message)}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-800 text-white text-sm font-semibold rounded-xl hover:bg-gray-900 transition-colors shadow-xs"
              >
                <Mail size={18} /> SMS
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}