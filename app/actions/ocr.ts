'use server'

import { GoogleGenAI } from '@google/genai'

export type OcrResult = {
  success: boolean
  data?: {
    nomClient: string
    montantFcfa: number
    dateService: string
  }
  error?: string
}

export async function scannerFacture(formData: FormData): Promise<OcrResult> {
  try {
    const file = formData.get('facture') as File | null

    if (!file || file.size === 0) {
      return { success: false, error: "Aucun fichier sélectionné." }
    }

    // Vérification du type MIME
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Format non supporté. Utilisez JPG, PNG, WebP ou PDF." }
    }

    // Limite de taille : 10 MB
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: "L'image est trop volumineuse (max 10 Mo)." }
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey.includes('placeholder')) {
      return { 
        success: false, 
        error: "Clé API Gemini non configurée. Ajoutez GEMINI_API_KEY dans vos variables d'environnement." 
      }
    }

    // Conversion de l'image en Base64
    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString('base64')

    const ai = new GoogleGenAI({ apiKey })

    const prompt = `Analyse cette facture ou ce document comptable et retourne UNIQUEMENT un objet JSON valide (sans markdown, sans backticks, sans commentaire) avec exactement ces clés :
- "nomClient" (string) : le nom du client ou destinataire de la facture
- "montantFcfa" (number) : le montant total en FCFA (nombre entier, sans espaces ni séparateurs)  
- "dateService" (string) : la date du service ou de la facture au format YYYY-MM-DD

Si une information est introuvable, utilise "" pour les strings et 0 pour les nombres.
Réponds UNIQUEMENT avec le JSON, rien d'autre.`

    // Utiliser l'API interactions pour le multimodal (recommandé par la doc)
    let responseText = ''
    try {
      const interaction = await ai.interactions.create({
        model: 'gemini-3.6-flash',
        input: [
          { type: 'text', text: prompt },
          {
            type: file.type === 'application/pdf' ? 'document' : 'image',
            data: base64Data,
            mime_type: file.type
          }
        ]
      })
      responseText = interaction.output_text || ''
    } catch {
      // Fallback sur generateContent si interactions n'est pas disponible
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64Data,
                },
              },
            ],
          },
        ],
      })
      responseText = response.text || ''
    }

    if (!responseText) {
      return { success: false, error: "L'IA n'a pas pu analyser le document." }
    }

    // Nettoyage de la réponse (enlever les backticks markdown si présents)
    let jsonStr = responseText.trim()
    jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '')
    jsonStr = jsonStr.trim()

    // Parse JSON
    const parsed = JSON.parse(jsonStr)

    return {
      success: true,
      data: {
        nomClient: String(parsed.nomClient || '').trim(),
        montantFcfa: Math.max(0, Math.round(Number(parsed.montantFcfa) || 0)),
        dateService: String(parsed.dateService || '').trim(),
      }
    }

  } catch (err: unknown) {
    console.error("Erreur OCR Gemini:", err)

    if (err instanceof SyntaxError) {
      return { success: false, error: "L'IA a retourné une réponse mal formatée. Réessayez avec une image plus nette." }
    }

    const message = err instanceof Error ? err.message : "Erreur lors de l'analyse de la facture."
    return { success: false, error: message }
  }
}
