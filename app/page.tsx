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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ClipboardList,
  Loader2,
  ChevronDown,
  Package,
  CheckCircle,
  Truck,
  Pencil,
  PlusCircle,
  BarChart3,
} from "lucide-react"
import {
  Ticket,
  STATUS_COLORS,
  STATUS_LABELS,
  EQUIPMENT_LABELS,
} from "@/lib/types"

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

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("es-HN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inicio</h1>
            <p className="text-muted-foreground">
              Tickets activos — del más nuevo al más antiguo
            </p>
          </div>
          <Button asChild className="w-full shrink-0 sm:w-auto">
            <Link href="/nuevo-ticket">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo ticket
            </Link>
          </Button>
        </div>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Equipos en taller
                {!ticketsLoading && (
                  <Badge variant="secondary" className="font-normal">
                    {tickets.length} activo{tickets.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/tickets-activos">Buscar y filtros avanzados</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {ticketsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="px-6 py-12 text-center text-muted-foreground">
                <p className="mb-3">No hay tickets activos.</p>
                <Button asChild>
                  <Link href="/nuevo-ticket">Crear el primero</Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Ticket</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="hidden sm:table-cell">Equipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden md:table-cell">Ingreso</TableHead>
                      <TableHead className="w-36 text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-sm font-semibold">
                          {displayId(ticket)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ticket.client_name}</p>
                            <p className="text-xs text-muted-foreground">{ticket.client_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">
                          {EQUIPMENT_LABELS[ticket.equipment_type] ?? ticket.equipment_type}
                          {(ticket.brand || ticket.model) && (
                            <p className="text-xs text-muted-foreground">
                              {[ticket.brand, ticket.model].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-xs border-0"
                            style={{
                              backgroundColor: `${STATUS_COLORS[ticket.status]}22`,
                              color: STATUS_COLORS[ticket.status],
                            }}
                          >
                            {STATUS_LABELS[ticket.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {ticket.created_at ? formatDate(ticket.created_at) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" asChild>
                            <Link
                              href={`/tickets-activos?ticketId=${encodeURIComponent(ticket.id)}`}
                            >
                              <Pencil className="mr-1.5 h-3.5 w-3.5" />
                              Actualizar
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
