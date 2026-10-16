import { NextRequest, NextResponse } from 'next/server';
import { requireCompany } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.redirect(new URL('/auth/error', request.url));

  const supabase = await createClient();
  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    console.error('Échec de l’échange du code OAuth Supabase :', exchangeError);
    return NextResponse.redirect(new URL('/auth/error', request.url));
  }

  await requireCompany();
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
