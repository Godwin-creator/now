import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  createCreance: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireUser: mocks.requireUser }))
vi.mock('@/lib/db/creances', () => ({ createCreance: mocks.createCreance }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))

import { creerCreance } from '@/app/actions/creances-create'

function makeFormData(): FormData {
  const form = new FormData()
  form.set('isNewClient', 'false')
  form.set('client_id', '11111111-1111-4111-8111-111111111111')
  form.set('montant_fcfa', '10 000 FCFA')
  form.set('date_service', '2026-10-01')
  form.set('delai_paiement_jours', '30')
  form.set('type_relation', 'regulier')
  form.set('canal_contact', 'whatsapp')
  return form
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.requireUser.mockResolvedValue({ id: 'company-session' })
  mocks.createCreance.mockResolvedValue({ ok: true, data: null })
})

describe('creerCreance', () => {
  it('refuse un appel sans utilisateur authentifié', async () => {
    mocks.requireUser.mockRejectedValue(new Error('redirect'))
    await expect(creerCreance(makeFormData())).rejects.toThrow('redirect')
    expect(mocks.createCreance).not.toHaveBeenCalled()
  })

  it('rejette un montant invalide avant le repository', async () => {
    const form = makeFormData()
    form.set('montant_fcfa', '-5')
    const result = await creerCreance(form)
    expect(result).toMatchObject({ ok: false, error: { code: 'VALIDATION' } })
    expect(mocks.createCreance).not.toHaveBeenCalled()
  })

  it('calcule l’échéance dans le domaine avant le dépôt', async () => {
    const result = await creerCreance(makeFormData())
    expect(result).toEqual({ ok: true, data: null })
    expect(mocks.createCreance).toHaveBeenCalledWith(
      'company-session',
      expect.objectContaining({ serviceDate: '2026-10-01', channel: 'whatsapp' }),
      10_000,
      '2026-10-31',
    )
  })
})