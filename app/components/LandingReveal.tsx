'use client'

import { useEffect, useRef, type ReactNode } from 'react'

export default function LandingReveal({ children }: { children: ReactNode }) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = container.current
    if (!element || !('IntersectionObserver' in window)) return
    element.classList.add('landing-reveal-pending')
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        element.classList.add('landing-reveal-visible')
        observer.disconnect()
      }
    }, { threshold: 0.12 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return <div ref={container} className="landing-reveal">{children}</div>
}
