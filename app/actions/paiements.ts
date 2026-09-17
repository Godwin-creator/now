'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type PaiementResponse = {
  success: boolean;
  error?: string;
}

export async function marquerCommePayee(factureId: string, montant: number): Promise<PaiementResponse> {
  try {
    const supabase = await createClient()

    // 1. Vérification de la session utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: false, 
        error: "Session expirée. Veuillez vous reconnecter." 
      }
    }

    if (!factureId) {
      return { success: false, error: "Identifiant de facture manquant." }
    }

    const montantPaye = Math.max(0, Number(montant) || 0)

    // 2. Mettre à jour le statut de la facture à 'payee'
    const { error: updateError } = await supabase
      .from('factures')
      .update({ statut: 'payee' })
      .eq('id', factureId)
      .eq('company_id', user.id)

    if (updateError) {
      console.error("Erreur lors de la mise à jour de la facture :", updateError)
      return { 
        success: false, 
        error: updateError.message || "Impossible de marquer la créance comme payée." 
      }
    }

    // 3. Enregistrer l'entrée dans la table paiements
    const { error: insertPaiementError } = await supabase
      .from('paiements')
      .insert({
        facture_id: factureId,
        montant_paye: montantPaye,
        date_paiement: new Date().toISOString()
      })

    if (insertPaiementError) {
      console.error("Erreur lors de l'enregistrement du paiement :", insertPaiementError)
      // On prévient mais la facture a bien été marquée payée
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: unknown) {
    console.error("Erreur serveur inattendue dans marquerCommePayee:", err)
    const message = err instanceof Error ? err.message : "Une erreur inattendue est survenue."
    return { success: false, error: message }
  }
}
