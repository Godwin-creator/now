'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Eye, EyeOff, Lock, Mail, Sparkles, UserPlus } from 'lucide-react'
import { signUpWithCompany } from '@/app/actions/auth'

export default function SignupPage() {
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.set('nomEntreprise', companyName)
      formData.set('email', email)
      formData.set('password', password)

      const result = await signUpWithCompany(formData)

      if (!result.success) {
        setError(result.error ?? 'Impossible de créer le compte.')
        return
      }

      if (result.needsEmailConfirmation) {
        setSuccess('Compte créé. Vérifiez votre email pour finaliser votre inscription.')
        setTimeout(() => router.push('/login'), 1500)
        return
      }

      setSuccess('Compte créé avec succès ! Redirection en cours…')
      setTimeout(() => router.push('/dashboard'), 1200)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l’inscription.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-now-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white border border-now-border shadow-[0_12px_40px_rgba(18,50,116,0.08)]">
        <div className="h-1.5 w-full bg-gradient-to-r from-now-blue via-now-yellow to-now-blue" />

        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-now-blue-light">Onboarding</p>
            <h1 className="text-xl font-black text-now-blue">Créer mon compte</h1>
          </div>
          <div className="flex items-center justify-center rounded-full bg-now-yellow/15 p-2 text-now-blue">
            <UserPlus size={18} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="border-l-4 border-red-500 bg-red-50 p-3 text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="border-l-4 border-emerald-500 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
              {success}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-now-blue-light">
              Nom de l’entreprise *
            </label>
            <div className="relative">
              <Building2 size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="ex: Lomé Business Group"
                className="w-full border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm font-medium text-gray-900 focus:border-now-yellow focus:ring-2 focus:ring-now-yellow/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-now-blue-light">
              Email professionnel *
            </label>
            <div className="relative">
              <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@entreprise.com"
                className="w-full border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm font-medium text-gray-900 focus:border-now-yellow focus:ring-2 focus:ring-now-yellow/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.18em] text-now-blue-light">
              Mot de passe *
            </label>
            <div className="relative">
              <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 bg-gray-50 py-3 pl-10 pr-10 text-sm font-medium text-gray-900 focus:border-now-yellow focus:ring-2 focus:ring-now-yellow/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-now-blue"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 bg-now-blue px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-now-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Création en cours…
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-now-yellow" />
                Créer mon compte
              </>
            )}
          </button>

          <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-[11px] font-bold text-gray-600">
            <span>Vous avez déjà un compte ?</span>
            <Link href="/login" className="inline-flex items-center gap-1 text-now-blue hover:underline">
              Se connecter
              <ArrowLeft size={12} className="rotate-180" />
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
