import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import CompanyForm from './CompanyForm';

export default async function OnboardingPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: company, error } = await supabase
    .from('companies')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Impossible de vérifier l’entreprise : ${error.message}`);
  }
  if (company) redirect('/dashboard');

  return (
    <main className="flex min-h-screen items-center justify-center bg-now-bg px-4 py-10">
      <section className="w-full max-w-md border border-now-border bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-now-blue-light">
          Première étape
        </p>
        <h1 className="mt-2 text-2xl font-black text-now-blue">
          Créez votre entreprise
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          Indiquez le nom de votre entreprise pour terminer la configuration de
          votre espace NowPay.
        </p>
        <CompanyForm />
      </section>
    </main>
  );
}
