import { createGoogle } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import { invoiceOcrSchema, classifyAiError } from './contracts'
import type { AiErrorCode, InvoiceOcr } from './contracts'

export type OcrOutcome =
  | { ok: true; data: InvoiceOcr }
  | { ok: false; error: AiErrorCode | 'configuration' | 'invalide' }

export async function extractInvoice(file: File): Promise<OcrOutcome> {
  const apiKey = process.env.GEMINI_API_KEY
  const modelId = process.env.GEMINI_MODEL
  if (!apiKey || !modelId) return { ok: false, error: 'configuration' }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const google = createGoogle({ apiKey })
    const { output } = await generateText({
      model: google(modelId),
      output: Output.object({ schema: invoiceOcrSchema }),
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'Extrais le nom du client, le montant total en FCFA entier et la date de service au format YYYY-MM-DD. Retourne uniquement l’objet conforme au schéma. Si une donnée est illisible, ne l’invente pas.' },
          { type: 'file', data: bytes, mediaType: file.type },
        ],
      }],
      timeout: 15_000,
      maxRetries: 0,
    })
    const parsed = invoiceOcrSchema.safeParse(output)
    return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: 'invalide' }
  } catch (error) {
    return { ok: false, error: classifyAiError(error) }
  }
}