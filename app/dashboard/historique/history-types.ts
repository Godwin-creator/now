export type HistoryStatus = 'Réussi' | 'Générée' | 'Copiée' | 'Envoyée' | 'En attente' | 'Échoué'
export type HistoryAction = 'whatsapp' | 'email' | 'sms' | 'tel' | 'paiement'

export interface HistoryRow {
  id: string
  date: string
  client: string
  action: HistoryAction
  canalLabel: string
  details: string
  status: HistoryStatus
}