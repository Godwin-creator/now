'use client'

import { useState } from 'react'
import { genererMessageIA } from '@/app/actions/creances'
import { Bot, Copy, Mail, MessageCircle, CheckCircle2 } from 'lucide-react'

export default function RelanceAction({ factureId, canal }: { factureId: string, canal: string }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{message: string, client: any} | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await genererMessageIA(factureId)
      setResult(res)
    } catch (error) {
      console.error(error)
      alert("Erreur lors de la génération")
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
      {!result ? (
        <button 
          onClick={handleGenerate} 
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-70"
        >
          <Bot size={20} />
          {loading ? 'Génération par IA...' : 'Générer une relance'}
        </button>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-4 animate-in fade-in">
          <textarea 
            className="w-full h-40 p-3 text-sm text-gray-700 bg-white border rounded-lg outline-none resize-none"
            defaultValue={result.message}
            readOnly
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button onClick={handleCopy} className="flex items-center justify-center gap-2 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
              {copied ? <CheckCircle2 size={18} className="text-green-600"/> : <Copy size={18} />}
              {copied ? 'Copié !' : 'Copier'}
            </button>

            {canal === 'whatsapp' && result.client.whatsapp && (
              <a 
                href={`https://wa.me/${result.client.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(result.message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#20bd5a] transition-colors"
              >
                <MessageCircle size={18} /> Envoyer via WA
              </a>
            )}

            {canal === 'email' && result.client.email && (
              <a 
                href={`mailto:${result.client.email}?subject=${encodeURIComponent("Relance de facture")}&body=${encodeURIComponent(result.message)}`}
                className="flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Mail size={18} /> Envoyer l'Email
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}