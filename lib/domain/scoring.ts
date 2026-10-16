export type NiveauRisque = 'Faible' | 'Moyen' | 'Élevé' | 'Critique'

export interface ScoreInput {
  joursRetard: number
  soldeRestant: number
  retardsPrecedents: number
  seuilMontantEleve?: number
}

export interface ScoreResult {
  score: number
  niveau: NiveauRisque
}

const DEFAULT_SEUIL_MONTANT_ELEVE = 200_000

export function computeScore(input: ScoreInput): ScoreResult {
  const { joursRetard, soldeRestant, retardsPrecedents } = input
  const seuil = input.seuilMontantEleve ?? DEFAULT_SEUIL_MONTANT_ELEVE
  if (![joursRetard, soldeRestant, retardsPrecedents, seuil].every(Number.isFinite) || seuil <= 0) {
    throw new RangeError('Les valeurs du score doivent être finies et le seuil positif.')
  }

  const retard = Math.min(Math.max(joursRetard, 0) / 90, 1) * 40
  const montant = Math.min(Math.max(soldeRestant, 0) / seuil, 1) * 30
  const recidive = Math.min(Math.max(retardsPrecedents, 0) * 10, 30)
  const score = Math.round(retard + montant + recidive)

  return {
    score,
    niveau: score <= 33 ? 'Faible' : score <= 66 ? 'Moyen' : score <= 85 ? 'Élevé' : 'Critique',
  }
}