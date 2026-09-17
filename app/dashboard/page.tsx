import { createClient } from '@/utils/supabase/server'
import CreanceForm from '@/app/components/CreanceForm'
import RelanceAction from '@/app/components/RelanceAction'
import { AlertTriangle, CheckCircle, Clock, Wallet } from 'lucide-react'

export default async function Dashboard() {
  const supabase = createClient()
  
  // Récupération des données
  const { data: clients } = await supabase.from('clients').select('*')
  const { data: factures } = await supabase.from('factures').select('*, clients(nom)').eq('statut', 'en_attente').order('score_risque', { ascending: false })

  const totalDu = factures?.reduce((acc, curr) => acc + Number(curr.montant_fcfa), 0) || 0

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header Mobile */}
      <header className="bg-blue-900 text-white p-6 rounded-b-3xl shadow-md">
        <h1 className="text-2xl font-bold mb-1">Now.</h1>
        <p className="text-blue-200 text-sm">Relancez juste. Récupérez vite.</p>
        
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
            <Wallet className="text-blue-300 mb-2" size={24} />
            <p className="text-xs text-blue-100">Total à recouvrer</p>
            <p className="text-lg font-bold">{totalDu.toLocaleString('fr-FR')} FCFA</p>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
            <AlertTriangle className="text-orange-300 mb-2" size={24} />
            <p className="text-xs text-blue-100">Créances actives</p>
            <p className="text-lg font-bold">{factures?.length || 0}</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-8 mt-4">
        {/* Section Formulaire */}
        <section>
          <CreanceForm clientsExistants={clients || []} />
        </section>

        {/* Liste des Créances (Priorisées par Score) */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4 px-2 flex items-center gap-2">
            <Clock size={20} className="text-gray-500"/> À relancer en priorité
          </h2>
          
          <div className="flex flex-col gap-4">
            {factures?.map((facture) => (
              <div key={facture.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800">{facture.clients.nom}</h3>
                    <p className="text-sm text-gray-500">{Number(facture.montant_fcfa).toLocaleString('fr-FR')} FCFA</p>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                    facture.niveau_risque === 'Critique' ? 'bg-red-100 text-red-700' :
                    facture.niveau_risque === 'Élevé' ? 'bg-orange-100 text-orange-700' :
                    facture.niveau_risque === 'Moyen' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    Risque {facture.niveau_risque} ({facture.score_risque}/100)
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 flex gap-2">
                  <span className="bg-gray-100 px-2 py-1 rounded">Canal: {facture.canal_contact}</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">Échéance: {new Date(facture.date_echeance).toLocaleDateString('fr-FR')}</span>
                </div>

                {/* Bouton d'action IA */}
                <RelanceAction factureId={facture.id} canal={facture.canal_contact} />
              </div>
            ))}
            
            {factures?.length === 0 && (
              <div className="text-center p-8 text-gray-400 flex flex-col items-center">
                <CheckCircle size={40} className="mb-2 text-green-400" />
                <p>Aucune créance en attente.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}