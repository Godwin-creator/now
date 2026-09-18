'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, PlusCircle, Users, LogOut } from 'lucide-react'
import { signOut } from '@/app/actions/auth'

export default function Sidebar() {
  const pathname = usePathname()

  const tabs = [
    { name: 'Créances', href: '/dashboard', icon: <FileText size={18} /> },
    { name: 'Nouveau', href: '/dashboard/nouveau', icon: <PlusCircle size={18} /> },
    { name: 'Clients', href: '/dashboard/clients', icon: <Users size={18} /> },
  ]

  return (
    <aside className="w-64 bg-now-green text-white rounded-3xl p-6 flex flex-col justify-between shrink-0 shadow-xl">
      <div>
        <div className="mb-10 px-2">
          <h1 className="text-3xl font-black tracking-tighter leading-none">
            Now<span className="text-now-gold">.</span>
          </h1>
          <p className="text-white/60 text-[10px] font-mono mt-1.5 uppercase tracking-widest">
            Relance IA SaaS
          </p>
        </div>

        <nav className="space-y-2">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? 'text-white font-bold' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-now-green-light rounded-xl z-0"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.icon}</span>
                <span className="relative z-10 text-sm tracking-wide">{tab.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="pt-6 border-t border-white/10">
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-3 px-4 py-3 w-full text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-sm font-semibold tracking-wide"
          >
            <LogOut size={18} />
            <span className="relative z-10">Déconnexion</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
