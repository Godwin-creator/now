import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import type { Client } from '@/types'
import ClientsTable from './ClientsTable'

export default async function ClientsPage() {
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
    console.error('Erreur chargement clients:', error)
  }

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-now-blue tracking-tight">Clients</h2>
          <p className="text-sm text-now-blue-light mt-1">Gérez votre base de clients.</p>
        </div>
      </div>

      <ClientsTable initialClients={clients} />
    </div>
  )
}
