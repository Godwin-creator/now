'use server'

import Papa from 'papaparse'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { failure } from '@/lib/auth/result'
import { addDays, isValidIsoDate, parseFcfa } from '@/lib/domain'
import { importCreances } from '@/lib/db/import-creances'
import { csvFileSchema, csvImportRowsSchema } from '@/lib/validation/schemas'

function csvCells(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((cell: unknown) => typeof cell === 'string' ? cell : '')
}

export async function importerCreances(formData: FormData) {
  const user = await requireUser()
  const file = formData.get('csv')
  if (!(file instanceof File)) return failure('VALIDATION', 'Sélectionnez un fichier CSV.')

  const metadata = csvFileSchema.safeParse({ name: file.name, type: file.type, size: file.size })
  if (!metadata.success) {
    const tooLarge = file.size > 2 * 1024 * 1024
    return failure(tooLarge ? 'LIMIT' : 'VALIDATION', tooLarge ? 'Le fichier CSV ne doit pas dépasser 2 Mo.' : 'Choisissez un fichier CSV valide.')
  }

  try {
    const parsedCsv = Papa.parse<string[]>(await file.text(), { header: false, skipEmptyLines: false })
    if (parsedCsv.errors.length > 0) return failure('CSV_PARSE', 'Le fichier CSV est illisible. Vérifiez son encodage et ses séparateurs.')

    let firstDataIndex = 0
    const firstRow = csvCells(parsedCsv.data[0])
    const headers = firstRow.map((cell) => cell.trim().toLocaleLowerCase('fr-FR').normalize('NFD').replace(/\p{Diacritic}/gu, ''))
    const hasNameHeader = ['nom', 'client', 'nom client', 'nom du client'].includes(headers[0] ?? '')
    const hasAmountHeader = ['montant', 'montant fcfa'].includes(headers[2] ?? '')
    const hasDateHeader = ['date', 'date service', 'date du service'].includes(headers[3] ?? '')
    if (hasNameHeader && (hasAmountHeader || hasDateHeader)) firstDataIndex = 1

    const rawRows = parsedCsv.data.slice(firstDataIndex).flatMap((value, index) => {
      const cells = csvCells(value)
      if (cells.every((cell) => !cell.trim())) return []
      return [{
        line: firstDataIndex + index + 1,
        nom: cells[0]?.trim() ?? '',
        telephone: cells[1]?.trim() ?? '',
        montant: cells[2]?.trim() ?? '',
        date_service: cells[3]?.trim() ?? '',
      }]
    })

    if (rawRows.length === 0) return failure('EMPTY', 'Le fichier CSV ne contient aucune ligne à importer.')
    if (rawRows.length > 500) return failure('LIMIT', 'L’import est limité à 500 lignes.')
    const parsedRows = csvImportRowsSchema.safeParse(rawRows)
    if (!parsedRows.success) return failure('VALIDATION', 'Une ou plusieurs lignes dépassent les limites autorisées.')

    const invalidRows: string[] = []
    const rows = []
    for (const row of parsedRows.data) {
      const rowIssues: string[] = []
      const nom = row.nom.trim()
      const montant = parseFcfa(row.montant)
      if (!nom) rowIssues.push('nom manquant')
      if (montant === null || montant <= 0) rowIssues.push('montant invalide')
      if (!isValidIsoDate(row.date_service)) rowIssues.push('date invalide (format attendu : AAAA-MM-JJ)')
      if (rowIssues.length > 0 || montant === null) {
        invalidRows.push(`ligne ${row.line} : ${rowIssues.join(', ')}`)
        continue
      }
      try {
        rows.push({
          nom,
          telephone: row.telephone.trim(),
          montantFcfa: montant,
          dateService: row.date_service,
          dateEcheance: addDays(row.date_service, 30),
        })
      } catch {
        invalidRows.push(`ligne ${row.line} : date invalide`)
      }
    }

    if (invalidRows.length > 0) return failure('INVALID_ROWS', `Import annulé. Corrigez : ${invalidRows.join(' ; ')}`)
    if (rows.length !== parsedRows.data.length) return failure('INVALID_ROWS', 'Certaines lignes n’ont pas pu être traitées.')

    const result = await importCreances(user.id, rows)
    if (!result.ok) return result
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/clients')
    return result
  } catch {
    return failure('DATABASE', 'L’import n’a pas abouti. Vérifiez les données et réessayez.')
  }
}