import { describe, expect, it } from 'vitest';
import {
  createGoogleOAuthCallbackUrl,
  createGoogleOAuthConsentCookieValue,
  getOAuthErrorReason,
  hasGoogleOAuthConsent,
  hasStoredGoogleOAuthConsent,
} from '@/lib/auth/google-oauth';

describe('Google OAuth helpers', () => {
  it('builds the exact callback URL for the active app origin', () => {
    const callback = new URL(
      createGoogleOAuthCallbackUrl('https://www.nowpay.website'),
    );

    expect(callback.origin).toBe('https://www.nowpay.website');
    expect(callback.pathname).toBe('/auth/callback');
    expect(callback.search).toBe('');
  });

  it('accepts only the expected short-lived consent cookie value', () => {
    const consent = createGoogleOAuthConsentCookieValue();

    expect(hasGoogleOAuthConsent(consent)).toBe(true);
    expect(hasGoogleOAuthConsent(undefined)).toBe(false);
    expect(hasGoogleOAuthConsent('ancienne-version-accepted')).toBe(false);
    expect(hasGoogleOAuthConsent(`${consent}:tampered`)).toBe(false);
  });

  it('allows login without showing consent again only when both consents were stored', () => {
    expect(
      hasStoredGoogleOAuthConsent({
        legal_consent_version: '2026-10-17',
        third_party_contact_rights_confirmed: true,
      }),
    ).toBe(true);
    expect(
      hasStoredGoogleOAuthConsent({
        legal_consent_version: '2026-10-17',
        third_party_contact_rights_confirmed: false,
      }),
    ).toBe(false);
    expect(hasStoredGoogleOAuthConsent({})).toBe(false);
  });

  it('maps OAuth cancellation separately from provider failures', () => {
    expect(getOAuthErrorReason('access_denied')).toBe('cancelled');
    expect(getOAuthErrorReason('server_error')).toBe('failed');
    expect(getOAuthErrorReason(null)).toBeNull();
  });
});
