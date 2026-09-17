'use server'

import { createClient } from '@/utils/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { revalidatePath } from 'next/cache'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Logique de Scoring
function calculerScoreRisque(joursRetard: number, montant: number, retardsPrecedents: number, profil: string, relation: string) {
  const maxMontant = 5000000;
  let penaliteProfil = (profil === 'particulier informel' || relation === 'difficile') ? 15 : 0;
  
  let score = (joursRetard / 90) * 40 + (montant / maxMontant) * 30 + (retardsPrecedents * 15) + penaliteProfil;
  score = Math.min(Math.max(score, 0), 100); // Plafonner entre 0 et 100

  let niveau = 'Faible';
  if (score > 33 && score <= 66) niveau = 'Moyen';
  else if (score > 66 && score <= 85) niveau = 'Élevé';
  else if (score > 85) niveau = 'Critique';

  return { score: Math.round(score), niveau };
}

export async function creerCreance(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Non autorisé")

  const isNewClient = formData.get('isNewClient') === 'true'
  let clientId = formData.get('client_id') as string

  // 1. Création du client si hybride
  if (isNewClient) {
    const { data: newClient, error: clientError } = await supabase.from('clients').insert({
      company_id: user.id,
      nom: formData.get('nom_client'),
      email: formData.get('email'),
      whatsapp: formData.get('whatsapp'),
      profil: formData.get('profil'),
      retards_precedents: 0
    }).select().single()

    if (clientError) throw new Error(clientError.message)
    clientId = newClient.id
  }

  // 2. Calculs pour la facture
  const montant = Number(formData.get('montant'))
  const dateService = new Date(formData.get('date_service') as string)
  const dateEcheance = new Date(dateService)
  dateEcheance.setDate(dateEcheance.getDate() + 30) // J+30

  const joursRetard = Math.max(0, Math.floor((new Date().getTime() - dateEcheance.getTime()) / (1000 * 3600 * 24)))
  
  // Récupérer infos client pour le score
  const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single()
  
  const { score, niveau } = calculerScoreRisque(
    joursRetard, 
    montant, 
    client.retards_precedents, 
    client.profil, 
    formData.get('type_relation') as string
  )

  // 3. Insertion Facture
  const { error: factureError } = await supabase.from('factures').insert({
    company_id: user.id,
    client_id: clientId,
    montant_fcfa: montant,
    date_service: dateService.toISOString(),
    date_echeance: dateEcheance.toISOString(),
    type_relation: formData.get('type_relation'),
    canal_contact: formData.get('canal_contact'),
    score_risque: score,
    niveau_risque: niveau
  })

  if (factureError) throw new Error(factureError.message)
  revalidatePath('/dashboard')
}

export async function genererMessageIA(factureId: string) {
  const supabase = createClient()
  
  // Récupérer les données complètes
  const { data: facture } = await supabase.from('factures')
    .select(`*, clients(*), companies(*)`)
    .eq('id', factureId).single()

  if (!facture) throw new Error("Facture introuvable")

  const joursRetard = Math.floor((new Date().getTime() - new Date(facture.date_echeance).getTime()) / (1000 * 3600 * 24))

  // Prompt Engineering pour Gemini
  const prompt = `
    Tu es un assistant de recouvrement pour une PME africaine. Rédige un message de relance.
    Règles strictes :
    - Utilise le pronom "Nous" (première personne du pluriel).
    - AUCUN émoji.
    - Ton adapté : ${facture.clients.profil === 'corporate' ? 'Très formel et institutionnel' : 'Direct, courtois mais ferme'}.
    - Canal : ${facture.canal_contact}. ${facture.canal_contact === 'sms' ? 'Fais très court (max 160 caractères).' : 'Structure avec objet si email.'}
    - Niveau de risque : ${facture.niveau_risque}.
    
    Informations :
    - Client : ${facture.clients.nom}
    - Montant : ${facture.montant_fcfa} FCFA
    - Jours de retard : ${joursRetard} jours
    - Entreprise émettrice : ${facture.companies.nom}
    
    Génère uniquement le texte du message, prêt à être copié.
  `

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
  const result = await model.generateContent(prompt)
  const messageGenere = result.response.text()

  // Sauvegarder la relance
  const { data: relance } = await supabase.from('relances').insert({
    facture_id: factureId,
    canal: facture.canal_contact,
    message_genere: messageGenere
  }).select().single()

  return { message: messageGenere, relanceId: relance.id, client: facture.clients }
}