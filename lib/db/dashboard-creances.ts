import { failure, success, type Result } from '@/lib/auth/result'
import { enrichirCreances, type CreanceEnrichie } from '@/lib/domain'
import { createClient } from '@/utils/supabase/server'

export async function getDashboardCreances(
  companyId: string,
  today: string,
): Promise<Result<CreanceEnrichie[]>> {
  try {
    const supabase = await createClient()
    const [facturesResult, paiementsResult, relancesResult] = await Promise.all([
      supabase.from('factures').select('*, clients(*), companies(*)').eq('company_id', companyId).order('date_echeance'),
      supabase.from('paiements').select('*').eq('company_id', companyId),
      supabase.from('relances').select('*').eq('company_id', companyId),
    ])

    if (facturesResult.error || paiementsResult.error || relancesResult.error) {
      return failure('DATABASE', 'Impossible de charger les créances pour le moment.')
    }

    const invoices = facturesResult.data.map((invoice) => ({
      ...invoice,
      paiements: paiementsResult.data.filter((payment) => payment.facture_id === invoice.id),
      relances: relancesResult.data.filter((reminder) => reminder.facture_id === invoice.id),
    }))
    const threshold = facturesResult.data[0]?.companies?.seuil_montant_eleve ?? 200_000
    return success(enrichirCreances(invoices, today, threshold))
  } catch {
    return failure('DATABASE', 'Impossible de charger les créances pour le moment.')
  }
}