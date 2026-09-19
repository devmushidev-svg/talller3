import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import {
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
  STATUS_TOKENS,
  type PaymentStatus,
  type TicketStatus,
} from '@/lib/types'

/**
 * Unica pildora de estado de la app.
 *
 * El fondo se deriva del color vivo (`--st` al 16% sobre la superficie) y el
 * texto usa la tinta, que es un valor distinto. Pintar el texto con el mismo
 * color que el tinte es lo que dejaba cuatro de los cinco estados por debajo
 * de 2.7:1; el par base/tinta es lo que lo arregla.
 *
 * El punto de color no es decoracion: es la senal redundante para quien no
 * distingue el verde del ambar.
 */
function Pill({
  base,
  fg,
  label,
  className,
}: {
  base: string
  fg: string
  label: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'estado-tinte inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1',
        'text-xs font-medium leading-none whitespace-nowrap',
        className
      )}
      style={{ '--st': base, color: fg } as CSSProperties}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ background: base }}
        aria-hidden
      />
      {label}
    </span>
  )
}

export function StatusPill({
  status,
  className,
}: {
  status: TicketStatus
  className?: string
}) {
  const t = STATUS_TOKENS[status]
  return <Pill base={t.base} fg={t.fg} label={STATUS_LABELS[status]} className={className} />
}

const PAYMENT_TOKENS: Record<PaymentStatus, { base: string; fg: string }> = {
  pendiente: { base: 'var(--danger)', fg: 'var(--danger-fg)' },
  parcial: { base: 'var(--warning)', fg: 'var(--warning-fg)' },
  pagado: { base: 'var(--success)', fg: 'var(--success-fg)' },
}

export function PaymentPill({
  status,
  className,
}: {
  status: PaymentStatus
  className?: string
}) {
  const t = PAYMENT_TOKENS[status]
  return (
    <Pill base={t.base} fg={t.fg} label={PAYMENT_STATUS_LABELS[status]} className={className} />
  )
}

/** Barra/punto de estado solido, para el borde de una tarjeta o fila. */
export function statusBase(status: TicketStatus) {
  return STATUS_TOKENS[status].base
}
