'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './sidebar'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64">
        {/* key por ruta => re-dispara la animación de entrada al navegar */}
        <div key={pathname} className="p-4 pt-16 lg:p-8 lg:pt-8 animate-fade-in-up">
          {children}
        </div>
      </main>
    </div>
  )
}
