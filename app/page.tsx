import Link from 'next/link'

const stats = [
  { value: '3x', label: 'plus de rapidité' },
  { value: '94%', label: 'taux de relance priorisée' },
  { value: '24/7', label: 'suivi automatique' },
]

const benefits = [
  'Priorisation intelligente des créances à risque',
  'Relances automatiques avec IA et suivi d’actions',
  'Vue d’ensemble claire pour les équipes de recouvrement',
]

const features = [
  {
    title: 'Score de risque',
    text: 'Analyse les dossiers les plus urgents pour concentrer les efforts là où ils ont le plus d’impact.',
  },
  {
    title: 'Relances automatisées',
    text: 'Envoi de rappels, suivis et escalades intelligents sans lourde charge manuelle.',
  },
  {
    title: 'Dashboard pro',
    text: 'Un tableau de bord synthétique pour piloter les encours, paiements et relances en temps réel.',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="mx-auto max-w-7xl px-6 py-6">
        <nav className="flex items-center justify-between rounded-full border border-slate-200 bg-white/80 px-5 py-3 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#123274] to-[#1f4db6] text-lg font-black text-white shadow-md">
              N
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-[#123274]">NowPay</p>
            </div>
          </div>

          <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#avantages" className="transition hover:text-[#123274]">Avantages</a>
            <a href="#fonctionnalites" className="transition hover:text-[#123274]">Fonctionnalités</a>
            <a href="#contact" className="transition hover:text-[#123274]">Contact</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#123274] hover:text-[#123274]"
            >
              Tester
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-[#123274] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#123274]/20 transition hover:bg-[#0f2d67]"
            >
              Accéder au dashboard
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-8 md:pb-24 md:pt-12">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="inline-flex items-center rounded-full border border-[#123274]/15 bg-[#123274]/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#123274]">
              Recouvrement intelligent
            </span>

            <h1 className="mt-6 max-w-xl text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
              Optimisez le recouvrement avec l’IA de <span className="text-[#123274]">NowPay</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
              Centralisez les créances, priorisez les dossiers à risque et automatisez les relances pour améliorer votre taux de récupération sans effort manuel.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-[#FFD100] px-6 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-[#FFD100]/30 transition hover:-translate-y-0.5 hover:bg-[#f7c800]"
              >
                Tester NowPay
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800 transition hover:border-[#123274] hover:text-[#123274]"
              >
                Accéder au dashboard
              </Link>
            </div>

            <ul className="mt-8 space-y-3 text-sm text-slate-700">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFD100] text-xs font-black text-slate-900">
                    ✓
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="absolute -left-10 top-12 h-32 w-32 rounded-full bg-[#FFD100]/30 blur-3xl" />
            <div className="absolute -right-8 bottom-14 h-36 w-36 rounded-full bg-[#123274]/20 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_rgba(18,50,116,0.15)]">
              <div className="rounded-[1.5rem] bg-gradient-to-br from-[#123274] via-[#183d8d] to-[#1d4fb9] p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Performance</p>
                    <h2 className="mt-3 text-3xl font-black">+28%</h2>
                  </div>
                  <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">
                    Ce mois
                  </div>
                </div>

                <div className="mt-8 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-sm text-blue-50">
                    <span>Récupération</span>
                    <span className="font-semibold">82.4%</span>
                  </div>
                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full w-[82%] rounded-full bg-[#FFD100]" />
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-2xl font-black text-[#123274]">{stat.value}</div>
                    <div className="mt-1 text-xs text-slate-600">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Dossiers prioritaires</p>
                    <p className="mt-1 text-xs text-slate-500">12 créances à relancer aujourd’hui</p>
                  </div>
                  <span className="rounded-full bg-[#FFD100]/20 px-2.5 py-1 text-xs font-bold text-[#123274]">
                    High risk
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="avantages" className="bg-[#123274] py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">Pourquoi NowPay</p>
            <h2 className="mt-4 text-3xl font-black md:text-4xl">Une plateforme pensée pour accélérer le recouvrement</h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFD100] text-lg font-black text-[#123274]">
                  ✦
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-blue-100">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="fonctionnalites" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#123274]">Workflow</p>
            <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-900">Plus de contrôle, moins de friction</h3>
            <div className="mt-8 space-y-5">
              {[
                'Importez vos dossiers et clients en quelques clics.',
                'L’IA identifie les opérations à risque et les priorise automatiquement.',
                'Les actions de relance et le suivi sont centralisés dans un seul espace.',
              ].map((item, index) => (
                <div key={item} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#123274] text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <p className="pt-1 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Impact business</p>
            <h3 className="mt-4 text-3xl font-black">Des résultats visibles dès les premières semaines</h3>

            <div className="mt-8 space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Temps de traitement</span>
                  <span className="text-2xl font-black text-[#FFD100]">-40%</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Taux de relance</span>
                  <span className="text-2xl font-black text-[#FFD100]">+32%</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Productivité équipe</span>
                  <span className="text-2xl font-black text-[#FFD100]">+2.5x</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="bg-slate-100 py-20">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-white px-6 py-12 shadow-sm md:px-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#123274]">Prêt à lancer</p>
              <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Commencez à tester NowPay dès aujourd’hui</h3>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-[#123274] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#123274]/20 transition hover:bg-[#0f2d67]"
              >
                Tester l’outil
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-slate-300 bg-slate-50 px-6 py-3 text-sm font-bold text-slate-800 transition hover:border-[#123274] hover:text-[#123274]"
              >
                Accéder au dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
