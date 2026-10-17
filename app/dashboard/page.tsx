import { requireCompany } from '@/lib/auth'
import DashboardClient from '@/app/components/DashboardClientCore'
import { getDashboardCreances } from '@/lib/db/dashboard-creances'

export default async function Dashboard() {
  const { user } = await requireCompany()
  const today = new Date().toISOString().slice(0, 10)
  const result = await getDashboardCreances(user.id, today)

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-now-blue tracking-tight">À faire aujourd’hui</h2>
          <p className="text-sm text-now-blue-light mt-1">Les créances à traiter en priorité.</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {result.ok ? <DashboardClient initialFactures={result.data} /> : <p role="alert" className="border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-800">{result.error.message}</p>}
      </div>
    </div>
  )
}