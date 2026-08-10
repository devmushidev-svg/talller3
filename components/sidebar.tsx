'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ClipboardList,
  History,
  LayoutDashboard,
  Menu,
  Package,
  PlusCircle,
  Settings,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Inicio', shortLabel: 'Inicio', icon: LayoutDashboard },
  { href: '/nuevo-ticket', label: 'Nuevo ticket', shortLabel: 'Nuevo', icon: PlusCircle },
  { href: '/tickets-activos', label: 'Tickets activos', shortLabel: 'Activos', icon: ClipboardList },
  { href: '/inventario', label: 'Inventario de piezas', shortLabel: 'Inventario', icon: Package },
  { href: '/historial', label: 'Historial', shortLabel: 'Historial', icon: History },
  { href: '/configuracion', label: 'Configuración', shortLabel: 'Ajustes', icon: Settings },
] as const

const mobilePrimaryItems = navItems.filter((item) =>
  ['/', '/nuevo-ticket', '/tickets-activos', '/historial'].includes(item.href),
)

function isRouteActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('relative flex items-center gap-3', compact ? 'min-w-0' : 'px-6 py-6')}>
      <div className="relative shrink-0">
        <div
          className="absolute inset-0 rounded-xl bg-gradient-brand opacity-60 blur-md"
          aria-hidden
        />
        <Image
          src="/logo-multiplanet.png"
          alt="Multiplanet"
          width={44}
          height={44}
          className={cn(
            'relative rounded-xl bg-white object-contain p-0.5 shadow-lg',
            compact ? 'size-9' : 'size-11',
          )}
        />
      </div>
      <div className="min-w-0">
        <p className={cn('truncate font-bold leading-tight tracking-tight', compact ? 'text-sm' : 'text-base')}>
          MULTIPLANET
        </p>
        {!compact && (
          <p className="text-xs text-sidebar-foreground/55">Sistema de tickets</p>
        )}
      </div>
    </div>
  )
}

function NavigationList({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <nav aria-label="Navegación principal" className="relative flex-1 space-y-1.5 overflow-y-auto px-3 py-5">
      {navItems.map((item, index) => {
        const isActive = isRouteActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            onClick={onNavigate}
            style={{ animationDelay: `${index * 0.04}s` }}
            className={cn(
              'group relative flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-sidebar-ring animate-slide-in-left',
              isActive
                ? 'text-white shadow-lg shadow-primary/25'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
            )}
          >
            {isActive && (
              <>
                <span className="absolute inset-0 rounded-xl bg-gradient-brand" aria-hidden />
                <span
                  className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white/90"
                  aria-hidden
                />
              </>
            )}
            <span
              className={cn(
                'relative flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                isActive ? 'bg-white/15' : 'bg-sidebar-accent/40 group-hover:bg-sidebar-accent',
              )}
            >
              <item.icon className="size-[18px]" />
            </span>
            <span className="relative">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-60"
      style={{
        backgroundImage:
          'radial-gradient(28rem 20rem at 50% -10%, oklch(0.58 0.22 275 / 0.35), transparent 60%)',
      }}
      aria-hidden
    />
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1024px)')
    const closeMobileMenu = () => {
      if (desktopQuery.matches) setMobileOpen(false)
    }

    desktopQuery.addEventListener('change', closeMobileMenu)
    return () => desktopQuery.removeEventListener('change', closeMobileMenu)
  }, [])

  return (
    <>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <header className="glass fixed inset-x-0 top-0 z-40 border-b border-border/70 pt-[env(safe-area-inset-top)] lg:hidden no-print">
          <div className="flex h-16 items-center justify-between gap-3 px-3">
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="size-11 rounded-xl border border-border/70 bg-card/80 shadow-sm"
                aria-label="Abrir menú principal"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>

            <Brand compact />

            <Button asChild size="icon-lg" className="size-11 rounded-xl shadow-md shadow-primary/25">
              <Link href="/nuevo-ticket" aria-label="Crear nuevo ticket">
                <PlusCircle className="size-5" />
              </Link>
            </Button>
          </div>
        </header>

        <SheetContent
          side="left"
          className="w-[min(88vw,22rem)] gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground lg:hidden no-print"
        >
          <SidebarBackdrop />
          <SheetHeader className="relative border-b border-sidebar-border/70 p-0 text-left">
            <SheetTitle className="sr-only">Menú principal</SheetTitle>
            <SheetDescription className="sr-only">
              Navega entre las secciones del sistema de tickets.
            </SheetDescription>
            <Brand />
          </SheetHeader>
          <NavigationList pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <div className="relative border-t border-sidebar-border/70 px-6 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4">
            <p className="text-xs text-sidebar-foreground/45">Multiplanet · Tocoa, Colón</p>
          </div>
        </SheetContent>

        <nav
          aria-label="Accesos rápidos"
          className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border/70 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1 lg:hidden no-print"
        >
          <div className="grid grid-cols-5 px-1">
            {mobilePrimaryItems.map((item) => {
              const isActive = isRouteActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                    isActive ? 'text-primary' : 'text-muted-foreground active:bg-muted',
                  )}
                >
                  {isActive && (
                    <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-gradient-brand" aria-hidden />
                  )}
                  <item.icon className={cn('size-5', item.href === '/nuevo-ticket' && 'text-primary')} />
                  <span>{item.shortLabel}</span>
                </Link>
              )
            })}
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium text-muted-foreground outline-none transition-colors active:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Ver todas las secciones"
              >
                <Menu className="size-5" />
                <span>Más</span>
              </button>
            </SheetTrigger>
          </div>
        </nav>
      </Sheet>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex no-print">
        <SidebarBackdrop />
        <div className="relative border-b border-sidebar-border/70">
          <Brand />
        </div>
        <NavigationList pathname={pathname} />
        <div className="relative border-t border-sidebar-border/70 px-6 py-4">
          <p className="text-xs text-sidebar-foreground/45">Multiplanet · Tocoa, Colón</p>
        </div>
      </aside>
    </>
  )
}
