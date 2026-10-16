import { canalEffectif, type CanalEffectif } from './canal'
import { daysBetween, isValidIsoDate } from './dates'
import { soldeRestant, statutFacture, type StatutFactureCalcule } from './facture'
import { computeScore, type NiveauRisque } from './scoring'
import { recommandationRelance, type RecommandationRelance } from './timing'

export interface LigneCreance {
  id: string
  client_id: string
  date_echeance: string
  montant_fcfa: number
  statut: string
  canal_contact: string
  clients?: {
    nom?: string
    profil?: string | null
    email?: string | null
    telephone?: string | null
    whatsapp?: string | null
  } | null
  paiements?: readonly { montant_paye: number; date_paiement: string | null }[] | null
  relances?: readonly {
    statut_envoi: string
    envoyee_at: string | null
    created_at: string | null
  }[] | null
}

export interface CreanceEnrichie extends LigneCreance {
  score: number
  niveau: NiveauRisque
  jours_retard: number
  solde_restant: number
  statut_calcule: StatutFactureCalcule
  recommandation: RecommandationRelance
  canal_effectif: CanalEffectif
  raison_canal: 'choisi' | 'canal de repli' | 'coordonnée manquante'
}

function dateReglementComplet(creance: LigneCreance): string | null {
  let paye = 0
  const paiements = [...(creance.paiements ?? [])]
    .filter((payment) => payment.date_paiement && isValidIsoDate(payment.date_paiement))
    .sort((left, right) => (left.date_paiement ?? '').localeCompare(right.date_paiement ?? ''))

  for (const paiement of paiements) {
    paye += paiement.montant_paye
    if (paye >= creance.montant_fcfa) return paiement.date_paiement
  }
  return null
}

function dernierEnvoiConfirme(creance: LigneCreance): string | null {
  return (creance.relances ?? [])
    .filter((relance) => relance.statut_envoi === 'envoyee')
    .map((relance) => relance.envoyee_at?.slice(0, 10) ?? relance.created_at?.slice(0, 10) ?? null)
    .filter((date): date is string => date !== null && isValidIsoDate(date))
    .sort()
    .at(-1) ?? null
}

function canalChoisiValide(value: string): string {
  return ['whatsapp', 'email', 'sms', 'tel', 'tous'].includes(value) ? value : 'tous'
}

export function enrichirCreances<T extends LigneCreance>(
  rows: readonly T[],
  today: string,
  seuilMontantEleve = 200_000,
): (T & CreanceEnrichie)[] {
  if (!isValidIsoDate(today)) throw new RangeError('Date du jour invalide.')
  const datesReglement = new Map(rows.map((row) => [row.id, dateReglementComplet(row)]))

  return rows.map((row) => {
    const payments = (row.paiements ?? []).map((payment) => payment.montant_paye)
    const solde = soldeRestant(row.montant_fcfa, payments)
    const statut = statutFacture(row.montant_fcfa, payments, row.statut === 'annulee')
    const joursRetard = Math.max(0, daysBetween(row.date_echeance, today))
    const retardsPrecedents = rows.filter((previous) =>
      previous.id !== row.id &&
      previous.client_id === row.client_id &&
      previous.date_echeance < row.date_echeance &&
      previous.statut !== 'annulee' &&
      (datesReglement.get(previous.id) ?? '') > previous.date_echeance,
    ).length
    const scoreResult = computeScore({
      joursRetard,
      soldeRestant: solde,
      retardsPrecedents,
      seuilMontantEleve,
    })
    const niveau = scoreResult.niveau
    const recommandation = recommandationRelance({
      dateEcheance: row.date_echeance,
      today,
      niveau,
      statut,
      derniereRelanceEnvoyee: dernierEnvoiConfirme(row),
    })
    const canal = canalEffectif(canalChoisiValide(row.canal_contact), row.clients ?? {})

    return {
      ...row,
      score: scoreResult.score,
      niveau,
      jours_retard: joursRetard,
      solde_restant: solde,
      statut_calcule: statut,
      recommandation,
      canal_effectif: canal.canal,
      raison_canal: canal.raison,
    }
  })
}