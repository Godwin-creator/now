import type { ReactNode } from 'react'
import Link from 'next/link'

export default function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-9">
        <Link href="/" className="inline-flex min-h-11 items-center font-bold text-blue-900 underline">NowPay</Link>
        <h1 className="mt-5 text-3xl font-black">{title}</h1>
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-950">Document de travail — à relire par un juriste avant exploitation commerciale.</p>
        <div className="mt-7 space-y-6 text-base leading-7 text-slate-800">{children}</div>
        <nav aria-label="Documents juridiques" className="mt-10 flex flex-wrap gap-x-5 gap-y-3 border-t border-slate-200 pt-5 text-sm font-semibold">
          <Link href="/mentions-legales" className="underline">Mentions légales</Link>
          <Link href="/confidentialite" className="underline">Confidentialité</Link>
          <Link href="/conditions-utilisation" className="underline">Conditions d’utilisation</Link>
        </nav>
      </article>
    </main>
  )
}
