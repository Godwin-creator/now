'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { canShowIncentive, incentiveTriggerReached, INCENTIVE_DELAY_MS, markIncentiveShown, persistIncentiveDismissal } from '@/lib/demo/landing-incentive'

export default function LandingIncentive({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [visible, setVisible] = useState(false)
  const close = useCallback(() => {
    setVisible(false)
    try {
      persistIncentiveDismissal(window.localStorage, Date.now())
    } catch {
      // La fermeture courante reste effective si l’accès au stockage est bloqué.
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated || window.location.pathname === '/login') return
    let eligible: boolean
    try {
      eligible = canShowIncentive(window.localStorage, window.sessionStorage, Date.now())
    } catch {
      eligible = true
    }
    if (!eligible) {
      return
    }
    let triggered = false
    const startedAt = Date.now()
    const show = () => {
      if (triggered) return
      triggered = true
      try {
        markIncentiveShown(window.sessionStorage)
      } catch {
        // L’affichage ponctuel reste possible sans sessionStorage.
      }
      setVisible(true)
      window.removeEventListener('scroll', onScroll)
    }
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      if (scrollable > 0 && incentiveTriggerReached(Date.now() - startedAt, window.scrollY / scrollable)) show()
    }
    const timer = window.setTimeout(show, INCENTIVE_DELAY_MS)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!visible) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [visible, close])

  if (!visible || isAuthenticated) return null
  return (
    <aside className="landing-incentive" role="complementary" aria-label="Créer un compte NowPay">
      <button type="button" className="landing-incentive-close" aria-label="Fermer" onClick={close}>×</button>
      <p className="pr-10 text-base font-semibold leading-6">Prêt à relancer vos premières factures ? Créez votre compte gratuit.</p>
      <Link href="/login?mode=signup" className="mt-3 inline-flex min-h-11 items-center justify-center bg-yellow-400 px-4 font-bold text-slate-950">Commencer gratuitement</Link>
    </aside>
  )
}
