import type { LucideIcon } from 'lucide-react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Los tres estados que necesita cualquier lista, mas el cuarto que faltaba.
 *
 * "No hay clientes" cuando en realidad el buscador no encontro nada es un bug
 * de comunicacion. "No hay clientes" cuando el servidor no respondio es peor:
 * es una mentira. Por eso son componentes distintos.
 */
export function EstadoVacio({
  icon: Icon,
  titulo,
  detalle,
  accion,
  className,
}: {
  icon: LucideIcon
  titulo: string
  detalle?: string
  accion?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-5 py-14 text-center',
        className
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{titulo}</p>
        {detalle && <p className="max-w-sm text-sm text-muted-foreground">{detalle}</p>}
      </div>
      {accion}
    </div>
  )
}

export function EstadoError({
  mensaje,
  onReintentar,
  className,
}: {
  mensaje: string
  onReintentar?: () => void
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-5 py-14 text-center',
        className
      )}
    >
      <div
        className="estado-tinte flex size-11 items-center justify-center rounded-xl"
        style={{ '--st': 'var(--danger)', color: 'var(--danger-fg)' } as React.CSSProperties}
      >
        <AlertTriangle className="size-5" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="font-medium">No se pudo cargar la información</p>
        <p className="max-w-sm text-sm text-muted-foreground">{mensaje}</p>
      </div>
      {onReintentar && (
        <Button variant="outline" size="sm" onClick={onReintentar}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
