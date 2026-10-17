import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  requireUser: vi.fn(),
  deleteAuthUser: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@/lib/auth', () => ({ requireUser: mocks.requireUser }))
vi.mock('@/utils/supabase/server', () => ({ createClient: mocks.createClient }))
vi.mock('@/lib/supabase/admin', () => ({ deleteAuthUser: mocks.deleteAuthUser }))

import { deleteAccount } from '@/app/actions/account'

afterEach(() => vi.clearAllMocks())

function makeClient(companyName = 'Atelier Exemple') {
  const signOut = vi.fn().mockResolvedValue({ error: null })
  const maybeSingle = vi.fn().mockResolvedValue({ data: { nom: companyName }, error: null })
  const eq = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ select }))
  mocks.createClient.mockResolvedValue({ from, auth: { signOut } })
  mocks.requireUser.mockResolvedValue({ id: 'user-123', email: 'owner@example.com' })
  return { from, select, eq, maybeSingle, signOut }
}

describe('deleteAccount', () => {
  it('does not delete the account unless the exact company name is confirmed', async () => {
    makeClient()

    const result = await deleteAccount('atelier exemple')

    expect(result).toEqual({
      ok: false,
      error: { code: 'VALIDATION', message: 'Le nom saisi ne correspond pas au nom de votre entreprise.' },
    })
    expect(mocks.deleteAuthUser).not.toHaveBeenCalled()
  })

  it('deletes the authenticated user and clears the local session', async () => {
    const { signOut } = makeClient()
    mocks.deleteAuthUser.mockResolvedValue({ error: null })

    await expect(deleteAccount('Atelier Exemple')).resolves.toEqual({ ok: true, data: null })

    expect(mocks.deleteAuthUser).toHaveBeenCalledWith('user-123')
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' })
  })
})
