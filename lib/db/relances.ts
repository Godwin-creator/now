import { failure, success, type Result } from '@/lib/auth/result'
import { createClient } from '@/utils/supabase/server'

export async function getRelanceContext(companyId: string, factureId: string) {
  const supabase = await createClient()
  const { data: facture, error: factureError } = await supabase
    .from('factures')
    .select('*, clients(*), companies(*)')
    .eq('id', factureId)
    .eq('company_id', companyId)
    .maybeSingle()

  if (factureError || !facture) return failure('NOT_FOUND', 'Facture introuvable.')

  const [paiementsResult, relancesResult, precedentesResult] = await Promise.all([
    supabase.from('paiements')
      .select('montant_paye, date_paiement')
      .eq('facture_id', factureId)
      .eq('company_id', companyId),
    supabase.from('relances')
      .select('id, canal, statut_envoi, envoyee_at, created_at')
      .eq('facture_id', factureId)
      .eq('company_id', companyId),
    supabase.from('factures')
      .select('*, paiements(montant_paye, date_paiement)')
      .eq('client_id', facture.client_id)
      .eq('company_id', companyId)
      .lt('date_echeance', facture.date_echeance),
  ])

  if (paiementsResult.error || relancesResult.error || precedentesResult.error) {
    return failure('DATABASE', 'Impossible de charger le dossier de relance.')
  }

  return success({
    facture,
    paiements: paiementsResult.data,
    relances: relancesResult.data,
    precedentes: precedentesResult.data,
  })
}

export async function insertRelance(input: {
  companyId: string
  factureId: string
  canal: string
  message: string
  source: 'ia' | 'template'
}): Promise<Result<{ id: string }>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('relances')
    .insert({
      company_id: input.companyId,
      facture_id: input.factureId,
      canal: input.canal,
      message_genere: input.message,
      source: input.source,
      statut_envoi: 'generee',
    })
    .select('id')
    .single()
  if (error || !data) return failure('DATABASE', 'La relance n’a pas pu être enregistrée.')
  return success(data)
}

export async function updateRelanceStatus(
  companyId: string,
  relanceId: string,
  status: 'copiee' | 'envoyee',
): Promise<Result<null>> {
  const supabase = await createClient()
  const update = status === 'envoyee'
    ? supabase.from('relances').update({ statut_envoi: status, envoyee_at: new Date().toISOString() })
    : supabase.from('relances').update({ statut_envoi: status })
  const query = update.eq('id', relanceId).eq('company_id', companyId)
  const result = status === 'envoyee'
    ? await query.in('statut_envoi', ['generee', 'copiee']).select('id').maybeSingle()
    : await query.in('statut_envoi', ['generee', 'copiee']).select('id').maybeSingle()
  if (result.error) return failure('DATABASE', 'Le statut de la relance n’a pas pu être mis à jour.')
  if (!result.data) return failure('INVALID_STATE', 'Cette relance ne peut plus changer de statut.')
  return success(null)
}