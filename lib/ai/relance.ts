import { createGoogle } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import { formatFcfa } from '@/lib/domain/money'
import { classifyAiError, relanceInputSchema, relanceOutputSchema } from './contracts'
import type { AiErrorCode, NiveauTemplate, RelanceInput, RelanceOutput } from './contracts'
import { buildTemplate } from './templates'

const EMOJI_PATTERN = /\p{Extended_Pictographic}/u

function buildPrompt(input: RelanceInput): string {
  const trustedRules = `Rédige en français soigné, au nom de l’entreprise, en première personne du pluriel (« Nous »). Aucun emoji. Mentionne exactement le solde, le nom de l’entreprise et, si présent, le numéro de facture. Pour un e-mail, fournis un objet et un corps. Pour les autres canaux, ne fournis que le corps.`
  const untrustedData = JSON.stringify(input).replace(/</g, '\\u003c')
  return `${trustedRules}\n\nCanal : ${input.canal}. Ton : ${input.ton}. Retard : ${input.joursRetard} jour(s).\n\n<DONNEES_NON_FIABLES_JSON>${untrustedData}</DONNEES_NON_FIABLES_JSON>`
}

function isValidMessage(output: RelanceOutput, input: RelanceInput): boolean {
  const body = output.corps
  const normalizedBody = body.toLocaleLowerCase('fr-FR').replace(/\s+/g, ' ')
  const normalizedCompany = input.entreprise.toLocaleLowerCase('fr-FR')
  const normalizedAmount = formatFcfa(input.montantSolde).toLocaleLowerCase('fr-FR').replace(/\s+/g, ' ')
  return !EMOJI_PATTERN.test(body) &&
    /\bNous\b/i.test(body) &&
    normalizedBody.includes(normalizedCompany) &&
    normalizedBody.includes(normalizedAmount) &&
    (input.canal !== 'sms' || body.length <= 320) &&
    (input.canal === 'email' ? Boolean(output.objet) : !output.objet)
}

export interface GeneratedRelance {
  output: RelanceOutput
  source: 'ia' | 'template'
  fallbackReason?: AiErrorCode
}

export async function generateRelance(
  input: RelanceInput,
  niveau: NiveauTemplate,
): Promise<GeneratedRelance> {
  const parsed = relanceInputSchema.safeParse(input)
  if (!parsed.success) return { output: buildTemplate(input, niveau), source: 'template', fallbackReason: 'invalide' }

  const apiKey = process.env.GEMINI_API_KEY
  const modelId = process.env.GEMINI_MODEL
  if (!apiKey || !modelId) return { output: buildTemplate(parsed.data, niveau), source: 'template', fallbackReason: 'reseau' }

  try {
    const google = createGoogle({ apiKey })
    const { output } = await generateText({
      model: google(modelId),
      output: Output.object({ schema: relanceOutputSchema }),
      prompt: buildPrompt(parsed.data),
      timeout: 15_000,
      maxRetries: 0,
    })
    const validated = relanceOutputSchema.safeParse(output)
    if (!validated.success || !isValidMessage(validated.data, parsed.data)) {
      return { output: buildTemplate(parsed.data, niveau), source: 'template', fallbackReason: 'invalide' }
    }
    return { output: validated.data, source: 'ia' }
  } catch (error) {
    return { output: buildTemplate(parsed.data, niveau), source: 'template', fallbackReason: classifyAiError(error) }
  }
}