'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, PlusCircle, Users, LogOut, Menu, X } from 'lucide-react'
import { signOut } from '@/app/actions/auth'

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const tabs = [
    { name: 'Créances', href: '/dashboard', icon: <FileText size={18} /> },
    { name: 'Nouveau', href: '/dashboard/nouveau', icon: <PlusCircle size={18} /> },
    { name: 'Clients', href: '/dashboard/clients', icon: <Users size={18} /> },
  ]

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-now-blue text-white rounded-xl shadow-lg"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="md:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-50 md:z-auto
        w-64 bg-[#15274D] text-white rounded-3xl p-6 flex flex-col justify-between shrink-0 shadow-2xl
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div>
          <div className="mb-10 px-2">
            <h1 className="text-3xl font-black tracking-tighter leading-none text-white">
              Now<span className="text-[#FFC000]">.</span>
            </h1>
            <p className="text-white/80 text-[10px] font-mono mt-1.5 uppercase tracking-widest">
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
                  onClick={() => setIsOpen(false)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive ? 'text-[#15274D] font-bold' : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-[#FFC000] rounded-xl shadow-md z-0"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 ${isActive ? 'text-[#15274D]' : 'text-white/80'}`}>{tab.icon}</span>
                  <span className="relative z-10 text-sm tracking-wide">{tab.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-white/20">
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-3 w-full text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-sm font-semibold tracking-wide"
            >
              <LogOut size={18} />
              <span className="relative z-10">Déconnexion</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
