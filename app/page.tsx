"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ClipboardList,
  Loader2,
  ChevronDown,
  ChevronRight,
  Package,
  CheckCircle,
  Truck,
  PlusCircle,
  BarChart3,
  Smartphone,
} from "lucide-react"
import {
  Ticket,
  TicketStatus,
  STATUS_COLORS,
  STATUS_LABELS,
  EQUIPMENT_LABELS,
} from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatDateOnlyForDisplay } from "@/lib/date-utils"

function parseTicket(t: Ticket): Ticket {
  return {
    ...t,
    accessories:
      typeof t.accessories === "string"
        ? JSON.parse(t.accessories as string)
        : t.accessories || [],
    photos:
      typeof t.photos === "string" ? JSON.parse(t.photos as string) : t.photos || [],
  }
}

const statusFlow: TicketStatus[] = [
  "recibido",
  "en_diagnostico",
  "en_reparacion",
  "listo",
  "entregado",
]

interface Stats {
  receivedToday: number
  activeTickets: number
  readyForPickup: number
  deliveredToday: number
  weekTickets: number
  weekRevenue: number
  monthTickets: number
  monthRevenue: number
  monthDelivered: number
  avgRepairDays: number
  pendingPayments: number
}

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [statusSavingId, setStatusSavingId] = useState<string | null>(null)
  const [statsOpen, setStatsOpen] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/tickets")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const list = Array.isArray(data)
          ? data.map((t: Ticket) => parseTicket(t)).filter((t: Ticket) => t.status !== "entregado")
          : []
        setTickets(list)
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setTicketsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!statsOpen || stats !== null) return
    let cancelled = false
    setStatsLoading(true)
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || data?.error) return
        setStats(data as Stats)
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setStatsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [statsOpen, stats])

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    setStatusSavingId(ticketId)
    try {
      const update: Record<string, unknown> = { status: newStatus }
      if (newStatus === "entregado") {
        update.delivered_at = new Date().toISOString()
      }
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      })
      if (!res.ok) throw new Error("No se pudo actualizar")
      setTickets((prev) => {
        if (newStatus === "entregado") return prev.filter((t) => t.id !== ticketId)
        return prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      })
      if (newStatus === "entregado") {
        setExpandedId((e) => (e === ticketId ? null : e))
      }
    } catch (e) {
      console.error(e)
      alert("No se pudo cambiar el estado")
    } finally {
      setStatusSavingId(null)
    }
  }

  const todayCards = stats
    ? [
        {
          title: "Recibidos hoy",
          value: stats.receivedToday,
          icon: Package,
          bg: "bg-primary/10",
          fg: "text-primary",
        },
        {
          title: "Activos",
          value: stats.activeTickets,
          icon: ClipboardList,
          bg: "bg-amber-100 dark:bg-amber-950",
          fg: "text-amber-700 dark:text-amber-400",
        },
        {
          title: "Listos",
          value: stats.readyForPickup,
          icon: CheckCircle,
          bg: "bg-green-100 dark:bg-green-950",
          fg: "text-green-700 dark:text-green-400",
        },
        {
          title: "Entregados hoy",
          value: stats.deliveredToday,
          icon: Truck,
          bg: "bg-muted",
          fg: "text-muted-foreground",
        },
      ]
    : []

  const displayId = (t: Ticket) =>
    t.ticket_seq != null ? `N° ${t.ticket_seq}` : t.id

  const formatDate = (s: string) => formatDateOnlyForDisplay(s, "es-HN")

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const accList = (t: Ticket) =>
    Array.isArray(t.accessories) ? t.accessories.filter(Boolean) : []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inicio</h1>
            <p className="text-muted-foreground">
              Tickets activos (más nuevos arriba). Toca una tarjeta para el detalle y el estado.
            </p>
          </div>
          <Button asChild className="w-full shrink-0 sm:w-auto">
            <Link href="/nuevo-ticket">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo ticket
            </Link>
          </Button>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                En taller
                {!ticketsLoading && (
                  <Badge variant="secondary" className="font-normal">
                    {tickets.length} activo{tickets.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/tickets-activos">Lista completa y filtros</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {ticketsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p className="mb-3">No hay tickets activos.</p>
                <Button asChild>
                  <Link href="/nuevo-ticket">Crear el primero</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 max-w-2xl mx-auto">
                {tickets.map((ticket) => {
                  const open = expandedId === ticket.id
                  return (
                    <div
                      key={ticket.id}
                      className={cn(
                        "rounded-2xl border bg-card text-left shadow-md transition-all duration-200",
                        open
                          ? "border-primary/40 shadow-lg ring-2 ring-primary/20"
                          : "hover:border-primary/30 hover:shadow-lg"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleExpand(ticket.id)}
                        className="flex w-full gap-3 p-4 sm:p-5 text-left rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <div
                          className={cn(
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-muted/50 transition-transform",
                            open && "rotate-90"
                          )}
                        >
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-bold text-primary">
                              {displayId(ticket)}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] border-0 px-2 py-0"
                              style={{
                                backgroundColor: `${STATUS_COLORS[ticket.status]}18`,
                                color: STATUS_COLORS[ticket.status],
                              }}
                            >
                              {STATUS_LABELS[ticket.status]}
                            </Badge>
                            <Badge variant="secondary" className="text-xs font-medium">
                              {EQUIPMENT_LABELS[ticket.equipment_type] ?? ticket.equipment_type}
                            </Badge>
                          </div>
                          <div>
                            <p className="font-semibold text-base leading-tight">
                              {ticket.client_name}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <Smartphone className="h-3.5 w-3.5 shrink-0" />
                              {ticket.client_phone}
                            </p>
                          </div>
                          <p className="text-sm text-foreground/90 line-clamp-3 leading-snug border-l-2 border-border pl-3">
                            {ticket.problem_description || "Sin descripción del problema."}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {open ? "Ocultar detalle" : "Tocar para estado y más datos"}
                          </p>
                        </div>
                      </button>

                      {open && (
                        <div className="border-t border-border/80 px-4 pb-4 pt-3 sm:px-5 sm:pb-5 space-y-4">
                          <div className="grid gap-2 text-sm sm:grid-cols-2">
                            <p>
                              <span className="text-muted-foreground">Marca / modelo</span>
                              <br />
                              <span className="font-medium">
                                {[ticket.brand, ticket.model].filter(Boolean).join(" · ") || "—"}
                              </span>
                            </p>
                            <p>
                              <span className="text-muted-foreground">Ingreso</span>
                              <br />
                              <span className="font-medium">
                                {ticket.created_at ? formatDate(ticket.created_at) : "—"}
                              </span>
                            </p>
                            {ticket.estimated_delivery_date && (
                              <p>
                                <span className="text-muted-foreground">Entrega est.</span>
                                <br />
                                <span className="font-medium">
                                  {formatDate(ticket.estimated_delivery_date)}
                                </span>
                              </p>
                            )}
                            {ticket.serial_number && (
                              <p>
                                <span className="text-muted-foreground">Serie</span>
                                <br />
                                <span className="font-mono font-medium">{ticket.serial_number}</span>
                              </p>
                            )}
                          </div>

                          {accList(ticket).length > 0 && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">Accesorios: </span>
                              {accList(ticket).join(", ")}
                            </p>
                          )}

                          {ticket.internal_notes && (
                            <p className="text-xs text-muted-foreground rounded-md bg-muted/50 p-2">
                              <span className="font-medium text-foreground/80">Notas internas: </span>
                              {ticket.internal_notes}
                            </p>
                          )}

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Estado del ticket</label>
                            <Select
                              value={ticket.status}
                              disabled={statusSavingId === ticket.id}
                              onValueChange={(v) =>
                                void handleStatusChange(ticket.id, v as TicketStatus)
                              }
                            >
                              <SelectTrigger className="h-11 w-full max-w-md">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusFlow.map((st) => (
                                  <SelectItem key={st} value={st}>
                                    {STATUS_LABELS[st]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {statusSavingId === ticket.id && (
                              <p className="text-xs text-muted-foreground flex items-center gap-2">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Guardando…
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Si marca <strong className="text-foreground">Entregado</strong>, el
                              ticket sale de esta lista (sigue en historial).
                            </p>
                          </div>

                          <Button variant="outline" className="w-full sm:w-auto" asChild>
                            <Link
                              href={`/tickets-activos?ticketId=${encodeURIComponent(ticket.id)}`}
                            >
                              Abrir ficha completa (costos, fotos, imprimir…)
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Collapsible open={statsOpen} onOpenChange={setStatsOpen}>
          <Card className="border-border border-dashed">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 p-4 text-left hover:bg-muted/50 rounded-xl transition-colors"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <BarChart3 className="h-4 w-4" />
                  Estadísticas del taller (opcional)
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${statsOpen ? "rotate-180" : ""}`}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 pb-4 space-y-4">
                {statsLoading && (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!statsLoading && stats && (
                  <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {todayCards.map((c) => (
                        <div
                          key={c.title}
                          className="flex items-center gap-3 rounded-lg border border-border p-3"
                        >
                          <div className={`rounded-lg p-2 ${c.bg}`}>
                            <c.icon className={`h-4 w-4 ${c.fg}`} />
                          </div>
                          <div>
                            <p className="text-xl font-bold">{c.value}</p>
                            <p className="text-xs text-muted-foreground">{c.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3 text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">Semana:</span>{" "}
                        {stats.weekTickets} tickets · L. {stats.weekRevenue.toFixed(2)}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Mes:</span>{" "}
                        {stats.monthDelivered} entregados · L. {stats.monthRevenue.toFixed(2)}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Promedio reparación:</span>{" "}
                        {stats.avgRepairDays} días ·{" "}
                        <span className="text-amber-700 dark:text-amber-400">
                          Por cobrar L. {stats.pendingPayments.toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </DashboardLayout>
  )
}
