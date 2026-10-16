import type { Tables } from './database'

export type ProfilClient = 'particulier informel' | 'professionnel' | 'corporate'
export type TypeRelation = 'regulier' | 'nouveau' | 'difficile'
export type CanalContact = 'whatsapp' | 'email' | 'sms' | 'tel' | 'tous'
export type NiveauRisque = 'Faible' | 'Moyen' | 'Élevé' | 'Critique'
export type StatutFacture = 'en_attente' | 'partielle' | 'payee' | 'annulee'

export type Company = Tables<'companies'>
export type Client = Tables<'clients'>
export type Facture = Tables<'factures'> & {
  clients?: Client | null
  companies?: Company | null
}
export type Relance = Tables<'relances'> & {
  factures?: (Facture & { clients?: Client | null }) | null
}
export type Paiement = Tables<'paiements'> & {
  factures?: (Facture & { clients?: Client | null }) | null
}
