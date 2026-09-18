import { createClient } from '@/utils/supabase/server'
import { Client } from '@/types'
import { redirect } from 'next/navigation'

export default async function Clients() {
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
          <h2 className="text-2xl font-black text-now-blue tracking-tight">Clients</h2>
          <p className="text-sm text-now-blue-light mt-1">Gérez votre base de clients.</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="text-center py-12">
            <h3 className="text-lg font-bold text-now-blue mb-2">Gestion des Clients</h3>
            <p className="text-sm text-now-blue-light mb-4">Cette page est en cours de développement.</p>
            <p className="text-xs text-gray-400">Nombre de clients chargés: {clients.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
