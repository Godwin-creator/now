'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type CreanceImportPayload = {
  nom: string
  telephone: string
  montant_fcfa: number
  date_service: string
}

export type ImportCsvResponse = {
  success: boolean
  count?: number
  error?: string
}

// Logique de Scoring conforme au Cahier des charges
function calculerScoreRisque(
  joursRetard: number,
  montant: number,
  retardsPrecedents: number,
  profil: string,
  relation: string
) {
  const maxMontant = 5000000
  const penaliteProfil = (profil === 'particulier informel' || relation === 'difficile') ? 15 : 0
  const retardsPoints = Math.min((retardsPrecedents || 0) * 10, 30) // Max 30 pts

  let score = (joursRetard / 90) * 40 + (montant / maxMontant) * 30 + retardsPoints + penaliteProfil
  score = Math.min(Math.max(score, 0), 100) // Plafonner entre 0 et 100

  let niveau: 'Faible' | 'Moyen' | 'Élevé' | 'Critique' = 'Faible'
  if (score > 85) {
    niveau = 'Critique'
  } else if (score > 66) {
    niveau = 'Élevé'
  } else if (score > 33) {
    niveau = 'Moyen'
  }

  return { score: Math.round(score), niveau }
}

export async function importerCreances(payload: CreanceImportPayload[]): Promise<ImportCsvResponse> {
  try {
    const supabase = await createClient()

    // 1. Vérification de la session utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: "Session expirée. Veuillez vous reconnecter pour importer des créances."
      }
    }

    if (!payload || payload.length === 0) {
      return {
        success: false,
        error: "Le tableau de données est vide."
      }
    }

    // ÉTAPE 1 : Lecture & Indexation
    const { data: clientsExistants, error: clientsError } = await supabase
      .from('clients')
      .select('id, nom, telephone, retards_precedents, profil')
      .eq('company_id', user.id)

    if (clientsError) {
      return { success: false, error: "Erreur lors de la lecture des clients existants." }
    }

    // Map nom_minuscule -> client et telephone -> client
    const clientMap = new Map<string, any>()
    for (const c of clientsExistants || []) {
      if (c.nom) clientMap.set(c.nom.toLowerCase().trim(), c)
      if (c.telephone) {
         const telClean = c.telephone.replace(/[^0-9]/g, '')
         if (telClean) clientMap.set(telClean, c)
      }
    }

    // Identifier les nouveaux clients à insérer
    const newClientsToInsert = []
    const processedNewClientKeys = new Set<string>()

    for (const row of payload) {
      const nomTrimmed = row.nom.trim().toLowerCase()
      const telClean = (row.telephone || '').replace(/[^0-9]/g, '')
      
      let found = clientMap.get(nomTrimmed)
      if (!found && telClean) found = clientMap.get(telClean)

      if (!found) {
        // C'est un nouveau client, on l'ajoute à la liste d'insertion (si pas déjà ajouté)
        const key = nomTrimmed + '|' + telClean
        if (!processedNewClientKeys.has(key)) {
           newClientsToInsert.push({
             company_id: user.id,
             nom: row.nom.trim(),
             telephone: row.telephone ? row.telephone.trim() : null,
             whatsapp: row.telephone ? row.telephone.trim() : null,
             profil: 'professionnel',
             secteur: 'Services',
             retards_precedents: 0
           })
           processedNewClientKeys.add(key)
        }
      }
    }

    // ÉTAPE 2 : Bulk Insert Clients
    if (newClientsToInsert.length > 0) {
      const { data: insertedClients, error: insertError } = await supabase
        .from('clients')
        .insert(newClientsToInsert)
        .select('id, nom, telephone, retards_precedents, profil')
      
      if (insertError) {
        return { success: false, error: "Erreur lors de l'insertion en lot des nouveaux clients." }
      }

      // Mettre à jour la Map avec les nouveaux IDs
      for (const c of insertedClients || []) {
        if (c.nom) clientMap.set(c.nom.toLowerCase().trim(), c)
        if (c.telephone) {
           const telClean = c.telephone.replace(/[^0-9]/g, '')
           if (telClean) clientMap.set(telClean, c)
        }
      }
    }

    // ÉTAPE 3 : Bulk Insert Factures
    const facturesToInsert = []
    const maintenant = new Date()

    for (const row of payload) {
      const nomTrimmed = row.nom.trim().toLowerCase()
      const telClean = (row.telephone || '').replace(/[^0-9]/g, '')
      
      let clientObj = clientMap.get(nomTrimmed)
      if (!clientObj && telClean) clientObj = clientMap.get(telClean)

      if (!clientObj || !clientObj.id) continue // Sécurité

      const dateService = new Date(row.date_service)
      const dateEcheance = new Date(dateService)
      dateEcheance.setDate(dateEcheance.getDate() + 30) // Délai par défaut : 30 jours

      const diffTemps = maintenant.getTime() - dateEcheance.getTime()
      const joursRetard = Math.max(0, Math.floor(diffTemps / (1000 * 3600 * 24)))

      const { score, niveau } = calculerScoreRisque(
        joursRetard,
        row.montant_fcfa,
        Number(clientObj.retards_precedents) || 0,
        clientObj.profil || 'professionnel',
        'regulier'
      )

      facturesToInsert.push({
        company_id: user.id,
        client_id: clientObj.id,
        montant_fcfa: row.montant_fcfa,
        date_service: dateService.toISOString(),
        date_echeance: dateEcheance.toISOString(),
        delai_paiement_jours: 30,
        type_relation: 'regulier',
        canal_contact: row.telephone ? 'whatsapp' : 'email',
        score_risque: score,
        niveau_risque: niveau,
        statut: 'en_attente'
      })
    }

    if (facturesToInsert.length === 0) {
      return { success: false, error: "Aucune facture valide n'a pu être construite." }
    }

    const { error: facturesError } = await supabase
      .from('factures')
      .insert(facturesToInsert)

    if (facturesError) {
      return { success: false, error: "Erreur lors de l'insertion en lot des factures." }
    }

    // ÉTAPE 4 : Revalidation et Réponse
    revalidatePath('/dashboard')

    return {
      success: true,
      count: facturesToInsert.length
    }

  } catch (err: unknown) {
    console.error("Erreur importerCreances:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur inattendue lors de l'import."
    }
  }
}
