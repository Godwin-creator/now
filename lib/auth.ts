import 'server-only';

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return user;
}

export async function requireCompany() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: company, error } = await supabase
    .from('companies')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (error)
    throw new Error(`Impossible de vérifier l’entreprise : ${error.message}`);
  if (!company) redirect('/onboarding');

  return { user, company };
}
