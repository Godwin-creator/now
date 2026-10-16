'use client'

import { useMemo, useState } from 'react'
import { Eye, MessageCircle, PencilLine, Phone, Search } from 'lucide-react'
import type { Client } from '@/types'
import ClientDetailsPanel from './ClientDetailsPanel'

const profileStyles: Record<string, string> = {
  corporate: 'bg-blue-50 text-now-blue border border-blue-100',
  professionnel: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
  'particulier informel': 'bg-slate-100 text-slate-700 border border-slate-200',
}

const formatProfile = (profil?: string) => {
  if (!profil) return 'Non renseigné'

  return profil
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

interface ClientsTableProps {
  initialClients: Client[]
}

export default function ClientsTable({ initialClients }: ClientsTableProps) {
  const [query, setQuery] = useState('')
  const [clients, setClients] = useState(initialClients)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const filteredClients = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return clients

    return clients.filter((client) => {
      const haystack = [
        client.nom,
        client.email,
        client.telephone,
        client.whatsapp,
        client.secteur,
        client.profil,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(term)
    })
  }, [clients, query])

  const handleClientSaved = (client: Client) => {
    setClients((current) => current.map((item) => (item.id === client.id ? client : item)))
    setEditingClient(null)
    setSelectedClient(client)
  }

  return (
    <>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="bg-now-surface rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-now-surface">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-now-blue" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un client..."
                className="w-full bg-now-bg border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-now-blue placeholder:text-now-blue-light focus:outline-none focus:ring-2 focus:ring-now-yellow/40"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1100px]">
              <thead>
                <tr>
                  <th className="px-4 pb-4 pt-4 text-xs text-now-blue-light uppercase tracking-wider font-semibold border-b border-slate-200">Nom du client</th>
                  <th className="px-4 pb-4 pt-4 text-xs text-now-blue-light uppercase tracking-wider font-semibold border-b border-slate-200">Contact</th>
                  <th className="px-4 pb-4 pt-4 text-xs text-now-blue-light uppercase tracking-wider font-semibold border-b border-slate-200">Profil</th>
                  <th className="px-4 pb-4 pt-4 text-xs text-now-blue-light uppercase tracking-wider font-semibold border-b border-slate-200">Secteur</th>
                  <th className="px-4 pb-4 pt-4 text-xs text-now-blue-light uppercase tracking-wider font-semibold border-b border-slate-200 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredClients.map((client) => {
                  const profileClass = profileStyles[client.profil] || 'bg-slate-100 text-slate-700 border border-slate-200'
                  return (
                    <tr key={client.id} className="group hover:bg-slate-50 transition-colors border-b border-gray-100">
                      <td className="px-4 py-4 align-top">
                        <div className="font-semibold text-now-blue">{client.nom}</div>
                        {client.email ? <div className="mt-1 text-xs text-slate-500">{client.email}</div> : null}
                      </td>

                      <td className="px-4 py-4 align-top">
                        <div className="space-y-1 text-sm">
                          {client.telephone ? (
                            <div className="flex items-center gap-2 text-slate-700">
                              <Phone className="h-3.5 w-3.5 text-now-blue-light" />
                              <span>{client.telephone}</span>
                            </div>
                          ) : null}
                          {client.whatsapp ? (
                            <div className="flex items-center gap-2 text-green-700">
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>{client.whatsapp}</span>
                            </div>
                          ) : null}
                          {!client.telephone && !client.whatsapp ? (
                            <span className="text-slate-400 text-sm">Non renseigné</span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${profileClass}`}>
                          {formatProfile(client.profil)}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-slate-600">
                        {client.secteur || 'Non renseigné'}
                      </td>

                      <td className="px-4 py-4 align-top text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedClient(client)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-now-blue hover:border-now-blue/30 hover:bg-now-yellow/10 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Voir profil
                          </button>

                          <button
                            type="button"
                            aria-label={`Modifier ${client.nom}`}
                            onClick={() => setEditingClient(client)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-now-blue hover:bg-slate-100 transition-colors"
                          >
                            <PencilLine className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ClientDetailsPanel
        selectedClient={selectedClient}
        editingClient={editingClient}
        onClose={() => { setSelectedClient(null); setEditingClient(null) }}
        onStartEditing={setEditingClient}
        onEditingChange={setEditingClient}
        onSaved={handleClientSaved}
      />
    </>
  )
}
