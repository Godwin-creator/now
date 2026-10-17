import { enrichirCreances } from '@/lib/domain'
import { buildDailyDigestEmail, sendEmail } from '@/lib/mail'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const siteUrl = process.env.SITE_URL
  if (!siteUrl) return Response.json({ error: 'Configuration du site manquante.' }, { status: 500 })

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return Response.json({ error: 'Configuration de la base de données manquante.' }, { status: 500 })
  }

  const { data: companies, error: companiesError } = await admin
    .from('companies')
    .select('id, nom, email, seuil_montant_eleve')
    .eq('digest_actif', true)
    .order('nom', { ascending: true })

  if (companiesError) return Response.json({ error: 'Impossible de charger les comptes.' }, { status: 500 })

  const today = new Date().toISOString().slice(0, 10)
  let sent = 0
  let skipped = 0
  let failed = 0

  for (const company of companies) {
    if (!company.email) {
      skipped += 1
      continue
    }

    try {
      const { data: invoices, error: invoicesError } = await admin
        .from('factures')
        .select('id, client_id, date_echeance, montant_fcfa, statut, canal_contact, clients(nom), paiements(montant_paye, date_paiement), relances(statut_envoi, envoyee_at, created_at)')
        .eq('company_id', company.id)

      if (invoicesError) throw new Error('Impossible de charger les créances.')
      const reminders = enrichirCreances(invoices, today, company.seuil_montant_eleve)
        .filter((invoice) => invoice.recommandation.aRelancerAujourdhui)
      if (reminders.length === 0) {
        skipped += 1
        continue
      }

      const email = buildDailyDigestEmail(
        reminders.map((invoice) => ({
          clientName: invoice.clients?.nom ?? 'Client sans nom',
          balance: invoice.solde_restant,
          daysLate: invoice.jours_retard,
          riskLevel: invoice.niveau,
        })),
        siteUrl,
      )
      await sendEmail({ ...email, to: company.email })
      sent += 1
    } catch {
      failed += 1
      console.error('Échec du récapitulatif quotidien pour une entreprise.', { companyId: company.id })
    }
  }

  return Response.json({ sent, skipped, failed })
}
