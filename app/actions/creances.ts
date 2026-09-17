'use server'

import { createClient } from '@/utils/supabase/server'
import { GoogleGenAI } from '@google/genai'
import { revalidatePath } from 'next/cache'

// Logique de Scoring conforme au Cahier des charges
// Formule : Score = (Jours retard / 90) × 40 + (Montant / Montant max) × 30 + (Retards précédents × 10) [max 30 pts] + penaliteProfil
function calculerScoreRisque(joursRetard: number, montant: number, retardsPrecedents: number, profil: string, relation: string) {
  const maxMontant = 5000000;
  const penaliteProfil = (profil === 'particulier informel' || relation === 'difficile') ? 15 : 0;
  
  const retardsPoints = Math.min((retardsPrecedents || 0) * 10, 30); // Max 30 pts
  let score = (joursRetard / 90) * 40 + (montant / maxMontant) * 30 + retardsPoints + penaliteProfil;
  score = Math.min(Math.max(score, 0), 100); // Plafonner strictement entre 0 et 100

  let niveau: 'Faible' | 'Moyen' | 'Élevé' | 'Critique' = 'Faible';
  if (score > 85) {
    niveau = 'Critique';
  } else if (score > 66) {
    niveau = 'Élevé';
  } else if (score > 33) {
    niveau = 'Moyen';
  }

  return { score: Math.round(score), niveau };
}

export type ActionResponse = {
  success: boolean;
  error?: string;
  message?: string;
}

export async function creerCreance(formData: FormData): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // 1. Vérification de la session utilisateur
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { 
        success: false, 
        error: "Session expirée. Veuillez vous reconnecter pour créer une créance." 
      }
    }

    const isNewClient = formData.get('isNewClient') === 'true'
    let clientId = formData.get('client_id') as string

    // Conversion sécurisée des valeurs numériques
    const retardsRaw = formData.get('retards_precedents')
    const retardsInput = Math.max(0, Number(retardsRaw) || 0)

    // 2. Création du client si nouveau client
    if (isNewClient) {
      const nomClient = String(formData.get('nom_client') || '').trim()
      if (!nomClient) {
        return { success: false, error: "Le nom du client est obligatoire." }
      }

      const { data: newClient, error: clientError } = await supabase.from('clients').insert({
        company_id: user.id,
        nom: nomClient,
        email: formData.get('email') ? String(formData.get('email')).trim() : null,
        whatsapp: formData.get('whatsapp') ? String(formData.get('whatsapp')).trim() : null,
        profil: String(formData.get('profil') || 'professionnel'),
        secteur: String(formData.get('secteur') || 'Services'),
        retards_precedents: retardsInput
      }).select().single()

      if (clientError || !newClient) {
        return { 
          success: false, 
          error: clientError?.message || "Erreur lors de l'enregistrement du nouveau client." 
        }
      }
      clientId = newClient.id
    } else {
      if (!clientId) {
        return { success: false, error: "Veuillez sélectionner un client existant." }
      }
    }

    // 3. Extraction et validation du montant (support montant_fcfa ou montant)
    const montantRaw = formData.get('montant_fcfa') || formData.get('montant')
    const montant = Math.max(0, Number(montantRaw) || 0)
    if (montant <= 0) {
      return { success: false, error: "Le montant de la créance doit être supérieur à 0 FCFA." }
    }

    // 4. Calculs des dates pour la facture
    const dateServiceStr = formData.get('date_service') as string
    if (!dateServiceStr) {
      return { success: false, error: "La date du service rendu est obligatoire." }
    }
    const dateService = new Date(dateServiceStr)
    if (isNaN(dateService.getTime())) {
      return { success: false, error: "La date du service rendu est invalide." }
    }
    
    // Date d'échéance = J+30 automatiquement selon le cahier des charges
    const dateEcheance = new Date(dateService)
    dateEcheance.setDate(dateEcheance.getDate() + 30)

    // Calcul des jours de retard réels par rapport à l'échéance
    const maintenant = new Date()
    const diffTemps = maintenant.getTime() - dateEcheance.getTime()
    const joursRetard = Math.max(0, Math.floor(diffTemps / (1000 * 3600 * 24)))
    
    // Récupérer les informations complètes du client pour le calcul du score
    const { data: client, error: fetchClientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (fetchClientError || !client) {
      return { 
        success: false, 
        error: "Client introuvable dans la base de données." 
      }
    }
    
    const { score, niveau } = calculerScoreRisque(
      joursRetard, 
      montant, 
      Number(client.retards_precedents) || 0, 
      client.profil || 'professionnel', 
      String(formData.get('type_relation') || 'regulier')
    )

    // 5. Insertion sécurisée de la facture
    const { error: factureError } = await supabase.from('factures').insert({
      company_id: user.id,
      client_id: clientId,
      montant_fcfa: montant,
      date_service: dateService.toISOString(),
      date_echeance: dateEcheance.toISOString(),
      type_relation: String(formData.get('type_relation') || 'regulier'),
      canal_contact: String(formData.get('canal_contact') || 'whatsapp'),
      score_risque: score,
      niveau_risque: niveau,
      statut: 'en_attente'
    })

    if (factureError) {
      return { 
        success: false, 
        error: factureError.message || "Erreur lors de l'enregistrement de la facture." 
      }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: unknown) {
    // Interception absolue de toutes les erreurs pour garantir un objet JSON simple et sérialisable
    console.error("Erreur serveur lors de creerCreance:", err)
    const message = err instanceof Error ? err.message : "Une erreur inattendue est survenue sur le serveur."
    return { success: false, error: message }
  }
}

export type RelanceResponse = {
  success: boolean;
  message?: string;
  relanceId?: string;
  client?: any;
  error?: string;
}

export async function genererMessageIA(factureId: string): Promise<RelanceResponse> {
  try {
    const supabase = await createClient()
    
    // Vérification de la session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Session expirée. Veuillez vous reconnecter." }
    }

    // Récupérer les données complètes de la facture
    const { data: facture, error: fetchError } = await supabase
      .from('factures')
      .select(`*, clients(*), companies(*)`)
      .eq('id', factureId)
      .single()

    if (fetchError || !facture) {
      return { success: false, error: "Facture introuvable." }
    }

    const dateEcheance = new Date(facture.date_echeance)
    const maintenant = new Date()
    const diffMs = maintenant.getTime() - dateEcheance.getTime()
    const joursRetard = Math.max(0, Math.floor(diffMs / (1000 * 3600 * 24)))

    const nomEntreprise = facture.companies?.nom || 'Notre entreprise'
    const nomClient = facture.clients?.nom || 'Cher client'

    // Ton de la relance selon le profil client et la relation
    let tonRecommande = 'Direct, courtois et professionnel'
    if (facture.clients?.profil === 'corporate') {
      tonRecommande = 'Très formel et institutionnel'
    } else if (facture.clients?.profil === 'particulier informel') {
      tonRecommande = 'Courtois, factuel et chaleureux'
    }

    // Formatting par canal
    let regleCanal = "Rédige un message intermédiaire avec formule de politesse."
    if (facture.canal_contact === 'sms') {
      regleCanal = "Fais un message très court et concis de 160 caractères maximum."
    } else if (facture.canal_contact === 'email') {
      regleCanal = "Structure le message avec un Objet clair, un corps poli et une formule de politesse."
    } else if (facture.canal_contact === 'whatsapp') {
      regleCanal = "Rédige un message WhatsApp lisible et structuré, direct sans fioritures."
    }

    // Prompt Engineering strict selon les règles du cahier des charges
    const prompt = `
Tu es l'assistant de relance et de recouvrement amiable de l'entreprise "${nomEntreprise}".

Règles strictes de rédaction :
- Rédige TOUJOURS au nom de l'entreprise en utilisant la première personne du pluriel ("Nous").
- N'utilise ABSOLUMENT AUCUN émoji.
- Ton recommandé : ${tonRecommande}.
- Canal cible : ${facture.canal_contact.toUpperCase()}. ${regleCanal}
- Niveau de risque estimé : ${facture.niveau_risque} (Score: ${facture.score_risque}/100).

Données du dossier :
- Nom du client : ${nomClient}
- Montant dû : ${Number(facture.montant_fcfa).toLocaleString('fr-FR')} FCFA
- Date d'échéance : ${dateEcheance.toLocaleDateString('fr-FR')} (${joursRetard} jour(s) de retard)
- Secteur client : ${facture.clients?.secteur || 'Non renseigné'}
- Entreprise émettrice : ${nomEntreprise}

Génère UNIQUEMENT le texte du message prêt à être copié et envoyé.
`

    let messageGenere = ""
    try {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey || apiKey.startsWith('AQ.') || apiKey.includes('placeholder')) {
        // Fallback professionnel si la clé Gemini n'est pas configurée
        if (facture.canal_contact === 'email') {
          messageGenere = `Objet : Relance — Règlement de facture d'un montant de ${Number(facture.montant_fcfa).toLocaleString('fr-FR')} FCFA

Madame, Monsieur,

Nous nous permettons de vous adresser ce message concernant notre facture d'un montant de ${Number(facture.montant_fcfa).toLocaleString('fr-FR')} FCFA, dont l'échéance est dépassée depuis le ${dateEcheance.toLocaleDateString('fr-FR')}.

Sauf erreur de notre part, ce règlement n'a pas encore été enregistré dans nos comptes. Nous vous serions reconnaissants de bien vouloir procéder au paiement dans les meilleurs délais, ou de nous contacter si vous souhaitez convenir d'un arrangement.

Nous restons à votre entière disposition pour tout renseignement complémentaire.

Cordialement,
${nomEntreprise}`
        } else {
          messageGenere = `Bonjour ${nomClient}, nous vous contactons concernant la facture de ${Number(facture.montant_fcfa).toLocaleString('fr-FR')} FCFA échue le ${dateEcheance.toLocaleDateString('fr-FR')}. Sauf erreur de notre part, le règlement n'a pas encore été reçu. Merci de bien vouloir faire le nécessaire dans les plus brefs délais. Cordialement, ${nomEntreprise}.`
        }
      } else {
        const ai = new GoogleGenAI({ apiKey })
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt
        })
        messageGenere = response.text || ""
      }
    } catch (error) {
      console.error("Erreur lors de l'appel Gemini API:", error)
      messageGenere = `Bonjour ${nomClient}, nous vous sollicitons concernant votre facture de ${Number(facture.montant_fcfa).toLocaleString('fr-FR')} FCFA en retard de paiement. Merci de nous recontacter pour finaliser le règlement. Cordialement, ${nomEntreprise}.`
    }

    // Sauvegarder la relance dans le journal d'historique Supabase
    let relanceId = ""
    try {
      const { data: relance } = await supabase.from('relances').insert({
        facture_id: factureId,
        canal: facture.canal_contact,
        message_genere: messageGenere,
        statut_envoi: 'genere'
      }).select().single()
      if (relance) relanceId = relance.id
    } catch (e) {
      console.warn("Impossible de sauvegarder la relance en BDD :", e)
    }

    return { 
      success: true, 
      message: messageGenere, 
      relanceId, 
      client: {
        nom: facture.clients?.nom,
        whatsapp: facture.clients?.whatsapp,
        email: facture.clients?.email
      }
    }
  } catch (err: unknown) {
    console.error("Erreur serveur lors de genererMessageIA:", err)
    const message = err instanceof Error ? err.message : "Erreur inattendue lors de la génération de la relance."
    return { success: false, error: message }
  }
}