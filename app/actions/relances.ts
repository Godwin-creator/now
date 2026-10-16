'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { failure, type Result } from '@/lib/auth/result'
import { generateRelance } from '@/lib/ai/relance'
import { canalEffectif, daysBetween, enrichirCreances, type LigneCreance } from '@/lib/domain'
import { consumeAiQuota } from '@/lib/db/ai-usage'
import { getRelanceContext, insertRelance, updateRelanceStatus } from '@/lib/db/relances'
import { relanceIdSchema, relanceRequestSchema } from '@/lib/validation/schemas'

export interface GenererRelanceData {
  message: string
  relanceId: string
  canalUtilise: string
  source: 'ia' | 'template'
  client: { nom: string; whatsapp: string | null; telephone: string | null; email: string | null; profil: string }
}

export async function genererRelance(input: unknown): Promise<Result<GenererRelanceData>> {
  const user = await requireUser()
  const parsed = relanceRequestSchema.safeParse(input)
  if (!parsed.success) return failure('VALIDATION', 'Les paramètres de relance sont invalides.')

  try {
    const quota = await consumeAiQuota('generation', 15, 60)
    if (!quota.ok) return quota

    const context = await getRelanceContext(user.id, parsed.data.factureId)
    if (!context.ok) return context
    const { facture } = context.data
    if (!facture.clients) return failure('NOT_FOUND', 'Le client de cette facture est introuvable.')

    const client = facture.clients
    const selectedChannel = parsed.data.canal ?? facture.canal_contact
    const channel = canalEffectif(selectedChannel, {
    whatsapp: client.whatsapp,
    telephone: client.telephone,
    email: client.email,
  })
    if (!channel.canal) return failure('MISSING_CONTACT', 'Aucune coordonnée ne permet de contacter ce client.')

    const today = new Date().toISOString().slice(0, 10)
    const previousRows: LigneCreance[] = context.data.precedentes.map((previous) => ({
    id: previous.id,
    client_id: previous.client_id,
    date_echeance: previous.date_echeance,
    montant_fcfa: previous.montant_fcfa,
    statut: previous.statut,
    canal_contact: previous.canal_contact,
    paiements: previous.paiements,
  }))
    const currentRow: LigneCreance = {
    id: facture.id,
    client_id: facture.client_id,
    date_echeance: facture.date_echeance,
    montant_fcfa: facture.montant_fcfa,
    statut: facture.statut,
    canal_contact: facture.canal_contact,
    clients: {
      nom: client.nom,
      profil: client.profil,
      email: client.email,
      telephone: client.telephone,
      whatsapp: client.whatsapp,
    },
    paiements: context.data.paiements,
    relances: context.data.relances,
  }
    const enriched = enrichirCreances(
    [...previousRows, currentRow],
    today,
    facture.companies?.seuil_montant_eleve ?? 200_000,
  ).at(-1)
    if (!enriched) return failure('INVALID_INVOICE', 'Le score de cette facture n’a pas pu être calculé.')

    const generated = await generateRelance({
    entreprise: facture.companies?.nom || 'Notre entreprise',
    client: client.nom,
    montantSolde: enriched.solde_restant,
    joursRetard: Math.max(0, daysBetween(facture.date_echeance, today)),
    ton: parsed.data.ton ?? 'factuel',
    canal: channel.canal,
    numeroFacture: facture.numero,
    dateEcheance: facture.date_echeance,
  }, enriched.niveau)
    const message = generated.output.objet
    ? `Objet : ${generated.output.objet}\n\n${generated.output.corps}`
    : generated.output.corps

    const saved = await insertRelance({
    companyId: user.id,
    factureId: facture.id,
    canal: channel.canal,
    message,
    source: generated.source,
  })
    if (!saved.ok) return saved

    revalidatePath('/dashboard/historique')
    revalidatePath('/dashboard')
    return {
      ok: true,
      data: {
        message,
        relanceId: saved.data.id,
        canalUtilise: channel.canal,
        source: generated.source,
        client: {
          nom: client.nom,
          whatsapp: client.whatsapp,
          telephone: client.telephone,
          email: client.email,
          profil: client.profil,
        },
      },
    }
  } catch {
    return failure('UNAVAILABLE', 'La génération de relance est temporairement indisponible.')
  }
}

async function updateRelance(relanceId: unknown, status: 'copiee' | 'envoyee'): Promise<Result<null>> {
  const user = await requireUser()
  const parsed = relanceIdSchema.safeParse(relanceId)
  if (!parsed.success) return failure('VALIDATION', 'Identifiant de relance invalide.')
  try {
    const result = await updateRelanceStatus(user.id, parsed.data, status)
    if (!result.ok) return result
    revalidatePath('/dashboard/historique')
    revalidatePath('/dashboard')
    return result
  } catch {
    return failure('DATABASE', 'Le statut de la relance n’a pas pu être enregistré.')
  }
}

export async function marquerRelanceEnvoyee(relanceId: unknown): Promise<Result<null>> {
  return updateRelance(relanceId, 'envoyee')
}

export async function marquerRelanceCopiee(relanceId: unknown): Promise<Result<null>> {
  return updateRelance(relanceId, 'copiee')
}