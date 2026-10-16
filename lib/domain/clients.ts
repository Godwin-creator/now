export function normalizeClientName(name: string): string {
  return name
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('fr-FR')
    .replace(/\s+/g, ' ')
}

export function hasDuplicateClientName(name: string, existingNames: readonly string[]): boolean {
  const normalized = normalizeClientName(name)
  return normalized.length > 0 && existingNames.some((existing) => normalizeClientName(existing) === normalized)
}