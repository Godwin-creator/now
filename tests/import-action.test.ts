import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  importCreances: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireUser: mocks.requireUser }))
vi.mock('@/lib/db/import-creances', () => ({ importCreances: mocks.importCreances }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))

import { importerCreances } from '@/app/actions/importCsv'

function formWithCsv(content: string): FormData {
  const form = new FormData()
  form.set('csv', new File([content], 'clients.csv', { type: 'text/csv' }))
  return form
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.requireUser.mockResolvedValue({ id: 'company-1' })
  mocks.importCreances.mockResolvedValue({ ok: true, data: { count: 1 } })
})

describe('importerCreances', () => {
  it('refuse un import sans session', async () => {
    mocks.requireUser.mockRejectedValue(new Error('redirect'))
    await expect(importerCreances(formWithCsv('nom,tel,montant,date\nKofi,,10000,2026-10-01'))).rejects.toThrow('redirect')
    expect(mocks.importCreances).not.toHaveBeenCalled()
  })

  it('applique la limite de 500 lignes côté serveur', async () => {
    const rows = Array.from({ length: 501 }, (_, index) => `Client ${index},,10000,2026-10-01`).join('\n')
    const result = await importerCreances(formWithCsv(`nom,tel,montant,date\n${rows}`))
    expect(result).toMatchObject({ ok: false, error: { code: 'LIMIT' } })
    expect(mocks.importCreances).not.toHaveBeenCalled()
  })

  it('applique la limite réelle de taille à 2 Mo', async () => {
    const form = new FormData()
    form.set('csv', new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'large.csv', { type: 'text/csv' }))
    const result = await importerCreances(form)
    expect(result).toMatchObject({ ok: false, error: { code: 'LIMIT' } })
    expect(mocks.importCreances).not.toHaveBeenCalled()
  })

  it('rapporte les lignes invalides et n’importe aucune ligne partiellement', async () => {
    const csv = [
      'nom,téléphone,montant,date',
      'Kofi Agence,+22890000000,10000,2026-10-01',
      'Client sans montant,,abc,2026-10-01',
      'Client sans date,,5000,demain',
    ].join('\n')
    const result = await importerCreances(formWithCsv(csv))
    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_ROWS' } })
    if (!result.ok) {
      expect(result.error.message).toContain('ligne 3')
      expect(result.error.message).toContain('ligne 4')
    }
    expect(mocks.importCreances).not.toHaveBeenCalled()
  })

  it('calcule les échéances sans fallback vers la date courante', async () => {
    const result = await importerCreances(formWithCsv('nom,téléphone,montant,date\nKofi Agence,+22890000000,10 000 FCFA,2026-10-01'))
    expect(result).toEqual({ ok: true, data: { count: 1 } })
    expect(mocks.importCreances).toHaveBeenCalledWith('company-1', [{
      nom: 'Kofi Agence',
      telephone: '+22890000000',
      montantFcfa: 10_000,
      dateService: '2026-10-01',
      dateEcheance: '2026-10-31',
    }])
  })

  it('ne confond pas un nom de client avec un en-tête CSV', async () => {
    const result = await importerCreances(formWithCsv('Client en retard,,10 000,2026-10-01'))
    expect(result).toMatchObject({ ok: true, data: { count: 1 } })
    expect(mocks.importCreances).toHaveBeenCalledWith('company-1', [expect.objectContaining({ nom: 'Client en retard' })])
  })
})