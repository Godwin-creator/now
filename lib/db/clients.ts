import { failure, success, type Result } from '@/lib/auth/result'
import type { ClientUpdateInput } from '@/lib/validation/schemas'
import { createClient } from '@/utils/supabase/server'
import type { Client } from '@/types'

export async function updateClient(
  companyId: string,
  clientId: string,
  input: ClientUpdateInput,
): Promise<Result<Client>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('clients')
      .update({
        nom: input.nom,
        email: input.email,
        telephone: input.telephone || null,
        whatsapp: input.whatsapp || null,
        profil: input.profil,
        secteur: input.secteur || null,
      })
      .eq('id', clientId)
      .eq('company_id', companyId)
      .select('*')
      .maybeSingle()

    if (error) return failure('DATABASE', 'Impossible de mettre à jour ce client.')
    if (!data) return failure('NOT_FOUND', 'Client introuvable dans votre entreprise.')
    return success(data)
  } catch {
    return failure('DATABASE', 'Impossible de mettre à jour ce client.')
  }
}