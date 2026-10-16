import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getPaymentState: vi.fn(),
  insertPayment: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireUser: mocks.requireUser }))
vi.mock('@/lib/db/paiements', () => ({
  getPaymentState: mocks.getPaymentState,
  insertPayment: mocks.insertPayment,
}))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))

import { enregistrerPaiement } from '@/app/actions/paiements'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.requireUser.mockResolvedValue({ id: 'company-1' })
  mocks.getPaymentState.mockResolvedValue({
    ok: true,
    data: { montantFacture: 10_000, paiements: [2_000], annulee: false },
  })
  mocks.insertPayment.mockResolvedValue({ ok: true, data: null })
})

describe('enregistrerPaiement', () => {
  it('refuse un appel sans utilisateur authentifié', async () => {
    mocks.requireUser.mockRejectedValue(new Error('redirect'))
    await expect(enregistrerPaiement('11111111-1111-4111-8111-111111111111', 1_000, '2026-10-16'))
      .rejects.toThrow('redirect')
    expect(mocks.getPaymentState).not.toHaveBeenCalled()
  })

  it('rejette une entrée invalide avant de lire la facture', async () => {
    const result = await enregistrerPaiement('not-a-uuid', 0, '2026-02-30')
    expect(result).toMatchObject({ ok: false, error: { code: 'VALIDATION' } })
    expect(mocks.getPaymentState).not.toHaveBeenCalled()
  })

  it('refuse un paiement supérieur au solde restant', async () => {
    const result = await enregistrerPaiement('11111111-1111-4111-8111-111111111111', 8_001, '2026-10-16')
    expect(result).toMatchObject({
      ok: false,
      error: { code: 'PAYMENT_EXCEEDS_BALANCE', message: 'Le paiement dépasse le solde restant dû.' },
    })
    expect(mocks.insertPayment).not.toHaveBeenCalled()
  })

  it('refuse un paiement sur une facture annulée', async () => {
    mocks.getPaymentState.mockResolvedValue({
      ok: true,
      data: { montantFacture: 10_000, paiements: [], annulee: true },
    })
    const result = await enregistrerPaiement('11111111-1111-4111-8111-111111111111', 1_000, '2026-10-16')
    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_STATE' } })
    expect(mocks.insertPayment).not.toHaveBeenCalled()
  })

  it('enregistre un paiement partiel sans modifier le statut de facture', async () => {
    const result = await enregistrerPaiement('11111111-1111-4111-8111-111111111111', 3_000, '2026-10-16')
    expect(result).toEqual({ ok: true, data: null })
    expect(mocks.insertPayment).toHaveBeenCalledWith(
      'company-1',
      '11111111-1111-4111-8111-111111111111',
      3_000,
      '2026-10-16',
    )
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/dashboard')
  })
})