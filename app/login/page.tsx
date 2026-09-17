'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogIn, UserPlus, AlertCircle, ArrowLeft, Building2 } from 'lucide-react'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const supabase = createClient()

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) {
          setErrorMsg(error.message)
        } else {
          // Créer l'entrée dans la table companies si un utilisateur a été créé
          if (data.user) {
            await supabase.from('companies').insert({
              id: data.user.id,
              nom: companyName.trim() || 'Mon Entreprise',
              email: email
            })
          }
          setSuccessMsg("Compte créé avec succès ! Vous pouvez maintenant vous connecter ou accéder au dashboard.")
          router.push('/dashboard')
          router.refresh()
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setErrorMsg(error.message)
        } else {
          router.push('/dashboard')
          router.refresh()
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur d'authentification."
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 mb-6 font-medium">
          <ArrowLeft size={14} /> Retour au tableau de bord
        </Link>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-blue-950">Now.</h1>
          <p className="text-xs text-gray-500 mt-1">
            {isSignUp ? "Créer un compte pour votre entreprise" : "Connexion à votre espace de recouvrement"}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-semibold">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Nom de votre entreprise *</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Lomé Tech Services"
                  className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Email professionnel *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@entreprise.com"
              className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Mot de passe *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-60 shadow-md shadow-blue-500/20 text-sm flex items-center justify-center gap-2"
          >
            {loading ? "Chargement..." : isSignUp ? (
              <><UserPlus size={16} /> S'inscrire</>
            ) : (
              <><LogIn size={16} /> Se connecter</>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500 border-t pt-4">
          {isSignUp ? (
            <p>
              Vous avez déjà un compte ?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false)
                  setErrorMsg(null)
                }}
                className="font-bold text-blue-600 hover:underline"
              >
                Se connecter
              </button>
            </p>
          ) : (
            <p>
              Pas encore de compte ?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true)
                  setErrorMsg(null)
                }}
                className="font-bold text-blue-600 hover:underline"
              >
                Créer un compte
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
