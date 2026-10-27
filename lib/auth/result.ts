export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export function success<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function failure(code: string, message: string): Result<never> {
  return { ok: false, error: { code, message } };
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  over_email_send_rate_limit:
    'Trop de demandes ont été envoyées. Attendez un peu avant de réessayer.',
  email_not_confirmed:
    'Votre adresse e-mail n’est pas confirmée. Saisissez le code reçu pour activer votre compte.',
  invalid_credentials: 'Adresse e-mail ou mot de passe incorrect.',
  otp_expired: 'Ce code a expiré. Demandez-en un nouveau.',
  invalid_otp:
'Ce code est invalide. Vérifiez les six chiffres reçus par e-mail.',
  validation_failed:
'Ce code est invalide ou expiré. Vérifiez les six chiffres ou demandez-en un nouveau.',
  user_already_exists:
    'Un compte existe déjà avec cette adresse e-mail. Connectez-vous.',
  email_exists:
    'Un compte existe déjà avec cette adresse e-mail. Connectez-vous.',
};

export function getAuthErrorCode(error: unknown): string | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code;
  }
  return undefined;
}

export function getAuthErrorMessage(error: unknown): string {
  const code = getAuthErrorCode(error);
  return (
    (code && AUTH_ERROR_MESSAGES[code]) ??
    'Une erreur est survenue. Vérifiez vos informations et réessayez.'
  );
}
