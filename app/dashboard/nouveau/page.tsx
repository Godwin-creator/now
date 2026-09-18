import { createClient } from '@/utils/supabase/server'
import CreanceForm from '@/app/components/CreanceForm'
import { Client } from '@/types'
import { redirect } from 'next/navigation'

export default async function Nouveau() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  let clients: Client[] = []

  try {
    const clientsRes = await supabase.from('clients').select('*').order('nom', { ascending: true })
    clients = clientsRes.data || []
  } catch (error) {
    console.error("Erreur chargement clients:", error)
  }

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-now-blue tracking-tight">Nouvelle Créance</h2>
          <p className="text-sm text-now-blue-light mt-1">Enregistrez une nouvelle créance ou importez des factures.</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto flex flex-col">
        <CreanceForm clientsExistants={clients} />
      </div>
    </div>
  )
}
