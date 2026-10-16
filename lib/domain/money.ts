const formatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

export function formatFcfa(amount: number): string {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new RangeError('Le montant doit être un entier positif ou nul.')
  }
  return `${formatter.format(amount)} FCFA`
}

export function parseFcfa(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, '').replace(/fcfa$/i, '')
  if (!/^\d+$/.test(normalized)) return null

  const amount = Number(normalized)
  return Number.isSafeInteger(amount) ? amount : null
}