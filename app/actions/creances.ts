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

export async function creerCreance(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Non autorisé")

  const isNewClient = formData.get('isNewClient') === 'true'
  let clientId = formData.get('client_id') as string

  // 1. Création du client si nouveau client
  if (isNewClient) {
    const retardsInput = Number(formData.get('retards_precedents') || 0)
    const { data: newClient, error: clientError } = await supabase.from('clients').insert({
      company_id: user.id,
      nom: formData.get('nom_client'),
      email: formData.get('email') || null,
      whatsapp: formData.get('whatsapp') || null,
      profil: formData.get('profil') || 'professionnel',
      secteur: formData.get('secteur') || 'Services',
      retards_precedents: retardsInput
    }).select().single()

    if (clientError) throw new Error(clientError.message)
    clientId = newClient.id
  }

  // 2. Calculs pour la facture
  const montant = Number(formData.get('montant'))
  const dateServiceStr = formData.get('date_service') as string
  const dateService = new Date(dateServiceStr)
  
  // Date d'échéance = J+30 automatiquement selon le cahier des charges
  const dateEcheance = new Date(dateService)
  dateEcheance.setDate(dateEcheance.getDate() + 30)

  // Calcule les jours de retard réels par rapport à l'échéance
  const maintenant = new Date()
  const diffTemps = maintenant.getTime() - dateEcheance.getTime()
  const joursRetard = Math.max(0, Math.floor(diffTemps / (1000 * 3600 * 24)))
  
  // Récupérer les informations complètes du client pour le calcul du score
  const { data: client, error: fetchClientError } = await supabase.from('clients').select('*').eq('id', clientId).single()
  if (fetchClientError || !client) throw new Error("Client introuvable")
  
  const { score, niveau } = calculerScoreRisque(
    joursRetard, 
    montant, 
    client.retards_precedents || 0, 
    client.profil, 
    formData.get('type_relation') as string
  )

  // 3. Insertion de la facture
  const { error: factureError } = await supabase.from('factures').insert({
    company_id: user.id,
    client_id: clientId,
    montant_fcfa: montant,
    date_service: dateService.toISOString(),
    date_echeance: dateEcheance.toISOString(),
    type_relation: formData.get('type_relation') || 'regulier',
    canal_contact: formData.get('canal_contact') || 'whatsapp',
    score_risque: score,
    niveau_risque: niveau,
    statut: 'en_attente'
  })

  if (factureError) throw new Error(factureError.message)
  revalidatePath('/dashboard')
}

export async function genererMessageIA(factureId: string) {
  const supabase = await createClient()
  
  // Récupérer les données complètes de la facture
  const { data: facture, error: fetchError } = await supabase.from('factures')
    .select(`*, clients(*), companies(*)`)
    .eq('id', factureId)
    .single()

  if (fetchError || !facture) throw new Error("Facture introuvable")

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
      // Fallback professionnel en mode simulation si la clé Gemini n'est pas encore activée
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

  return { message: messageGenere, relanceId, client: facture.clients }
}