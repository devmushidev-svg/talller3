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
import { ThemeToggle } from '@/components/theme-toggle'
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
    <div className={cn('flex items-center gap-2.5', compact ? 'min-w-0' : 'px-5 py-5')}>
      <Image
        src="/logo-multiplanet.png"
        alt=""
        width={36}
        height={36}
        className={cn('shrink-0 rounded-lg bg-white object-contain p-0.5', compact ? 'size-8' : 'size-9')}
      />
      <div className="min-w-0">
        <p
          className={cn(
            'truncate font-semibold leading-tight tracking-tight',
            compact ? 'text-sm' : 'text-[15px]',
          )}
        >
          Multiplanet
        </p>
        {!compact && (
          <p className="text-xs text-muted-foreground">Sistema de tickets</p>
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
    <nav aria-label="Navegación principal" className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
      {navItems.map((item) => {
        const isActive = isRouteActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            onClick={onNavigate}
            className={cn(
              'relative flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors',
              isActive
                ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
            )}
          >
            {isActive && (
              <span
                className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                aria-hidden
              />
            )}
            <item.icon className="size-[18px] shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarFooter() {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-sidebar-border px-2.5 py-2.5">
      <p className="truncate pl-2 text-xs text-muted-foreground">Tocoa, Colón</p>
      <ThemeToggle />
    </div>
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
        <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/85 backdrop-blur-sm pt-[env(safe-area-inset-top)] lg:hidden no-print">
          <div className="flex h-16 items-center justify-between gap-3 px-3">
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                className="size-11 shrink-0"
                aria-label="Abrir menú principal"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>

            <Brand compact />

            <Button asChild size="icon-lg" className="size-11 shrink-0">
              <Link href="/nuevo-ticket" aria-label="Crear nuevo ticket">
                <PlusCircle className="size-5" />
              </Link>
            </Button>
          </div>
        </header>

        <SheetContent
          side="left"
          className="w-[min(88vw,20rem)] gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground lg:hidden no-print"
        >
          <SheetHeader className="border-b border-sidebar-border p-0 text-left">
            <SheetTitle className="sr-only">Menú principal</SheetTitle>
            <SheetDescription className="sr-only">
              Navega entre las secciones del sistema de tickets.
            </SheetDescription>
            <Brand />
          </SheetHeader>
          <NavigationList pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <div className="pb-[max(env(safe-area-inset-bottom),0.25rem)]">
            <SidebarFooter />
          </div>
        </SheetContent>

        <nav
          aria-label="Accesos rápidos"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 backdrop-blur-sm pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1 lg:hidden no-print"
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
                    'relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-medium transition-colors',
                    isActive ? 'text-foreground' : 'text-muted-foreground active:bg-muted',
                  )}
                >
                  {isActive && (
                    <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary" aria-hidden />
                  )}
                  <item.icon className="size-5" />
                  <span>{item.shortLabel}</span>
                </Link>
              )
            })}
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-medium text-muted-foreground transition-colors active:bg-muted"
                aria-label="Ver todas las secciones"
              >
                <Menu className="size-5" />
                <span>Más</span>
              </button>
            </SheetTrigger>
          </div>
        </nav>
      </Sheet>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex no-print">
        <div className="border-b border-sidebar-border">
          <Brand />
        </div>
        <NavigationList pathname={pathname} />
        <SidebarFooter />
      </aside>
    </>
  )
}
