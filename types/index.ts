export type ProfilClient = 'particulier informel' | 'professionnel' | 'corporate';
export type TypeRelation = 'regulier' | 'nouveau' | 'difficile';
export type CanalContact = 'whatsapp' | 'email' | 'sms' | 'tel';
export type NiveauRisque = 'Faible' | 'Moyen' | 'Élevé' | 'Critique';
export type StatutFacture = 'en_attente' | 'payee' | 'annulee';

export interface Company {
  id: string;
  nom: string;
  email?: string;
  created_at?: string;
}

export interface Client {
  id: string;
  company_id: string;
  nom: string;
  email?: string;
  telephone?: string;
  whatsapp?: string;
  profil: ProfilClient;
  secteur?: string;
  retards_precedents: number;
  created_at?: string;
}

export interface Facture {
  id: string;
  company_id: string;
  client_id: string;
  montant_fcfa: number;
  date_service: string;
  date_echeance: string;
  statut: StatutFacture;
  type_relation: TypeRelation;
  canal_contact: CanalContact;
  score_risque: number;
  niveau_risque: NiveauRisque;
  created_at?: string;
  clients?: Client;
  companies?: Company;
}

export interface Relance {
  id: string;
  facture_id: string;
  canal: CanalContact;
  message_genere: string;
  statut_envoi?: string;
  created_at: string;
  factures?: Facture;
}

export interface Paiement {
  id: string;
  facture_id: string;
  montant_paye: number;
  date_paiement: string;
  created_at?: string;
}
