'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './sidebar'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64">
        {/* Contenedor centrado con ancho máximo y espaciado consistente.
            key por ruta => re-dispara la animación de entrada al navegar. */}
        <div
          key={pathname}
          className="mx-auto w-full max-w-[1400px] px-4 pb-12 pt-20 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10 animate-fade-in-up"
        >
          {children}
        </div>
      </main>
    </div>
  )
}
