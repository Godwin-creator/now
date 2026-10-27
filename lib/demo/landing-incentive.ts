export const INCENTIVE_DELAY_MS = 30_000
export const INCENTIVE_SESSION_KEY = 'nowpay-landing-incentive-shown'
export const INCENTIVE_DISMISS_KEY = 'nowpay-landing-incentive-dismissed-until'
export const INCENTIVE_DISMISS_MS = 7 * 24 * 60 * 60 * 1000

export function incentiveTriggerReached(elapsedMs: number, scrollRatio: number): boolean {
  return elapsedMs >= INCENTIVE_DELAY_MS || scrollRatio >= 0.6
}

export function canShowIncentive(local: Storage, session: Storage, now: number): boolean {
  try {
    if (Number(local.getItem(INCENTIVE_DISMISS_KEY) ?? 0) > now) return false
    return session.getItem(INCENTIVE_SESSION_KEY) === null
  } catch {
    return true
  }
}

export function markIncentiveShown(session: Storage): void {
  try {
    session.setItem(INCENTIVE_SESSION_KEY, '1')
  } catch {
    // Une session sans stockage reste éligible à l’affichage.
  }
}

export function persistIncentiveDismissal(local: Storage, now: number): void {
  try {
    local.setItem(INCENTIVE_DISMISS_KEY, String(now + INCENTIVE_DISMISS_MS))
  } catch {
    // La fermeture courante reste effective si le stockage est bloqué.
  }
}
