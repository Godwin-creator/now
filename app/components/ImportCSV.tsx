'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { importerCreances, CreanceImportPayload } from '@/app/actions/importCsv'
import Papa from 'papaparse'

interface ImportCSVProps {
  onImportSuccess?: (count: number) => void
}

export default function ImportCSV({ onImportSuccess }: ImportCSVProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setMessage(null)

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const payload: CreanceImportPayload[] = []
          
          let startIndex = 0
          if (results.data.length > 0) {
            const firstRow = results.data[0] as string[]
            const isHeader = firstRow.some(t => 
              typeof t === 'string' && (t.toLowerCase().includes('nom') || t.toLowerCase().includes('client') || t.toLowerCase().includes('montant') || t.toLowerCase().includes('date') || t.toLowerCase().includes('téléphone'))
            )
            if (isHeader) startIndex = 1
          }

          for (let i = startIndex; i < results.data.length; i++) {
            const row = results.data[i] as string[]
            if (row.length < 3) continue

            const nom = (row[0] || '').trim()
            const telephone = (row[1] || '').trim()
            const montantStr = (row[2] || '').trim()
            const dateStr = (row[3] || '').trim()

            if (!nom) continue
            
            const montantClean = montantStr.replace(/[^0-9]/g, '')
            const montant = Number(montantClean) || 0
            if (montant <= 0) continue
            
            let dateService = new Date(dateStr)
            if (isNaN(dateService.getTime())) {
              const parts = dateStr.split(/[\/\-\.]/)
              if (parts.length === 3 && parts[2].length === 4) {
                 dateService = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`)
              }
            }
            if (isNaN(dateService.getTime())) {
              dateService = new Date()
            }

            payload.push({
              nom,
              telephone,
              montant_fcfa: montant,
              date_service: dateService.toISOString().split('T')[0]
            })
          }

          if (payload.length === 0) {
            setMessage({ type: 'error', text: 'Aucune donnée valide trouvée dans le CSV (Montant ou nom manquant).' })
            setLoading(false)
            return
          }

          const res = await importerCreances(payload)

          if (res.success && res.count) {
            setMessage({
              type: 'success',
              text: `${res.count} créance${res.count > 1 ? 's' : ''} importée${res.count > 1 ? 's' : ''} avec succès !`,
            })
            if (onImportSuccess) {
              onImportSuccess(res.count)
            }
          } else {
            setMessage({
              type: 'error',
              text: res.error || "Une erreur est survenue lors de l'import.",
            })
          }
        } catch (err: unknown) {
          setMessage({
            type: 'error',
            text: err instanceof Error ? err.message : "Erreur de traitement des données.",
          })
        } finally {
          setLoading(false)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
      },
      error: (error) => {
        setMessage({ type: 'error', text: `Erreur PapaParse : ${error.message}` })
        setLoading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    })
  }

  return (
    <div className="relative inline-flex flex-col items-end">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv,application/vnd.ms-excel"
        className="hidden"
        onChange={handleFileChange}
        disabled={loading}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="btn-sweep inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-gray-300 bg-white text-gray-700 hover:text-black hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer select-none"
        title="Importer plusieurs créances via un fichier CSV"
      >
        {loading ? (
          <>
            <Loader2 size={13} className="animate-spin text-[#15274D]" />
            <span>Import en cours…</span>
          </>
        ) : (
          <>
            <FileSpreadsheet size={13} className="text-[#15274D]" />
            <span>Importer CSV</span>
            <Upload size={11} className="text-[#FFC000] ml-0.5" />
          </>
        )}
      </button>

      {/* Message feedback flottant / toast */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className={`absolute top-full mt-1.5 right-0 z-50 p-2.5 shadow-lg border-l-4 text-xs font-bold whitespace-nowrap flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-500'
                : 'bg-rose-50 text-rose-900 border-rose-500'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={14} className="text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="ml-2 text-[10px] uppercase font-mono opacity-60 hover:opacity-100 underline"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
