import { z } from 'zod'
import { isValidIsoDate } from '@/lib/domain/dates'

const isoDateSchema = z.string().refine(isValidIsoDate, 'Date ISO invalide.')
const clientProfileSchema = z.enum(['particulier informel', 'professionnel', 'corporate'])
const contactChannelSchema = z.enum(['whatsapp', 'email', 'sms', 'tel', 'tous'])

export const creanceFormSchema = z.object({
  isNewClient: z.enum(['true', 'false']),
  clientId: z.string().uuid().optional(),
  clientName: z.string().trim().max(150).optional(),
  amount: z.string().trim().min(1).max(32),
  serviceDate: isoDateSchema,
  paymentDelay: z.string().regex(/^\d{1,3}$/).optional(),
  profile: clientProfileSchema,
  relation: z.enum(['regulier', 'nouveau', 'difficile']),
  channel: contactChannelSchema,
  email: z.string().trim().max(254).optional(),
  telephone: z.string().trim().max(40).optional(),
  whatsapp: z.string().trim().max(40).optional(),
  secteur: z.string().trim().max(100).optional(),
}).superRefine((value, context) => {
  if (value.isNewClient === 'true' && !value.clientName) {
    context.addIssue({ code: 'custom', path: ['clientName'], message: 'Le nom du client est obligatoire.' })
  }
  if (value.isNewClient === 'false' && !value.clientId) {
    context.addIssue({ code: 'custom', path: ['clientId'], message: 'Sélectionnez un client existant.' })
  }
})

export const paymentSchema = z.object({
  factureId: z.string().uuid(),
  montant: z.number().int().positive().safe(),
  date: isoDateSchema,
})

export const paymentIdSchema = z.string().uuid()

export const clientUpdateSchema = z.object({
  id: z.string().uuid(),
  nom: z.string().trim().min(1).max(150),
  email: z.union([z.string().trim().email().max(254), z.literal('')]).nullable().transform((value) => value || null),
  telephone: z.string().trim().max(40).nullable(),
  whatsapp: z.string().trim().max(40).nullable(),
  profil: clientProfileSchema,
  secteur: z.string().trim().max(100).nullable(),
})

export const csvImportRowSchema = z.object({
  line: z.number().int().positive(),
  nom: z.string().max(150),
  telephone: z.string().max(40),
  montant: z.string().max(32),
  date_service: z.string().max(40),
})

export const csvImportRowsSchema = z.array(csvImportRowSchema).max(500)

export const csvFileSchema = z.object({
  name: z.string().trim().max(255).regex(/\.csv$/i),
  type: z.enum(['', 'text/csv', 'application/csv', 'application/vnd.ms-excel', 'application/octet-stream']),
  size: z.number().int().positive().max(2 * 1024 * 1024),
})

export const relanceRequestSchema = z.object({
  factureId: z.string().uuid(),
  canal: contactChannelSchema.optional(),
  ton: z.enum(['courtois', 'factuel', 'ferme', 'urgent']).optional(),
})

export const relanceIdSchema = z.string().uuid()

export const ocrFileSchema = z.object({
  mime: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']),
  size: z.number().int().positive().max(10 * 1024 * 1024),
})

export type CreanceFormInput = z.infer<typeof creanceFormSchema>
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>
