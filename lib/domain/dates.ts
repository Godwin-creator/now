const DAY_MS = 24 * 60 * 60 * 1000

function utcDay(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return null

  const date = new Date(0)
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCFullYear(year, month - 1, day)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return date.getTime()
}

export function isValidIsoDate(value: string): boolean {
  return utcDay(value) !== null
}

export function daysBetween(from: string, to: string): number {
  const fromDay = utcDay(from)
  const toDay = utcDay(to)
  if (fromDay === null || toDay === null) throw new RangeError('Date ISO invalide.')
  return Math.round((toDay - fromDay) / DAY_MS)
}

export function addDays(date: string, days: number): string {
  const day = utcDay(date)
  if (day === null) throw new RangeError('Date ISO invalide.')
  if (!Number.isSafeInteger(days)) throw new RangeError('Le nombre de jours doit être entier.')

  const result = new Date(day + days * DAY_MS)
  if (!Number.isFinite(result.getTime())) throw new RangeError('Date résultante invalide.')
  return result.toISOString().slice(0, 10)
}