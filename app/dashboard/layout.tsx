import Sidebar from '@/app/components/Sidebar'
import { ReactNode } from 'react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-now-bg p-4 gap-6">
      <Sidebar />
      <main className="flex-1 bg-now-surface rounded-3xl shadow-sm overflow-y-auto p-4 md:p-8 relative flex flex-col">
        {children}
      </main>
    </div>
  )
}
