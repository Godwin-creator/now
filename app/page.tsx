import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { disambiguation, jsonLdScript, structuredData } from '@/lib/seo'
import PhoneMockup from '@/app/components/PhoneMockup'
import LandingReveal from '@/app/components/LandingReveal'
import LandingIncentive from '@/app/components/LandingIncentive'

export const metadata: Metadata = {
  title: 'NowPay — Suivi et relance de factures impayées pour PME',
  description: "NowPay aide les PME à voir qui relancer aujourd'hui et à préparer un message de relance à envoyer elles-mêmes.",
  alternates: { canonical: '/' },
  openGraph: { title: 'NowPay — Suivi et relance de factures impayées pour PME', description: "Suivez vos factures et préparez vos relances.", url: '/', siteName: 'NowPay', locale: 'fr_FR', type: 'website', images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'NowPay' }] },
}

const faqs = [
  ['Qu’est-ce que NowPay ?', 'NowPay aide les PME à suivre leurs factures impayées, à choisir les relances à traiter et à préparer leurs messages.'],
  ['L’IA envoie-t-elle les messages à ma place ?', 'Non. Vous relisez le message proposé, puis vous l’envoyez vous-même depuis WhatsApp, e-mail ou SMS.'],
  ['Quels canaux de relance sont proposés ?', 'Vous pouvez préparer un message pour WhatsApp, e-mail ou SMS selon les coordonnées disponibles pour votre client.'],
]

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(structuredData) }} />
      <header className="absolute inset-x-0 top-0 z-20 mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <nav aria-label="Navigation principale" className="flex items-center justify-between gap-3 border border-white/25 bg-[#0b1f4d]/75 p-3 text-white shadow-lg backdrop-blur-sm">
          <Link href="/" aria-label="NowPay, accueil" className="inline-flex bg-white px-2 py-1"><Image src="/logo-nowpay.png" alt="NowPay" width={180} height={72} className="h-10 w-auto object-contain" /></Link>
          <div className="hidden items-center gap-6 text-sm font-semibold md:flex"><a href="#comment-ca-marche">Comment ça marche</a><a href="#faq">FAQ</a></div>
          <div className="flex items-center gap-2"><Link href="/login" className="inline-flex min-h-11 items-center px-3 text-sm font-semibold">Se connecter</Link><Link href="/login?mode=signup" className="inline-flex min-h-11 items-center bg-yellow-400 px-4 text-sm font-bold text-slate-950">Commencer</Link></div>
        </nav>
      </header>

      <section className="landing-hero relative flex min-h-[min(760px,100svh)] items-end overflow-hidden bg-[#0b1f4d] pt-24 text-white md:items-center md:pt-20">
        <div className="landing-hero-image absolute inset-x-0 top-0 h-full md:h-full"><Image src="/landing/hero.webp" alt="" fill fetchPriority="high" loading="eager" sizes="100vw" className="object-cover" /></div>
        <div className="landing-hero-gradient absolute inset-0" />
        <div className="landing-hero-copy relative z-10 mx-auto w-full max-w-6xl px-5 pb-10 pt-24 md:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-yellow-300">Pour les gérants de PME</p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">Voyez qui relancer aujourd’hui et préparez le bon message.</h1>
            <p className="mt-5 max-w-xl text-lg leading-7 text-white">Suivez les factures en retard et préparez un message adapté, à relire avant de l’envoyer vous-même.</p>
            <p className="mt-3 text-sm leading-6 text-white">{disambiguation}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/login?mode=signup" className="inline-flex min-h-12 items-center justify-center bg-yellow-400 px-6 text-base font-bold text-slate-950">Commencer gratuitement</Link><Link href="#comment-ca-marche" className="inline-flex min-h-12 items-center justify-center px-5 font-semibold text-white underline underline-offset-4">Voir comment ça marche</Link></div>
          </div>
        </div>
      </section>

      <section id="comment-ca-marche" className="scroll-mt-6 bg-blue-950 py-14 text-white sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 md:grid-cols-[1fr_0.9fr]">
          <div><h2 className="max-w-2xl text-3xl font-black sm:text-4xl">Comment ça marche</h2><div className="mt-8 grid gap-4">{[['Ajoutez vos factures', 'Saisissez les factures et les paiements reçus.'], ['Voyez qui relancer aujourd’hui', 'La file quotidienne met les prochaines actions en évidence.'], ['Relisez le message et envoyez-le vous-même', 'Vous gardez la main sur chaque message et son envoi.']].map(([title, text], index) => <LandingReveal key={title}><article className="rounded-2xl border border-white/20 bg-white/5 p-5 transition-shadow"><p className="text-sm font-bold text-yellow-300">Étape {index + 1}</p><h3 className="mt-2 text-xl font-bold">{title}</h3><p className="mt-2 leading-7 text-blue-100">{text}</p></article></LandingReveal>)}</div></div>
          <div><PhoneMockup /><p className="mt-5 text-center text-sm leading-6 text-blue-100">Un aperçu de la file de factures à traiter et du message préparé. Vous choisissez le canal, relisez le texte, puis envoyez la relance vous-même.</p></div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl scroll-mt-6 px-4 py-14 sm:px-6 sm:py-20"><h2 className="text-3xl font-black">Questions fréquentes</h2><p className="mt-3 text-slate-700">{disambiguation}</p><div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">{faqs.map(([question, answer]) => <details key={question} className="py-4"><summary className="cursor-pointer py-2 text-base font-bold">{question}</summary><p className="pt-2 leading-7 text-slate-700">{answer}</p></details>)}</div></section>
      <section className="bg-blue-950 px-4 py-12 text-center text-white"><h2 className="text-2xl font-bold">Prêt à mieux suivre vos factures ?</h2><Link href="/login?mode=signup" className="mt-5 inline-flex min-h-12 items-center justify-center bg-yellow-400 px-6 font-bold text-slate-950">Commencer gratuitement</Link></section>
      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="max-w-xl space-y-2"><span className="font-bold text-slate-900">NowPay</span><p>{disambiguation}</p></div><nav aria-label="Informations légales" className="flex flex-wrap gap-x-5 gap-y-2"><Link href="/mentions-legales" className="underline">Mentions légales</Link><Link href="/confidentialite" className="underline">Confidentialité</Link><Link href="/cgu" className="underline">Conditions d’utilisation</Link></nav></div></footer>
      <LandingIncentive isAuthenticated={Boolean(user)} />
    </main>
  )
}
