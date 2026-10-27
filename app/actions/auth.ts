'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import {
  failure,
  getAuthErrorCode,
  getAuthErrorMessage,
  success,
  type Result,
} from '@/lib/auth/result';
import {
  companyNameSchema,
  signUpSchema,
  signupCodeSchema,
} from '@/lib/validation/auth';
import { createClient } from '@/utils/supabase/server';

type SignUpResult = { verificationRequired: boolean };

export async function signUp(
  email: string,
  password: string,
  legalAccepted: boolean,
  thirdPartyDataRightsConfirmed: boolean,
): Promise<Result<SignUpResult>> {
  const parsed = signUpSchema.safeParse({ email, password, legalAccepted, thirdPartyDataRightsConfirmed });
  if (!parsed.success) {
    return failure('VALIDATION', 'Saisissez une adresse e-mail valide, un mot de passe d’au moins 8 caractères et confirmez les deux cases requises.');
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          legal_consent_version: '2026-10-17',
          legal_consent_at: new Date().toISOString(),
          third_party_contact_rights_confirmed: true,
        },
      },
    });

    if (error) return failure(getAuthErrorCode(error) ?? 'AUTH', getAuthErrorMessage(error));
    if (!data.user) {
      return failure('AUTH', 'Le compte n’a pas pu être créé. Réessayez dans quelques instants.');
    }

    return success({ verificationRequired: !data.session });
  } catch {
    return failure('UNAVAILABLE', 'Le service d’inscription est temporairement indisponible.');
  }
}

export async function verifySignupCode(
  email: string,
  code: string,
): Promise<Result<null>> {
  const parsed = signupCodeSchema.safeParse({ email, code });
  if (!parsed.success) {
    return failure('VALIDATION', 'Saisissez une adresse e-mail valide et le code à 6 chiffres.');
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email: parsed.data.email,
      token: parsed.data.code,
      type: 'signup',
    });

    if (error) return failure(getAuthErrorCode(error) ?? 'AUTH', getAuthErrorMessage(error));
    if (!data.user || !data.session) {
      return failure('AUTH', 'La vérification n’a pas abouti. Demandez un nouveau code.');
    }
    return success(null);
  } catch {
    return failure('UNAVAILABLE', 'La vérification est temporairement indisponible. Réessayez.');
  }
}

export async function resendSignupCode(email: string): Promise<Result<null>> {
  const parsedEmail = signUpSchema.shape.email.safeParse(email);
  if (!parsedEmail.success) {
    return failure('VALIDATION', 'Saisissez une adresse e-mail valide.');
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: parsedEmail.data,
    });

    if (error) return failure(getAuthErrorCode(error) ?? 'AUTH', getAuthErrorMessage(error));
    return success(null);
  } catch {
    return failure('UNAVAILABLE', 'Impossible d’envoyer le code pour le moment. Réessayez plus tard.');
  }
}

export async function createCompany(name: string): Promise<Result<null>> {
  const user = await requireUser();
  const parsedName = companyNameSchema.safeParse(name);
  if (!parsedName.success) {
    return failure('VALIDATION', 'Le nom de l’entreprise est obligatoire (120 caractères maximum).');
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from('companies').upsert(
      {
        id: user.id,
        nom: parsedName.data,
        email: user.email ?? null,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    );

    if (error) return failure('DATABASE', 'Impossible de créer l’entreprise. Vérifiez vos informations et réessayez.');
    return success(null);
  } catch {
    return failure('DATABASE', 'Impossible de créer l’entreprise. Réessayez dans quelques instants.');
  }
}

export async function signOut(): Promise<Result<null>> {
  await requireUser();
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) return failure('AUTH', 'La déconnexion n’a pas abouti. Réessayez.');
  } catch {
    return failure('AUTH', 'La déconnexion n’a pas abouti. Réessayez.');
  }
  redirect('/login');
}
