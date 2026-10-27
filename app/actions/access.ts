'use server';

import { failure, getAuthErrorCode, getAuthErrorMessage, success, type Result } from '@/lib/auth/result';
import { signUpSchema, signupCodeSchema } from '@/lib/validation/auth';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

const loginPasswordSchema = z.string().min(1).max(128);
const newPasswordSchema = z.string().min(8).max(128);

export async function signIn(email: string, password: string): Promise<Result<{ confirmationRequired: boolean }>> {
  const parsed = signUpSchema.shape.email.safeParse(email);
  const parsedPassword = loginPasswordSchema.safeParse(password);
  if (!parsed.success || !parsedPassword.success) return failure('VALIDATION', 'Saisissez une adresse e-mail et un mot de passe valides.');
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data, password: parsedPassword.data });
    if (error) {
      const code = getAuthErrorCode(error);
      if (code === 'email_not_confirmed') return success({ confirmationRequired: true });
      return failure(code ?? 'AUTH', getAuthErrorMessage(error));
    }
    return success({ confirmationRequired: false });
  } catch { return failure('UNAVAILABLE', 'Le service de connexion est temporairement indisponible.'); }
}

const recoveryCodeSchema = signupCodeSchema;
export async function requestPasswordReset(email: string): Promise<Result<{ message: string }>> {
  const parsed = signUpSchema.shape.email.safeParse(email);
  if (!parsed.success) return failure('VALIDATION', 'Saisissez une adresse e-mail valide.');
  try {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(parsed.data);
    return success({ message: 'Si cette adresse correspond à un compte, un code de récupération lui sera envoyé.' });
  } catch { return success({ message: 'Si cette adresse correspond à un compte, un code de récupération lui sera envoyé.' }); }
}

export async function verifyRecoveryCode(email: string, code: string): Promise<Result<null>> {
  const parsed = recoveryCodeSchema.safeParse({ email, code });
  if (!parsed.success) return failure('VALIDATION', 'Saisissez le code à six chiffres reçu par e-mail.');
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ email: parsed.data.email, token: parsed.data.code, type: 'recovery' });
    if (error) return failure(getAuthErrorCode(error) ?? 'AUTH', getAuthErrorMessage(error));
    return success(null);
  } catch { return failure('UNAVAILABLE', 'La vérification est temporairement indisponible.'); }
}

export async function setNewPassword(password: string): Promise<Result<null>> {
  const parsed = newPasswordSchema.safeParse(password);
  if (!parsed.success) return failure('VALIDATION', 'Le mot de passe doit contenir au moins 8 caractères.');
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return failure('AUTH', 'Le code de récupération a expiré. Demandez-en un nouveau.');
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    if (error) return failure(getAuthErrorCode(error) ?? 'AUTH', getAuthErrorMessage(error));
    return success(null);
  } catch { return failure('UNAVAILABLE', 'La modification est temporairement indisponible.'); }
}
