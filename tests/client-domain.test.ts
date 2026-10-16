import { describe, expect, it } from 'vitest'
import { hasDuplicateClientName, normalizeClientName } from '@/lib/domain'

describe('normalisation du nom client', () => {
  it.each([
    ['  Société   Étoile  ', 'société étoile'],
    ['MARCHÉ   CENTRAL', 'marché central'],
    ['Kofi', 'kofi'],
  ])('normalise %s', (input, expected) => {
    expect(normalizeClientName(input)).toBe(expected)
  })
})

describe('détection de doublon client', () => {
  it.each([
    [' Société Étoile ', ['société   étoile'], true],
    ['Kofi Mensah', ['Kofi Agence'], false],
    ['', ['Client'], false],
  ])('compare %s avec les fiches existantes', (name, existingNames, expected) => {
    expect(hasDuplicateClientName(name, existingNames)).toBe(expected)
  })
})