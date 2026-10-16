'use server'

import { requireUser } from '@/lib/auth'
import { failure, type Result } from '@/lib/auth/result'
import { extractInvoice } from '@/lib/ai/ocr'
import type { InvoiceOcr } from '@/lib/ai/contracts'
import { consumeAiQuota } from '@/lib/db/ai-usage'
import { ocrFileSchema } from '@/lib/validation/schemas'

export async function scannerFacture(formData: FormData): Promise<Result<InvoiceOcr>> {
  await requireUser()
  const file = formData.get('facture')
  if (!(file instanceof File)) return failure('VALIDATION', 'Sélectionnez un fichier de facture.')
  if (file.size === 0) return failure('VALIDATION', 'Le fichier sélectionné est vide.')

  const metadata = ocrFileSchema.safeParse({ mime: file.type, size: file.size })
  if (!metadata.success) {
    const tooLarge = file.size > 10 * 1024 * 1024
    return failure('VALIDATION', tooLarge ? 'Le fichier dépasse la limite de 10 Mo.' : 'Format non pris en charge. Utilisez JPG, PNG, WebP ou PDF.')
  }

  try {
    const quota = await consumeAiQuota('ocr', 5, 15)
    if (!quota.ok) return quota

    const result = await extractInvoice(file)
    if (!result.ok) {
      const message = result.error === 'configuration'
        ? 'Le service d’analyse n’est pas configuré.'
        : result.error === 'reseau'
          ? 'L’analyse a échoué ou a dépassé le délai autorisé. Réessayez.'
          : 'Le document n’a pas pu être lu correctement. Essayez une image plus nette.'
      return failure(result.error.toUpperCase(), message)
    }
    return { ok: true, data: result.data }
  } catch {
    return failure('UNAVAILABLE', 'Le service d’analyse est temporairement indisponible.')
  }
}
