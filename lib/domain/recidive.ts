import { isValidIsoDate } from './dates'

export interface FactureSoldeePourRecidive {
  date_echeance: string
  date_reglement: string
}

export function countRetardsPrecedents(facturesSoldeesDuClient: readonly FactureSoldeePourRecidive[]): number {
  return facturesSoldeesDuClient.filter(
    (facture) =>
      isValidIsoDate(facture.date_echeance) &&
      isValidIsoDate(facture.date_reglement) &&
      facture.date_reglement > facture.date_echeance,
  ).length
}