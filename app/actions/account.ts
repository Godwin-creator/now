'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { failure, success, type Result } from '@/lib/auth/result'
import { soldeRestant, statutFacture } from '@/lib/domain'
import { deleteAccountSchema } from '@/lib/validation/auth'
import { deleteAuthUser } from '@/lib/supabase/admin'
import { createClient } from '@/utils/supabase/server'

export async function updateDigestPreference(enabled: boolean): Promise<Result<null>> {
  const user = await requireUser()
  const parsed = z.boolean().safeParse(enabled)
  if (!parsed.success) return failure('VALIDATION', 'Préférence de récapitulatif invalide.')
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('companies')
      .update({ digest_actif: parsed.data })
      .eq('id', user.id)
      .select('id')
      .maybeSingle()
    if (error || !data) return failure('DATABASE', 'La préférence n’a pas pu être enregistrée.')
    revalidatePath('/dashboard/parametres')
    return success(null)
  } catch {
    return failure('UNAVAILABLE', 'La préférence est temporairement indisponible.')
  }
}

export async function deleteAccount(confirmation: string): Promise<Result<null>> {
  const user = await requireUser()
  const parsed = deleteAccountSchema.safeParse({ confirmation })
  if (!parsed.success) return failure('VALIDATION', 'Saisissez le nom exact de votre entreprise.')

  try {
    const supabase = await createClient()
    const { data: company, error: companyError } = await supabase
      .from('companies').select('nom').eq('id', user.id).maybeSingle()
    if (companyError || !company) return failure('DATABASE', 'Impossible de vérifier votre entreprise.')
    if (parsed.data.confirmation !== company.nom) {
      return failure('VALIDATION', 'Le nom saisi ne correspond pas au nom de votre entreprise.')
    }

    const deletion = await deleteAuthUser(user.id)
    if (deletion.error) return failure('DATABASE', 'La suppression du compte a échoué. Réessayez.')

    await supabase.auth.signOut({ scope: 'local' })
    return success(null)
  } catch {
    return failure('UNAVAILABLE', 'La suppression du compte est temporairement indisponible.')
  }
}

function csvCell(value: string | number | null): string {
  const text = value === null ? '' : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

export async function exportCreancesCsv(): Promise<Result<{ csv: string }>> {
  const user = await requireUser()
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('factures')
      .select('numero, montant_fcfa, date_service, date_echeance, statut, canal_contact, clients(nom, email, telephone, whatsapp), paiements(montant_paye)')
      .eq('company_id', user.id)
      .order('date_echeance', { ascending: true })
    if (error) return failure('DATABASE', 'Impossible de préparer l’export des créances.')

    const rows = data.map((invoice) => {
      const paid = invoice.paiements.reduce((total, payment) => total + payment.montant_paye, 0)
      const balance = soldeRestant(invoice.montant_fcfa, invoice.paiements.map((payment) => payment.montant_paye))
      const status = statutFacture(invoice.montant_fcfa, invoice.paiements.map((payment) => payment.montant_paye), invoice.statut === 'annulee')
      const client = invoice.clients
      return [
        invoice.numero, client?.nom ?? '', client?.email ?? '', client?.telephone ?? '', client?.whatsapp ?? '',
        invoice.montant_fcfa, paid, balance, invoice.date_service, invoice.date_echeance, status, invoice.canal_contact,
      ]
    })
    const header = ['Facture', 'Client', 'E-mail', 'Téléphone', 'WhatsApp', 'Montant FCFA', 'Payé FCFA', 'Solde FCFA', 'Date du service', 'Échéance', 'Statut', 'Canal']
    const csv = `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n')}`
    return success({ csv })
  } catch {
    return failure('UNAVAILABLE', 'L’export des créances est temporairement indisponible.')
  }
}
