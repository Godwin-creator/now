'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { failure, type Result } from '@/lib/auth/result'
import { soldeRestant, statutFacture } from '@/lib/domain'
import { deleteRecentPayment, getPaymentState, insertPayment } from '@/lib/db/paiements'
import { paymentIdSchema, paymentSchema } from '@/lib/validation/schemas'

export async function enregistrerPaiement(
  factureId: string,
  montant: number,
  date: string,
): Promise<Result<{ id: string }>> {
  const user = await requireUser()
  const parsed = paymentSchema.safeParse({ factureId, montant, date })
  if (!parsed.success) return failure('VALIDATION', 'Le paiement doit avoir un montant positif et une date valide.')

  try {
    const state = await getPaymentState(user.id, parsed.data.factureId)
    if (!state.ok) return state

    const status = statutFacture(state.data.montantFacture, state.data.paiements, state.data.annulee)
    if (status === 'annulee') return failure('INVALID_STATE', 'Une facture annulée ne peut pas recevoir de paiement.')
    if (status === 'payee') return failure('ALREADY_PAID', 'Cette facture est déjà soldée.')

    const solde = soldeRestant(state.data.montantFacture, state.data.paiements)
    if (parsed.data.montant > solde) {
      return failure('PAYMENT_EXCEEDS_BALANCE', 'Le paiement dépasse le solde restant dû.')
    }
    const inserted = await insertPayment(user.id, parsed.data.factureId, parsed.data.montant, parsed.data.date)
    if (!inserted.ok) return inserted

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/creances')
    revalidatePath('/dashboard/historique')
    return inserted
  } catch {
    return failure('DATABASE', 'Le paiement n’a pas pu être vérifié ou enregistré.')
  }
}

export async function annulerPaiement(paymentId: unknown): Promise<Result<null>> {
  const user = await requireUser()
  const parsed = paymentIdSchema.safeParse(paymentId)
  if (!parsed.success) return failure('VALIDATION', 'Identifiant de paiement invalide.')
  try {
    const result = await deleteRecentPayment(user.id, parsed.data)
    if (!result.ok) return result
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/creances')
    revalidatePath('/dashboard/historique')
    return result
  } catch {
    return failure('DATABASE', 'Le paiement n’a pas pu être annulé.')
  }
}
