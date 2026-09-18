import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import HistoriqueClient from './HistoriqueClient'
import type { Paiement, Relance } from '@/types'

export default async function HistoriquePage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  let relances: Relance[] = []
  let paiements: Paiement[] = []

  try {
    const [relancesRes, paiementsRes] = await Promise.all([
      supabase
        .from('relances')
        .select('*, factures(*, clients(*))')
        .order('created_at', { ascending: false }),
      supabase
        .from('paiements')
        .select('*, factures(*, clients(*))')
        .order('created_at', { ascending: false }),
    ])

    relances = relancesRes.data || []
    paiements = paiementsRes.data || []
  } catch (error) {
    console.error('Erreur chargement historique:', error)
  }

  return (
    <div className="w-full flex flex-col h-full gap-8">
      <div className="shrink-0">
        <h2 className="text-2xl font-black text-now-blue tracking-tight">Historique</h2>
        <p className="mt-1 text-sm text-now-blue-light">
          Journal des actions, relances et paiements.
        </p>
      </div>

      <HistoriqueClient initialRelances={relances} initialPaiements={paiements} />
    </div>
  )
}
