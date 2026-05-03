"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Database, FolderOpen, BarChart3, Database as SchemaIcon, LayoutDashboard, LogOut } from 'lucide-react'
import { logout } from '@/modules/auth/services/auth.service'

const navigation = [
  { name: 'Dashboard', href: '/data', icon: LayoutDashboard },
  { name: 'Schemas', href: '/data/data-gateway/schemas', icon: SchemaIcon },
  { name: 'Files', href: '/data/data-gateway/files', icon: FolderOpen },
  { name: 'Explorer', href: '/data/data-gateway/explorer', icon: BarChart3 },
]

export default function DataLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    await logout()
  }

  return (
    <div className="flex h-screen bg-neutral-950">
      <aside className="w-64 border-r border-white/10 bg-neutral-900 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <Link href="/data" className="flex items-center gap-2">
            <Database className="w-5 h-5 text-white" />
            <h2 className="text-lg font-semibold text-white">Data Gateway</h2>
          </Link>
        </div>
        <nav className="flex-1 p-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/data' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors mb-1 ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="p-2 border-t border-white/10">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {isLoggingOut ? 'Signing out...' : 'Logout'}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-hidden bg-neutral-950">{children}</main>
    </div>
  )
}
