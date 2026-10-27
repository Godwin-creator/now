export const GOOGLE_LEGAL_CONSENT_VERSION = '2026-10-17';
export const GOOGLE_OAUTH_CONSENT_COOKIE = 'nowpay-google-consent';

export type OAuthErrorReason = 'cancelled' | 'failed';

export function createGoogleOAuthCallbackUrl(origin: string): string {
  return new URL('/auth/callback', origin).toString();
}

export function createGoogleOAuthConsentCookieValue(): string {
  return `${GOOGLE_LEGAL_CONSENT_VERSION}-accepted`;
}

export function hasGoogleOAuthConsent(
  cookieValue: string | undefined,
): boolean {
  return cookieValue === createGoogleOAuthConsentCookieValue();
}

export function hasStoredGoogleOAuthConsent(
  userMetadata: Readonly<Record<string, unknown>>,
): boolean {
  return (
    userMetadata.legal_consent_version === GOOGLE_LEGAL_CONSENT_VERSION &&
    userMetadata.third_party_contact_rights_confirmed === true
  );
}

export function getOAuthErrorReason(
  errorCode: string | null,
): OAuthErrorReason | null {
  if (!errorCode) return null;
  return errorCode === 'access_denied' ? 'cancelled' : 'failed';
}
