"use client"

import Link from "next/link"
import { ExternalLink, Loader2, PackageCheck } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusPill } from "@/components/status-pill"
import { PhoneActions } from "@/components/phone-actions"
import {
  EQUIPMENT_LABELS,
  STATUS_LABELS,
  type Ticket,
  type TicketStatus,
} from "@/lib/types"
import { formatDateOnlyForDisplay } from "@/lib/date-utils"
import { buildTicketWhatsAppTemplates } from "@/lib/whatsapp"

const ORDEN_ESTADOS: TicketStatus[] = [
  "recibido",
  "en_diagnostico",
  "en_reparacion",
  "listo",
  "entregado",
]

function Fila({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 border-b border-border py-2 last:border-0">
      <dt className="text-sm text-muted-foreground">{etiqueta}</dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  )
}

/**
 * Resumen de un ticket con sus operaciones, en una ventana.
 *
 * Existe porque tocar un ticket en el inicio navegaba a otra pantalla y
 * cortaba lo que se estaba haciendo. Lo normal es querer ver de que se trata
 * y cambiarle el estado, no irse a otro lado.
 */
export function TicketResumenDialog({
  ticket,
  abierto,
  onAbiertoChange,
  onCambiarEstado,
  guardandoEstado = false,
}: {
  ticket: Ticket | null
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  onCambiarEstado: (id: string, estado: TicketStatus) => void
  guardandoEstado?: boolean
}) {
  if (!ticket) return null

  const numero = ticket.ticket_seq != null ? `N° ${ticket.ticket_seq}` : ticket.id
  const equipo = [
    EQUIPMENT_LABELS[ticket.equipment_type] ?? ticket.equipment_type,
    ticket.brand,
    ticket.model,
  ]
    .filter(Boolean)
    .join(" ")
  const accesorios = Array.isArray(ticket.accessories)
    ? ticket.accessories.filter(Boolean)
    : []
  const fecha = (v?: string | null) =>
    v ? formatDateOnlyForDisplay(v, "es-HN") : "—"
  const dinero = (v?: number | null) =>
    v != null && v > 0 ? `L. ${v.toFixed(2)}` : null

  const total = dinero(ticket.total_cost)
  const pagado = dinero(ticket.amount_paid)
  const diagnostico = dinero(ticket.diagnosis_cost)

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span className="font-mono tabular">{numero}</span>
            <StatusPill status={ticket.status} />
          </DialogTitle>
          <DialogDescription className="text-left">
            {ticket.client_name} · {equipo}
          </DialogDescription>
        </DialogHeader>

        {/* ── Resumen ──────────────────────────────────── */}
        <dl className="rounded-2xl border border-border px-4 py-1">
          <Fila etiqueta="Cliente">{ticket.client_name}</Fila>
          <Fila etiqueta="Teléfono">
            <div className="flex flex-wrap items-center gap-2">
              <span className="tabular">{ticket.client_phone}</span>
              <PhoneActions
                phone={ticket.client_phone}
                templates={buildTicketWhatsAppTemplates(ticket)}
                size="sm"
                preguntarMarcarListo={ticket.status !== "listo"}
                marcarListo={() => onCambiarEstado(ticket.id, "listo")}
              />
            </div>
          </Fila>
          <Fila etiqueta="Equipo">{equipo}</Fila>
          {ticket.device_password && (
            <Fila etiqueta="Contraseña">
              <span className="font-mono">{ticket.device_password}</span>
            </Fila>
          )}
          <Fila etiqueta="Problema">
            <p className="whitespace-pre-line">{ticket.problem_description}</p>
          </Fila>
          <Fila etiqueta="Accesorios">
            {accesorios.length > 0 ? accesorios.join(", ") : "Ninguno"}
          </Fila>
          <Fila etiqueta="Ingreso">{fecha(ticket.created_at)}</Fila>
          <Fila etiqueta="Entrega est.">{fecha(ticket.estimated_delivery_date)}</Fila>
          {(total || pagado || diagnostico) && (
            <Fila etiqueta="Costos">
              <span className="tabular">
                {[
                  diagnostico && `Diagnóstico ${diagnostico}`,
                  total && `Total ${total}`,
                  pagado && `Pagado ${pagado}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </Fila>
          )}
          {ticket.received_by && (
            <Fila etiqueta="Recibió">{ticket.received_by}</Fila>
          )}
        </dl>

        {/* ── Operaciones ──────────────────────────────── */}
        <div className="space-y-3">
          {/* La entrega va como boton aparte y solo cuando corresponde: es la
              operacion que cierra el ticket y no deberia costar lo mismo que
              cambiar de "en diagnostico" a "en reparacion". */}
          {ticket.status === "listo" && (
            <Button
              className="w-full"
              size="lg"
              disabled={guardandoEstado}
              onClick={() => onCambiarEstado(ticket.id, "entregado")}
            >
              {guardandoEstado ? (
                <Loader2 className="mr-2 size-5 animate-spin" />
              ) : (
                <PackageCheck className="mr-2 size-5" />
              )}
              Marcar como entregado
            </Button>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={ticket.status}
              onValueChange={(v) => onCambiarEstado(ticket.id, v as TicketStatus)}
              disabled={guardandoEstado}
            >
              <SelectTrigger className="w-full" aria-label="Cambiar estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDEN_ESTADOS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {STATUS_LABELS[e]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button asChild variant="outline" className="shrink-0">
              <Link href={`/ticket/${encodeURIComponent(ticket.id)}`}>
                <ExternalLink className="mr-2 size-4" />
                Ficha completa
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
