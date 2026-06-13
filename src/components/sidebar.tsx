'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Users, CreditCard, Wrench, BarChart3, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/', label: 'Přehled', icon: Home },
  { href: '/properties', label: 'Nemovitosti', icon: Building2 },
  { href: '/tenants', label: 'Nájemníci', icon: Users },
  { href: '/rent', label: 'Platby nájmu', icon: CreditCard },
  { href: '/maintenance', label: 'Údržba', icon: Wrench },
  { href: '/pl', label: 'Příjmy & Výdaje', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col py-6 px-3 shrink-0">
      <div className="mb-8 px-3">
        <span className="text-lg font-bold text-white">Micro-Landlord</span>
        <p className="text-xs text-zinc-500 mt-0.5">Správa nemovitostí</p>
      </div>
      <nav className="flex flex-col gap-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              pathname === href
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
