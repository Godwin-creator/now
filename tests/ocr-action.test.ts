import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  consumeAiQuota: vi.fn(),
  extractInvoice: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireUser: mocks.requireUser }))
vi.mock('@/lib/db/ai-usage', () => ({ consumeAiQuota: mocks.consumeAiQuota }))
vi.mock('@/lib/ai/ocr', () => ({ extractInvoice: mocks.extractInvoice }))

import { scannerFacture } from '@/app/actions/ocr'

function formWithFile(file: File): FormData {
  const formData = new FormData()
  formData.set('facture', file)
  return formData
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.requireUser.mockResolvedValue({ id: 'user-1' })
  mocks.consumeAiQuota.mockResolvedValue({ ok: true, data: null })
  mocks.extractInvoice.mockResolvedValue({
    ok: true,
    data: { nomClient: 'Kofi Agence', montantFcfa: 10_000, dateService: '2026-10-01' },
  })
})

describe('scannerFacture', () => {
  it('refuse un utilisateur non authentifié avant le traitement du fichier', async () => {
    mocks.requireUser.mockRejectedValue(new Error('redirect'))
    await expect(scannerFacture(formWithFile(new File(['x'], 'scan.png', { type: 'image/png' }))))
      .rejects.toThrow('redirect')
    expect(mocks.consumeAiQuota).not.toHaveBeenCalled()
  })

  it('refuse les types MIME non autorisés avant consommation du quota', async () => {
    const result = await scannerFacture(formWithFile(new File(['x'], 'scan.txt', { type: 'text/plain' })))
    expect(result).toMatchObject({ ok: false, error: { code: 'VALIDATION' } })
    expect(mocks.consumeAiQuota).not.toHaveBeenCalled()
  })

  it('refuse un fichier vide avant consommation du quota', async () => {
    const result = await scannerFacture(formWithFile(new File([], 'empty.png', { type: 'image/png' })))
    expect(result).toMatchObject({ ok: false, error: { code: 'VALIDATION' } })
    expect(mocks.consumeAiQuota).not.toHaveBeenCalled()
  })

  it('refuse un fichier supérieur à 10 Mo avant consommation du quota', async () => {
    const tooLarge = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.pdf', { type: 'application/pdf' })
    const result = await scannerFacture(formWithFile(tooLarge))
    expect(result).toMatchObject({ ok: false, error: { code: 'VALIDATION' } })
    expect(mocks.consumeAiQuota).not.toHaveBeenCalled()
  })

  it('refuse un quota dépassé sans appeler Gemini', async () => {
    mocks.consumeAiQuota.mockResolvedValue({
      ok: false,
      error: { code: 'quota', message: 'Quota dépassé.' },
    })
    const result = await scannerFacture(formWithFile(new File(['x'], 'scan.pdf', { type: 'application/pdf' })))
    expect(result).toMatchObject({ ok: false, error: { code: 'quota' } })
    expect(mocks.extractInvoice).not.toHaveBeenCalled()
  })

  it('retourne les données extraites validées après quota autorisé', async () => {
    const file = new File(['x'], 'scan.pdf', { type: 'application/pdf' })
    const result = await scannerFacture(formWithFile(file))
    expect(result).toEqual({
      ok: true,
      data: { nomClient: 'Kofi Agence', montantFcfa: 10_000, dateService: '2026-10-01' },
    })
    expect(mocks.consumeAiQuota).toHaveBeenCalledWith('ocr', 5, 15)
    expect(mocks.extractInvoice).toHaveBeenCalledWith(file)
  })
})