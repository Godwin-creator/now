'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { importerCreances } from '@/app/actions/importCsv'

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

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Le fichier CSV ne doit pas dépasser 2 Mo.' })
      setLoading(false)
      e.target.value = ''
      return
    }

    try {
      const formData = new FormData()
      formData.set('csv', file)
      const result = await importerCreances(formData)
      if (!result.ok) {
        setMessage({ type: 'error', text: result.error.message })
      } else {
        setMessage({
          type: 'success',
          text: `${result.data.count} créance${result.data.count > 1 ? 's' : ''} importée${result.data.count > 1 ? 's' : ''} avec succès !`,
        })
        onImportSuccess?.(result.data.count)
      }
    } catch {
      setMessage({ type: 'error', text: 'L’import n’a pas abouti. Réessayez.' })
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
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
