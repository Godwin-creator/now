import { createClient } from '@/utils/supabase/server'
import DashboardClient from '@/app/components/DashboardClient'
import { AlertTriangle, Clock, Wallet, Bell, LogIn, ShieldAlert } from 'lucide-react'
import { Client, Facture, Relance, Paiement } from '@/types'
import Link from 'next/link'

export default async function Dashboard() {
  const supabase = await createClient()
  
  // 1. Contrôle de session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const isAuthenticated = !!user && !authError

  // 2. Récupération des données Supabase avec valeurs par défaut
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

  // Calculs KPIs robustes
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
    <main className="min-h-screen bg-gray-50 pb-20 text-gray-900 font-sans">
      {/* Header Premium Vert Forêt & Accent Or */}
      <header className="bg-gradient-to-br from-[#14361e] via-[#1E4D2B] to-[#184223] text-white p-6 md:p-8 rounded-b-2xl md:rounded-b-3xl shadow-md border-b border-[#1E4D2B]/50">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center">
                Now<span className="text-[#F3B229]">.</span>
              </h1>
              <p className="text-gray-200 text-xs md:text-sm font-medium mt-0.5">
                Relancez juste. Récupérez vite.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <span className="text-xs bg-[#F3B229]/20 border border-[#F3B229]/40 text-[#F3B229] px-3.5 py-1.5 rounded-full font-bold flex items-center gap-2 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#F3B229] animate-pulse"></span>
                  Connecté
                </span>
              ) : (
                <Link 
                  href="/login" 
                  className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-full font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <LogIn size={14} /> Se connecter
                </Link>
              )}
            </div>
          </div>
          
          {/* 4 KPIs V1 Conformes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pt-1">
            <div className="bg-white/10 p-4 md:p-5 rounded-xl backdrop-blur-md border border-white/15 shadow-sm">
              <Wallet className="text-[#F3B229] mb-2" size={22} />
              <p className="text-[11px] text-gray-200 font-medium uppercase tracking-wider">Montant total dû</p>
              <p className="text-lg md:text-xl font-extrabold mt-0.5 text-white">
                {totalDu.toLocaleString('fr-FR')} <span className="text-xs font-semibold text-[#F3B229]">FCFA</span>
              </p>
            </div>

            <div className="bg-white/10 p-4 md:p-5 rounded-xl backdrop-blur-md border border-white/15 shadow-sm">
              <AlertTriangle className="text-emerald-300 mb-2" size={22} />
              <p className="text-[11px] text-gray-200 font-medium uppercase tracking-wider">Créances actives</p>
              <p className="text-lg md:text-xl font-extrabold mt-0.5 text-white">{facturesActives.length}</p>
            </div>

            <div className="bg-white/10 p-4 md:p-5 rounded-xl backdrop-blur-md border border-white/15 shadow-sm">
              <Clock className="text-[#F3B229] mb-2" size={22} />
              <p className="text-[11px] text-gray-200 font-medium uppercase tracking-wider">En retard (nb)</p>
              <p className="text-lg md:text-xl font-extrabold mt-0.5 text-[#F3B229]">{enRetardNb}</p>
            </div>

            <div className="bg-white/10 p-4 md:p-5 rounded-xl backdrop-blur-md border border-white/15 shadow-sm">
              <Bell className="text-amber-200 mb-2" size={22} />
              <p className="text-[11px] text-gray-200 font-medium uppercase tracking-wider">À relancer</p>
              <p className="text-lg md:text-xl font-extrabold mt-0.5 text-amber-200">{aRelancerAujourdhui}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteneur principal */}
      <div className="max-w-4xl mx-auto p-4 md:p-6 mt-4 space-y-6">
        {/* Alerte si utilisateur non connecté */}
        {!isAuthenticated && (
          <div className="bg-[#F3B229]/10 border border-[#F3B229]/30 rounded-xl md:rounded-2xl p-4 md:p-5 flex items-start gap-4 shadow-sm">
            <ShieldAlert className="text-[#B27F15] shrink-0 mt-0.5" size={22} />
            <div className="flex-1 text-xs md:text-sm text-gray-800">
              <p className="font-bold text-[#8A6000]">Mode non connecté (Politiques Supabase RLS actives)</p>
              <p className="mt-1 text-gray-600 leading-relaxed">
                Connectez-vous pour enregistrer vos créances et synchroniser vos relances avec les règles de sécurité mono-tenant de votre entreprise.
              </p>
              <div className="mt-3">
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-1.5 bg-[#1E4D2B] hover:bg-[#15381f] text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
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