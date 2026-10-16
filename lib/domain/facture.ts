export type StatutFactureCalcule = 'en_attente' | 'partielle' | 'payee' | 'annulee'

export function soldeRestant(montant: number, paiements: readonly number[]): number {
  if (!Number.isFinite(montant) || montant < 0 || paiements.some((payment) => !Number.isFinite(payment) || payment < 0)) {
    throw new RangeError('Les montants doivent être positifs ou nuls.')
  }
  return Math.max(0, montant - paiements.reduce((sum, payment) => sum + payment, 0))
}

export function statutFacture(
  montant: number,
  paiements: readonly number[],
  annulee = false,
): StatutFactureCalcule {
  if (annulee) return 'annulee'
  const solde = soldeRestant(montant, paiements)
  if (solde === 0) return 'payee'
  return paiements.some((payment) => payment > 0) ? 'partielle' : 'en_attente'
}