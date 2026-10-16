import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  consumeAiQuota: vi.fn(),
  getRelanceContext: vi.fn(),
  insertRelance: vi.fn(),
  updateRelanceStatus: vi.fn(),
  generateRelance: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireUser: mocks.requireUser }))
vi.mock('@/lib/db/ai-usage', () => ({ consumeAiQuota: mocks.consumeAiQuota }))
vi.mock('@/lib/db/relances', () => ({
  getRelanceContext: mocks.getRelanceContext,
  insertRelance: mocks.insertRelance,
  updateRelanceStatus: mocks.updateRelanceStatus,
}))
vi.mock('@/lib/ai/relance', () => ({ generateRelance: mocks.generateRelance }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))

import { genererRelance, marquerRelanceEnvoyee } from '@/app/actions/relances'

const factureId = '11111111-1111-4111-8111-111111111111'
const relanceId = '22222222-2222-4222-8222-222222222222'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.requireUser.mockResolvedValue({ id: 'company-session' })
  mocks.consumeAiQuota.mockResolvedValue({ ok: true, data: null })
  mocks.getRelanceContext.mockResolvedValue({
    ok: true,
    data: {
      facture: {
        id: factureId,
        client_id: '33333333-3333-4333-8333-333333333333',
        company_id: 'company-session',
        date_echeance: '2026-10-01',
        date_service: '2026-09-01',
        montant_fcfa: 10_000,
        numero: 'FAC-00000001',
        statut: 'en_attente',
        canal_contact: 'whatsapp',
        delai_paiement_jours: 30,
        type_relation: 'regulier',
        created_at: null,
        clients: {
          id: '33333333-3333-4333-8333-333333333333',
          company_id: 'company-session',
          created_at: null,
          nom: 'Kofi Agence',
          profil: 'professionnel',
          secteur: 'Services',
          retards_precedents: 0,
          email: null,
          telephone: null,
          whatsapp: '+22890000000',
        },
        companies: {
          id: 'company-session',
          nom: 'NowPay',
          email: null,
          created_at: null,
          seuil_montant_eleve: 200_000,
          digest_actif: true,
        },
      },
      paiements: [],
      relances: [],
      precedentes: [],
    },
  })
  mocks.generateRelance.mockResolvedValue({
    output: { corps: 'Bonjour Kofi, Nous vous rappelons le solde de 10 000 FCFA chez NowPay.' },
    source: 'template',
    fallbackReason: 'reseau',
  })
  mocks.insertRelance.mockResolvedValue({ ok: true, data: { id: relanceId } })
  mocks.updateRelanceStatus.mockResolvedValue({ ok: true, data: null })
})

describe('actions relance', () => {
  it('refuse une génération sans utilisateur', async () => {
    mocks.requireUser.mockRejectedValue(new Error('redirect'))
    await expect(genererRelance({ factureId })).rejects.toThrow('redirect')
    expect(mocks.consumeAiQuota).not.toHaveBeenCalled()
  })

  it('refuse un quota dépassé avant de charger ou générer', async () => {
    mocks.consumeAiQuota.mockResolvedValue({ ok: false, error: { code: 'quota', message: 'Quota dépassé.' } })
    const result = await genererRelance({ factureId })
    expect(result).toMatchObject({ ok: false, error: { code: 'quota' } })
    expect(mocks.getRelanceContext).not.toHaveBeenCalled()
    expect(mocks.generateRelance).not.toHaveBeenCalled()
  })

  it('enregistre une panne Gemini comme message template', async () => {
    const result = await genererRelance({ factureId })
    expect(result).toMatchObject({ ok: true, data: { relanceId, source: 'template' } })
    expect(mocks.insertRelance).toHaveBeenCalledWith(expect.objectContaining({
      companyId: 'company-session',
      factureId,
      source: 'template',
      canal: 'whatsapp',
    }))
  })

  it('marque une relance envoyée sous l’entreprise de la session', async () => {
    const result = await marquerRelanceEnvoyee(relanceId)
    expect(result).toEqual({ ok: true, data: null })
    expect(mocks.updateRelanceStatus).toHaveBeenCalledWith('company-session', relanceId, 'envoyee')
  })
})