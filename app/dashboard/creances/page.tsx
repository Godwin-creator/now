import { requireCompany } from '@/lib/auth'
import { getDashboardCreances } from '@/lib/db/dashboard-creances'
import CreancesListClient from './CreancesListClient'

export default async function CreancesPage() {
  const { user } = await requireCompany()
  const today = new Date().toISOString().slice(0, 10)
  const result = await getDashboardCreances(user.id, today)

  return (
    <section className="min-w-0 space-y-4">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-now-blue">Toutes les créances</h1>
        <p className="mt-1 text-sm text-slate-700">Votre portefeuille, trié par priorité.</p>
      </header>
      <CreancesListClient invoices={result.ok ? result.data : []} loadError={result.ok ? undefined : result.error.message} />
    </section>
  )
}
