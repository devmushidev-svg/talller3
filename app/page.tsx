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
} from "lucide-react"
import {
  Ticket,
  TicketStatus,
  STATUS_LABELS,
  EQUIPMENT_LABELS,
} from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatDateOnlyForDisplay } from "@/lib/date-utils"
import { PhoneActions } from "@/components/phone-actions"
import { buildTicketWhatsAppTemplates } from "@/lib/whatsapp"

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

/** Color por estado (variable CSS, se adapta a claro/oscuro) */
const STATUS_VAR: Record<TicketStatus, string> = {
  recibido: "var(--chart-1)",
  en_diagnostico: "var(--warning)",
  en_reparacion: "var(--chart-2)",
  listo: "var(--success)",
  entregado: "var(--muted-foreground)",
}

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
    let cancelled = false
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || data?.error) return
        setStats(data as Stats)
      })
      .catch(console.error)
    return () => {
      cancelled = true
    }
  }, [])

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
    } catch (e) {
      console.error(e)
      alert("No se pudo cambiar el estado")
    } finally {
      setStatusSavingId(null)
    }
  }

  const statCards = [
    {
      title: "Recibidos hoy",
      value: stats?.receivedToday,
      icon: Package,
      tint: "var(--chart-1)",
    },
    {
      title: "Activos",
      value: stats?.activeTickets,
      icon: ClipboardList,
      tint: "var(--warning)",
    },
    {
      title: "Listos para entrega",
      value: stats?.readyForPickup,
      icon: CheckCircle,
      tint: "var(--success)",
    },
    {
      title: "Entregados hoy",
      value: stats?.deliveredToday,
      icon: Truck,
      tint: "var(--chart-2)",
    },
  ]

  const displayId = (t: Ticket) =>
    t.ticket_seq != null ? `N° ${t.ticket_seq}` : t.id

  const formatDate = (s: string) => formatDateOnlyForDisplay(s, "es-HN")

  const accList = (t: Ticket) =>
    Array.isArray(t.accessories) ? t.accessories.filter(Boolean) : []

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader
          icon={LayoutDashboard}
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

        {/* ── Estadísticas ───────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 stagger">
          {statCards.map((c) => (
            <div
              key={c.title}
              className="hover-lift relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 sm:p-5"
            >
              <div
                className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-[0.12]"
                style={{ background: c.tint }}
                aria-hidden
              />
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${c.tint} 15%, transparent)`,
                    color: c.tint,
                  }}
                >
                  <c.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  {c.value == null ? (
                    <div className="h-7 w-10 rounded-md shimmer" />
                  ) : (
                    <p className="text-2xl font-bold leading-none tabular-nums">
                      {c.value}
                    </p>
                  )}
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {c.title}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Métricas secundarias */}
        {stats && (
          <div className="grid gap-3 sm:grid-cols-3 stagger">
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4">
              <CalendarClock className="h-5 w-5 shrink-0 text-primary" />
              <div className="text-sm">
                <p className="font-semibold">Esta semana</p>
                <p className="text-muted-foreground">
                  {stats.weekTickets} tickets · L. {stats.weekRevenue.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4">
              <Truck className="h-5 w-5 shrink-0 text-chart-2" />
              <div className="text-sm">
                <p className="font-semibold">Este mes</p>
                <p className="text-muted-foreground">
                  {stats.monthDelivered} entregados · L. {stats.monthRevenue.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4">
              <Wallet className="h-5 w-5 shrink-0 text-amber-500" />
              <div className="text-sm">
                <p className="font-semibold">Por cobrar</p>
                <p className="text-muted-foreground">
                  L. {stats.pendingPayments.toFixed(2)} · {stats.avgRepairDays} días prom.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Tickets en taller ──────────────────────── */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ClipboardList className="h-5 w-5 text-primary" />
              En taller
              {!ticketsLoading && (
                <Badge variant="secondary" className="font-normal">
                  {tickets.length} activo{tickets.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/tickets-activos">
                Lista completa y filtros
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {ticketsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-52 rounded-2xl border border-border/70 bg-card p-5"
                >
                  <div className="h-5 w-24 rounded shimmer" />
                  <div className="mt-4 h-6 w-40 rounded shimmer" />
                  <div className="mt-3 h-4 w-full rounded shimmer" />
                  <div className="mt-2 h-4 w-3/4 rounded shimmer" />
                </div>
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand-soft">
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
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 stagger">
              {tickets.map((ticket) => {
                const color = STATUS_VAR[ticket.status]
                const waTemplates = buildTicketWhatsAppTemplates(ticket)
                return (
                  <article
                    key={ticket.id}
                    className="hover-lift group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card"
                  >
                    {/* Barra de acento por estado */}
                    <span
                      className="absolute inset-y-0 left-0 w-1.5"
                      style={{ background: color }}
                      aria-hidden
                    />

                    <Link
                      href={`/tickets-activos?ticketId=${encodeURIComponent(ticket.id)}`}
                      className="block flex-1 space-y-3 p-5 pl-6 outline-none focus-visible:bg-muted/40"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-primary">
                          {displayId(ticket)}
                        </span>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                          style={{
                            backgroundColor: `color-mix(in oklch, ${color} 16%, transparent)`,
                            color,
                          }}
                        >
                          {STATUS_LABELS[ticket.status]}
                        </span>
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
                    </Link>

                    {/* Pie: contacto + cambio rápido de estado */}
                    <div className="space-y-2.5 border-t border-border/70 bg-muted/30 px-5 py-3 pl-6">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          <Smartphone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {ticket.client_phone}
                        </span>
                        <PhoneActions
                          phone={ticket.client_phone}
                          templates={waTemplates}
                          size="sm"
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
    </DashboardLayout>
  )
}
