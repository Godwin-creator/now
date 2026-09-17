import { createClient } from '@/utils/supabase/server'
import DashboardClient from '@/app/components/DashboardClient'
import AnimatedSection from '@/app/components/AnimatedSection'
import { signOut } from '@/app/actions/auth'
import { AlertTriangle, Clock, Wallet, Bell, LogIn, ShieldAlert, LogOut, Zap } from 'lucide-react'
import { Client, Facture, Relance, Paiement } from '@/types'
import Link from 'next/link'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const isAuthenticated = !!user && !authError

  let clients: Client[] = []
  let factures: Facture[] = []
  let relances: Relance[] = []
  let paiements: Paiement[] = []

  if (isAuthenticated) {
    try {
      const [clientsRes, facturesRes, relancesRes, paiementsRes] = await Promise.all([
        supabase.from('clients').select('*').order('nom', { ascending: true }),
        supabase.from('factures').select('*, clients(*), companies(*)').order('score_risque', { ascending: false }),
        supabase.from('relances').select('*, factures(*, clients(*))').order('created_at', { ascending: false }),
        supabase.from('paiements').select('*, factures(*, clients(*))').order('created_at', { ascending: false })
      ])
      clients = clientsRes.data || []
      factures = facturesRes.data || []
      relances = relancesRes.data || []
      paiements = paiementsRes.data || []
    } catch {
      clients = []; factures = []; relances = []; paiements = []
    }
  }

  const facturesActives = factures.filter(f => f?.statut === 'en_attente')
  const totalDu = facturesActives.reduce((acc, curr) => acc + (Number(curr?.montant_fcfa) || 0), 0)
  const maintenant = new Date()
  const enRetardNb = facturesActives.filter(f => f?.date_echeance && new Date(f.date_echeance) < maintenant).length
  const aRelancerAujourdhui = facturesActives.filter(f =>
    (Number(f?.score_risque) || 0) >= 34 || (f?.date_echeance && new Date(f.date_echeance) < maintenant)
  ).length

  const kpis = [
    {
      icon: <Wallet size={20} />,
      label: 'Montant total dû',
      value: totalDu.toLocaleString('fr-FR'),
      unit: 'FCFA',
      color: '#F3B229',
      delay: '0ms',
    },
    {
      icon: <AlertTriangle size={20} />,
      label: 'Créances actives',
      value: String(facturesActives.length),
      unit: 'dossiers',
      color: '#6ee7b7',
      delay: '80ms',
    },
    {
      icon: <Clock size={20} />,
      label: 'En retard',
      value: String(enRetardNb),
      unit: 'factures',
      color: '#F3B229',
      delay: '160ms',
    },
    {
      icon: <Bell size={20} />,
      label: 'À relancer',
      value: String(aRelancerAujourdhui),
      unit: "aujourd\u2019hui",
      color: '#fca5a5',
      delay: '240ms',
    },
  ]

  const tickerText = 'NOW SYSTEM ACTIF — RELANCE IA — SUPABASE RLS — SCORING ALGORITHMIQUE — MULTICANAL — WHATSAPP · EMAIL · SMS · TEL — '

  return (
    <main className="min-h-screen pb-28" style={{ background: 'var(--bg)' }}>

      {/* ════════════════════════════════════
          HEADER — animé + décoration + déconnexion
          ════════════════════════════════════ */}
      <header className="animated-gradient scan-line text-white relative overflow-hidden">

        {/* Coin accent lines */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-32 h-px bg-gradient-to-r from-[#F3B229]/80 to-transparent" />
          <div className="absolute top-0 left-0 w-px h-32 bg-gradient-to-b from-[#F3B229]/80 to-transparent" />
          <div className="absolute bottom-12 right-0 w-32 h-px bg-gradient-to-l from-[#F3B229]/60 to-transparent" />
          <div className="absolute bottom-12 right-0 w-px h-32 bg-gradient-to-t from-[#F3B229]/60 to-transparent" />

          {/* Floating geometric shapes (infinite) */}
          <div className="float-y absolute top-8 right-[8%] w-14 h-14 border border-[#F3B229]/25"
               style={{ animationDelay: '0s', animationDuration: '6s' }} />
          <div className="float-y absolute top-20 right-[22%] w-5 h-5 bg-[#F3B229]/15"
               style={{ animationDelay: '1.5s', animationDuration: '4s' }} />
          <div className="float-y absolute bottom-16 left-[12%] w-20 h-20 border border-white/8"
               style={{ animationDelay: '0.7s', animationDuration: '7s' }} />
          <div className="float-y absolute top-1/3 left-[5%] w-3 h-3 bg-white/10"
               style={{ animationDelay: '2.2s', animationDuration: '5s' }} />
          <div className="float-y absolute bottom-16 right-[38%] w-6 h-6 border border-[#F3B229]/20"
               style={{ animationDelay: '1.2s', animationDuration: '8s' }} />
          <div className="float-y absolute top-6 left-[40%] w-2 h-8 bg-[#F3B229]/10"
               style={{ animationDelay: '3s', animationDuration: '5s' }} />
        </div>

        {/* Main header content */}
        <div className="relative z-10 max-w-4xl mx-auto px-5 pt-7 pb-6 md:px-8 md:pt-9 md:pb-7 space-y-6">

          {/* Logo + bouton déconnexion */}
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-none">
                Now<span className="shimmer-text">.</span>
              </h1>
              <p className="text-gray-400 text-xs md:text-sm font-mono mt-1.5 tracking-wider uppercase">
                Relancez juste · Récupérez vite
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1 shrink-0">
              {isAuthenticated ? (
                <>
                  {/* Indicateur connecté avec ring animé */}
                  <div className="relative flex items-center gap-2 text-xs text-[#F3B229] border border-[#F3B229]/40 px-3 py-1.5 font-bold">
                    <span className="relative flex h-2 w-2">
                      <span className="pulse-glow animate-ping absolute inline-flex h-full w-full bg-[#F3B229] opacity-75" />
                      <span className="relative inline-flex h-2 w-2 bg-[#F3B229]" />
                    </span>
                    Connecté
                  </div>

                  {/* Bouton déconnexion */}
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="btn-sweep flex items-center gap-1.5 text-xs border border-white/25 text-white/80 px-3 py-1.5 font-semibold hover:text-black transition-all"
                    >
                      <LogOut size={13} />
                      <span className="hidden sm:inline">Déconnexion</span>
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  className="btn-sweep flex items-center gap-1.5 text-xs border border-white/25 text-white px-4 py-2 font-semibold"
                >
                  <LogIn size={13} /> Se connecter
                </Link>
              )}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {kpis.map(({ icon, label, value, unit, color, delay }) => (
              <div
                key={label}
                className="kpi-card p-4 md:p-5"
                style={{ animationDelay: delay }}
              >
                <div className="mb-2" style={{ color }}>{icon}</div>
                <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest leading-tight">{label}</p>
                <p className="text-xl md:text-2xl font-black mt-1 count-in" style={{ color }}>
                  {value}
                </p>
                <p className="text-[10px] text-gray-500 font-medium mt-0.5">{unit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ticker bar */}
        <div className="relative z-10 border-t border-white/10 bg-black/20 overflow-hidden h-7 flex items-center">
          <div
            className="flex whitespace-nowrap text-[10px] font-mono text-[#F3B229]/50 tracking-widest gap-0"
            style={{ animation: 'marquee 24s linear infinite' }}
          >
            {/* Doubled for seamless loop */}
            <span className="pr-16">{tickerText}</span>
            <span className="pr-16">{tickerText}</span>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════
          CONTENU PRINCIPAL
          ════════════════════════════════════ */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 space-y-6">

        {/* Alerte non connecté */}
        {!isAuthenticated && (
          <AnimatedSection>
            <div className="border-l-4 border-[#F3B229] bg-white p-5 flex items-start gap-4 shadow-sm">
              <ShieldAlert className="text-[#F3B229] shrink-0 mt-0.5" size={22} />
              <div className="flex-1 text-sm text-gray-700">
                <p className="font-bold text-gray-900 mb-1">Mode non connecté — RLS Supabase actif</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Connectez-vous pour accéder à vos créances et synchroniser vos données de manière sécurisée.
                </p>
                <Link
                  href="/login"
                  className="btn-primary-sweep mt-3 inline-flex items-center gap-1.5 bg-[#1E4D2B] text-white font-semibold text-xs px-4 py-2"
                >
                  <LogIn size={13} /> Se connecter
                </Link>
              </div>
            </div>
          </AnimatedSection>
        )}

        <AnimatedSection>
          <DashboardClient
            initialClients={clients}
            initialFactures={factures}
            initialRelances={relances}
            initialPaiements={paiements}
          />
        </AnimatedSection>
      </div>
    </main>
  )
}