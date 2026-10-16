'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getAuthErrorMessage, type Result } from '@/lib/auth/result';
import {
  companyNameSchema,
  signUpSchema,
  signupCodeSchema,
} from '@/lib/auth/validation';
import { createClient } from '@/utils/supabase/server';

type SignUpResult = { verificationRequired: boolean };

export async function signUp(
  email: string,
  password: string,
): Promise<Result<SignUpResult>> {
  const parsed = signUpSchema.safeParse({ email, password });
  if (!parsed.success) {
    return {
      success: false,
      error:
        'Saisissez une adresse e-mail valide et un mot de passe d’au moins 8 caractères.',
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) return { success: false, error: getAuthErrorMessage(error) };
    if (!data.user) {
      return {
        success: false,
        error:
          'Le compte n’a pas pu être créé. Réessayez dans quelques instants.',
      };
    }

    return {
      success: true,
      data: { verificationRequired: !data.session },
    };
  } catch {
    return {
      success: false,
      error: 'Le service d’inscription est temporairement indisponible.',
    };
  }
}

export async function verifySignupCode(
  email: string,
  code: string,
): Promise<Result<null>> {
  const parsed = signupCodeSchema.safeParse({ email, code });
  if (!parsed.success) {
    return {
      success: false,
      error: 'Saisissez une adresse e-mail valide et le code à 8 chiffres.',
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email: parsed.data.email,
      token: parsed.data.code,
      type: 'signup',
    });

    if (error) return { success: false, error: getAuthErrorMessage(error) };
    if (!data.user || !data.session) {
      return {
        success: false,
        error: 'La vérification n’a pas abouti. Demandez un nouveau code.',
      };
    }
    return { success: true, data: null };
  } catch {
    return {
      success: false,
      error: 'La vérification est temporairement indisponible. Réessayez.',
    };
  }
}

export async function resendSignupCode(email: string): Promise<Result<null>> {
  const parsedEmail = signUpSchema.shape.email.safeParse(email);
  if (!parsedEmail.success) {
    return { success: false, error: 'Saisissez une adresse e-mail valide.' };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: parsedEmail.data,
    });

    if (error) return { success: false, error: getAuthErrorMessage(error) };
    return { success: true, data: null };
  } catch {
    return {
      success: false,
      error:
        'Impossible d’envoyer le code pour le moment. Réessayez plus tard.',
    };
  }
}

export async function createCompany(name: string): Promise<Result<null>> {
  const user = await requireUser();
  const parsedName = companyNameSchema.safeParse(name);
  if (!parsedName.success) {
    return {
      success: false,
      error: 'Le nom de l’entreprise est obligatoire (120 caractères maximum).',
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('companies').upsert(
    {
      id: user.id,
      nom: parsedName.data,
      email: user.email ?? null,
    },
    { onConflict: 'id', ignoreDuplicates: true },
  );

  if (error) {
    console.error('Erreur lors de la création de l’entreprise :', error);
    return {
      success: false,
      error:
        'Impossible de créer l’entreprise. Vérifiez vos informations et réessayez.',
    };
  }
  return { success: true, data: null };
}

export async function signOut(): Promise<void> {
  await requireUser();
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
