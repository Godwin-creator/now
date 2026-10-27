import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireCompany } from '@/lib/auth';
import {
  getOAuthErrorReason,
  hasGoogleOAuthConsent,
  hasStoredGoogleOAuthConsent,
  GOOGLE_LEGAL_CONSENT_VERSION,
  GOOGLE_OAUTH_CONSENT_COOKIE,
} from '@/lib/auth/google-oauth';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const acceptedConsent = hasGoogleOAuthConsent(
    request.cookies.get(GOOGLE_OAUTH_CONSENT_COOKIE)?.value,
  );
  const cookieStore = await cookies();
  cookieStore.delete(GOOGLE_OAUTH_CONSENT_COOKIE);

  const oauthError = getOAuthErrorReason(
    request.nextUrl.searchParams.get('error') ??
      request.nextUrl.searchParams.get('error_code'),
  );
  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/auth/error?reason=${oauthError}`, request.url),
    );
  }

  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(
      new URL('/auth/error?reason=failed', request.url),
    );
  }

  if (!acceptedConsent) {
    return NextResponse.redirect(
      new URL('/auth/error?reason=consent', request.url),
    );
  }

  const supabase = await createClient();
  try {
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;

    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data.user)
      throw userError ?? new Error('Session absente');
    if (
      !data.user.identities?.some((identity) => identity.provider === 'google')
    ) {
      throw new Error('Le fournisseur Google est absent de la session.');
    }

    if (acceptedConsent) {
      const { error: consentError } = await supabase.auth.updateUser({
        data: {
          legal_consent_version: GOOGLE_LEGAL_CONSENT_VERSION,
          legal_consent_at: new Date().toISOString(),
          third_party_contact_rights_confirmed: true,
        },
      });
      if (consentError) throw consentError;
    } else if (!hasStoredGoogleOAuthConsent(data.user.user_metadata)) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL('/auth/error?reason=consent', request.url),
      );
    }
  } catch {
    return NextResponse.redirect(
      new URL('/auth/error?reason=failed', request.url),
    );
  }

  await requireCompany();
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
