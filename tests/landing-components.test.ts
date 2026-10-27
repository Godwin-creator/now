import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import PhoneMockup from '@/app/components/PhoneMockup'
import LandingIncentive from '@/app/components/LandingIncentive'
import {
  canShowIncentive,
  incentiveTriggerReached,
  INCENTIVE_DELAY_MS,
  INCENTIVE_DISMISS_KEY,
  INCENTIVE_DISMISS_MS,
  INCENTIVE_SESSION_KEY,
  markIncentiveShown,
  persistIncentiveDismissal,
} from '@/lib/demo/landing-incentive'


function memoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => { values.set(key, String(value)) },
  }
}

function unavailableStorage(): Storage {
  return {
    get length(): number { throw new Error('storage unavailable') },
    clear: () => { throw new Error('storage unavailable') },
    getItem: () => { throw new Error('storage unavailable') },
    key: () => { throw new Error('storage unavailable') },
    removeItem: () => { throw new Error('storage unavailable') },
    setItem: () => { throw new Error('storage unavailable') },
  }
}

describe('PhoneMockup', () => {
  it('rend les données de démo dans un aperçu accessible et inerte', () => {
    const html = renderToStaticMarkup(createElement(PhoneMockup))
    expect(html).toContain('role="img"')
    expect(html).toContain('Aperçu de l’écran “À faire aujourd’hui” de NowPay : trois factures à relancer, triées par priorité')
    expect(html).toContain('inert=""')
    expect(html).toContain('aria-hidden="true"')
    expect(html).not.toMatch(/tabindex=/i)
    expect(html).not.toMatch(/<(?:a|button|input|select|textarea)\b/i)
    expect(html).toContain('Atelier Kévin')
    expect(html).toContain('Maison Afi')
    expect(html).toContain('Services Kossi')
    expect(html).toContain('85')
    expect(html).toContain('240')
    expect(html).toContain('460')
    expect(html).toContain('WhatsApp')
    expect(html).toContain('e-mail')
    expect(html).toContain('SMS')
    expect(html).toContain('Faible')
    expect(html).toContain('Moyen')
    expect(html).toContain('Élevé')
  })
})

describe('LandingIncentive', () => {
  it('attend 30 secondes ou le seuil de 60 % de défilement', () => {
    expect(INCENTIVE_DELAY_MS).toBe(30_000)
    expect(incentiveTriggerReached(29_999, 0.59)).toBe(false)
    expect(incentiveTriggerReached(30_000, 0)).toBe(true)
    expect(incentiveTriggerReached(0, 0.6)).toBe(true)
  })

  it('ne s’affiche qu’une fois dans la session', () => {
    const local = memoryStorage()
    const session = memoryStorage()
    expect(canShowIncentive(local, session, 1_000)).toBe(true)
    markIncentiveShown(session)
    expect(session.getItem(INCENTIVE_SESSION_KEY)).toBe('1')
    expect(canShowIncentive(local, session, 1_000)).toBe(false)
  })

  it('mémorise une fermeture pendant sept jours', () => {
    const local = memoryStorage()
    const session = memoryStorage()
    const now = 1_000
    persistIncentiveDismissal(local, now)
    expect(Number(local.getItem(INCENTIVE_DISMISS_KEY))).toBe(now + INCENTIVE_DISMISS_MS)
    expect(canShowIncentive(local, session, now + INCENTIVE_DISMISS_MS - 1)).toBe(false)
    expect(canShowIncentive(local, session, now + INCENTIVE_DISMISS_MS + 1)).toBe(true)
  })

  it('ne rend pas la carte si la session est connectée', () => {
    const html = renderToStaticMarkup(createElement(LandingIncentive, { isAuthenticated: true }))
    expect(html).toBe('')
  })

  it('ne plante pas quand les stockages sont indisponibles', () => {
    const storage = unavailableStorage()
    expect(canShowIncentive(storage, storage, 1_000)).toBe(true)
    expect(() => markIncentiveShown(storage)).not.toThrow()
    expect(() => persistIncentiveDismissal(storage, 1_000)).not.toThrow()
  })
})
