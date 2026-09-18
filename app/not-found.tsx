import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-now-bg px-4">
      <div className="w-full max-w-xl text-center">
        <p className="mb-4 text-[10px] font-black uppercase tracking-[0.35em] text-now-blue-light">
          Erreur 404
        </p>
        <h1 className="text-7xl font-extrabold tracking-tight text-now-blue sm:text-9xl">404</h1>
        <p className="mt-6 text-lg text-now-blue-light">
          Oups ! Cette page n&apos;existe pas ou a été déplacée.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-now-yellow px-6 py-3 text-base font-bold text-now-blue transition-colors hover:bg-now-yellow-hover"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </main>
  )
}
