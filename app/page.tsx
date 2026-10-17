import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Vos relances, simplement',
  description: "Voyez qui relancer aujourd'hui, envoyez le bon message en moins d'une minute.",
  alternates: { canonical: '/' },
  openGraph: {
    title: 'NowPay — vos relances, simplement',
    description: "Voyez qui relancer aujourd'hui, envoyez le bon message en moins d'une minute.",
    url: '/',
    siteName: 'NowPay',
    locale: 'fr_FR',
    type: 'website',
  },
}

const steps = [
  ['Voyez les priorités', 'Retrouvez les créances à traiter dans votre espace.'],
  ['Préparez le message', 'NowPay propose un texte que vous pouvez relire et modifier.'],
  ['Envoyez vous-même', 'Ouvrez WhatsApp, votre messagerie ou SMS pour envoyer le message.'],
]

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <nav aria-label="Navigation principale" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <Link href="/" aria-label="NowPay, accueil" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800">
            <Image src="/logo-nowpay.png" alt="NowPay" width={180} height={72} priority className="h-10 w-auto object-contain" />
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
            <a href="#fonctionnement" className="rounded focus-visible:outline-2 focus-visible:outline-blue-800">Comment ça marche</a>
            <Link href="/mentions-legales" className="rounded focus-visible:outline-2 focus-visible:outline-blue-800">Mentions légales</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-800">Se connecter</Link>
            <Link href="/signup" className="inline-flex min-h-11 items-center rounded-xl bg-blue-900 px-4 text-sm font-bold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800">Créer un compte</Link>
          </div>
          <details className="group relative w-full md:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-800 focus-visible:outline-2 focus-visible:outline-blue-800">Menu</summary>
            <div className="mt-2 grid gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <a href="#fonctionnement" className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-50">Comment ça marche</a>
              <Link href="/mentions-legales" className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-50">Mentions légales</Link>
              <Link href="/confidentialite" className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-50">Confidentialité</Link>
            </div>
          </details>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 md:py-20 lg:grid-cols-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-blue-800">Pour les gérants de PME</p>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">Voyez qui relancer aujourd&apos;hui, envoyez le bon message en moins d&apos;une minute.</h1>
          <p className="mt-5 text-lg leading-8 text-slate-700">Depuis votre téléphone, retrouvez les créances à suivre et préparez une relance adaptée. Vous gardez la main sur chaque message et son envoi.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-yellow-400 px-6 text-base font-bold text-slate-950 hover:bg-yellow-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800">Créer mon compte</Link>
            <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-base font-bold text-slate-800 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-800">Se connecter</Link>
          </div>
          <p className="mt-4 text-sm text-slate-700">Les messages sont relus et envoyés par vous. NowPay ne les envoie pas automatiquement.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-7" aria-label="Exemple d’une relance préparée dans NowPay">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <Image src="/logo-nowpay.png" alt="" width={120} height={48} className="h-8 w-auto" />
            <span className="text-sm font-semibold text-slate-600">Exemple d’écran</span>
          </div>
          <h2 className="mt-5 text-xl font-bold">À faire aujourd&apos;hui</h2>
          <article className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-bold">Client Exemple</p>
            <p className="mt-1 text-sm text-slate-700">Solde dû : 75 000 FCFA</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-900">Risque moyen</span>
              <span className="text-slate-700">WhatsApp</span>
            </div>
            <button type="button" className="mt-4 min-h-12 w-full rounded-xl bg-blue-900 px-4 font-bold text-white">Préparer une relance</button>
          </article>
          <p className="mt-3 text-xs text-slate-600">Données fictives à titre d’illustration.</p>
        </div>
      </section>

      <section id="fonctionnement" className="scroll-mt-6 bg-blue-950 py-14 text-white sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="max-w-2xl text-3xl font-black sm:text-4xl">Le suivi des créances, à portée de téléphone</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map(([title, text], index) => (
              <article key={title} className="rounded-2xl border border-white/20 bg-white/5 p-5">
                <p className="text-sm font-bold text-yellow-300">Étape {index + 1}</p>
                <h3 className="mt-2 text-xl font-bold">{title}</h3>
                <p className="mt-2 leading-7 text-blue-100">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span>NowPay</span>
        <nav aria-label="Informations légales" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/mentions-legales" className="underline">Mentions légales</Link>
          <Link href="/confidentialite" className="underline">Confidentialité</Link>
          <Link href="/conditions-utilisation" className="underline">Conditions d’utilisation</Link>
        </nav>
      </footer>
    </main>
  )
}
