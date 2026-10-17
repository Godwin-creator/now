'use client'

import { useState } from 'react'
import { AlertCircle, Check, Copy, Mail, MessageCircle, MessageSquare, PhoneCall, Send } from 'lucide-react'
import { genererRelance, marquerRelanceCopiee, marquerRelanceEnvoyee } from '@/app/actions/relances'
import type { CanalContact, Client } from '@/types'
import type { TonRelance } from '@/lib/ai/contracts'
import type { GenererRelanceData } from '@/app/actions/relances'

const channels: { id: CanalContact; label: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'email', label: 'E-mail' },
  { id: 'sms', label: 'SMS' },
  { id: 'tel', label: 'Appel' },
  { id: 'tous', label: 'Meilleur canal' },
]
const tones: { id: TonRelance; label: string }[] = [
  { id: 'courtois', label: 'Courtois' },
  { id: 'factuel', label: 'Factuel' },
  { id: 'ferme', label: 'Ferme' },
  { id: 'urgent', label: 'Urgent' },
]

export default function RelanceActionClient({
  factureId,
  canal,
  client,
}: {
  factureId: string
  canal: string
  client?: Partial<Pick<Client, 'nom' | 'whatsapp' | 'telephone' | 'email'>>
}) {
  const initialChannel = channels.find((item) => item.id === canal)?.id ?? 'tous'
  const [selectedChannel, setSelectedChannel] = useState<CanalContact>(initialChannel)
  const [selectedTone, setSelectedTone] = useState<TonRelance>('factuel')
  const [result, setResult] = useState<GenererRelanceData | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [working, setWorking] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      const response = await genererRelance({ factureId, canal: selectedChannel, ton: selectedTone })
      if (!response.ok) {
        setError(response.error.message)
      } else {
        setResult(response.data)
        setMessage(response.data.message)
      }
    } catch {
      setError('La génération est temporairement indisponible. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const copyMessage = async () => {
    if (!result || !message) return
    setWorking(true)
    setError(null)
    try {
      await navigator.clipboard.writeText(message)
      const response = await marquerRelanceCopiee(result.relanceId)
      if (!response.ok) {
        setError(response.error.message)
      } else {
        setNotice('Message copié. Statut enregistré.')
      }
    } catch {
      setError('Le message n’a pas pu être copié ou enregistré.')
    } finally {
      setWorking(false)
    }
  }

  const markSent = async () => {
    if (!result) return
    setWorking(true)
    setError(null)
    try {
      const response = await marquerRelanceEnvoyee(result.relanceId)
      if (!response.ok) {
        setError(response.error.message)
      } else {
        setNotice('Envoi marqué dans l’historique.')
      }
    } catch {
      setError('Le statut d’envoi n’a pas pu être enregistré.')
    } finally {
      setWorking(false)
    }
  }

  const effectiveClient = result?.client ?? client
  const whatsapp = effectiveClient?.whatsapp?.replace(/[^0-9]/g, '') ?? ''
  const telephone = effectiveClient?.telephone?.replace(/[^0-9]/g, '') || whatsapp
  const email = effectiveClient?.email ?? ''
  const encodedMessage = encodeURIComponent(message)

  return (
    <section className="space-y-3" aria-label="Générer une relance">
      {error && <p role="alert" className="flex items-center gap-2 border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={16} />{error}</p>}
      {notice && <p role="status" className="flex items-center gap-2 border-l-4 border-emerald-500 bg-emerald-50 p-3 text-sm text-emerald-800"><Check size={16} />{notice}</p>}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {channels.map((item) => (
          <button key={item.id} type="button" onClick={() => setSelectedChannel(item.id)} aria-pressed={selectedChannel === item.id} className={`min-h-11 border px-3 py-2 text-sm font-semibold ${selectedChannel === item.id ? 'border-now-blue bg-now-blue text-white' : 'border-slate-200 bg-white text-slate-700'}`}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {tones.map((item) => (
          <button key={item.id} type="button" onClick={() => setSelectedTone(item.id)} aria-pressed={selectedTone === item.id} className={`min-h-11 rounded border px-3 py-2 text-sm font-semibold ${selectedTone === item.id ? 'border-now-blue bg-now-blue text-white' : 'border-slate-200 bg-white text-slate-700'}`}>
            {item.label}
          </button>
        ))}
        <button type="button" onClick={generate} disabled={loading} className="ml-auto inline-flex min-h-11 items-center gap-2 rounded bg-now-yellow px-4 py-2 text-sm font-bold text-now-blue disabled:opacity-60">
          <Send size={16} />{loading ? 'Génération…' : result ? 'Régénérer' : 'Générer la relance'}
        </button>
      </div>
      {!whatsapp && !telephone && !email && <div className="border-l-4 border-amber-500 bg-amber-50 p-3 text-sm text-amber-950"><p>Aucune coordonnée n’est renseignée. Ajoutez un numéro ou une adresse e-mail, ou choisissez un autre client.</p><a className="mt-2 inline-flex min-h-11 items-center font-bold underline" href="/dashboard/clients">Voir les clients</a></div>}

      {result && (
        <div className="space-y-3 border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-800">Canal : {result.canalUtilise}</span>
            {result.source === 'template' && <span className="border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-900">Message de secours</span>}
          </div>
          <label htmlFor={`relance-${factureId}`} className="sr-only">Message de relance</label>
          <textarea id={`relance-${factureId}`} value={message} onChange={(event) => setMessage(event.target.value)} rows={7} className="w-full resize-y border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-900" />
          <div className="flex flex-wrap gap-2">
            {whatsapp && <a target="_blank" rel="noreferrer" href={`https://wa.me/${whatsapp}?text=${encodedMessage}`} className="inline-flex min-h-11 items-center gap-2 bg-emerald-700 px-3 py-2 text-sm font-bold text-white"><MessageCircle size={16} />Ouvrir WhatsApp</a>}
            {email && <a href={`mailto:${email}?subject=${encodeURIComponent('Rappel de règlement')}&body=${encodedMessage}`} className="inline-flex min-h-11 items-center gap-2 bg-now-blue px-3 py-2 text-sm font-bold text-white"><Mail size={16} />Ouvrir Mail</a>}
            {telephone && <a href={`sms:${telephone}?body=${encodedMessage}`} className="inline-flex min-h-11 items-center gap-2 bg-slate-800 px-3 py-2 text-sm font-bold text-white"><MessageSquare size={16} />Ouvrir SMS</a>}
            {telephone && <a href={`tel:${telephone}`} className="inline-flex min-h-11 items-center gap-2 bg-amber-400 px-3 py-2 text-sm font-bold text-slate-900"><PhoneCall size={16} />Appeler</a>}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3">
            <button type="button" onClick={copyMessage} disabled={working} className="inline-flex min-h-11 items-center gap-2 border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"><Copy size={16} />Copier</button>
            <button type="button" onClick={markSent} disabled={working} className="min-h-11 bg-now-blue px-4 py-2 text-sm font-bold text-white disabled:opacity-60">J’ai envoyé</button>
          </div>
        </div>
      )}
    </section>
  )
}
