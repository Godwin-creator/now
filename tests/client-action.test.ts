import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  updateClient: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ requireUser: mocks.requireUser }))
vi.mock('@/lib/db/clients', () => ({ updateClient: mocks.updateClient }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))

import { updateClient } from '@/app/actions/clients'

const clientId = '11111111-1111-4111-8111-111111111111'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.requireUser.mockResolvedValue({ id: 'company-session' })
  mocks.updateClient.mockResolvedValue({ ok: true, data: { id: clientId, nom: 'Kofi' } })
})

describe('updateClient', () => {
  it('refuse un appel non authentifié', async () => {
    mocks.requireUser.mockRejectedValue(new Error('redirect'))
    await expect(updateClient({ id: clientId, nom: 'Kofi' })).rejects.toThrow('redirect')
    expect(mocks.updateClient).not.toHaveBeenCalled()
  })

  it('valide les entrées avant l’accès au repository', async () => {
    const result = await updateClient({ id: clientId, nom: '', email: 'invalid' })
    expect(result).toMatchObject({ ok: false, error: { code: 'VALIDATION' } })
    expect(mocks.updateClient).not.toHaveBeenCalled()
  })

  it('dérive l’entreprise de la session, jamais de la charge utile', async () => {
    const result = await updateClient({
      id: clientId,
      company_id: 'attacker-company',
      nom: 'Kofi Mensah',
      email: '',
      telephone: null,
      whatsapp: null,
      profil: 'professionnel',
      secteur: 'Services',
    })
    expect(result).toMatchObject({ ok: true })
    expect(mocks.updateClient).toHaveBeenCalledWith('company-session', clientId, expect.objectContaining({ nom: 'Kofi Mensah', email: null }))
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/dashboard/clients')
  })
})