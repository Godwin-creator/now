import { createClient } from '@/utils/supabase/server'
import DashboardClient from '@/app/components/DashboardClient'
import { AlertTriangle, Clock, Wallet, CheckCircle, Bell } from 'lucide-react'
import { Client, Facture, Relance, Paiement } from '@/types'

export default async function Dashboard() {
  const supabase = await createClient()
  
  // Récupération asynchrone sécurisée des données Supabase
  const { data: clientsData } = await supabase
    .from('clients')
    .select('*')
    .order('nom', { ascending: true })

  const { data: facturesData } = await supabase
    .from('factures')
    .select('*, clients(*), companies(*)')
    .order('score_risque', { ascending: false })

  const { data: relancesData } = await supabase
    .from('relances')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: paiementsData } = await supabase
    .from('paiements')
    .select('*')
    .order('created_at', { ascending: false })

  const clients: Client[] = clientsData || []
  const factures: Facture[] = facturesData || []
  const relances: Relance[] = relancesData || []
  const paiements: Paiement[] = paiementsData || []

  // Factures actives (en attente de règlement)
  const facturesActives = factures.filter(f => f.statut === 'en_attente')

  // KPIs V1 selon le Cahier des charges
  const totalDu = facturesActives.reduce((acc, curr) => acc + Number(curr.montant_fcfa || 0), 0)
  
  const maintenant = new Date()
  const enRetardNb = facturesActives.filter(f => new Date(f.date_echeance).getTime() < maintenant.getTime()).length

  // Factures recommandées pour relance aujourd'hui (risque moyen/élevé/critique ou en retard)
  const aRelancerAujourdhui = facturesActives.filter(f => 
    f.score_risque >= 34 || new Date(f.date_echeance).getTime() < maintenant.getTime()
  ).length

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header Mobile & Desktop */}
      <header className="bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white p-6 md:p-8 rounded-b-3xl shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-black tracking-tight">Now.</h1>
            <span className="text-xs bg-blue-500/20 border border-blue-400/30 text-blue-200 px-3 py-1 rounded-full font-semibold">
              Lomé Summer School IA 2026
            </span>
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
      <div className="max-w-4xl mx-auto p-4 md:p-6 mt-2">
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