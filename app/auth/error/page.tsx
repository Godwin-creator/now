import Link from 'next/link';

export default async function AuthConfirmationErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const message =
    reason === 'cancelled'
      ? 'Vous avez annulé la connexion Google. Vous pouvez réessayer quand vous le souhaitez.'
      : reason === 'consent'
        ? 'Ce compte Google n’a pas encore terminé son inscription NowPay. Sélectionnez « Créer un compte », acceptez les deux cases, puis continuez avec Google.'
        : 'L’authentification n’a pas pu aboutir. Recommencez la connexion ou vérifiez les réglages du fournisseur.';

  return (
    <main className="flex min-h-screen items-center justify-center bg-now-bg px-4 py-10">
      <section className="w-full max-w-md border border-now-border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-now-blue">
          Connexion impossible
        </h1>
        <p className="mt-3 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/login"
            className="min-h-11 rounded bg-now-blue px-4 py-3 text-center font-bold text-white"
          >
            Se connecter
          </Link>
          <Link
            href="/signup"
            className="min-h-11 px-4 py-3 text-center font-semibold text-now-blue"
          >
            Recommencer l’inscription
          </Link>
        </div>
      </section>
    </main>
  );
}
