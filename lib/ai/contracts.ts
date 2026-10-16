import { z } from 'zod'
import { isValidIsoDate } from '@/lib/domain/dates'

const boundedText = (max: number) => z.string().trim().min(1).max(max).transform((value) =>
  value.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max),
)

export const relanceInputSchema = z.object({
  entreprise: boundedText(120),
  client: boundedText(150),
  montantSolde: z.number().int().positive().safe(),
  joursRetard: z.number().int().nonnegative().safe(),
  ton: z.enum(['courtois', 'factuel', 'ferme', 'urgent']),
  canal: z.enum(['whatsapp', 'email', 'sms', 'tel']),
  numeroFacture: z.string().trim().max(80).optional().transform((value) => value?.replace(/[\u0000-\u001f\u007f-\u009f]/g, '').slice(0, 80)),
  dateEcheance: z.string().refine(isValidIsoDate, 'Date ISO invalide.'),
})

export const relanceOutputSchema = z.object({
  objet: z.string().trim().min(1).max(120).optional(),
  corps: z.string().trim().min(1).max(2_000),
})

export const invoiceOcrSchema = z.object({
  nomClient: boundedText(150),
  montantFcfa: z.number().int().positive().safe(),
  dateService: z.string().refine(isValidIsoDate, 'Date ISO invalide.'),
})

export type RelanceInput = z.infer<typeof relanceInputSchema>
export type RelanceOutput = z.infer<typeof relanceOutputSchema>
export type InvoiceOcr = z.infer<typeof invoiceOcrSchema>
export type NiveauTemplate = 'Faible' | 'Moyen' | 'Élevé' | 'Critique'
export type TonRelance = RelanceInput['ton']
export type CanalRelance = RelanceInput['canal']

export type AiErrorCode = 'quota' | 'reseau' | 'invalide'

export function classifyAiError(error: unknown): AiErrorCode {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  if (message.includes('429') || message.includes('quota') || message.includes('rate limit')) return 'quota'
  if (message.includes('timeout') || message.includes('network') || message.includes('fetch')) return 'reseau'
  return 'invalide'
}