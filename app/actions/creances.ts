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

    // 3. Extraction et validation du montant (support montant_fcfa ou montant avec espaces/séparateurs)
    const montantRaw = formData.get('montant_fcfa') || formData.get('montant')
    const montantClean = String(montantRaw || '').replace(/[^0-9]/g, '')
    const montant = Math.max(0, Number(montantClean) || 0)
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
      canal_contact: String(formData.get('canal_contact') || 'tous'),
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
  canalUtilise?: string;
  client?: {
    nom?: string;
    whatsapp?: string;
    telephone?: string;
    email?: string;
    profil?: string;
  };
  error?: string;
}

export async function genererMessageIA(
  factureId: string, 
  canalChoisi?: string,
  tonChoisi?: string
): Promise<RelanceResponse> {
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

    // Déterminer le canal effectif
    const canalEffectif = canalChoisi || facture.canal_contact || 'whatsapp'

    const dateEcheance = new Date(facture.date_echeance)
    const maintenant = new Date()
    const diffMs = maintenant.getTime() - dateEcheance.getTime()
    const joursRetard = Math.max(0, Math.floor(diffMs / (1000 * 3600 * 24)))

    const nomEntreprise = facture.companies?.nom || 'Notre entreprise'
    const nomClient = facture.clients?.nom || 'Cher client'
    const montantFormate = `${Number(facture.montant_fcfa).toLocaleString('fr-FR')} FCFA`
    const dateEcheanceStr = dateEcheance.toLocaleDateString('fr-FR')

    // Ton de la relance selon le profil client et la relation ou le choix explicite
    let tonRecommande = 'Direct, courtois et professionnel'
    if (tonChoisi === 'courtois') {
      tonRecommande = 'Très courtois, bienveillant et axé relation de confiance'
    } else if (tonChoisi === 'factuel') {
      tonRecommande = 'Direct, factuel et strictement professionnel'
    } else if (tonChoisi === 'ferme') {
      tonRecommande = 'Ferme, insistant sur le dépassement d’échéance et l’urgence de régulariser'
    } else if (tonChoisi === 'urgent') {
      tonRecommande = 'Dernier avis formel avant transmission au service contentieux ou suspension de service'
    } else if (facture.clients?.profil === 'corporate') {
      tonRecommande = 'Très formel et institutionnel'
    } else if (facture.clients?.profil === 'particulier informel') {
      tonRecommande = 'Courtois, factuel et chaleureux'
    }

    // Instructions spécifiques selon le canal
    let instructionsCanal = ""
    if (canalEffectif === 'sms') {
      instructionsCanal = `
- Canal : SMS (contrainte absolue : moins de 160 caractères).
- Rédige un message SMS percutant et ultra-concis mentionnant le montant (${montantFormate}) et le nom de l'entreprise.`
    } else if (canalEffectif === 'email') {
      instructionsCanal = `
- Canal : EMAIL.
- Rédige un email complet et soigné avec :
  1. Une ligne "Objet : [Objet clair et percutant]"
  2. Formule de salutation appropriée
  3. Corps du message rappelant la facture (${montantFormate}), l'échéance (${dateEcheanceStr}) et la date de service
  4. Proposition de modalités ou invitation à échanger en cas de difficulté
  5. Formule de politesse professionnelle et signature "${nomEntreprise}".`
    } else if (canalEffectif === 'whatsapp') {
      instructionsCanal = `
- Canal : WHATSAPP.
- Rédige un message WhatsApp lisible, direct, bien espacé, sans lourdeurs, prêt à l'envoi direct.`
    } else if (canalEffectif === 'tel') {
      instructionsCanal = `
- Canal : SCRIPT D'APPEL TÉLÉPHONIQUE (guide d'entretien pour le chargé de recouvrement).
- Rédige un script d'appel structuré sous forme de guide conversationnel en 4 étapes :
  1. [Ouverture] : Salutation et identification professionnelle.
  2. [Rappel] : Rappel du montant (${montantFormate}) et échéance échue (${dateEcheanceStr}).
  3. [Écoute / Négociation] : Questions pour identifier la raison du retard et proposer un règlement ou un échéancier.
  4. [Clôture] : Fixation d'une date d'engagement ferme et remerciement.`
    } else {
      // canalEffectif === 'tous'
      instructionsCanal = `
- Canal : MULTI-CANAL (PACK DE RELANCE COMPLET).
- Génère 4 versions adaptées et clairement identifiées par des en-têtes :
  === [1. WHATSAPP] ===
  (Message direct et fluide)

  === [2. EMAIL] ===
  (Objet + corps structuré + formule de politesse)

  === [3. SMS (<160 car.)] ===
  (Message ultra-court)

  === [4. SCRIPT D'APPEL TÉLÉPHONIQUE] ===
  (Guide pas-à-pas pour l'appel)`
    }

    // Prompt Engineering strict selon les règles du cahier des charges
    const prompt = `
Tu es l'expert en recouvrement et relance commerciale de l'entreprise "${nomEntreprise}".

Règles strictes de rédaction :
- Rédige au nom de l'entreprise en utilisant la première personne du pluriel ("Nous").
- N'utilise ABSOLUMENT AUCUN émoji.
- Ton appliqué : ${tonRecommande}.
- Niveau de risque : ${facture.niveau_risque} (Score de risque : ${facture.score_risque}/100).
- Retard constaté : ${joursRetard} jour(s).

${instructionsCanal}

Données du dossier :
- Nom du client : ${nomClient}
- Montant dû : ${montantFormate}
- Date d'échéance : ${dateEcheanceStr}
- Date du service : ${new Date(facture.date_service).toLocaleDateString('fr-FR')}
- Secteur client : ${facture.clients?.secteur || 'Non renseigné'}
- Entreprise émettrice : ${nomEntreprise}

Génère UNIQUEMENT le texte du message ou du script prêt à l'emploi.
`

    let messageGenere = ""
    try {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey || apiKey.startsWith('AQ.') || apiKey.includes('placeholder')) {
        // Fallbacks professionnels adaptés par canal si la clé Gemini n'est pas configurée
        if (canalEffectif === 'email') {
          messageGenere = `Objet : Relance — Règlement de facture d'un montant de ${montantFormate}

Madame, Monsieur,

Nous nous permettons de vous adresser ce message concernant notre facture d'un montant de ${montantFormate}, dont l'échéance était fixée au ${dateEcheanceStr}.

Sauf erreur de notre part, ce règlement n'a pas encore été enregistré dans nos comptes. Nous vous serions reconnaissants de bien vouloir procéder au paiement dans les meilleurs délais, ou de nous contacter si vous souhaitez convenir d'un arrangement.

Nous restons à votre entière disposition pour tout renseignement complémentaire.

Cordialement,
${nomEntreprise}`
        } else if (canalEffectif === 'sms') {
          messageGenere = `Rappel ${nomEntreprise}: votre facture de ${montantFormate} echue le ${dateEcheanceStr} est en attente. Merci de proceder au reglement.`
        } else if (canalEffectif === 'tel') {
          messageGenere = `[SCRIPT D'APPEL TÉLÉPHONIQUE]
1. OUVERTURE :
"Bonjour ${nomClient}, je suis le responsable comptabilité de l'entreprise ${nomEntreprise}. Avez-vous deux minutes à m'accorder ?"

2. RAPPEL DU DOSSIER :
"Je vous contacte concernant votre facture de ${montantFormate} dont l'échéance était le ${dateEcheanceStr}, soit un retard de ${joursRetard} jours. Avez-vous bien reçu le document ?"

3. ÉCOUTE ET ENGAGEMENT :
"Y a-t-il eu un contretemps particulier pour le paiement ? Quand pouvons-nous planifier la réception du virement ?"

4. CLÔTURE :
"Parfait, je note donc votre engagement de règlement pour le [date convenue]. Merci pour votre collaboration et excellente journée."`
        } else if (canalEffectif === 'tous') {
          messageGenere = `=== [1. WHATSAPP] ===
Bonjour ${nomClient}, nous vous contactons concernant votre facture de ${montantFormate} échue le ${dateEcheanceStr}. Merci de bien vouloir nous confirmer la date de votre règlement. Cordialement, ${nomEntreprise}.

=== [2. EMAIL] ===
Objet : Relance — Règlement facture ${montantFormate}

Madame, Monsieur,
Nous vous rappelons que la facture de ${montantFormate} échue le ${dateEcheanceStr} reste impayée. Merci de régulariser la situation dans les meilleurs délais.
Cordialement, ${nomEntreprise}

=== [3. SMS] ===
Rappel ${nomEntreprise}: facture de ${montantFormate} echue le ${dateEcheanceStr} en attente. Merci de proceder au reglement.

=== [4. SCRIPT D'APPEL] ===
"Bonjour ${nomClient}, ${nomEntreprise} au téléphone. Je vous appelle au sujet de la facture de ${montantFormate} échue le ${dateEcheanceStr} pour convenir d'une date de règlement."`
        } else {
          // WhatsApp par défaut
          messageGenere = `Bonjour ${nomClient}, nous vous contactons concernant la facture de ${montantFormate} échue le ${dateEcheanceStr}. Sauf erreur de notre part, le règlement n'a pas encore été reçu. Merci de bien vouloir faire le nécessaire dans les plus brefs délais. Cordialement, ${nomEntreprise}.`
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
      messageGenere = `Bonjour ${nomClient}, nous vous sollicitons concernant votre facture de ${montantFormate} en retard de paiement. Merci de nous recontacter pour finaliser le règlement. Cordialement, ${nomEntreprise}.`
    }

    // Sauvegarder la relance dans le journal d'historique Supabase
    let relanceId = ""
    try {
      const { data: relance } = await supabase.from('relances').insert({
        facture_id: factureId,
        canal: canalEffectif,
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
      canalUtilise: canalEffectif,
      client: {
        nom: facture.clients?.nom,
        whatsapp: facture.clients?.whatsapp,
        telephone: facture.clients?.telephone,
        email: facture.clients?.email,
        profil: facture.clients?.profil
      }
    }
  } catch (err: unknown) {
    console.error("Erreur serveur lors de genererMessageIA:", err)
    const message = err instanceof Error ? err.message : "Erreur inattendue lors de la génération de la relance."
    return { success: false, error: message }
  }
}