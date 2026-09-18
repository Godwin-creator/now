import Sidebar from '@/app/components/Sidebar'
import { ReactNode } from 'react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-now-bg p-4 gap-4 overflow-hidden">
      <Sidebar />
      <main className="flex-1 bg-now-surface rounded-3xl shadow-lg overflow-y-auto p-8 relative flex flex-col">
        {children}
      </main>
    </div>
  )
}
