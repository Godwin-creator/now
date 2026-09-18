import { createClient } from '@/utils/supabase/server'
import DashboardClient from '@/app/components/DashboardClient'
import { Client, Facture, Relance, Paiement } from '@/types'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  let clients: Client[] = []
  let factures: Facture[] = []
  let relances: Relance[] = []
  let paiements: Paiement[] = []

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
  } catch (error) {
    console.error("Erreur chargement données:", error)
  }

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Vue d'ensemble</h2>
          <p className="text-sm text-gray-500 mt-1">Gérez vos créances et relances automatiquement.</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <DashboardClient
          initialClients={clients}
          initialFactures={factures}
          initialRelances={relances}
          initialPaiements={paiements}
        />
      </div>
    </div>
  )
}