import { hasDuplicateClientName } from '@/lib/domain'
import { failure, success, type Result } from '@/lib/auth/result'
import type { CreanceFormInput } from '@/lib/validation/schemas'
import { createClient } from '@/utils/supabase/server'

export async function createCreance(
  companyId: string,
  input: CreanceFormInput,
  montantFcfa: number,
  dateEcheance: string,
): Promise<Result<null>> {
  const supabase = await createClient()
  let clientId = input.clientId
  let createdClientId: string | null = null

  if (input.isNewClient === 'true') {
    const { data: clients, error: findError } = await supabase
      .from('clients')
      .select('id, nom')
      .eq('company_id', companyId)
    if (findError) return failure('DATABASE', 'Impossible de vérifier les clients existants.')

    if (hasDuplicateClientName(input.clientName ?? '', clients.map((client) => client.nom))) {
      return failure('DUPLICATE_CLIENT', 'Un client portant ce nom existe déjà. Sélectionnez sa fiche existante.')
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        company_id: companyId,
        nom: input.clientName ?? '',
        email: input.email || null,
        telephone: input.telephone || null,
        whatsapp: input.whatsapp || null,
        profil: input.profile,
        secteur: input.secteur || 'Services',
      })
      .select('id')
      .single()

    if (clientError || !client) return failure('DATABASE', 'Impossible d’enregistrer le client.')
    clientId = client.id
    createdClientId = client.id
  }

  if (!clientId) return failure('VALIDATION', 'Sélectionnez un client existant.')

  const { data: ownedClient, error: ownerError } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('company_id', companyId)
    .maybeSingle()
  if (ownerError || !ownedClient) {
    if (createdClientId) await supabase.from('clients').delete().eq('id', createdClientId).eq('company_id', companyId)
    return failure('NOT_FOUND', 'Le client sélectionné est introuvable.')
  }

  const { error: invoiceError } = await supabase.from('factures').insert({
    company_id: companyId,
    client_id: clientId,
    montant_fcfa: montantFcfa,
    date_service: input.serviceDate,
    date_echeance: dateEcheance,
    delai_paiement_jours: Number(input.paymentDelay || '30'),
    type_relation: input.relation,
    canal_contact: input.channel,
    statut: 'en_attente',
  })

  if (invoiceError) {
    if (createdClientId) await supabase.from('clients').delete().eq('id', createdClientId).eq('company_id', companyId)
    return failure('DATABASE', 'Impossible d’enregistrer la créance.')
  }
  return success(null)
}