"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Ticket, EQUIPMENT_LABELS } from "@/lib/types"
import {
  Search,
  Eye,
  History,
  Smartphone,
  PackageOpen,
  CalendarClock,
  Wallet,
} from "lucide-react"
import { formatDateOnlyForDisplay } from "@/lib/date-utils"
import { PhoneActions } from "@/components/phone-actions"
import { buildTicketWhatsAppTemplates } from "@/lib/whatsapp"

/** Color del estado "entregado" (variable CSS, se adapta a claro/oscuro) */
const DELIVERED_COLOR = "var(--muted-foreground)"

export default function HistorialPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch("/api/tickets")
        const data = await response.json()

        // Parse accessories and filter completed tickets
        const completedTickets = data
          .map((t: Ticket) => ({
            ...t,
            accessories: typeof t.accessories === "string"
              ? JSON.parse(t.accessories)
              : t.accessories || [],
          }))
          .filter((t: Ticket) => t.status === "entregado")

        setTickets(completedTickets)
      } catch (error) {
        console.error("Error fetching tickets:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

  const filteredTickets = tickets.filter((ticket) => {
    const raw = searchTerm.trim()
    if (!raw) return true
    const search = raw.toLowerCase()
    if (/^\d+$/.test(raw)) {
      const n = parseInt(raw, 10)
      if (!Number.isNaN(n) && ticket.ticket_seq === n) return true
    }
    return (
      ticket.client_name.toLowerCase().includes(search) ||
      ticket.client_phone.includes(search) ||
      (ticket.serial_number?.toLowerCase().includes(search) ?? false) ||
      ticket.id.toLowerCase().includes(search)
    )
  })

  const formatDate = (dateStr: string) => formatDateOnlyForDisplay(dateStr, "es-MX")

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value)
  }

  const displayId = (t: Ticket) =>
    t.ticket_seq != null ? `N° ${t.ticket_seq}` : t.id

  const searchBox = (
    <div className="relative w-full sm:w-80">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Buscar por N°, cliente, serie, teléfono..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10"
      />
    </div>
  )

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader
          icon={History}
          title="Historial"
          description={
            loading
              ? "Equipos entregados y reparaciones completadas."
              : `${filteredTickets.length} ticket${
                  filteredTickets.length !== 1 ? "s" : ""
                } entregado${filteredTickets.length !== 1 ? "s" : ""}.`
          }
          action={searchBox}
        />

        {/* ── Tabla de tickets entregados ────────────── */}
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-28 pl-5">Ticket</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">Equipo</TableHead>
                  <TableHead className="hidden md:table-cell">Recepción</TableHead>
                  <TableHead className="hidden lg:table-cell">Entrega</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-16 pr-5 text-right">Ver</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-5">
                        <div className="h-5 w-16 rounded shimmer" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-28 rounded shimmer" />
                        <div className="mt-2 h-3 w-20 rounded shimmer" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="h-4 w-24 rounded shimmer" />
                        <div className="mt-2 h-3 w-16 rounded shimmer" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="h-4 w-20 rounded shimmer" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="h-4 w-20 rounded shimmer" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="ml-auto h-4 w-16 rounded shimmer" />
                      </TableCell>
                      <TableCell className="pr-5">
                        <div className="ml-auto h-8 w-8 rounded-md shimmer" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredTickets.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="p-0">
                      <div className="flex flex-col items-center gap-4 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand-soft">
                          <PackageOpen className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {searchTerm.trim()
                              ? "Sin coincidencias"
                              : "Aún no hay equipos entregados"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {searchTerm.trim()
                              ? "Prueba con otro número, cliente o serie."
                              : "Los tickets aparecerán aquí al marcarse como entregados."}
                          </p>
                        </div>
                        {searchTerm.trim() && (
                          <Button
                            variant="outline"
                            onClick={() => setSearchTerm("")}
                          >
                            Limpiar búsqueda
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="cursor-pointer transition-colors hover:bg-muted/40"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <TableCell className="pl-5 font-mono text-xs font-bold text-primary">
                        {displayId(ticket)}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium leading-tight">
                          {ticket.client_name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Smartphone className="h-3.5 w-3.5 shrink-0" />
                          {ticket.client_phone}
                        </p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <p className="leading-tight">
                          {ticket.brand || ""} {ticket.model || ""}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {EQUIPMENT_LABELS[ticket.equipment_type]}
                        </p>
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-muted-foreground md:table-cell">
                        {formatDate(ticket.created_at)}
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-muted-foreground lg:table-cell">
                        {ticket.delivered_at
                          ? formatDate(ticket.delivered_at)
                          : formatDate(ticket.updated_at)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {ticket.total_cost
                          ? formatCurrency(ticket.total_cost)
                          : "-"}
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Ver detalle"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTicket(ticket)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm font-bold text-primary">
                    {displayId(selectedTicket)}
                  </span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: `color-mix(in oklch, ${DELIVERED_COLOR} 16%, transparent)`,
                      color: DELIVERED_COLOR,
                    }}
                  >
                    Entregado
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 pt-2">
                {/* Client Info */}
                <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Cliente
                    </p>
                    <p className="mt-1 font-medium">{selectedTicket.client_name}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Teléfono
                    </p>
                    <p className="mt-1 font-medium">{selectedTicket.client_phone}</p>
                    <PhoneActions
                      phone={selectedTicket.client_phone}
                      templates={buildTicketWhatsAppTemplates(selectedTicket)}
                      size="sm"
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Equipment Info */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Tipo
                    </p>
                    <p className="mt-1 font-medium">
                      {EQUIPMENT_LABELS[selectedTicket.equipment_type]}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Marca
                    </p>
                    <p className="mt-1 font-medium">{selectedTicket.brand || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Modelo
                    </p>
                    <p className="mt-1 font-medium">{selectedTicket.model || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Serie
                    </p>
                    <p className="mt-1 font-medium">
                      {selectedTicket.serial_number || "-"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Contraseña del equipo
                  </p>
                  <p className="mt-1 font-mono font-medium">
                    {selectedTicket.device_password?.trim() || "—"}
                  </p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2.5">
                    <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Fecha de Recepción
                      </p>
                      <p className="mt-1 font-medium">
                        {formatDate(selectedTicket.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Fecha de Entrega
                      </p>
                      <p className="mt-1 font-medium">
                        {selectedTicket.delivered_at
                          ? formatDate(selectedTicket.delivered_at)
                          : formatDate(selectedTicket.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Problem */}
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Problema Reportado
                  </p>
                  <p className="mt-1 font-medium leading-snug">
                    {selectedTicket.problem_description}
                  </p>
                </div>

                {/* Diagnosis */}
                {selectedTicket.diagnosis && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Diagnóstico
                    </p>
                    <p className="mt-1 font-medium leading-snug">
                      {selectedTicket.diagnosis}
                    </p>
                  </div>
                )}

                {/* Repair Notes */}
                {selectedTicket.repair_notes && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Notas de Reparación
                    </p>
                    <p className="mt-1 font-medium leading-snug">
                      {selectedTicket.repair_notes}
                    </p>
                  </div>
                )}

                {/* Accessories */}
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                    Accesorios Recibidos
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTicket.accessories.length > 0 ? (
                      selectedTicket.accessories.map((acc) => (
                        <Badge key={acc} variant="secondary">
                          {acc}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Sin accesorios
                      </span>
                    )}
                  </div>
                </div>

                {/* Total */}
                {selectedTicket.total_cost ? (
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-gradient-brand-soft p-4">
                    <div className="flex items-center gap-2.5">
                      <Wallet className="h-5 w-5 text-primary" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Total de Reparación
                      </p>
                    </div>
                    <p className="text-2xl font-bold tabular-nums text-primary">
                      {formatCurrency(selectedTicket.total_cost)}
                    </p>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
