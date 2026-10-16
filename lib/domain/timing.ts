import { addDays, daysBetween, isValidIsoDate } from './dates'
import type { NiveauRisque } from './scoring'
import type { StatutFactureCalcule } from './facture'

const cadence: Record<NiveauRisque, { premierRappel: number; intervalle: number }> = {
  Faible: { premierRappel: 7, intervalle: 7 },
  Moyen: { premierRappel: 1, intervalle: 4 },
  Élevé: { premierRappel: 1, intervalle: 3 },
  Critique: { premierRappel: 1, intervalle: 2 },
}

export interface RecommandationRelanceInput {
  dateEcheance: string
  today: string
  niveau: string
  statut: StatutFactureCalcule
  derniereRelanceEnvoyee?: string | null
}

export interface RecommandationRelance {
  aRelancerAujourdhui: boolean
  prochaineRelanceLe: string | null
  appelRecommande: boolean
}

function isNiveauRisque(value: string): value is NiveauRisque {
  return ['Faible', 'Moyen', 'Élevé', 'Critique'].includes(value)
}

export function recommandationRelance(input: RecommandationRelanceInput): RecommandationRelance {
  const { dateEcheance, today, niveau, statut, derniereRelanceEnvoyee } = input
  if (!isNiveauRisque(niveau)) {
    throw new RangeError('Niveau de risque invalide.')
  }
  if (!isValidIsoDate(today) || !isValidIsoDate(dateEcheance)) {
    throw new RangeError('Date ISO invalide.')
  }
  const joursRetard = daysBetween(dateEcheance, today)
  const appelRecommande = joursRetard > 45 || niveau === 'Critique'
  if (statut === 'payee' || statut === 'annulee') {
    return { aRelancerAujourdhui: false, prochaineRelanceLe: null, appelRecommande }
  }

  const { premierRappel, intervalle } = cadence[niveau]
  const dateInitiale = addDays(dateEcheance, premierRappel)
  if (derniereRelanceEnvoyee && !isValidIsoDate(derniereRelanceEnvoyee)) {
    throw new RangeError('Date de relance invalide.')
  }
  const prochaineApresEnvoi = derniereRelanceEnvoyee
    ? addDays(derniereRelanceEnvoyee, intervalle)
    : dateInitiale
  const prochaineRelanceLe = prochaineApresEnvoi > dateInitiale ? prochaineApresEnvoi : dateInitiale

  return {
    aRelancerAujourdhui: today >= prochaineRelanceLe,
    prochaineRelanceLe,
    appelRecommande,
  }
}