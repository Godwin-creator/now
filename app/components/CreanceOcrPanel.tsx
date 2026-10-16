'use client'

import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Camera, ChevronDown, ChevronUp, FileUp, ScanLine, Sparkles } from 'lucide-react'
import { scannerFacture } from '@/app/actions/ocr'
import type { InvoiceOcr } from '@/lib/ai/contracts'

export default function CreanceOcrPanel({ onExtracted }: { onExtracted: (data: InvoiceOcr) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setLoading(true)
    setNotice(null)
    setError(null)
    try {
      const formData = new FormData()
      formData.set('facture', file)
      const result = await scannerFacture(formData)
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      onExtracted(result.data)
      setNotice('Les champs détectés ont été reportés dans le formulaire.')
      setIsOpen(false)
    } catch {
      setError('Le document n’a pas pu être analysé. Réessayez avec un autre fichier.')
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (cameraInputRef.current) cameraInputRef.current.value = ''
    }
  }

  return (
    <section className="border border-gray-200 bg-gray-50/50" aria-label="Scanner une facture">
      <input ref={fileInputRef} type="file" accept="image/*,.pdf,application/pdf" className="hidden" onChange={handleFile} disabled={loading} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} disabled={loading} />
      <button type="button" onClick={() => setIsOpen((open) => !open)} className="flex min-h-11 w-full items-center justify-between p-3 text-left hover:bg-gray-100/80">
        <span className="flex items-center gap-2 text-sm font-bold text-gray-800"><Camera size={16} />Scanner une facture (IA)<span className="hidden text-xs font-medium text-slate-500 sm:inline">Caméra / PDF</span></span>
        {isOpen || loading ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <AnimatePresence initial={false}>
        {(isOpen || loading) && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-200">
          <div className="space-y-3 p-3">
            {loading ? <div className="flex min-h-16 items-center justify-center gap-3 text-sm font-semibold text-now-blue"><ScanLine className="animate-pulse" />Analyse en cours…</div> : <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex min-h-16 flex-col items-center justify-center gap-1 border border-dashed border-now-blue/40 bg-white p-3 text-sm font-semibold text-now-blue"><Camera size={20} />Caméra</button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex min-h-16 flex-col items-center justify-center gap-1 border border-dashed border-now-yellow/60 bg-white p-3 text-sm font-semibold text-now-blue"><FileUp size={20} />Importer</button>
            </div>}
            {error && <p role="alert" className="flex items-center gap-2 text-sm text-red-700"><AlertCircle size={16} />{error}</p>}
            {notice && <p role="status" className="flex items-center gap-2 text-sm text-emerald-700"><Sparkles size={15} />{notice}</p>}
          </div>
        </motion.div>}
      </AnimatePresence>
    </section>
  )
}