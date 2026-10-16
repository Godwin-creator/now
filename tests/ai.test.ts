import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  generateText: vi.fn(),
  createGoogle: vi.fn(() => vi.fn(() => ({ model: true }))),
  object: vi.fn((options: unknown) => options),
}))

vi.mock('ai', () => ({ generateText: mocks.generateText, Output: { object: mocks.object } }))
vi.mock('@ai-sdk/google', () => ({ createGoogle: mocks.createGoogle }))

import { extractInvoice } from '@/lib/ai/ocr'
import { generateRelance } from '@/lib/ai/relance'

const relanceInput = {
  entreprise: 'NowPay',
  client: 'Kofi Agence',
  montantSolde: 10_000,
  joursRetard: 12,
  ton: 'courtois' as const,
  canal: 'email' as const,
  numeroFacture: 'FAC-00000001',
  dateEcheance: '2026-10-01',
}

beforeEach(() => {
  mocks.generateText.mockReset()
  mocks.createGoogle.mockClear()
  mocks.object.mockClear()
  vi.stubEnv('GEMINI_API_KEY', 'test-key')
  vi.stubEnv('GEMINI_MODEL', 'gemini-test-model')
})

afterEach(() => vi.unstubAllEnvs())

describe('génération IA', () => {
  it('accepte une sortie structurée conforme aux contrôles déterministes', async () => {
    mocks.generateText.mockResolvedValue({
      output: {
        objet: 'Rappel de règlement',
        corps: 'Madame, Monsieur, Nous vous rappelons le solde de 10\u202f000 FCFA dû à NowPay. Merci de nous confirmer votre date de règlement.',
      },
    })
    const result = await generateRelance(relanceInput, 'Moyen')
    expect(result.source).toBe('ia')
    expect(mocks.generateText).toHaveBeenCalledWith(expect.objectContaining({ timeout: 15_000, maxRetries: 0 }))
  })

  it.each([
    { objet: 'Rappel', corps: 'Bonjour, merci pour votre règlement.' },
    { objet: 'Rappel', corps: 'Nous vous rappelons 10\u202f000 FCFA.' },
    { objet: 'Rappel', corps: 'Nous vous rappelons le solde de 10\u202f000 FCFA à NowPay 🙂.' },
  ])('se replie sur un template quand la sortie ne respecte pas le contrat', async (output) => {
    mocks.generateText.mockResolvedValue({ output })
    const result = await generateRelance(relanceInput, 'Moyen')
    expect(result.source).toBe('template')
    expect(result.output.corps).toContain('NowPay')
    expect(result.output.corps).toContain('10\u202f000 FCFA')
  })

  it('se replie sur un template lors d’une panne Gemini', async () => {
    mocks.generateText.mockRejectedValue(new Error('network timeout'))
    const result = await generateRelance({ ...relanceInput, canal: 'sms' }, 'Critique')
    expect(result.source).toBe('template')
    expect(result.fallbackReason).toBe('reseau')
    expect(result.output.corps.length).toBeLessThanOrEqual(320)
  })

  it('se replie sans appeler Gemini si la configuration manque', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')
    const result = await generateRelance(relanceInput, 'Faible')
    expect(result.source).toBe('template')
    expect(mocks.generateText).not.toHaveBeenCalled()
  })

  it('garde le template SMS sous 320 caractères avec les champs au maximum', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')
    const result = await generateRelance({
      ...relanceInput,
      entreprise: 'E'.repeat(120),
      numeroFacture: 'F'.repeat(80),
      ton: 'urgent',
      canal: 'sms',
    }, 'Critique')
    expect(result.source).toBe('template')
    expect(result.output.corps.length).toBeLessThanOrEqual(320)
    expect(result.output.corps).toContain('10\u202f000 FCFA')
    expect(result.output.corps).toContain('E'.repeat(120))
  })
})

describe('extraction OCR', () => {
  it('valide le JSON OCR structuré et transmet le fichier PDF', async () => {
    mocks.generateText.mockResolvedValue({
      output: { nomClient: 'Kofi Agence', montantFcfa: 10_000, dateService: '2026-10-01' },
    })
    const file = new File([new Uint8Array([1, 2, 3])], 'facture.pdf', { type: 'application/pdf' })
    const result = await extractInvoice(file)
    expect(result).toEqual({
      ok: true,
      data: { nomClient: 'Kofi Agence', montantFcfa: 10_000, dateService: '2026-10-01' },
    })
    expect(mocks.generateText).toHaveBeenCalledWith(expect.objectContaining({ timeout: 15_000, maxRetries: 0 }))
  })

  it('refuse une sortie OCR invalide', async () => {
    mocks.generateText.mockResolvedValue({ output: { nomClient: '', montantFcfa: 0, dateService: 'demain' } })
    const result = await extractInvoice(new File(['x'], 'scan.png', { type: 'image/png' }))
    expect(result).toEqual({ ok: false, error: 'invalide' })
  })
})