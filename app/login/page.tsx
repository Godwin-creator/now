'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  LogIn,
  UserPlus,
  AlertCircle,
  ArrowLeft,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

// Phrases pour l'effet typewriter
const TYPEWRITER_PHRASES = [
  'Relancez juste. Récupérez vite.',
  'Scoring algorithmique prédictif du risque.',
  'Relances multicanales IA personnalisées.',
  'Optimisez la trésorerie de votre entreprise.',
]

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // ── Suivi du déplacement du curseur en temps réel ──
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // ── Animation Typewriter ──
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [text, setText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentPhrase = TYPEWRITER_PHRASES[phraseIndex]
    const typeSpeed = isDeleting ? 30 : 65
    const pauseTime = isDeleting ? 400 : 2200

    if (!isDeleting && text === currentPhrase) {
      const timeout = setTimeout(() => setIsDeleting(true), pauseTime)
      return () => clearTimeout(timeout)
    }

    if (isDeleting && text === '') {
      setIsDeleting(false)
      setPhraseIndex((prev) => (prev + 1) % TYPEWRITER_PHRASES.length)
      return
    }

    const timeout = setTimeout(() => {
      setText((prev) =>
        isDeleting
          ? currentPhrase.substring(0, prev.length - 1)
          : currentPhrase.substring(0, prev.length + 1)
      )
    }, typeSpeed)

    return () => clearTimeout(timeout)
  }, [text, isDeleting, phraseIndex])

  // ── Authentification Supabase ──
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const supabase = createClient()

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })

        if (error) {
          setErrorMsg(error.message)
        } else {
          if (data.user) {
            await supabase.from('companies').insert({
              id: data.user.id,
              nom: companyName.trim() || 'Mon Entreprise',
              email: email.trim(),
            })
          }
          setSuccessMsg('Compte créé avec succès ! Redirection en cours…')
          setTimeout(() => {
            router.push('/dashboard')
            router.refresh()
          }, 1200)
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
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

  const tickerText = 'NOW SYSTEM · RECOUVREMENT AMIABLE PAR IA · SCORING RISQUE · MULTICANAL WHATSAPP EMAIL SMS TEL · SUPABASE RLS · '

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a1520] text-white flex flex-col justify-between select-none">
      {/* ── Effet Spotlight Curseur (temps réel) ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(150px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 192, 0, 0.14), rgba(21, 39, 77, 0.12) 40%, transparent 95%)`,
        }}
      />

      {/* ── Grille de fond animée & Formes géométriques flottantes (infinite) ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Grille fine */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(to right, #FFC000 1px, transparent 1px), linear-gradient(to bottom, #FFC000 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Lignes de visée géométriques */}
        <div className="absolute top-0 left-0 w-48 h-px bg-gradient-to-r from-[#FFC000] to-transparent" />
        <div className="absolute top-0 left-0 w-px h-48 bg-gradient-to-b from-[#FFC000] to-transparent" />
        <div className="absolute bottom-0 right-0 w-48 h-px bg-gradient-to-l from-[#FFC000] to-transparent" />
        <div className="absolute bottom-0 right-0 w-px h-48 bg-gradient-to-t from-[#FFC000] to-transparent" />

        {/* Formes flottantes infinies */}
        <div
          className="float-y absolute top-[12%] right-[14%] w-24 h-24 border border-[#FFC000]/20"
          style={{ animationDuration: '8s', animationDelay: '0s' }}
        />
        <div
          className="float-y absolute top-[28%] left-[8%] w-16 h-16 border border-white/10"
          style={{ animationDuration: '6s', animationDelay: '1.2s' }}
        />
        <div
          className="float-y absolute bottom-[22%] right-[8%] w-10 h-10 bg-[#FFC000]/10"
          style={{ animationDuration: '5s', animationDelay: '2s' }}
        />
        <div
          className="float-y absolute bottom-[35%] left-[16%] w-6 h-6 border-2 border-[#FFC000]/30"
          style={{ animationDuration: '7s', animationDelay: '0.8s' }}
        />
        <div
          className="float-y absolute top-[6%] left-[45%] w-32 h-px bg-[#FFC000]/30"
          style={{ animationDuration: '9s', animationDelay: '1.5s' }}
        />
      </div>

      {/* ── Top Header Navigation ── */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="btn-sweep inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/80 border border-white/20 px-3.5 py-2 hover:text-black transition-all"
        >
          <ArrowLeft size={13} />
          <span>Dashboard</span>
        </Link>

        <div className="flex items-center gap-2 text-[10px] font-mono text-[#FFC000] border border-[#FFC000]/40 bg-[#FFC000]/10 px-3 py-1.5 uppercase tracking-widest">
          <ShieldCheck size={12} className="text-[#FFC000]" />
          <span>Portail Sécurisé</span>
        </div>
      </header>

      {/* ── Centre : Carte de Connexion / Inscription ── */}
      <main className="relative z-10 max-w-lg w-full mx-auto px-4 py-6 flex flex-col justify-center">
        {/* ── Grand Logo en Filigrane (Watermark animé en arrière-plan) ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
          animate={{
            opacity: [0.04, 0.08, 0.05, 0.04],
            scale: [1, 1.5, 1.3, 1],
            rotate: [0, 1.5, -1.5, 0],
            y: [0, -10, 6, 0],
          }}
          transition={{
            opacity: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
            scale: { duration: 12, repeat: Infinity, ease: 'easeInOut' },
            rotate: { duration: 16, repeat: Infinity, ease: 'easeInOut' },
            y: { duration: 10, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] sm:w-[600px] pointer-events-none z-0 select-none overflow-visible"
        >
          <Image
            src="/logo_now.png"
            alt="Now Background Watermark"
            width={600}
            height={600}
            priority
            className="w-full h-auto object-contain filter drop-shadow-[0_0_90px_rgba(255,192,0,0.2)] brightness-125"
          />
        </motion.div>

        {/* En-tête de marque + Typewriter */}
        <div className="relative z-10 text-center mb-6 space-y-2">
          {/* Badge logo compact animé */}
          {/* <motion.div
            initial={{ opacity: 0, scale: 0.7, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex justify-center mb-2"
          >
            <div className="relative group p-2 bg-[#15274D]/40 border border-[#FFC000]/40 backdrop-blur-sm shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-[#15274D] to-[#FFC000] opacity-0 group-hover:opacity-20 transition-opacity" />
              <Image
                src="/logo_now.png"
                alt="Now Logo"
                width={48}
                height={48}
                className="w-10 h-10 sm:w-11 sm:h-11 object-contain"
                priority
              />
            </div>
          </motion.div> */}

          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white inline-block">
              Now<span className="shimmer-text">.</span>
            </h1>
          </motion.div>

          {/* Animation Typewriter dynamique */}
          <div className="h-6 flex items-center justify-center">
            <p className="text-xs sm:text-sm font-mono text-[#FFC000] tracking-wider uppercase flex items-center">
              <span>{text}</span>
              <span className="inline-block w-2 h-4 bg-[#FFC000] ml-1 animate-pulse" />
            </p>
          </div>
        </div>

        {/* Conteneur Sharp Brutal */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="bg-white text-gray-900 border-2 border-[#FFC000] shadow-2xl relative overflow-hidden"
        >
          {/* Accent top gradient bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#15274D] via-[#FFC000] to-[#15274D]" />

          {/* Onglets interactifs avec glissement layoutId */}
          <div className="grid grid-cols-2 border-b border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false)
                setErrorMsg(null)
                setSuccessMsg(null)
              }}
              className={`relative py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                !isSignUp ? 'text-[#15274D] bg-white' : 'text-gray-400 bg-gray-50 hover:text-gray-700'
              }`}
            >
              <LogIn size={14} className={!isSignUp ? 'text-[#15274D]' : 'text-gray-400'} />
              <span>Connexion</span>
              {!isSignUp && (
                <motion.div
                  layoutId="auth-tab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-[#15274D]"
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSignUp(true)
                setErrorMsg(null)
                setSuccessMsg(null)
              }}
              className={`relative py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                isSignUp ? 'text-[#15274D] bg-white' : 'text-gray-400 bg-gray-50 hover:text-gray-700'
              }`}
            >
              <UserPlus size={14} className={isSignUp ? 'text-[#15274D]' : 'text-gray-400'} />
              <span>Créer un compte</span>
              {isSignUp && (
                <motion.div
                  layoutId="auth-tab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-[#15274D]"
                />
              )}
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            {/* Messages alertes */}
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2.5 p-3.5 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs font-bold"
                >
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs font-bold"
                >
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleAuth} className="space-y-4">
              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div
                    key="company-field"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                      Nom de l'entreprise *
                    </label>
                    <div className="relative">
                      <Building2
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="ex: Lomé Tech Solutions"
                        className="input-anim w-full pl-10 pr-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-now-yellow/20 focus:border-now-yellow"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Champ Email */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                  Email professionnel *
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@entreprise.com"
                    className="input-anim w-full pl-10 pr-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-now-yellow/20 focus:border-now-yellow"
                  />
                </div>
              </div>

              {/* Champ Mot de passe avec toggle visibilité */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                  Mot de passe *
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-anim w-full pl-10 pr-10 py-3 text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-now-yellow/20 focus:border-now-yellow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Bouton d'action principal avec Sweep */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary-sweep w-full py-4 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin" />
                    <span>Traitement en cours…</span>
                  </>
                ) : isSignUp ? (
                  <>
                    <Sparkles size={14} className="text-[#FFC000]" />
                    <span>Créer mon compte entreprise</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} className="text-[#FFC000]" />
                    <span>Accéder à mon espace</span>
                  </>
                )}
              </button>
            </form>

            {/* Pied de formulaire */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-semibold">
              <span>{isSignUp ? 'Déjà inscrit ?' : 'Nouveau sur Now ?'}</span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setErrorMsg(null)
                  setSuccessMsg(null)
                }}
                className="text-[#15274D] font-black uppercase tracking-wider hover:underline flex items-center gap-1"
              >
                <span>{isSignUp ? 'Se connecter' : 'Créer un compte'}</span>
                <ArrowRight size={11} />
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* ── Footer Ticker Marquee infini ── */}
      <footer className="relative z-10 border-t border-white/10 bg-black/40 h-8 flex items-center overflow-hidden">
        <div
          className="flex whitespace-nowrap text-[10px] font-mono text-[#FFC000]/60 tracking-widest gap-0"
          style={{ animation: 'marquee 22s linear infinite' }}
        >
          <span className="pr-16">{tickerText}</span>
          <span className="pr-16">{tickerText}</span>
        </div>
      </footer>
    </div>
  )
}
