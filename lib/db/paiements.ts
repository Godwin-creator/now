import { failure, success, type Result } from '@/lib/auth/result'
import { createClient } from '@/utils/supabase/server'

export interface PaymentState {
  montantFacture: number
  paiements: number[]
  annulee: boolean
}

export async function getPaymentState(companyId: string, factureId: string): Promise<Result<PaymentState>> {
  const supabase = await createClient()
  const { data: facture, error: factureError } = await supabase
    .from('factures')
    .select('id, montant_fcfa, statut')
    .eq('id', factureId)
    .eq('company_id', companyId)
    .maybeSingle()
  if (factureError || !facture) return failure('NOT_FOUND', 'Facture introuvable.')

  const { data: paiements, error: paiementsError } = await supabase
    .from('paiements')
    .select('montant_paye')
    .eq('facture_id', factureId)
    .eq('company_id', companyId)
  if (paiementsError) return failure('DATABASE', 'Impossible de vérifier les paiements existants.')

  return success({
    montantFacture: facture.montant_fcfa,
    paiements: paiements.map((paiement) => paiement.montant_paye),
    annulee: facture.statut === 'annulee',
  })
}

export async function insertPayment(
  companyId: string,
  factureId: string,
  montant: number,
  date: string,
): Promise<Result<null>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('paiements')
    .insert({ company_id: companyId, facture_id: factureId, montant_paye: montant, date_paiement: date })
    .select('id')
    .single()
  if (error || !data) return failure('DATABASE', 'Le paiement n’a pas pu être enregistré.')
  return success(null)
}