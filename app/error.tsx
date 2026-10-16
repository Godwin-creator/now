'use client'

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-bold text-now-blue">Une erreur est survenue</h1>
      <p className="text-sm text-slate-600">La page n’a pas pu être chargée. Réessayez.</p>
      <button type="button" onClick={retry} className="min-h-11 bg-now-blue px-5 py-3 text-sm font-semibold text-white">Réessayer</button>
    </main>
  )
}