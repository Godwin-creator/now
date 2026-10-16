import { redirect } from 'next/navigation';
import { signUpSchema } from '@/lib/auth/validation';
import VerifyCodeForm from './VerifyCodeForm';

type VerifyPageProps = {
  searchParams: Promise<{ email?: string; resend?: string }>;
};

export default async function VerifySignupPage({
  searchParams,
}: VerifyPageProps) {
  const { email, resend } = await searchParams;
  const parsedEmail = signUpSchema.shape.email.safeParse(email);
  if (!parsedEmail.success) redirect('/signup');

  return (
    <main className="flex min-h-screen items-center justify-center bg-now-bg px-4 py-10">
      <section className="w-full max-w-md border border-now-border bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-now-blue-light">
          Vérification de l’adresse
        </p>
        <h1 className="mt-2 text-2xl font-black text-now-blue">
          Entrez le code à 8 chiffres reçu par e-mail
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          Nous avons envoyé un code à <strong>{parsedEmail.data}</strong>.
        </p>
        <VerifyCodeForm
          email={parsedEmail.data}
          canResendImmediately={resend === '1'}
        />
      </section>
    </main>
  );
}
