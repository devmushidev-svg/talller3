"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  Package,
  CheckCircle,
  Truck,
  PlusCircle,
  LayoutDashboard,
  Smartphone,
  ArrowRight,
  Wallet,
  CalendarClock,
  AlertTriangle,
} from "lucide-react"
import {
  Ticket,
  TicketStatus,
  STATUS_LABELS,
  EQUIPMENT_LABELS,
} from "@/lib/types"
import { cn } from "@/lib/utils"
import { StatusPill, statusBase } from "@/components/status-pill"
import { formatDateOnlyForDisplay } from "@/lib/date-utils"
import { PhoneActions } from "@/components/phone-actions"
import { ScrollSafeButton } from "@/components/scroll-safe-link"
import { TicketResumenDialog } from "@/components/ticket-resumen-dialog"
import { GlobalTicketSearch } from "@/components/global-ticket-search"
import { buildTicketWhatsAppTemplates } from "@/lib/whatsapp"
import { toast } from "sonner"
import { EstadoError } from "@/components/estado-lista"
import { fetchLista, mensajeDeError } from "@/lib/fetch-lista"

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
  const [statusSavingId, setStatusSavingId] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [ticketsError, setTicketsError] = useState<string | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [reintento, setReintento] = useState(0)
  const [ticketAbierto, setTicketAbierto] = useState<Ticket | null>(null)

  useEffect(() => {
    let cancelled = false
    setTicketsLoading(true)
    setTicketsError(null)
    fetchLista<Ticket>("/api/tickets?scope=active&limit=8")
      .then((data) => {
        if (cancelled) return
        setTickets(
          data.map((t) => parseTicket(t)).filter((t) => t.status !== "entregado")
        )
      })
      .catch((e) => {
        if (cancelled) return
        console.error(e)
        // Un 500 no es "no hay tickets". Decirlo asi seria mentir.
        setTicketsError(mensajeDeError(e))
        setTickets([])
      })
      .finally(() => {
        if (!cancelled) setTicketsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reintento])

  useEffect(() => {
    let cancelled = false
    setStatsError(null)
    fetch("/api/stats")
      .then(async (res) => {
        if (!res.ok) throw new Error(`El servidor respondió ${res.status}.`)
        const data = await res.json()
        if (data?.error) throw new Error(String(data.error))
        return data as Stats
      })
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch((e) => {
        if (cancelled) return
        console.error(e)
        // Sin esto, las tarjetas se quedaban en esqueleto de carga para
        // siempre: parecia que seguia cargando y en realidad habia fallado.
        setStatsError(mensajeDeError(e))
      })
    return () => {
      cancelled = true
    }
  }, [reintento])

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
      // Entregado sale de la lista, asi que la ventana se cierra sola; en el
      // resto se actualiza para que la pildora no quede mostrando lo viejo.
      setTicketAbierto((abierto) =>
        abierto?.id !== ticketId
          ? abierto
          : newStatus === "entregado"
            ? null
            : { ...abierto, status: newStatus }
      )
      if (newStatus === "entregado") {
        setStats((previous) =>
          previous
            ? {
                ...previous,
                activeTickets: Math.max(previous.activeTickets - 1, 0),
                deliveredToday: previous.deliveredToday + 1,
              }
            : previous
        )
      }
    } catch (e) {
      console.error(e)
      toast.error("No se pudo cambiar el estado")
    } finally {
      setStatusSavingId(null)
    }
  }

  /**
   * Quien abre el inicio pregunta una sola cosa: que tengo que entregar y
   * cuanto trabajo hay adentro. Esos dos numeros van grandes. Todo lo demas
   * es contexto y va chico, en una linea.
   */
  const principales = [
    {
      title: "Listos para entrega",
      value: stats?.readyForPickup,
      hint: "esperando que el cliente pase",
      href: "/tickets-activos?status=listo",
    },
    {
      title: "En taller",
      value: stats?.activeTickets,
      hint: "equipos sin entregar",
      href: "/tickets-activos",
    },
  ]

  const hoy = [
    { title: "Recibidos hoy", value: stats?.receivedToday },
    { title: "Entregados hoy", value: stats?.deliveredToday },
  ]

  const displayId = (t: Ticket) =>
    t.ticket_seq != null ? `N° ${t.ticket_seq}` : t.id

  const formatDate = (s: string) => formatDateOnlyForDisplay(s, "es-HN")

  const accList = (t: Ticket) =>
    Array.isArray(t.accessories) ? t.accessories.filter(Boolean) : []

  // La API ya entrega los tickets del más reciente al más antiguo.
  const recentTickets = tickets.slice(0, 8)
  const activeTicketCount = stats?.activeTickets ?? null

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader
          title="Inicio"
          description="Resumen del taller y tickets activos."
          action={
            <Button asChild size="lg">
              <Link href="/nuevo-ticket">
                <PlusCircle className="mr-2 h-5 w-5" />
                Nuevo ticket
              </Link>
            </Button>
          }
        />

        <GlobalTicketSearch />

        {/* ── Lo que hay que hacer ahora ─────────────── */}
        <div className="grid gap-3 sm:grid-cols-2">
          {principales.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-input"
            >
              <p className="text-sm text-muted-foreground">{c.title}</p>
              {c.value == null ? (
                statsError ? (
                  <p className="mt-1 text-4xl font-semibold leading-none text-muted-foreground">
                    —
                  </p>
                ) : (
                  <div className="mt-2 h-10 w-16 rounded-md shimmer" />
                )
              ) : (
                <p className="mt-1 text-4xl font-semibold leading-none tabular">
                  {c.value}
                </p>
              )}
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                {c.hint}
                <ArrowRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </p>
            </Link>
          ))}
        </div>

        {/* Contexto del dia: una linea, no tres tarjetas */}
        {statsError ? (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-border bg-card px-5 py-3.5 text-sm"
          >
            <span className="flex items-center gap-2 font-medium">
              <AlertTriangle
                className="size-4 shrink-0"
                style={{ color: "var(--danger)" }}
                aria-hidden
              />
              No se pudieron cargar las cifras
            </span>
            <span className="text-muted-foreground">{statsError}</span>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => setReintento((n) => n + 1)}
            >
              Reintentar
            </Button>
          </div>
        ) : (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-border bg-card px-5 py-3.5 text-sm">
          {hoy.map((c) => (
            <span key={c.title} className="flex items-baseline gap-1.5">
              <span className="font-medium tabular">
                {c.value ?? "—"}
              </span>
              <span className="text-muted-foreground">{c.title.toLowerCase()}</span>
            </span>
          ))}
          {stats && (
            <span className="flex items-baseline gap-1.5">
              <span className="font-medium tabular" data-money>
                L. {stats.pendingPayments.toFixed(2)}
              </span>
              <span className="text-muted-foreground">por cobrar</span>
            </span>
          )}
          {stats && (
            <span className="ml-auto text-xs text-muted-foreground tabular">
              Semana: {stats.weekTickets} tickets · L. {stats.weekRevenue.toFixed(2)}
              {"  ·  "}
              Mes: {stats.monthDelivered} entregados · L. {stats.monthRevenue.toFixed(2)}
            </span>
          )}
        </div>
        )}

        {/* ── Tickets en taller ──────────────────────── */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ClipboardList className="h-5 w-5 text-primary" />
              En taller
              {activeTicketCount !== null && (
                <Badge variant="secondary" className="font-normal">
                  {activeTicketCount} activo{activeTicketCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </h2>
            <div className="flex items-center gap-3">
              {activeTicketCount !== null && activeTicketCount > recentTickets.length && (
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  Mostrando los {recentTickets.length} más recientes
                </span>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href="/tickets-activos">
                  Lista completa y filtros
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {ticketsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-52 rounded-2xl border border-border bg-card p-5"
                >
                  <div className="h-5 w-24 rounded shimmer" />
                  <div className="mt-4 h-6 w-40 rounded shimmer" />
                  <div className="mt-3 h-4 w-full rounded shimmer" />
                  <div className="mt-2 h-4 w-3/4 rounded shimmer" />
                </div>
              ))}
            </div>
          ) : ticketsError ? (
            <EstadoError
              mensaje={ticketsError}
              onReintentar={() => setReintento((n) => n + 1)}
            />
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <ClipboardList className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">No hay tickets activos</p>
                <p className="text-sm text-muted-foreground">
                  Crea el primero para empezar.
                </p>
              </div>
              <Button asChild>
                <Link href="/nuevo-ticket">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear ticket
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {recentTickets.map((ticket) => {
                const color = statusBase(ticket.status)
                const waTemplates = buildTicketWhatsAppTemplates(ticket)
                return (
                  <article
                    key={ticket.id}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-input"
                  >
                    {/* Barra de acento por estado */}
                    <span
                      className="absolute inset-y-0 left-0 w-1"
                      style={{ background: color }}
                      aria-hidden
                    />

                    {/* Abre el resumen en una ventana. Antes navegaba a otra
                        pantalla y cortaba lo que se estaba haciendo. */}
                    <ScrollSafeButton
                      onClick={() => setTicketAbierto(ticket)}
                      aria-label={`Ver ticket ${displayId(ticket)} de ${ticket.client_name}`}
                      className="block w-full flex-1 touch-pan-y space-y-3 p-5 pl-6 text-left outline-none active:bg-muted/30 focus-visible:bg-muted/40"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-primary">
                          {displayId(ticket)}
                        </span>
                        <StatusPill status={ticket.status} />
                        <Badge variant="secondary" className="text-[11px] font-medium">
                          {EQUIPMENT_LABELS[ticket.equipment_type] ?? ticket.equipment_type}
                        </Badge>
                      </div>

                      <p className="font-semibold leading-tight">
                        {ticket.client_name}
                      </p>

                      <p className="line-clamp-2 text-sm leading-snug text-foreground/80">
                        {ticket.problem_description || "Sin descripción del problema."}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>Ingreso: {ticket.created_at ? formatDate(ticket.created_at) : "—"}</span>
                        {accList(ticket).length > 0 && (
                          <span>· {accList(ticket).length} accesorio{accList(ticket).length !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </ScrollSafeButton>

                    {/* Pie: contacto + cambio rápido de estado */}
                    <div className="space-y-2.5 border-t border-border bg-muted/30 px-5 py-3 pl-6">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          <Smartphone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {ticket.client_phone}
                        </span>
                        <PhoneActions
                          phone={ticket.client_phone}
                          templates={waTemplates}
                          size="sm"
                          preguntarMarcarListo={ticket.status !== "listo"}
                          marcarListo={() => handleStatusChange(ticket.id, "listo")}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={ticket.status}
                          disabled={statusSavingId === ticket.id}
                          onValueChange={(v) =>
                            void handleStatusChange(ticket.id, v as TicketStatus)
                          }
                        >
                          <SelectTrigger className="h-9 flex-1 bg-card text-sm">
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
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <TicketResumenDialog
        ticket={ticketAbierto}
        abierto={ticketAbierto !== null}
        onAbiertoChange={(a) => !a && setTicketAbierto(null)}
        onCambiarEstado={handleStatusChange}
        guardandoEstado={statusSavingId === ticketAbierto?.id}
      />
    </DashboardLayout>
  )
}
