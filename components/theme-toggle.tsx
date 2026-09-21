'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Conmutador claro/oscuro. El tema principal es el oscuro.
 *
 * Renderiza un hueco del mismo tamano hasta montar: next-themes no sabe el
 * tema en el servidor, y pintar el icono equivocado y corregirlo despues
 * produce un parpadeo.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [montado, setMontado] = useState(false)

  useEffect(() => setMontado(true), [])

  const esOscuro = resolvedTheme === 'dark'
  // El servidor no sabe el tema. Hasta montar, TODO lo que dependa de el
  // (icono, aria-label, title) tiene que ser identico en servidor y cliente,
  // o React reporta un desajuste de hidratacion.
  const etiqueta = !montado
    ? 'Cambiar tema'
    : esOscuro
      ? 'Cambiar a tema claro'
      : 'Cambiar a tema oscuro'

  return (
    <button
      type="button"
      onClick={() => setTheme(esOscuro ? 'light' : 'dark')}
      aria-label={etiqueta}
      title={etiqueta}
      className={cn(
        'tactil inline-flex items-center justify-center rounded-lg',
        'text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
        className
      )}
    >
      {montado ? (
        esOscuro ? (
          <Sun className="size-[18px]" />
        ) : (
          <Moon className="size-[18px]" />
        )
      ) : (
        <span className="size-[18px]" />
      )}
    </button>
  )
}
