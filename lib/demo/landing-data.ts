import { enrichirCreances, type LigneCreance } from '@/lib/domain'

const today = '2026-10-27'

const invoices: LigneCreance[] = [
  { id: 'demo-1', client_id: 'demo-client-1', date_echeance: '2026-10-24', montant_fcfa: 85000, statut: 'en_attente', canal_contact: 'whatsapp', clients: { nom: 'Atelier Kévin', whatsapp: '+22890000001' } },
  { id: 'demo-2', client_id: 'demo-client-2', date_echeance: '2026-10-16', montant_fcfa: 240000, statut: 'en_attente', canal_contact: 'email', clients: { nom: 'Maison Afi', email: 'afi@example.invalid' } },
  { id: 'demo-3', client_id: 'demo-client-3', date_echeance: '2026-06-27', montant_fcfa: 460000, statut: 'en_attente', canal_contact: 'sms', clients: { nom: 'Services Kossi', telephone: '+22890000003' } },
]

export const landingInvoices = enrichirCreances(invoices, today).sort((left, right) => right.score - left.score)

export const landingReminderMessage =
  'Nous vous contactons au sujet de votre facture de 85 000 FCFA arrivée à échéance le 24 octobre. Nous vous remercions de bien vouloir nous indiquer la date prévue de règlement. Nous restons disponibles pour toute précision. — Atelier Kévin'
