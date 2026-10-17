import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { disambiguation, jsonLdScript, structuredData } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'NowPay — Suivi et relance de factures impayées pour PME',
  description:
    "NowPay aide les PME à voir qui relancer aujourd'hui et à rédiger le bon message de relance par IA (WhatsApp, e-mail, SMS). Gratuit pendant la phase pilote.",
  alternates: { canonical: '/' },
  openGraph: {
    title: 'NowPay — Suivi et relance de factures impayées pour PME',
    description:
      "Suivez vos factures impayées, voyez qui relancer aujourd'hui et préparez un message à relire avant envoi.",
    url: '/',
    siteName: 'NowPay',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'NowPay, suivi des factures impayées',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NowPay — Suivi et relance de factures impayées pour PME',
    description:
      "Voyez qui relancer aujourd'hui et préparez le message à envoyer.",
    images: ['/opengraph-image.png'],
  },
};

const faqs = [
  {
    question: 'Qu’est-ce que NowPay ?',
    answer:
      'NowPay aide les PME à suivre leurs factures impayées, à choisir les relances à traiter et à préparer leurs messages.',
  },
  {
    question: 'Est-ce un service d’avance sur salaire ou de paiement ?',
    answer:
      'Non. NowPay ne propose ni avance sur salaire, ni prêt, ni service de paiement. C’est un outil de suivi et de relance de factures.',
  },
  {
    question: 'L’IA envoie-t-elle les messages à ma place ?',
    answer:
      'Non. Vous relisez le message proposé, puis vous l’envoyez vous-même depuis WhatsApp, e-mail ou SMS.',
  },
  {
    question: 'Quels canaux de relance sont proposés ?',
    answer:
      'Vous pouvez préparer un message pour WhatsApp, e-mail ou SMS selon les coordonnées disponibles pour votre client.',
  },
  {
    question: 'Comment le risque est-il calculé ?',
    answer:
      'Une formule transparente produit un score de 0 à 100 à partir du retard, du solde restant et des retards précédents.',
  },
  {
    question: 'Mes données sont-elles protégées ?',
    answer: (
      <>
        Les données de chaque compte sont séparées. Consultez notre{' '}
        <Link className="underline underline-offset-4" href="/confidentialite">
          politique de confidentialité
        </Link>
        .
      </>
    ),
  },
];

const steps = [
  ['Ajoutez vos factures', 'Saisissez les factures et les paiements reçus.'],
  [
    'Voyez qui relancer aujourd’hui',
    'La file quotidienne met les prochaines actions en évidence.',
  ],
  [
    'Relisez le message proposé et envoyez-le vous-même',
    'Vous gardez la main sur chaque message et son envoi.',
  ],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(structuredData) }}
      />
      <header className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <nav
          aria-label="Navigation principale"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
        >
          <Link
            href="/"
            aria-label="NowPay, accueil"
            className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
          >
            <Image
              src="/logo-nowpay.png"
              alt="NowPay"
              width={180}
              height={72}
              priority
              className="h-10 w-auto object-contain"
            />
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
            <a
              href="#fonctionnement"
              className="rounded focus-visible:outline-2 focus-visible:outline-blue-800"
            >
              Comment ça marche
            </a>
            <a
              href="#faq"
              className="rounded focus-visible:outline-2 focus-visible:outline-blue-800"
            >
              FAQ
            </a>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-800 sm:px-3"
            >
              Se connecter
            </Link>
            <Link
              href="/signup"
              className="inline-flex min-h-11 items-center rounded-xl bg-blue-900 px-3 text-sm font-bold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 sm:px-4"
            >
              Créer un compte
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-14 pt-7 sm:px-6 sm:pb-16 sm:pt-10 lg:grid-cols-2 lg:gap-10 lg:py-20">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-blue-800">
            Pour les gérants de PME
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight sm:mt-4 sm:text-5xl">
            Ne laissez plus dormir vos factures.
          </h1>
          <p className="mt-4 text-lg leading-7 text-slate-700">
            Voyez qui relancer aujourd&apos;hui, puis envoyez le bon message par
            WhatsApp, e-mail ou SMS.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            {disambiguation}
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:mt-7 sm:flex-row sm:gap-3">
            <Link
              href="/signup"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-yellow-400 px-6 text-base font-bold text-slate-950 hover:bg-yellow-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
            >
              Commencer gratuitement
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-base font-bold text-slate-800 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-800"
            >
              Se connecter
            </Link>
          </div>
          <p className="mt-3 text-sm text-slate-700">
            Gratuit pendant la phase pilote. Sans carte bancaire.
          </p>
        </div>
        <figure className="mx-auto w-full max-w-[390px] rounded-3xl border border-slate-200 bg-white p-2 shadow-xl sm:p-3">
          <Image
            src="/file-aujourdhui.webp"
            alt="Exemple fictif de la file À faire aujourd’hui sur téléphone, avec deux factures et leurs actions de relance."
            width={780}
            height={1120}
            priority
            className="h-auto w-full rounded-2xl"
          />
          <figcaption className="px-3 py-2 text-center text-sm text-slate-600">
            Exemple d’écran — données fictives
          </figcaption>
        </figure>
      </section>

      <section
        id="fonctionnement"
        className="scroll-mt-6 bg-blue-950 py-14 text-white sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="max-w-2xl text-3xl font-black sm:text-4xl">
            Comment ça marche
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map(([title, text], index) => (
              <article
                key={title}
                className="rounded-2xl border border-white/20 bg-white/5 p-5"
              >
                <p className="text-sm font-bold text-yellow-300">
                  Étape {index + 1}
                </p>
                <h3 className="mt-2 text-xl font-bold">{title}</h3>
                <p className="mt-2 leading-7 text-blue-100">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="mx-auto max-w-4xl scroll-mt-6 px-4 py-14 sm:px-6 sm:py-20"
      >
        <h2 className="text-3xl font-black">Questions fréquentes</h2>
        <p className="mt-3 text-slate-700">{disambiguation}</p>
        <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
          {faqs.map(({ question, answer }) => (
            <details key={question} className="py-4">
              <summary className="cursor-pointer py-2 text-base font-bold focus-visible:outline-2 focus-visible:outline-blue-800">
                {question}
              </summary>
              <p className="pt-2 leading-7 text-slate-700">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="max-w-xl space-y-2">
            <span className="font-bold text-slate-900">NowPay</span>
            <p>{disambiguation}</p>
          </div>
          <nav
            aria-label="Informations légales"
            className="flex flex-wrap gap-x-5 gap-y-2"
          >
            <Link href="/mentions-legales" className="underline">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="underline">
              Confidentialité
            </Link>
            <Link href="/cgu" className="underline">
              Conditions d’utilisation
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
