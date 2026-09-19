import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  /** Botón(es) o controles a la derecha del título */
  action?: React.ReactNode
  className?: string
}

/**
 * Encabezado de pantalla. Sin icono, sin degradado, sin chip de color.
 * La barra lateral ya dice donde estas; el titulo solo tiene que decir que
 * se hace aca.
 */
export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}
