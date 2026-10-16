import { normalizeClientName } from '@/lib/domain'
import { failure, success, type Result } from '@/lib/auth/result'
import { createClient } from '@/utils/supabase/server'

export interface ImportInvoice {
  nom: string
  telephone: string
  montantFcfa: number
  dateService: string
  dateEcheance: string
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export async function importCreances(
  companyId: string,
  rows: readonly ImportInvoice[],
): Promise<Result<{ count: number }>> {
  const supabase = await createClient()
  const { data: existingClients, error: clientsError } = await supabase
    .from('clients')
    .select('id, nom, telephone')
    .eq('company_id', companyId)
  if (clientsError) return failure('DATABASE', 'Impossible de lire les clients de l’entreprise.')

  const clientByName = new Map<string, string>()
  const clientByPhone = new Map<string, string>()
  for (const client of existingClients) {
    clientByName.set(normalizeClientName(client.nom), client.id)
    if (client.telephone) clientByPhone.set(normalizePhone(client.telephone), client.id)
  }

  const clientsToInsert = new Map<string, { company_id: string; nom: string; telephone: string | null; whatsapp: string | null; profil: string; secteur: string }>()
  for (const row of rows) {
    const name = normalizeClientName(row.nom)
    const phone = normalizePhone(row.telephone)
    if (clientByName.has(name) || (phone && clientByPhone.has(phone)) || clientsToInsert.has(name)) continue
    clientsToInsert.set(name, {
      company_id: companyId,
      nom: row.nom.trim(),
      telephone: row.telephone || null,
      whatsapp: row.telephone || null,
      profil: 'professionnel',
      secteur: 'Services',
    })
  }

  if (clientsToInsert.size > 0) {
    const { data, error } = await supabase
      .from('clients')
      .insert([...clientsToInsert.values()])
      .select('id, nom, telephone')
    if (error || !data) return failure('DATABASE', 'Impossible d’enregistrer les nouveaux clients.')
    for (const client of data) {
      clientByName.set(normalizeClientName(client.nom), client.id)
      if (client.telephone) clientByPhone.set(normalizePhone(client.telephone), client.id)
    }
  }

  const invoices = rows.flatMap((row) => {
    const clientId = clientByName.get(normalizeClientName(row.nom)) ?? clientByPhone.get(normalizePhone(row.telephone))
    if (!clientId) return []
    return [{
      company_id: companyId,
      client_id: clientId,
      montant_fcfa: row.montantFcfa,
      date_service: row.dateService,
      date_echeance: row.dateEcheance,
      delai_paiement_jours: 30,
      type_relation: 'regulier',
      canal_contact: row.telephone ? 'whatsapp' : 'email',
      statut: 'en_attente',
    }]
  })
  if (invoices.length !== rows.length) return failure('DATABASE', 'Un client de l’import n’a pas pu être associé.')

  const { error: invoiceError } = await supabase.from('factures').insert(invoices)
  if (invoiceError) return failure('DATABASE', 'Impossible d’enregistrer les factures importées.')
  return success({ count: invoices.length })
}