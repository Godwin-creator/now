'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function signUpWithCompany(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const nomEntreprise = String(formData.get('nomEntreprise') ?? '').trim()

  if (!email || !password || !nomEntreprise) {
    return { success: false, error: 'Email, mot de passe et nom de l’entreprise sont obligatoires.' }
  }

  if (password.length < 6) {
    return { success: false, error: 'Le mot de passe doit contenir au moins 6 caractères.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    const message = error.message?.toLowerCase() ?? ''
    if (message.includes('already') || message.includes('exist')) {
      return {
        success: false,
        error: 'Un compte existe déjà pour cette adresse email. Veuillez vous connecter.',
      }
    }

    return { success: false, error: error.message || 'Impossible de créer le compte.' }
  }

  if (!data.user?.id) {
    return {
      success: false,
      error: 'Le compte a bien été créé, mais la confirmation de votre email est nécessaire avant l’accès.',
    }
  }

  const { error: companyError } = await supabase.from('companies').insert({
    id: data.user.id,
    nom: nomEntreprise,
    email,
  })

  if (companyError) {
    const message = companyError.message?.toLowerCase() ?? ''
    if (message.includes('duplicate') || message.includes('already') || message.includes('unique')) {
      return {
        success: false,
        error: 'Une entreprise est déjà associée à ce compte. Veuillez vous connecter.',
      }
    }

    return {
      success: false,
      error: companyError.message || 'La création de l’entreprise a échoué.',
    }
  }

  return {
    success: true,
    needsEmailConfirmation: !data.session,
  }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
