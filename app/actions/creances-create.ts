'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { failure, type Result } from '@/lib/auth/result'
import { addDays, parseFcfa } from '@/lib/domain'
import { createCreance as createCreanceRepository } from '@/lib/db/creances'
import { creanceFormSchema } from '@/lib/validation/schemas'

function formString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

export async function creerCreance(formData: FormData): Promise<Result<null>> {
  const user = await requireUser()
  const parsed = creanceFormSchema.safeParse({
    isNewClient: formString(formData, 'isNewClient') || 'false',
    clientId: formString(formData, 'client_id') || undefined,
    clientName: formString(formData, 'nom_client') || undefined,
    amount: formString(formData, 'montant_fcfa') || formString(formData, 'montant'),
    serviceDate: formString(formData, 'date_service'),
    paymentDelay: formString(formData, 'delai_paiement_jours') || undefined,
    profile: formString(formData, 'profil') || 'professionnel',
    relation: formString(formData, 'type_relation') || 'regulier',
    channel: formString(formData, 'canal_contact') || 'whatsapp',
    email: formString(formData, 'email') || undefined,
    telephone: formString(formData, 'telephone') || undefined,
    whatsapp: formString(formData, 'whatsapp') || undefined,
    secteur: formString(formData, 'secteur') || undefined,
  })
  if (!parsed.success) return failure('VALIDATION', parsed.error.issues[0]?.message ?? 'Vérifiez les champs de la créance.')

  const montant = parseFcfa(parsed.data.amount)
  if (montant === null || montant <= 0) return failure('VALIDATION', 'Le montant doit être un entier positif en FCFA.')

  try {
    const dateEcheance = addDays(parsed.data.serviceDate, Number(parsed.data.paymentDelay || '30'))
    const result = await createCreanceRepository(user.id, parsed.data, montant, dateEcheance)
    if (!result.ok) return result
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/clients')
    return result
  } catch {
    return failure('DATABASE', 'Impossible d’enregistrer la créance. Réessayez.')
  }
}