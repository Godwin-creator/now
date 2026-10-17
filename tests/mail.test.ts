import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildDailyDigestEmail, sendEmail } from '@/lib/mail'
import { formatFcfa } from '@/lib/domain'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('e-mail du récapitulatif', () => {
  it('contient uniquement les champs de relance prévus et un lien de désinscription', () => {
    const email = buildDailyDigestEmail([
      { clientName: '<Client>', balance: 45_000, daysLate: 12, riskLevel: 'Élevé' },
    ], 'https://dev.nowpay.website')

    expect(email.subject).toBe('NowPay — récapitulatif quotidien')
    expect(email.text).toContain("Aujourd'hui : 1 relances à faire")
    expect(email.text).toContain(`<Client> — solde ${formatFcfa(45_000)} — 12 jours de retard — niveau Élevé`)
    expect(email.html).toContain('&lt;Client&gt;')
    expect(email.html).toContain('https://dev.nowpay.website/dashboard')
    expect(email.html).toContain('https://dev.nowpay.website/dashboard/parametres#digest-preference')
    expect(email.text).not.toContain('message de relance')
  })

  it('envoie par l’interface Resend avec l’adresse expéditrice configurée', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('RESEND_API_KEY', 'resend-test-key')
    vi.stubEnv('RESEND_FROM_EMAIL', 'NowPay <test@nowpay.website>')

    await sendEmail({ to: 'manager@example.com', subject: 'Test', text: 'Bonjour', html: '<p>Bonjour</p>' })

    expect(fetchMock).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer resend-test-key' }),
    }))
  })
})
