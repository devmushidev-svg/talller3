"use client"

import { use, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import {
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  FileText,
  Package,
  Printer,
  ReceiptText,
  Smartphone,
  Tag,
  UserRound,
  Wallet,
  Wrench,
} from "lucide-react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/page-header"
import { PhoneActions } from "@/components/phone-actions"
import { PrintCustomer } from "@/components/print-customer"
import { PrintInternal } from "@/components/print-internal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { buildTicketWhatsAppTemplates } from "@/lib/whatsapp"
import { formatDateOnlyForDisplay } from "@/lib/date-utils"
import { EQUIPMENT_LABELS, type EquipmentType, type Ticket } from "@/lib/types"
import { EstadoLibrePill } from "@/components/status-pill"

/** Marca un fallo del servidor para distinguirlo de "el ticket no existe". */
class FalloDeCarga extends Error {}

const fetcher = async (url: string): Promise<Ticket> => {
  const response = await fetch(url, { cache: "no-store" })
  const payload: unknown = await response.json().catch(() => null)

  // 404 es "no existe". 500 es "no se pudo preguntar". Decirle al usuario
  // que su ticket "puede haber sido eliminado" cuando lo que fallo fue el
  // servidor es mentirle sobre sus propios datos.
  if (response.status >= 500) {
    throw new FalloDeCarga(`El servidor respondió ${response.status}.`)
  }
  if (!response.ok || !payload || typeof payload !== "object") {
    throw new Error("Ticket no encontrado")
  }

  const ticket = payload as Ticket & { accessories?: string | string[]; photos?: string | string[] }
  return {
    ...ticket,
    accessories: parseStringList(ticket.accessories),
    photos: parseStringList(ticket.photos).filter(isSafeHttpUrl),
  }
}

const STATUS_LABELS_SAFE: Record<string, string> = {
  recibido: "Recibido",
  received: "Recibido",
  en_diagnostico: "En diagnóstico",
  en_reparacion: "En reparación",
  listo: "Listo para entrega",
  entregado: "Entregado",
  delivered: "Entregado",
  cerrado: "Cerrado",
  completed: "Completado",
  cancelado: "Cancelado",
  canceled: "Cancelado",
  cancelled: "Cancelado",
  anulado: "Anulado",
  desactivado: "Desactivado",
  inactivo: "Inactivo",
}

function parseStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
  }
  if (typeof value !== "string" || !value.trim()) return []

  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      : []
  } catch {
    return []
  }
}

function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

function humanize(value: string) {
  const text = value.replaceAll("_", " ").trim()
  return text ? text.charAt(0).toLocaleUpperCase("es-HN") + text.slice(1) : "Sin estado"
}

function displayTicketNumber(ticket: Ticket) {
  return ticket.ticket_seq != null ? `Ticket N° ${ticket.ticket_seq}` : ticket.id
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
  }).format(value ?? 0)
}

function formatDateTime(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return formatDateOnlyForDisplay(value, "es-HN")
  return date.toLocaleString("es-HN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: ticket, isLoading, error, mutate } = useSWR<Ticket>(
    `/api/tickets/${encodeURIComponent(id)}`,
    fetcher,
    { revalidateOnFocus: false }
  )
  const [showCustomerPrint, setShowCustomerPrint] = useState(false)
  const [showInternalPrint, setShowInternalPrint] = useState(false)

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <Spinner className="size-8" />
          <p className="text-sm text-muted-foreground">Cargando ticket…</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !ticket) {
    const falloServidor = error instanceof FalloDeCarga
    return (
      <DashboardLayout>
        <Card className="mx-auto max-w-lg">
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <ClipboardList className="size-7" />
            </div>
            <h1 className="text-xl font-semibold">
              {falloServidor ? "No se pudo cargar el ticket" : "Ticket no encontrado"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {falloServidor
                ? `${error.message} El ticket sigue ahí; fue la consulta la que falló.`
                : "Puede que haya sido eliminado o que el enlace esté incompleto."}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {falloServidor && (
                <Button onClick={() => mutate()}>Reintentar</Button>
              )}
              <Button asChild variant="outline">
                <Link href="/">
                  <ArrowLeft className="mr-2 size-4" />
                  Volver al inicio
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  const ticketStatus = String(ticket.status || "")
  const statusLabel = STATUS_LABELS_SAFE[ticketStatus] ?? humanize(ticketStatus)
  const equipmentLabel =
    EQUIPMENT_LABELS[ticket.equipment_type as EquipmentType] ??
    humanize(String(ticket.equipment_type || "equipo"))
  const hasCosts = Boolean(
    ticket.total_cost ||
      ticket.amount_paid ||
      ticket.diagnosis_cost ||
      ticket.repair_cost ||
      ticket.labor_cost ||
      ticket.parts_cost
  )
  const remainingBalance = Math.max(
    Number(ticket.total_cost || 0) - Number(ticket.amount_paid || 0),
    0
  )

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          title={displayTicketNumber(ticket)}
          description="Ficha completa del equipo y su reparación."
          action={
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <Button variant="outline" asChild className="flex-1 sm:flex-none">
                <Link href="/">
                  <ArrowLeft className="mr-2 size-4" />
                  Inicio
                </Link>
              </Button>
              <Button
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => setShowInternalPrint(true)}
              >
                <Tag className="mr-2 size-4" />
                Etiquetas
              </Button>
              <Button
                className="flex-1 sm:flex-none"
                onClick={() => setShowCustomerPrint(true)}
              >
                <Printer className="mr-2 size-4" />
                Imprimir
              </Button>
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-2">
          <EstadoLibrePill status={ticketStatus} label={statusLabel} />
          <Badge variant="secondary">{equipmentLabel}</Badge>
          <span className="font-mono text-xs text-muted-foreground">ID: {ticket.id}</span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.8fr)]">
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserRound className="size-5 text-primary" />
                  Cliente y equipo
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <Detail label="Cliente" value={ticket.client_name} />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Teléfono
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Smartphone className="size-4 text-muted-foreground" />
                      {ticket.client_phone || "—"}
                    </span>
                    {ticket.client_phone ? (
                      <PhoneActions
                        phone={ticket.client_phone}
                        templates={buildTicketWhatsAppTemplates(ticket)}
                        size="sm"
                      />
                    ) : null}
                  </div>
                </div>
                <Detail label="Tipo" value={equipmentLabel} />
                <Detail
                  label="Marca y modelo"
                  value={[ticket.brand, ticket.model].filter(Boolean).join(" · ") || "—"}
                />
                <Detail label="Número de serie" value={ticket.serial_number || "—"} mono />
                <Detail label="Contraseña del equipo" value={ticket.device_password || "—"} mono />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wrench className="size-5 text-primary" />
                  Trabajo del taller
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <LongDetail label="Problema reportado" value={ticket.problem_description} />
                {ticket.diagnosis ? <LongDetail label="Diagnóstico" value={ticket.diagnosis} /> : null}
                {ticket.repair_notes ? (
                  <LongDetail label="Notas de reparación" value={ticket.repair_notes} />
                ) : null}
                {ticket.internal_notes ? (
                  <LongDetail label="Notas internas" value={ticket.internal_notes} />
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="size-5 text-primary" />
                  Accesorios recibidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ticket.accessories.length ? (
                  <div className="flex flex-wrap gap-2">
                    {ticket.accessories.map((accessory, index) => (
                      <Badge key={`${accessory}-${index}`} variant="secondary" className="px-3 py-1">
                        {accessory}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No se registraron accesorios.</p>
                )}
              </CardContent>
            </Card>

            {ticket.photos?.length ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="size-5 text-primary" />
                    Evidencia adjunta
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {ticket.photos.map((photo, index) => (
                    <Button key={`${photo}-${index}`} variant="outline" size="sm" asChild>
                      <a href={photo} target="_blank" rel="noreferrer">
                        Ver foto {index + 1}
                      </a>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <aside className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarClock className="size-5 text-primary" />
                  Fechas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Detail label="Recibido" value={formatDateTime(ticket.created_at)} />
                <Detail
                  label="Entrega aproximada"
                  value={
                    ticket.estimated_delivery_date
                      ? formatDateOnlyForDisplay(ticket.estimated_delivery_date, "es-HN")
                      : "—"
                  }
                />
                <Detail label="Entregado" value={formatDateTime(ticket.delivered_at)} />
                <Detail label="Última actualización" value={formatDateTime(ticket.updated_at)} />
                <Detail label="Recibido por" value={ticket.received_by || "—"} />
              </CardContent>
            </Card>

            {hasCosts ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wallet className="size-5 text-primary" />
                    Cobro
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <CostRow label="Diagnóstico" value={ticket.diagnosis_cost} />
                  <CostRow label="Reparación" value={ticket.repair_cost} />
                  <CostRow label="Mano de obra" value={ticket.labor_cost} />
                  <CostRow label="Repuestos" value={ticket.parts_cost} />
                  <CostRow label="Total" value={ticket.total_cost} strong />
                  <CostRow label="Pagado" value={ticket.amount_paid} />
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="font-medium">Saldo pendiente</span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(remainingBalance)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </aside>
        </div>
      </div>

      <PrintCustomer
        ticket={ticket}
        open={showCustomerPrint}
        onOpenChange={setShowCustomerPrint}
      />
      <PrintInternal
        ticket={ticket}
        open={showInternalPrint}
        onOpenChange={setShowInternalPrint}
      />
    </DashboardLayout>
  )
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1.5 break-words font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  )
}

function LongDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1.5 whitespace-pre-wrap leading-relaxed text-foreground/90">{value}</p>
    </div>
  )
}

function CostRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value?: number | null
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-bold" : "font-medium"}>{formatCurrency(value)}</span>
    </div>
  )
}
