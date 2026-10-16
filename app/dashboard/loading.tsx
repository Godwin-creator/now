export default function DashboardLoading() {
  return (
    <main aria-label="Chargement du tableau de bord" className="space-y-6">
      <div className="h-8 w-56 animate-pulse bg-slate-200" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 animate-pulse border border-slate-200 bg-white" />)}
      </div>
      <div className="h-72 animate-pulse border border-slate-200 bg-white" />
    </main>
  )
}