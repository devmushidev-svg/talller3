'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  Package,
  History,
  Settings,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const navItems = [
  { href: '/', label: 'Inicio', icon: LayoutDashboard },
  { href: '/nuevo-ticket', label: 'Nuevo Ticket', icon: PlusCircle },
  { href: '/tickets-activos', label: 'Tickets Activos', icon: ClipboardList },
  { href: '/inventario', label: 'Inventario de Piezas', icon: Package },
  { href: '/historial', label: 'Historial', icon: History },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden no-print glass rounded-xl shadow-lg border border-border/60"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/70 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 ease-out no-print",
        "lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Destello decorativo */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(28rem 20rem at 50% -10%, oklch(0.58 0.22 275 / 0.35), transparent 60%)',
          }}
          aria-hidden
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3 px-6 py-6 border-b border-sidebar-border/70">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-brand blur-md opacity-60" aria-hidden />
            <img
              src="/logo-multiplanet.png"
              alt="Multiplanet"
              className="relative w-11 h-11 rounded-xl object-contain bg-white p-0.5 shadow-lg"
            />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight tracking-tight">MULTIPLANET</h1>
            <p className="text-xs text-sidebar-foreground/55">Sistema de Tickets</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {navItems.map((item, i) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{ animationDelay: `${i * 0.04}s` }}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 animate-slide-in-left",
                  isActive
                    ? "text-white shadow-lg shadow-primary/25"
                    : "text-sidebar-foreground/65 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60"
                )}
              >
                {/* Fondo activo con gradiente */}
                {isActive && (
                  <span className="absolute inset-0 rounded-xl bg-gradient-brand" aria-hidden />
                )}
                {/* Indicador lateral */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-6 -translate-y-1/2 w-1 rounded-r-full bg-white/90" aria-hidden />
                )}
                <span
                  className={cn(
                    "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110",
                    isActive ? "bg-white/15" : "bg-sidebar-accent/40 group-hover:bg-sidebar-accent"
                  )}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                </span>
                <span className="relative">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="relative px-6 py-4 border-t border-sidebar-border/70">
          <p className="text-xs text-sidebar-foreground/45">
            Multiplanet · Tocoa, Colón
          </p>
        </div>
      </aside>
    </>
  )
}
