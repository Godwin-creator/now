'use client';

import { useState } from 'react';
import {
  createGoogleOAuthCallbackUrl,
  createGoogleOAuthConsentCookieValue,
  GOOGLE_OAUTH_CONSENT_COOKIE,
} from '@/lib/auth/google-oauth';
import { createClient } from '@/utils/supabase/client';

type GoogleOAuthSectionProps = {
  signup: boolean;
  legal: boolean;
  rights: boolean;
  disabled: boolean;
  onError: (message: string) => void;
};

export default function GoogleOAuthSection({
  signup,
  legal,
  rights,
  disabled,
  onError,
}: GoogleOAuthSectionProps) {
  const [pending, setPending] = useState(false);

  async function signInWithGoogle() {
    if (pending || disabled) return;
    if (signup && (!legal || !rights)) {
      onError(
        'Acceptez les conditions et confirmez vos droits sur les données pour continuer avec Google.',
      );
      return;
    }

    setPending(true);
    onError('');
    try {
      const secureCookie =
        window.location.protocol === 'https:' ? '; Secure' : '';
      const cookieValue = signup ? createGoogleOAuthConsentCookieValue() : '';
      const maxAge = signup ? 600 : 0;
      document.cookie = `${GOOGLE_OAUTH_CONSENT_COOKIE}=${cookieValue}; Path=/; SameSite=Lax; Max-Age=${maxAge}${secureCookie}`;
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: createGoogleOAuthCallbackUrl(window.location.origin),
        },
      });

      if (error) {
        onError('La connexion Google est indisponible. Réessayez.');
        return;
      }
      if (!data.url) {
        onError('La connexion Google n’a pas pu démarrer. Réessayez.');
        return;
      }
      window.location.assign(data.url);
    } catch {
      onError('La connexion Google est indisponible. Réessayez.');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="my-5 flex items-center gap-3 text-sm text-gray-500">
        <span className="h-px flex-1 bg-now-border" />
        <span>ou</span>
        <span className="h-px flex-1 bg-now-border" />
      </div>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={signInWithGoogle}
        className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-now-border bg-white px-4 font-semibold text-now-blue hover:bg-now-bg disabled:opacity-60"
      >
        <GoogleMark />
        {pending
          ? 'Redirection vers Google…'
          : signup
            ? 'Créer un compte avec Google'
            : 'Continuer avec Google'}
      </button>
    </>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.02 13.22l7.98 6.19C12.67 13.72 17.87 9.5 24 9.5Z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.8 46.98 24.55Z"
      />
      <path
        fill="#FBBC05"
        d="M10.99 28.59A14.4 14.4 0 0 1 10.2 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.86.92 7.52 2.98 10.78l8.01-6.19Z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.87 2.3-8.18 2.3-6.13 0-11.33-4.22-13-9.91l-8.01 6.19C6.48 43.62 14.6 48 24 48Z"
      />
    </svg>
  );
}
