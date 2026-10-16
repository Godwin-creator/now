import { createClient } from '@/utils/supabase/server'
import DashboardClient from '@/app/components/DashboardClientCore'
import { Facture, Relance, Paiement } from '@/types'
import { redirect } from 'next/navigation'
import { enrichirCreances } from '@/lib/domain'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  let factures: Facture[] = []
  let relances: Relance[] = []
  let paiements: Paiement[] = []

  try {
    const [facturesRes, relancesRes, paiementsRes] = await Promise.all([
      supabase.from('factures').select('*, clients(*), companies(*)').order('date_echeance', { ascending: true }),
      supabase.from('relances').select('*, factures(*, clients(*))').order('created_at', { ascending: false }),
      supabase.from('paiements').select('*, factures(*, clients(*))').order('created_at', { ascending: false })
    ])
    factures = facturesRes.data || []
    relances = relancesRes.data || []
    paiements = paiementsRes.data || []
  } catch (error) {
    console.error("Erreur chargement données:", error)
  }

  const today = new Date().toISOString().slice(0, 10)
  const seuilMontantEleve = factures[0]?.companies?.seuil_montant_eleve ?? 200_000
  const facturesEnrichies = enrichirCreances(
    factures.map((facture) => ({
      ...facture,
      paiements: paiements.filter((paiement) => paiement.facture_id === facture.id),
      relances: relances.filter((relance) => relance.facture_id === facture.id),
    })),
    today,
    seuilMontantEleve,
  )

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-now-blue tracking-tight">Vue generale</h2>
          <p className="text-sm text-now-blue-light mt-1">Suivi des créances et relances en temps réel.</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <DashboardClient
          initialFactures={facturesEnrichies}
        />
      </div>
    </div>
  )
}