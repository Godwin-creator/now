'use server'

import { createClient } from '@/utils/supabase/server'
import { GoogleGenAI } from '@google/genai'
import { revalidatePath } from 'next/cache'
import { addDays, canalEffectif, daysBetween, formatFcfa, isValidIsoDate, parseFcfa } from '@/lib/domain'

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

    // 2. Création du client si nouveau client
    if (isNewClient) {
      const nomClient = String(formData.get('nom_client') || '').trim()
      if (!nomClient) {
        return { success: false, error: "Le nom du client est obligatoire." }
      }

      const profilRaw = String(formData.get('profil') || 'professionnel').trim().toLowerCase()
      const profilValide = ['particulier informel', 'professionnel', 'corporate'].includes(profilRaw) ? profilRaw : 'professionnel'

      const { data: newClient, error: clientError } = await supabase.from('clients').insert({
        company_id: user.id,
        nom: nomClient,
        email: formData.get('email') ? String(formData.get('email')).trim() : null,
        whatsapp: formData.get('whatsapp') ? String(formData.get('whatsapp')).trim() : null,
        profil: profilValide,
        secteur: String(formData.get('secteur') || 'Services')
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
    const montant = parseFcfa(String(montantRaw ?? ''))
    if (montant === null || montant <= 0) {
      return { success: false, error: "Le montant de la créance doit être supérieur à 0 FCFA." }
    }

    // 4. Calculs des dates pour la facture
    const dateServiceStr = String(formData.get('date_service') ?? '')
    if (!isValidIsoDate(dateServiceStr)) {
      return { success: false, error: "La date du service rendu est invalide." }
    }
    
    // Délai de paiement personnalisé dynamique (0, 15, 30, 45, 60 jours...)
    const delaiPaiementRaw = formData.get('delai_paiement_jours')
    const delaiPaiement = delaiPaiementRaw !== null && delaiPaiementRaw !== ''
      ? Number(delaiPaiementRaw)
      : 30
    if (!Number.isSafeInteger(delaiPaiement) || delaiPaiement < 0) {
      return { success: false, error: 'Le délai de paiement est invalide.' }
    }

    // Date d'échéance = Date service + délai accordé
    const dateEcheance = addDays(dateServiceStr, delaiPaiement)

    // Validation stricte des énumérations
    const relationRaw = String(formData.get('type_relation') || 'regulier').trim().toLowerCase()
    const relationValide = (['regulier', 'nouveau', 'difficile'] as const).find(
      (relation) => relation === relationRaw,
    ) ?? 'regulier'

    const canalRaw = String(formData.get('canal_contact') || 'whatsapp').trim().toLowerCase()
    const canalValide = (['whatsapp', 'email', 'sms', 'tel', 'tous'] as const).find(
      (canal) => canal === canalRaw,
    ) ?? 'whatsapp'

    // 5. Insertion sécurisée de la facture
    const insertPayload = {
      company_id: user.id,
      client_id: clientId,
      montant_fcfa: montant,
      date_service: dateServiceStr,
      date_echeance: dateEcheance,
      delai_paiement_jours: delaiPaiement,
      type_relation: relationValide,
      canal_contact: canalValide,
      statut: 'en_attente'
    }

    let { error: factureError } = await supabase.from('factures').insert(insertPayload)

    // Sécurité: Si la colonne delai_paiement_jours n'existe pas encore ou contrainte de canal
    if (factureError && (factureError.message?.includes('delai_paiement_jours') || factureError.message?.includes('factures_canal_contact_check'))) {
      const fallbackPayload = {
        company_id: user.id,
        client_id: clientId,
        montant_fcfa: montant,
        date_service: dateServiceStr,
        date_echeance: dateEcheance,
        type_relation: relationValide,
        canal_contact: canalValide === 'tous' && factureError.message?.includes('factures_canal_contact_check') ? 'whatsapp' : canalValide,
        statut: 'en_attente'
      }
      const fallback = await supabase.from('factures').insert(fallbackPayload)
      factureError = fallback.error
    }

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
    const canal = canalEffectif(canalChoisi || facture.canal_contact || 'whatsapp', {
      whatsapp: facture.clients?.whatsapp,
      telephone: facture.clients?.telephone,
      email: facture.clients?.email,
    })
    if (!canal.canal) {
      return { success: false, error: 'Aucune coordonnée disponible pour contacter ce client.' }
    }
    const canalUtilise = canal.canal
    const today = new Date().toISOString().slice(0, 10)
    const joursRetard = Math.max(0, daysBetween(facture.date_echeance, today))

    const nomEntreprise = facture.companies?.nom || 'Notre entreprise'
    const nomClient = facture.clients?.nom || 'Cher client'
    const montantFormate = formatFcfa(Number(facture.montant_fcfa))
    const dateEcheanceStr = new Date(`${facture.date_echeance}T00:00:00Z`).toLocaleDateString('fr-FR', { timeZone: 'UTC' })

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
    let instructionsCanal = ''
    if (canalUtilise === 'sms') {
      instructionsCanal = `
- Canal : SMS (contrainte absolue : moins de 160 caractères).
- Rédige un message SMS percutant et ultra-concis mentionnant le montant (${montantFormate}) et le nom de l'entreprise.`
    } else if (canalUtilise === 'email') {
      instructionsCanal = `
- Canal : EMAIL.
- Rédige un email complet et soigné avec :
  1. Une ligne "Objet : [Objet clair et percutant]"
  2. Formule de salutation appropriée
  3. Corps du message rappelant la facture (${montantFormate}), l'échéance (${dateEcheanceStr}) et la date de service
  4. Proposition de modalités ou invitation à échanger en cas de difficulté
  5. Formule de politesse professionnelle et signature "${nomEntreprise}".`
    } else if (canalUtilise === 'tel') {
      instructionsCanal = `
- Canal : SCRIPT D'APPEL TÉLÉPHONIQUE.
- Rédige un guide conversationnel structuré en quatre étapes : ouverture, rappel du dossier, écoute et engagement, clôture.`
    } else {
      instructionsCanal = `
- Canal : WHATSAPP.
- Rédige un message lisible, direct et prêt à l'envoi.`
    }

    // Prompt Engineering strict selon les règles du cahier des charges
    const prompt = `
Tu es l'expert en recouvrement et relance commerciale de l'entreprise "${nomEntreprise}".

Règles strictes de rédaction :
- Rédige au nom de l'entreprise en utilisant la première personne du pluriel ("Nous").
- N'utilise ABSOLUMENT AUCUN émoji.
- Ton appliqué : ${tonRecommande}.
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
    let source: 'ia' | 'template' = 'template'
    try {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey || apiKey.startsWith('AQ.') || apiKey.includes('placeholder')) {
        // Fallbacks professionnels adaptés par canal si la clé Gemini n'est pas configurée
        if (canalUtilise === 'email') {
          messageGenere = `Objet : Relance — Règlement de facture d'un montant de ${montantFormate}

Madame, Monsieur,

Nous nous permettons de vous adresser ce message concernant notre facture d'un montant de ${montantFormate}, dont l'échéance était fixée au ${dateEcheanceStr}.

Sauf erreur de notre part, ce règlement n'a pas encore été enregistré dans nos comptes. Nous vous serions reconnaissants de bien vouloir procéder au paiement dans les meilleurs délais, ou de nous contacter si vous souhaitez convenir d'un arrangement.

Nous restons à votre entière disposition pour tout renseignement complémentaire.

Cordialement,
${nomEntreprise}`
        } else if (canalUtilise === 'sms') {
          messageGenere = `Rappel ${nomEntreprise}: votre facture de ${montantFormate} echue le ${dateEcheanceStr} est en attente. Merci de proceder au reglement.`
        } else if (canalUtilise === 'tel') {
          messageGenere = `[SCRIPT D'APPEL TÉLÉPHONIQUE]
1. OUVERTURE :
"Bonjour ${nomClient}, je suis le responsable comptabilité de l'entreprise ${nomEntreprise}. Avez-vous deux minutes à m'accorder ?"

2. RAPPEL DU DOSSIER :
"Je vous contacte concernant votre facture de ${montantFormate} dont l'échéance était le ${dateEcheanceStr}, soit un retard de ${joursRetard} jours. Avez-vous bien reçu le document ?"

3. ÉCOUTE ET ENGAGEMENT :
"Y a-t-il eu un contretemps particulier pour le paiement ? Quand pouvons-nous planifier la réception du virement ?"

4. CLÔTURE :
"Parfait, je note donc votre engagement de règlement pour le [date convenue]. Merci pour votre collaboration et excellente journée."`
        } else {
          // WhatsApp par défaut
          messageGenere = `Bonjour ${nomClient}, nous vous contactons concernant la facture de ${montantFormate} échue le ${dateEcheanceStr}. Sauf erreur de notre part, le règlement n'a pas encore été reçu. Merci de bien vouloir faire le nécessaire dans les plus brefs délais. Cordialement, ${nomEntreprise}.`
        }
      } else {
        const ai = new GoogleGenAI({ apiKey })
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt
        })
        messageGenere = response.text || ""
        if (messageGenere) source = 'ia'
      }
    } catch (error) {
      console.error("Erreur lors de l'appel Gemini API:", error)
      messageGenere = `Bonjour ${nomClient}, nous vous sollicitons concernant votre facture de ${montantFormate} en retard de paiement. Merci de nous recontacter pour finaliser le règlement. Cordialement, ${nomEntreprise}.`
    }

    // Sauvegarder la relance dans le journal d'historique Supabase
    let relanceId = ""
    try {
      const { data: relance } = await supabase.from('relances').insert({
        company_id: user.id,
        facture_id: factureId,
        canal: canalUtilise,
        message_genere: messageGenere,
        statut_envoi: 'generee',
        source,
      }).select().single()
      if (relance) relanceId = relance.id
    } catch (e) {
      console.warn("Impossible de sauvegarder la relance en BDD :", e)
    }

    return { 
      success: true, 
      message: messageGenere, 
      relanceId,
      canalUtilise,
      client: {
        nom: facture.clients?.nom ?? undefined,
        whatsapp: facture.clients?.whatsapp ?? undefined,
        telephone: facture.clients?.telephone ?? undefined,
        email: facture.clients?.email ?? undefined,
        profil: facture.clients?.profil ?? undefined
      }
    }
  } catch (err: unknown) {
    console.error("Erreur serveur lors de genererMessageIA:", err)
    const message = err instanceof Error ? err.message : "Erreur inattendue lors de la génération de la relance."
    return { success: false, error: message }
  }
}