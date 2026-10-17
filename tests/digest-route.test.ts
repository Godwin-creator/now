import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  sendEmail: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }))
vi.mock('@/lib/mail', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/mail')>()
  return { ...actual, sendEmail: mocks.sendEmail }
})

import { GET } from '@/app/api/cron/digest/route'

interface QueryResult<T> { data: T; error: null | { message: string } }

interface Query<T> extends PromiseLike<QueryResult<T>> {
  select: (columns: string) => Query<T>
  eq: (column: string, value: string | boolean) => Query<T>
  order: (column: string, options: { ascending: boolean }) => Query<T>
}

function query<T>(result: () => QueryResult<T>, onFilter?: (column: string, value: string | boolean) => void): Query<T> {
  const builder: Query<T> = {
    select: () => builder,
    eq: (column, value) => { onFilter?.(column, value); return builder },
    order: () => builder,
    then: (onFulfilled, onRejected) => Promise.resolve(result()).then(onFulfilled, onRejected),
  }
  return builder
}

function mockAdmin(companies: readonly object[], invoicesByCompany: Record<string, readonly object[]>) {
  let companyId = ''
  const from = vi.fn((table: 'companies' | 'factures') => {
    if (table === 'companies') return query(() => ({ data: companies, error: null }))
    return query(() => ({ data: invoicesByCompany[companyId] ?? [], error: null }), (column, value) => {
      if (column === 'company_id' && typeof value === 'string') companyId = value
    })
  })
  mocks.createAdminClient.mockReturnValue({ from })
}

const invoice = {
  id: 'invoice-1',
  client_id: 'client-1',
  date_echeance: '2026-10-09',
  montant_fcfa: 100_000,
  statut: 'en_attente',
  canal_contact: 'tous',
  clients: { nom: 'Client Test' },
  paiements: [],
  relances: [],
}

beforeEach(() => {
  vi.stubEnv('CRON_SECRET', 'test-cron-secret')
  vi.stubEnv('SITE_URL', 'https://dev.nowpay.website')
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-17T07:00:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('GET /api/cron/digest', () => {
  it('refuse une requête sans secret avant de créer le client admin', async () => {
    const response = await GET(new Request('https://dev.nowpay.website/api/cron/digest'))
    expect(response.status).toBe(401)
    delete process.env.CRON_SECRET
    const unconfigured = await GET(new Request('https://dev.nowpay.website/api/cron/digest', {
      headers: { authorization: 'Bearer test-cron-secret' },
    }))
    expect(unconfigured.status).toBe(401)
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
  })

  it('ne fait aucun envoi quand aucune créance ne doit être relancée', async () => {
    mockAdmin(
      [{ id: 'company-1', nom: 'Entreprise', email: 'gerant@example.com', seuil_montant_eleve: 200_000 }],
      { 'company-1': [{ ...invoice, date_echeance: '2026-10-17' }] },
    )

    const response = await GET(new Request('https://dev.nowpay.website/api/cron/digest', {
      headers: { authorization: 'Bearer test-cron-secret' },
    }))

    expect(response.status).toBe(200)
    expect(mocks.sendEmail).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({ sent: 0, skipped: 1, failed: 0 })
  })

  it('continue après un échec d’envoi et traite les entreprises suivantes', async () => {
    mockAdmin(
      [
        { id: 'company-1', nom: 'Entreprise 1', email: 'un@example.com', seuil_montant_eleve: 200_000 },
        { id: 'company-2', nom: 'Entreprise 2', email: 'deux@example.com', seuil_montant_eleve: 200_000 },
      ],
      { 'company-1': [invoice], 'company-2': [{ ...invoice, id: 'invoice-2' }] },
    )
    mocks.sendEmail.mockRejectedValueOnce(new Error('Resend indisponible')).mockResolvedValueOnce(undefined)

    const response = await GET(new Request('https://dev.nowpay.website/api/cron/digest', {
      headers: { authorization: 'Bearer test-cron-secret' },
    }))

    expect(mocks.sendEmail).toHaveBeenCalledTimes(2)
    expect(mocks.sendEmail.mock.calls[1]?.[0]).toMatchObject({
      to: 'deux@example.com',
      text: expect.stringContaining('Client Test'),
    })
    await expect(response.json()).resolves.toEqual({ sent: 1, skipped: 0, failed: 1 })
  })
})
