'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { failure } from '@/lib/auth/result'
import { updateClient as updateClientRepository } from '@/lib/db/clients'
import { clientUpdateSchema } from '@/lib/validation/schemas'

export async function updateClient(input: unknown) {
  const user = await requireUser()
  const parsed = clientUpdateSchema.safeParse(input)
  if (!parsed.success) return failure('VALIDATION', 'Vérifiez les informations du client.')

  try {
    const result = await updateClientRepository(user.id, parsed.data.id, parsed.data)
    if (!result.ok) return result
    revalidatePath('/dashboard/clients')
    revalidatePath('/dashboard')
    return result
  } catch {
    return failure('DATABASE', 'Impossible de mettre à jour le client. Réessayez.')
  }
}