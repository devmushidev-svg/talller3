"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Ticket,
  TicketStatus,
  STATUS_LABELS,
  EQUIPMENT_LABELS,
} from "@/lib/types"
import {
  Search,
  Eye,
  Printer,
  Loader2,
  Filter,
  Calendar,
  Tag,
  Image as ImageIcon,
  ClipboardList,
  Smartphone,
  X,
  Pencil,
} from "lucide-react"
import { QRScanner } from "@/components/qr-scanner"
import { CustomerHistory } from "@/components/customer-history"
import { PrintCustomer } from "@/components/print-customer"
import { PrintInternal } from "@/components/print-internal"
import { PhoneActions } from "@/components/phone-actions"
import { buildTicketWhatsAppTemplates } from "@/lib/whatsapp"
import { formatDateOnlyForDisplay } from "@/lib/date-utils"
import { StatusPill, statusBase } from "@/components/status-pill"

const statusOptions: TicketStatus[] = [
  "recibido",
  "en_diagnostico",
  "en_reparacion",
  "listo",
  "entregado",
]

const activeStatusOptions: Exclude<TicketStatus, "entregado">[] = [
  "recibido",
  "en_diagnostico",
  "en_reparacion",
  "listo",
]

const ACTIVE_STATUS_VALUES = new Set([
  ...activeStatusOptions,
  // Alias historico que todavia puede existir en la base de datos.
  "received",
])

function isActiveTicketStatus(status: unknown) {
  return typeof status === "string" && ACTIVE_STATUS_VALUES.has(status.toLowerCase())
}

function normalizeTicketStatus(status: unknown): TicketStatus {
  if (typeof status !== "string") return status as TicketStatus
  const normalizedStatus = status.toLowerCase()
  return normalizedStatus === "received"
    ? "recibido"
    : (normalizedStatus as TicketStatus)
}


interface ScrollSafeTableRowProps {
  children: ReactNode
  label: string
  onActivate: () => void
}

/** Evita activar una fila si el puntero se usó para desplazar la tabla. */
function ScrollSafeTableRow({ children, label, onActivate }: ScrollSafeTableRowProps) {
  const pointerOriginRef = useRef<{
    pointerId: number
    x: number
    y: number
  } | null>(null)
  const draggedRef = useRef(false)

  const handlePointerDown = (event: ReactPointerEvent<HTMLTableRowElement>) => {
    if (!event.isPrimary || event.button !== 0) return
    pointerOriginRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    }
    draggedRef.current = false
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLTableRowElement>) => {
    const origin = pointerOriginRef.current
    if (!origin || origin.pointerId !== event.pointerId || draggedRef.current) return

    if (
      Math.abs(event.clientX - origin.x) > 8 ||
      Math.abs(event.clientY - origin.y) > 8
    ) {
      draggedRef.current = true
    }
  }

  const handlePointerCancel = (event: ReactPointerEvent<HTMLTableRowElement>) => {
    if (pointerOriginRef.current?.pointerId === event.pointerId) {
      draggedRef.current = true
    }
  }

  const handleClick = (event: ReactMouseEvent<HTMLTableRowElement>) => {
    pointerOriginRef.current = null
    onActivate()
  }

  // Se ejecuta antes que el click del Select o de los botones de la celda.
  // Asi, un gesto usado para desplazar la tabla no activa ningun control.
  const handleClickCapture = (event: ReactMouseEvent<HTMLTableRowElement>) => {
    pointerOriginRef.current = null
    if (event.detail === 0) {
      draggedRef.current = false
      return
    }
    if (!draggedRef.current) return

    draggedRef.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTableRowElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.key !== "Enter" && event.key !== " ") return
    event.preventDefault()
    onActivate()
  }

  return (
    <TableRow
      tabIndex={0}
      aria-label={label}
      className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      onPointerDownCapture={handlePointerDown}
      onPointerMoveCapture={handlePointerMove}
      onPointerCancelCapture={handlePointerCancel}
      onClickCapture={handleClickCapture}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </TableRow>
  )
}

interface ActiveTicketMobileCardProps {
  ticket: Ticket
  ticketNumber: string
  formattedDate: string
  onOpen: (ticket: Ticket) => void
  onStatusChange: (ticketId: string, status: TicketStatus) => void
  isStatusSaving: boolean
  onCustomerPrint: (ticket: Ticket) => void
  onInternalPrint: (ticket: Ticket) => void
}

function ActiveTicketMobileCard({
  ticket,
  ticketNumber,
  formattedDate,
  onOpen,
  onStatusChange,
  isStatusSaving,
  onCustomerPrint,
  onInternalPrint,
}: ActiveTicketMobileCardProps) {
  const equipment = EQUIPMENT_LABELS[ticket.equipment_type] ?? ticket.equipment_type
  const brandModel = [ticket.brand, ticket.model].filter(Boolean).join(" ")

  return (
    <article>
      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="font-mono text-xs font-bold text-primary">{ticketNumber}</p>
              <h3 className="truncate text-base font-semibold">{ticket.client_name}</h3>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Smartphone className="size-3.5 shrink-0" />
                <span className="truncate">{ticket.client_phone || "Sin teléfono"}</span>
              </p>
            </div>
            <StatusPill status={ticket.status} />
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary" className="font-normal">{equipment}</Badge>
            {brandModel && (
              <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
                {brandModel}
              </span>
            )}
          </div>

          {ticket.problem_description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-foreground/80">
              {ticket.problem_description}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
            <span>{formattedDate}</span>
            {ticket.total_cost != null && ticket.total_cost > 0 && (
              <span className="font-semibold tabular-nums text-success">
                L. {ticket.total_cost.toFixed(2)}
              </span>
            )}
          </div>

          <Select
            value={ticket.status}
            disabled={isStatusSaving}
            onValueChange={(value) => onStatusChange(ticket.id, value as TicketStatus)}
          >
            <SelectTrigger
              className="h-11 w-full bg-card"
              aria-label={`Cambiar estado de ${ticketNumber}`}
              aria-busy={isStatusSaving}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  <StatusPill status={status} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button type="button" size="lg" className="h-11 flex-1" onClick={() => onOpen(ticket)}>
              <Eye className="size-4" />
              Ver detalles
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="size-11"
              aria-label={`Imprimir comprobante de ${ticketNumber}`}
              title="Imprimir comprobante"
              onClick={() => onCustomerPrint(ticket)}
            >
              <Printer className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="size-11"
              aria-label={`Imprimir etiquetas de ${ticketNumber}`}
              title="Imprimir etiquetas"
              onClick={() => onInternalPrint(ticket)}
            >
              <Tag className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </article>
  )
}

export default function TicketsActivosPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [printTicket, setPrintTicket] = useState<Ticket | null>(null)
  const [showCustomerPrint, setShowCustomerPrint] = useState(false)
  const [showInternalPrint, setShowInternalPrint] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [savingStatusIds, setSavingStatusIds] = useState<Set<string>>(
    () => new Set()
  )
  const ticketsRequestIdRef = useRef(0)

  // Advanced filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [equipmentFilter, setEquipmentFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Edit mode
  const [editMode, setEditMode] = useState(false)
  const [editDiagnosis, setEditDiagnosis] = useState("")
  const [editRepairNotes, setEditRepairNotes] = useState("")
  const [editLaborCost, setEditLaborCost] = useState("")
  const [editPartsCost, setEditPartsCost] = useState("")
  const [editAmountPaid, setEditAmountPaid] = useState("")
  const [editClientName, setEditClientName] = useState("")
  const [editClientPhone, setEditClientPhone] = useState("")
  const [savingClient, setSavingClient] = useState(false)

  const parseTicket = (t: Ticket): Ticket => ({
    ...t,
    status: normalizeTicketStatus(t.status),
    accessories:
      typeof t.accessories === "string"
        ? JSON.parse(t.accessories as string)
        : t.accessories || [],
    photos:
      typeof t.photos === "string"
        ? JSON.parse(t.photos as string)
        : t.photos || [],
  })

  useEffect(() => {
    const requestId = ++ticketsRequestIdRef.current
    const controller = new AbortController()

    const debounce = setTimeout(async () => {
      setLoading(true)

      try {
        const params = new URLSearchParams()
        const hasSearchFilters = Boolean(
          searchTerm ||
            statusFilter !== "all" ||
            equipmentFilter !== "all" ||
            dateFrom ||
            dateTo
        )
        if (hasSearchFilters) params.set("scope", "active")
        if (searchTerm) params.set("q", searchTerm)
        // Se filtra en cliente para que "recibido" incluya el alias "received".
        if (statusFilter !== "all" && statusFilter !== "recibido") {
          params.set("status", statusFilter)
        }
        if (equipmentFilter !== "all") {
          params.set("equipment_type", equipmentFilter)
        }
        if (dateFrom) params.set("date_from", dateFrom)
        if (dateTo) params.set("date_to", dateTo)

        const url = hasSearchFilters
          ? `/api/search?${params}`
          : "/api/tickets?scope=active"
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`No se pudieron cargar los tickets (${response.status})`)
        }

        const data: unknown = await response.json()
        if (requestId !== ticketsRequestIdRef.current) return

        const parsedTickets = (Array.isArray(data) ? data : [])
          .filter((ticket): ticket is Ticket =>
            isActiveTicketStatus((ticket as { status?: unknown })?.status)
          )
          .map((ticket) => parseTicket(ticket))
          .filter(
            (ticket) =>
              statusFilter === "all" || ticket.status === statusFilter
          )

        setTickets(parsedTickets)
      } catch (error) {
        if (controller.signal.aborted || requestId !== ticketsRequestIdRef.current) {
          return
        }
        console.error("Error fetching tickets:", error)
      } finally {
        if (requestId === ticketsRequestIdRef.current) {
          setLoading(false)
        }
      }
    }, 300)

    return () => {
      clearTimeout(debounce)
      controller.abort()
    }
  }, [searchTerm, statusFilter, equipmentFilter, dateFrom, dateTo])

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    if (savingStatusIds.has(ticketId)) return

    setSavingStatusIds((previous) => {
      const next = new Set(previous)
      next.add(ticketId)
      return next
    })

    try {
      const updateData: Record<string, unknown> = { status: newStatus }
      if (newStatus === 'entregado') {
        updateData.delivered_at = new Date().toISOString()
      }

      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        let message = "No se pudo cambiar el estado del ticket"
        try {
          const body = (await response.json()) as { error?: unknown }
          if (typeof body.error === "string" && body.error.trim()) {
            message = body.error
          }
        } catch {
          // La respuesta puede no incluir JSON; conservamos el mensaje amigable.
        }
        throw new Error(message)
      }

      setTickets((prev) => {
        if (
          !isActiveTicketStatus(newStatus) ||
          (statusFilter !== "all" && statusFilter !== newStatus)
        ) {
          return prev.filter((ticket) => ticket.id !== ticketId)
        }

        return prev.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
        )
      })

      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => {
          if (!prev || !isActiveTicketStatus(newStatus)) return null
          return { ...prev, status: newStatus }
        })
      }
    } catch (error) {
      console.error("Error updating status:", error)
      alert(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar el estado del ticket"
      )
    } finally {
      setSavingStatusIds((previous) => {
        const next = new Set(previous)
        next.delete(ticketId)
        return next
      })
    }
  }

  const handleSaveClient = async () => {
    if (!selectedTicket) return
    const name = editClientName.trim()
    const phone = editClientPhone.trim()
    if (!name || !phone) {
      alert("Nombre y teléfono son obligatorios")
      return
    }
    setSavingClient(true)
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_name: name, client_phone: phone }),
      })
      if (!res.ok) throw new Error("Error al actualizar cliente")
      const raw = await res.json()
      const updated = parseTicket(raw as Ticket)
      setSelectedTicket(updated)
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? updated : t))
      )
    } catch (e) {
      console.error(e)
      alert("No se pudo guardar los datos del cliente")
    } finally {
      setSavingClient(false)
    }
  }

  const handleSaveDetails = async () => {
    if (!selectedTicket) return

    const laborCost = parseFloat(editLaborCost) || 0
    const partsCost = parseFloat(editPartsCost) || 0
    const totalCost = laborCost + partsCost
    const amountPaid = parseFloat(editAmountPaid) || 0

    try {
      await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosis: editDiagnosis,
          repair_notes: editRepairNotes,
          labor_cost: laborCost,
          parts_cost: partsCost,
          total_cost: totalCost,
          amount_paid: amountPaid,
          payment_status: amountPaid >= totalCost ? 'pagado' : 'pendiente',
        }),
      })

      const updatedTicket: Ticket = {
        ...selectedTicket,
        diagnosis: editDiagnosis,
        repair_notes: editRepairNotes,
        labor_cost: laborCost,
        parts_cost: partsCost,
        total_cost: totalCost,
        amount_paid: amountPaid,
        payment_status: amountPaid >= totalCost ? 'pagado' : 'pendiente',
      }

      setSelectedTicket(updatedTicket)
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t))
      setEditMode(false)
    } catch (error) {
      console.error("Error saving details:", error)
    }
  }

  const openTicketDetail = useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket)
    setEditClientName(ticket.client_name)
    setEditClientPhone(ticket.client_phone)
    setEditDiagnosis(ticket.diagnosis || "")
    setEditRepairNotes(ticket.repair_notes || "")
    setEditLaborCost(ticket.labor_cost?.toString() || "0")
    setEditPartsCost(ticket.parts_cost?.toString() || "0")
    setEditAmountPaid(ticket.amount_paid?.toString() || "0")
    setEditMode(false)
  }, [])

  /** Enlace desde inicio: /tickets-activos?ticketId=… abre el detalle y limpia la URL. */
  useEffect(() => {
    if (loading || tickets.length === 0 || typeof window === "undefined") return
    const id = new URLSearchParams(window.location.search).get("ticketId")
    if (!id) return
    const t = tickets.find((x) => x.id === id)
    if (!t) return
    if (selectedTicket?.id === id) {
      router.replace("/tickets-activos", { scroll: false })
      return
    }
    openTicketDetail(t)
    router.replace("/tickets-activos", { scroll: false })
  }, [tickets, loading, router, openTicketDetail, selectedTicket?.id])

  const handleCustomerPrint = (ticket: Ticket) => {
    setPrintTicket(ticket)
    setShowCustomerPrint(true)
  }

  const handleInternalPrint = (ticket: Ticket) => {
    setPrintTicket(ticket)
    setShowInternalPrint(true)
  }

  const handleQRScan = (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId)
    if (ticket) {
      openTicketDetail(ticket)
    } else {
      // Ticket not in current view, search for it
      setSearchTerm(ticketId)
    }
  }

  const formatDate = (dateStr: string) => formatDateOnlyForDisplay(dateStr, "es-MX")

  const clearFilters = () => {
    setStatusFilter("all")
    setEquipmentFilter("all")
    setDateFrom("")
    setDateTo("")
    setSearchTerm("")
  }

  const hasActiveFilters = statusFilter !== 'all' || equipmentFilter !== 'all' || dateFrom || dateTo

  const displayId = (t: Ticket) =>
    t.ticket_seq != null ? `N° ${t.ticket_seq}` : t.id

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <PageHeader
          title="Tickets Activos"
          description="Busca, filtra y gestiona los equipos en taller."
          action={<QRScanner onScan={handleQRScan} />}
        />

        {/* ── Búsqueda y filtros ─────────────────────── */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cliente, N° ticket, teléfono o modelo"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-11 pl-10"
                  />
                </div>
                <CollapsibleTrigger asChild>
                  <Button
                    variant={hasActiveFilters ? "default" : "outline"}
                    className="h-11 shrink-0 gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Filtros
                    {hasActiveFilters && (
                      <span className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background/25 text-[11px] font-semibold">
                        !
                      </span>
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="space-y-4">
                <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los activos</SelectItem>
                        {activeStatusOptions.map(status => (
                          <SelectItem key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Equipo</Label>
                    <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {Object.entries(EQUIPMENT_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Fecha Desde
                    </Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Fecha Hasta
                    </Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
                    <X className="h-4 w-4" />
                    Limpiar filtros
                  </Button>
                )}
              </CollapsibleContent>
            </CardContent>
          </Card>
        </Collapsible>

        {/* ── Resultados ─────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ClipboardList className="h-5 w-5 text-primary" />
              En taller
            </h2>
            {!loading && (
              <Badge variant="secondary" className="font-normal">
                {tickets.length} equipo{tickets.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {loading ? (
            <Card>
              <CardContent className="space-y-3 p-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-5 w-16 rounded shimmer" />
                    <div className="h-5 flex-1 rounded shimmer" />
                    <div className="hidden h-5 w-28 rounded shimmer sm:block" />
                    <div className="h-7 w-28 rounded-full shimmer" />
                    <div className="h-8 w-20 rounded shimmer" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">No se encontraron tickets</p>
                <p className="text-sm text-muted-foreground">
                  Ajusta la búsqueda o limpia los filtros para ver más resultados.
                </p>
              </div>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="gap-1.5">
                  <X className="h-4 w-4" />
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {tickets.map((ticket) => (
                  <ActiveTicketMobileCard
                    key={ticket.id}
                    ticket={ticket}
                    ticketNumber={displayId(ticket)}
                    formattedDate={formatDate(ticket.created_at)}
                    onOpen={openTicketDetail}
                    onStatusChange={(ticketId, status) => {
                      void handleStatusChange(ticketId, status)
                    }}
                    isStatusSaving={savingStatusIds.has(ticket.id)}
                    onCustomerPrint={handleCustomerPrint}
                    onInternalPrint={handleInternalPrint}
                  />
                ))}
              </div>

              <Card className="hidden overflow-hidden md:block">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-28">Ticket</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="hidden sm:table-cell">Equipo</TableHead>
                        <TableHead className="hidden md:table-cell">Marca/Modelo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                        <TableHead className="hidden lg:table-cell">Total</TableHead>
                        <TableHead className="w-28 text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <ScrollSafeTableRow
                          key={ticket.id}
                          label={`Abrir ${displayId(ticket)} de ${ticket.client_name}`}
                          onActivate={() => openTicketDetail(ticket)}
                        >
                          <TableCell className="font-mono text-xs font-semibold text-primary">
                            {displayId(ticket)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{ticket.client_name}</p>
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Smartphone className="h-3 w-3 shrink-0" />
                                {ticket.client_phone}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="secondary" className="font-normal">
                              {EQUIPMENT_LABELS[ticket.equipment_type]}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground md:table-cell">
                            {ticket.brand} {ticket.model}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={ticket.status}
                              disabled={savingStatusIds.has(ticket.id)}
                              onValueChange={(value) =>
                                handleStatusChange(ticket.id, value as TicketStatus)
                              }
                            >
                              <SelectTrigger
                                className="h-9 w-[150px] border-border"
                                aria-busy={savingStatusIds.has(ticket.id)}
                              >
                                <StatusPill status={ticket.status} />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    <StatusPill status={status} />
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground sm:table-cell">
                            {formatDate(ticket.created_at)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {ticket.total_cost && ticket.total_cost > 0 ? (
                              <span className="font-medium tabular-nums text-success">
                                L. {ticket.total_cost.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Ver detalles"
                                onClick={() => openTicketDetail(ticket)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Imprimir ticket cliente"
                                onClick={() => handleCustomerPrint(ticket)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Etiquetas internas"
                                onClick={() => handleInternalPrint(ticket)}
                              >
                                <Tag className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </ScrollSafeTableRow>
                      ))}
                    </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </section>
      </div>

      {/* Ticket Detail Dialog */}
      <Dialog
        open={!!selectedTicket}
        onOpenChange={() => setSelectedTicket(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm font-bold text-primary">
                    {displayId(selectedTicket)}
                  </span>
                  <StatusPill status={selectedTicket.status} />
                  {selectedTicket.total_cost != null && selectedTicket.total_cost > 0 && (
                    <Badge variant={(selectedTicket.amount_paid ?? 0) >= selectedTicket.total_cost ? "default" : "destructive"}>
                      {(selectedTicket.amount_paid ?? 0) >= selectedTicket.total_cost ? "Pagado" : "Pendiente"}
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 pt-2">
                {/* Client Info */}
                <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
                  <p className="text-sm font-semibold text-foreground">Datos del cliente</p>
                  <div className="space-y-2">
                    <Label htmlFor="edit-client-name">Nombre</Label>
                    <Input
                      id="edit-client-name"
                      value={editClientName}
                      onChange={(e) => setEditClientName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-client-phone">Teléfono</Label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        id="edit-client-phone"
                        value={editClientPhone}
                        onChange={(e) => setEditClientPhone(e.target.value)}
                        className="sm:flex-1"
                      />
                      <CustomerHistory phone={selectedTicket.client_phone} name={selectedTicket.client_name} />
                    </div>
                    <div className="mt-2">
                      <PhoneActions
                        phone={selectedTicket.client_phone}
                        templates={buildTicketWhatsAppTemplates(selectedTicket)}
                        showLabels
                        size="sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Al guardar, se actualiza el ticket y la ficha del cliente (mismo teléfono).
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingClient}
                    onClick={handleSaveClient}
                  >
                    {savingClient ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando…
                      </>
                    ) : (
                      "Guardar cliente"
                    )}
                  </Button>
                </div>

                {/* Equipment Info */}
                <div className="rounded-2xl border border-border p-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Tipo</p>
                      <p className="font-medium">
                        {EQUIPMENT_LABELS[selectedTicket.equipment_type]}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Marca</p>
                      <p className="font-medium">{selectedTicket.brand || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Modelo</p>
                      <p className="font-medium">{selectedTicket.model || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Serie</p>
                      <p className="font-medium">
                        {selectedTicket.serial_number || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground">Contraseña del equipo</p>
                    <p className="font-mono font-medium">
                      {selectedTicket.device_password?.trim() || "—"}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha de Recepción</p>
                    <p className="font-medium">{formatDate(selectedTicket.created_at)}</p>
                  </div>
                  {selectedTicket.estimated_delivery_date && (
                    <div>
                      <p className="text-xs text-muted-foreground">Entrega Estimada</p>
                      <p className="font-medium">{formatDate(selectedTicket.estimated_delivery_date)}</p>
                    </div>
                  )}
                </div>

                {/* Problem */}
                <div>
                  <p className="text-xs text-muted-foreground">Problema Reportado</p>
                  <p className="font-medium">{selectedTicket.problem_description}</p>
                </div>

                {/* Photos */}
                {selectedTicket.photos && selectedTicket.photos.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <ImageIcon className="h-4 w-4" />
                      Fotos del Equipo
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedTicket.photos.map((photo, index) => (
                        <a key={index} href={photo} target="_blank" rel="noopener noreferrer">
                          <img
                            src={photo}
                            alt={`Foto ${index + 1}`}
                            className="aspect-square w-full rounded-lg border object-cover transition-opacity hover:opacity-80"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accessories */}
                <div>
                  <p className="mb-2 text-xs text-muted-foreground">
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

                {/* Diagnosis & Repair (editable) */}
                {editMode ? (
                  <div className="space-y-4 rounded-2xl border border-border bg-muted/40 p-4">
                    <div className="space-y-2">
                      <Label>Diagnóstico</Label>
                      <Textarea
                        value={editDiagnosis}
                        onChange={(e) => setEditDiagnosis(e.target.value)}
                        placeholder="Resultado del diagnóstico..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notas de Reparación</Label>
                      <Textarea
                        value={editRepairNotes}
                        onChange={(e) => setEditRepairNotes(e.target.value)}
                        placeholder="Detalles de la reparación..."
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Mano de Obra (L.)</Label>
                        <Input
                          type="number"
                          value={editLaborCost}
                          onChange={(e) => setEditLaborCost(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Piezas (L.)</Label>
                        <Input
                          type="number"
                          value={editPartsCost}
                          onChange={(e) => setEditPartsCost(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Total (L.)</Label>
                        <Input
                          type="number"
                          value={(parseFloat(editLaborCost || '0') + parseFloat(editPartsCost || '0')).toFixed(2)}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Monto Pagado (L.)</Label>
                      <Input
                        type="number"
                        value={editAmountPaid}
                        onChange={(e) => setEditAmountPaid(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveDetails}>Guardar</Button>
                      <Button variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(selectedTicket.diagnosis || selectedTicket.repair_notes) && (
                      <>
                        {selectedTicket.diagnosis && (
                          <div>
                            <p className="text-xs text-muted-foreground">Diagnóstico</p>
                            <p className="font-medium">{selectedTicket.diagnosis}</p>
                          </div>
                        )}
                        {selectedTicket.repair_notes && (
                          <div>
                            <p className="text-xs text-muted-foreground">Notas de Reparación</p>
                            <p className="font-medium">{selectedTicket.repair_notes}</p>
                          </div>
                        )}
                      </>
                    )}

                    {selectedTicket.total_cost != null && selectedTicket.total_cost > 0 && (
                      <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-muted/30 p-4 sm:grid-cols-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Mano de Obra</p>
                          <p className="font-medium tabular-nums">L. {selectedTicket.labor_cost?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Piezas</p>
                          <p className="font-medium tabular-nums">L. {selectedTicket.parts_cost?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-bold tabular-nums text-success">L. {selectedTicket.total_cost?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Pagado</p>
                          <p className="font-medium tabular-nums">L. {selectedTicket.amount_paid?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                    )}

                    <Button variant="outline" onClick={() => setEditMode(true)} className="gap-2">
                      <Pencil className="h-4 w-4" />
                      Editar Diagnóstico y Costos
                    </Button>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-4 border-t border-border pt-4">
                  <div className="space-y-2">
                    <Label>Cambiar estado</Label>
                    <Select
                      value={selectedTicket.status}
                      disabled={savingStatusIds.has(selectedTicket.id)}
                      onValueChange={(value) =>
                        handleStatusChange(selectedTicket.id, value as TicketStatus)
                      }
                    >
                      <SelectTrigger
                        className="w-full sm:w-56"
                        aria-busy={savingStatusIds.has(selectedTicket.id)}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button onClick={() => handleCustomerPrint(selectedTicket)} size="lg" className="h-12">
                      <Printer className="mr-2 h-4 w-4" />
                      Comprobante (cliente)
                    </Button>
                    <Button variant="secondary" onClick={() => handleInternalPrint(selectedTicket)} size="lg" className="h-12">
                      <Tag className="mr-2 h-4 w-4" />
                      POS / Etiquetas (Interno)
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Dialogs */}
      {printTicket && (
        <>
          <PrintCustomer
            ticket={printTicket}
            open={showCustomerPrint}
            onOpenChange={setShowCustomerPrint}
          />
          <PrintInternal
            ticket={printTicket}
            open={showInternalPrint}
            onOpenChange={setShowInternalPrint}
          />
        </>
      )}
    </DashboardLayout>
  )
}
