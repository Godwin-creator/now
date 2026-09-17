import { createClient } from '@/utils/supabase/server'
import DashboardClient from '@/app/components/DashboardClient'
import { AlertTriangle, Clock, Wallet, Bell, LogIn, ShieldAlert } from 'lucide-react'
import { Client, Facture, Relance, Paiement } from '@/types'
import Link from 'next/link'

export default async function Dashboard() {
  const supabase = await createClient()
  
  // 1. Vérification de l'authentification utilisateur
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const isAuthenticated = !!user && !authError

  // 2. Récupération sécurisée des données avec valeurs par défaut
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
    } catch (dbErr) {
      console.error("Erreur lors du chargement des données Supabase :", dbErr)
      clients = []
      factures = []
      relances = []
      paiements = []
    }
  }

  // Factures actives (en attente de règlement)
  const facturesActives = (factures || []).filter(f => f?.statut === 'en_attente')

  // Calculs KPIs robustes évitant les crashs sur tableaux vides
  const totalDu = facturesActives.reduce((acc, curr) => acc + (Number(curr?.montant_fcfa) || 0), 0)
  
  const maintenant = new Date()
  const enRetardNb = facturesActives.filter(f => {
    if (!f?.date_echeance) return false
    return new Date(f.date_echeance).getTime() < maintenant.getTime()
  }).length

  const aRelancerAujourdhui = facturesActives.filter(f => {
    if (!f) return false
    const estEnRetard = f.date_echeance ? new Date(f.date_echeance).getTime() < maintenant.getTime() : false
    return (Number(f.score_risque) || 0) >= 34 || estEnRetard
  }).length

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header Mobile & Desktop */}
      <header className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white p-6 md:p-8 rounded-b-3xl shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-black tracking-tight">Now.</h1>
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <span className="text-xs bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-3 py-1 rounded-full font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Connecté
                </span>
              ) : (
                <Link 
                  href="/login" 
                  className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 transition-all"
                >
                  <LogIn size={13} /> Se connecter
                </Link>
              )}
            </div>
          </div>
          <p className="text-blue-200 text-sm font-medium">Relancez juste. Récupérez vite.</p>
          
          {/* 4 KPIs V1 Conformes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6">
            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
              <Wallet className="text-blue-300 mb-1.5" size={22} />
              <p className="text-[11px] text-blue-200 font-medium uppercase tracking-wider">Montant total dû</p>
              <p className="text-lg md:text-xl font-black mt-0.5">{totalDu.toLocaleString('fr-FR')} FCFA</p>
            </div>

            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
              <AlertTriangle className="text-amber-300 mb-1.5" size={22} />
              <p className="text-[11px] text-blue-200 font-medium uppercase tracking-wider">Créances actives</p>
              <p className="text-lg md:text-xl font-black mt-0.5">{facturesActives.length}</p>
            </div>

            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
              <Clock className="text-rose-300 mb-1.5" size={22} />
              <p className="text-[11px] text-blue-200 font-medium uppercase tracking-wider">En retard (nb)</p>
              <p className="text-lg md:text-xl font-black mt-0.5 text-rose-200">{enRetardNb}</p>
            </div>

            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
              <Bell className="text-emerald-300 mb-1.5" size={22} />
              <p className="text-[11px] text-blue-200 font-medium uppercase tracking-wider">À relancer aujourd'hui</p>
              <p className="text-lg md:text-xl font-black mt-0.5 text-emerald-200">{aRelancerAujourdhui}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto p-4 md:p-6 mt-2 space-y-6">
        {/* Alerte si utilisateur non connecté pour éviter le blocage silencieux RLS */}
        {!isAuthenticated && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 md:p-5 flex items-start gap-3.5 shadow-xs">
            <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={22} />
            <div className="flex-1 text-xs md:text-sm text-amber-900">
              <p className="font-bold text-amber-950">Mode non connecté (Politiques Supabase RLS actives)</p>
              <p className="mt-1 text-amber-800 leading-relaxed">
                Les politiques de sécurité Supabase (RLS) limitent l'accès aux données de votre entreprise. 
                Veuillez vous connecter pour enregistrer vos créances et synchroniser vos relances en toute sécurité.
              </p>
              <div className="mt-3">
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs"
                >
                  <LogIn size={14} /> Accéder à la connexion
                </Link>
              </div>
            </div>
          </div>
        )}

        <DashboardClient
          initialClients={clients}
          initialFactures={factures}
          initialRelances={relances}
          initialPaiements={paiements}
        />
      </div>
    </main>
  )
}