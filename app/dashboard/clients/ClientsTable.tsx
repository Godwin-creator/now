'use client'

import { useMemo, useState } from 'react'
import { Eye, MessageCircle, PencilLine, Phone, Search, X } from 'lucide-react'
import type { Client } from '@/types'

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

  const handleUpdateClient = (client: Client) => {
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
                  <th className="px-4 pb-4 pt-4 text-xs text-now-blue-light uppercase tracking-wider font-semibold border-b border-slate-200 text-right">Retards précédents</th>
                  <th className="px-4 pb-4 pt-4 text-xs text-now-blue-light uppercase tracking-wider font-semibold border-b border-slate-200 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredClients.map((client) => {
                  const profileClass = profileStyles[client.profil] || 'bg-slate-100 text-slate-700 border border-slate-200'
                  const hasDelay = (client.retards_precedents ?? 0) > 0

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
                        <span className={`inline-flex items-center justify-end min-w-[2.5rem] text-sm font-semibold ${hasDelay ? 'text-red-600' : 'text-slate-700'}`}>
                          {client.retards_precedents ?? 0}
                        </span>
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

      {(selectedClient || editingClient) && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/25 backdrop-blur-[1px]">
          <div className="h-full w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black text-now-blue">
                {editingClient ? 'Modifier le client' : 'Profil du client'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedClient(null)
                  setEditingClient(null)
                }}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editingClient ? (
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (editingClient) handleUpdateClient(editingClient)
                }}
              >
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-now-blue-light mb-1">Nom</label>
                  <input
                    value={editingClient.nom}
                    onChange={(event) => setEditingClient({ ...editingClient, nom: event.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-now-blue"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-now-blue-light mb-1">Email</label>
                  <input
                    value={editingClient.email ?? ''}
                    onChange={(event) => setEditingClient({ ...editingClient, email: event.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-now-blue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-now-blue-light mb-1">Téléphone</label>
                    <input
                      value={editingClient.telephone ?? ''}
                      onChange={(event) => setEditingClient({ ...editingClient, telephone: event.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-now-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-now-blue-light mb-1">WhatsApp</label>
                    <input
                      value={editingClient.whatsapp ?? ''}
                      onChange={(event) => setEditingClient({ ...editingClient, whatsapp: event.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-now-blue"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-now-blue-light mb-1">Profil</label>
                    <select
                      value={editingClient.profil}
                      onChange={(event) => setEditingClient({ ...editingClient, profil: event.target.value as Client['profil'] })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-now-blue"
                    >
                      <option value="particulier informel">Particulier informel</option>
                      <option value="professionnel">Professionnel</option>
                      <option value="corporate">Corporate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-now-blue-light mb-1">Secteur</label>
                    <input
                      value={editingClient.secteur ?? ''}
                      onChange={(event) => setEditingClient({ ...editingClient, secteur: event.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-now-blue"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-now-blue-light mb-1">Retards précédents</label>
                  <input
                    type="number"
                    min={0}
                    value={editingClient.retards_precedents ?? 0}
                    onChange={(event) => setEditingClient({ ...editingClient, retards_precedents: Number(event.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-now-blue"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingClient(null)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-bold text-now-blue bg-now-yellow rounded-xl hover:bg-now-yellow-hover"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-5 text-sm text-slate-700">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-now-blue-light">Nom</p>
                  <p className="mt-1 font-semibold text-now-blue">{selectedClient?.nom}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-now-blue-light">Téléphone</p>
                    <p className="mt-1">{selectedClient?.telephone || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-now-blue-light">WhatsApp</p>
                    <p className="mt-1">{selectedClient?.whatsapp || 'Non renseigné'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-now-blue-light">Profil</p>
                    <p className="mt-1">{formatProfile(selectedClient?.profil)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-now-blue-light">Secteur</p>
                    <p className="mt-1">{selectedClient?.secteur || 'Non renseigné'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-now-blue-light">Email</p>
                  <p className="mt-1">{selectedClient?.email || 'Non renseigné'}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-now-blue-light">Retards précédents</p>
                  <p className={`mt-1 font-bold ${selectedClient && selectedClient.retards_precedents > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                    {selectedClient?.retards_precedents ?? 0}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedClient) setEditingClient(selectedClient)
                  }}
                  className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-now-yellow px-4 py-3 font-bold text-now-blue hover:bg-now-yellow-hover"
                >
                  <PencilLine className="h-4 w-4" />
                  Modifier le client
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
