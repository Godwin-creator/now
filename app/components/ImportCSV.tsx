'use client'

import { useState, useRef } from 'react'
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
        className="btn-sweep inline-flex min-h-11 items-center gap-2 border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-800 shadow-sm transition-colors hover:border-gray-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
        title="Importer plusieurs créances via un fichier CSV"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin text-[#15274D]" />
            <span>Import en cours…</span>
          </>
        ) : (
          <>
            <FileSpreadsheet size={16} className="text-[#15274D]" />
            <span>Importer CSV</span>
            <Upload size={14} className="text-[#806900] ml-0.5" />
          </>
        )}
      </button>

      {/* Message feedback flottant / toast */}
      {message && (
          <div role={message.type === 'error' ? 'alert' : 'status'} aria-live="polite"
            className={`absolute right-0 top-full z-50 mt-1.5 flex max-w-[min(92vw,24rem)] items-start gap-2 border-l-4 p-3 text-sm font-bold shadow-lg ${
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
              className="ml-auto inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center text-sm underline opacity-80 hover:opacity-100"
            >
              ×
            </button>
          </div>
        )}
    </div>
  )
}
