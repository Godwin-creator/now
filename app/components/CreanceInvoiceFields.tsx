'use client'

import { ChevronDown } from 'lucide-react'
import { parseFcfa } from '@/lib/domain'

const inputClass = 'input-anim w-full px-4 py-3 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-now-yellow/20 focus:border-now-yellow'
const selectClass = 'input-anim w-full px-4 py-3 text-sm font-semibold text-gray-900 appearance-none focus:ring-2 focus:ring-now-yellow/20 focus:border-now-yellow'
const labelClass = 'mb-1.5 block text-sm font-bold text-slate-800'

export default function CreanceInvoiceFields({
  amount,
  serviceDate,
  profile,
  onProfileChange,
  onAmountChange,
  onServiceDateChange,
}: {
  amount: string
  serviceDate: string
  profile: 'particulier informel' | 'professionnel' | 'corporate'
  onProfileChange: (value: 'particulier informel' | 'professionnel' | 'corporate') => void
  onAmountChange: (value: string) => void
  onServiceDateChange: (value: string) => void
}) {
  const parsedAmount = parseFcfa(amount) ?? 0
  return (
    <section className="border-t border-gray-100 pt-2">
      <p className="mb-4 text-xs font-bold uppercase tracking-wider text-now-blue-light">Informations de la créance</p>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="invoice-amount" className={labelClass}>Montant (FCFA) *</label>
            {parsedAmount > 0 && <span className="border border-now-blue/20 bg-now-blue/10 px-2 py-0.5 font-mono text-xs font-bold text-now-blue">{parsedAmount.toLocaleString('fr-FR')} FCFA</span>}
          </div>
          <input id="invoice-amount" name="montant_fcfa" type="text" inputMode="numeric" required value={amount} onChange={(event) => onAmountChange(event.target.value)} placeholder="ex: 150000" className={inputClass} />
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-700">Raccourcis :</span>
            {[50_000, 100_000, 250_000, 500_000, 1_000_000].map((value) => <button key={value} type="button" onClick={() => onAmountChange(value.toLocaleString('fr-FR'))} className="min-h-11 min-w-11 border border-gray-200 bg-gray-100 px-2 font-mono text-xs font-bold text-gray-700 hover:bg-now-blue hover:text-white">{value >= 1_000_000 ? `${value / 1_000_000}M` : `${value / 1_000}k`}</button>)}
          </div>
        </div>
        <div><label htmlFor="service-date" className={labelClass}>Date du service rendu *</label><input id="service-date" name="date_service" type="date" required value={serviceDate} onChange={(event) => onServiceDateChange(event.target.value)} className={inputClass} /></div>
        <div><label htmlFor="relation-type" className={labelClass}>Type de relation</label><div className="relative"><select id="relation-type" name="type_relation" defaultValue="regulier" className={selectClass}><option value="regulier">Client régulier</option><option value="nouveau">Nouveau client</option><option value="difficile">Client difficile</option></select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /></div></div>
        <div><label htmlFor="client-profile" className={labelClass}>Profil du client</label><div className="relative"><select id="client-profile" name="profil" value={profile} onChange={(event) => { const value = event.target.value; if (value === 'particulier informel' || value === 'professionnel' || value === 'corporate') onProfileChange(value) }} className={selectClass}><option value="particulier informel">Particulier informel</option><option value="professionnel">Professionnel</option><option value="corporate">Corporate</option></select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /></div></div>
        <div><label htmlFor="contact-channel" className={labelClass}>Canal de relance</label><div className="relative"><select id="contact-channel" name="canal_contact" defaultValue="whatsapp" className={selectClass}><option value="whatsapp">WhatsApp</option><option value="email">E-mail</option><option value="sms">SMS</option><option value="tel">Appel téléphonique</option><option value="tous">Meilleur canal disponible</option></select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /></div></div>
      </div>
      <details className="mt-4 border-t border-slate-200 pt-3"><summary className="flex min-h-11 cursor-pointer items-center justify-between text-sm font-semibold text-now-blue">Délai de paiement<ChevronDown size={17} /></summary><div className="pt-3"><label htmlFor="payment-delay" className="mb-1 block text-sm font-semibold text-slate-800">Délai accordé</label><select id="payment-delay" name="delai_paiement_jours" defaultValue="30" className="min-h-11 w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"><option value="0">0 jour (comptant)</option><option value="15">15 jours</option><option value="30">30 jours (standard)</option><option value="45">45 jours</option><option value="60">60 jours</option></select></div></details>
    </section>
  )
}
