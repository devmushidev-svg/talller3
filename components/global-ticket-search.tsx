"use client"

import { useEffect, useId, useState } from "react"
import {
  AlertCircle,
  ArrowUpRight,

  LoaderCircle,
  Monitor,
  Phone,
  Search,
  SearchX,
  UserRound,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollSafeLink } from "@/components/scroll-safe-link"
import { formatDateOnlyForDisplay } from "@/lib/date-utils"
import { EQUIPMENT_LABELS, type EquipmentType } from "@/lib/types"
import { cn } from "@/lib/utils"

const SEARCH_DEBOUNCE_MS = 300
const MAX_QUERY_LENGTH = 80
const DEFAULT_RESULT_LIMIT = 8

export interface GlobalTicketSearchResult {
  id: string
  ticket_seq: number | null
  created_at: string | null
  client_name: string
  client_phone: string | null
  equipment_type: string | null
  brand: string | null
  model: string | null
  serial_number: string | null
  status: string | null
}

export interface GlobalTicketSearchProps {
  className?: string
  resultLimit?: number
  autoFocus?: boolean
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  recibido: {
    label: "Recibido",
    className: "border-border bg-primary/10 text-primary",
  },
  received: {
    label: "Recibido",
    className: "border-border bg-primary/10 text-primary",
  },
  en_diagnostico: {
    label: "En diagnóstico",
    className: "border-warning/30 bg-warning/15 text-foreground",
  },
  en_reparacion: {
    label: "En reparación",
    className: "border-accent/20 bg-accent/10 text-accent-foreground",
  },
  listo: {
    label: "Listo",
    className: "border-success/25 bg-success/15 text-success",
  },
  entregado: {
    label: "Entregado",
    className: "border-border bg-muted text-muted-foreground",
  },
  delivered: {
    label: "Entregado",
    className: "border-border bg-muted text-muted-foreground",
  },
  cerrado: {
    label: "Cerrado",
    className: "border-border bg-muted text-muted-foreground",
  },
  completed: {
    label: "Completado",
    className: "border-border bg-muted text-muted-foreground",
  },
  cancelado: {
    label: "Cancelado",
    className: "border-destructive/25 bg-destructive/10 text-destructive",
  },
  canceled: {
    label: "Cancelado",
    className: "border-destructive/25 bg-destructive/10 text-destructive",
  },
  cancelled: {
    label: "Cancelado",
    className: "border-destructive/25 bg-destructive/10 text-destructive",
  },
  anulado: {
    label: "Anulado",
    className: "border-destructive/25 bg-destructive/10 text-destructive",
  },
  desactivado: {
    label: "Desactivado",
    className: "border-destructive/25 bg-destructive/10 text-destructive",
  },
  inactivo: {
    label: "Inactivo",
    className: "border-destructive/25 bg-destructive/10 text-destructive",
  },
}

function humanize(value: string) {
  const words = value.replaceAll("_", " ").trim()
  if (!words) return "Sin estado"
  return words.charAt(0).toLocaleUpperCase("es") + words.slice(1)
}

function getStatusMeta(status: string | null) {
  if (!status) {
    return {
      label: "Sin estado",
      className: "border-border bg-secondary text-secondary-foreground",
    }
  }

  return (
    STATUS_META[status.toLocaleLowerCase()] ?? {
      label: humanize(status),
      className: "border-border bg-secondary text-secondary-foreground",
    }
  )
}

function getEquipmentLabel(equipmentType: string | null) {
  if (!equipmentType) return null

  return (
    EQUIPMENT_LABELS[equipmentType as EquipmentType] ??
    humanize(equipmentType)
  )
}

function isSearchResult(value: unknown): value is GlobalTicketSearchResult {
  if (!value || typeof value !== "object") return false

  const ticket = value as Record<string, unknown>
  return (
    typeof ticket.id === "string" &&
    typeof ticket.client_name === "string"
  )
}

function canSearch(query: string) {
  return query.length >= 2 || /^\d+$/.test(query)
}

function clampResultLimit(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_RESULT_LIMIT
  return Math.min(Math.max(Math.trunc(value), 1), 20)
}

function ResultSkeleton() {
  return (
    <div className="space-y-3 p-4" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-20 items-center gap-3 rounded-xl border border-border p-3"
        >
          <div className="size-10 shrink-0 rounded-xl bg-muted shimmer" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-2/5 rounded bg-muted shimmer" />
            <div className="h-3 w-3/4 rounded bg-muted shimmer" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function GlobalTicketSearch({
  className,
  resultLimit = DEFAULT_RESULT_LIMIT,
  autoFocus = false,
}: GlobalTicketSearchProps) {
  const inputId = useId()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GlobalTicketSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [requestVersion, setRequestVersion] = useState(0)

  const trimmedQuery = query.trim()
  const searchable = canSearch(trimmedQuery)

  useEffect(() => {
    if (!trimmedQuery || !searchable) {
      setResults([])
      setError(null)
      setHasSearched(false)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const safeLimit = clampResultLimit(resultLimit)

    setIsLoading(true)
    setError(null)

    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: trimmedQuery,
          status: "all",
          view: "summary",
          limit: String(safeLimit),
        })
        const response = await fetch(`/api/search?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        })
        const payload: unknown = await response.json().catch(() => null)

        if (!response.ok) {
          const message =
            payload &&
            typeof payload === "object" &&
            "error" in payload &&
            typeof payload.error === "string"
              ? payload.error
              : "No se pudo realizar la búsqueda"
          throw new Error(message)
        }
        if (!Array.isArray(payload)) {
          throw new Error("La búsqueda devolvió una respuesta inesperada")
        }

        setResults(payload.filter(isSearchResult))
        setHasSearched(true)
      } catch (caughtError) {
        if (controller.signal.aborted) return

        setResults([])
        setHasSearched(true)
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudo realizar la búsqueda"
        )
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [requestVersion, resultLimit, searchable, trimmedQuery])

  return (
    <Card
      className={cn(
        "overflow-hidden border-border p-0",
        className
      )}
    >
      {/* Sin titulo ni chip de icono: el campo ya dice que hace. */}
      <div className="px-4 py-4 sm:px-5">
        <label className="sr-only" htmlFor={inputId}>
          Buscar por número, cliente, teléfono, equipo, modelo o serie
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id={inputId}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoFocus={autoFocus}
            maxLength={MAX_QUERY_LENGTH}
            placeholder="N° ticket, nombre o modelo"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-12 pl-10 pr-12 text-base md:text-base"
            aria-describedby={`${inputId}-hint`}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 touch-manipulation items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <p id={`${inputId}-hint`} className="mt-2 text-xs text-muted-foreground">
          También busca por tipo de equipo, marca y número de serie.
        </p>
      </div>

      <CardContent className="p-0" aria-live="polite" aria-busy={isLoading}>
        {/* En reposo no se dibuja nada: la pista bajo el campo ya lo dice,
            y un bloque vacio de 180px es espacio muerto en cada carga. */}
        {!trimmedQuery ? null : !searchable ? (
          <SearchMessage
            icon={Search}
            title="Escribe al menos 2 letras"
            description="Si buscas por número de ticket, un solo dígito es suficiente."
          />
        ) : isLoading ? (
          <div>
            <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              Buscando en todos los tickets…
            </div>
            <ResultSkeleton />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center px-5 py-8 text-center">
            <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-5" aria-hidden="true" />
            </div>
            <p className="font-medium">No pudimos buscar los tickets</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setRequestVersion((version) => version + 1)}
            >
              Intentar de nuevo
            </Button>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <SearchMessage
            icon={SearchX}
            title="No encontramos coincidencias"
            description="Revisa el número o prueba con el nombre, teléfono, modelo o serie."
          />
        ) : (
          <div>
            <div className="flex items-center justify-between border-b border-border px-4 py-3 text-sm">
              <span className="font-medium">
                {results.length} resultado{results.length === 1 ? "" : "s"}
              </span>
              <span className="text-xs text-muted-foreground">Todos los estados</span>
            </div>
            <ul className="max-h-[28rem] divide-y divide-border overflow-y-auto overscroll-contain">
              {results.map((ticket) => (
                <TicketResult key={ticket.id} ticket={ticket} />
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SearchMessage({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Search
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center px-5 py-8 text-center">
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function TicketResult({ ticket }: { ticket: GlobalTicketSearchResult }) {
  const status = getStatusMeta(ticket.status)
  const equipment = [
    getEquipmentLabel(ticket.equipment_type),
    ticket.brand,
    ticket.model,
  ]
    .filter(Boolean)
    .join(" · ")
  const ticketNumber =
    ticket.ticket_seq != null ? `Ticket N° ${ticket.ticket_seq}` : ticket.id

  return (
    <li>
      <ScrollSafeLink
        href={`/ticket/${encodeURIComponent(ticket.id)}`}
        prefetch={false}
        className="group block min-h-24 touch-manipulation px-4 py-4 transition-colors hover:bg-muted/50 active:bg-muted focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
        aria-label={`Abrir ${ticketNumber} de ${ticket.client_name}`}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Monitor className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-primary">
                {ticketNumber}
              </span>
              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
            </div>

            <div className="mt-2 grid min-w-0 gap-1 sm:grid-cols-2 sm:gap-x-4">
              <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
                <UserRound className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="truncate">{ticket.client_name}</span>
              </span>
              {ticket.client_phone && (
                <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground sm:justify-end">
                  <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{ticket.client_phone}</span>
                </span>
              )}
            </div>

            <div className="mt-2 flex min-w-0 items-end justify-between gap-3">
              <div className="min-w-0 text-xs text-muted-foreground">
                <p className="truncate">{equipment || "Equipo sin especificar"}</p>
                {ticket.serial_number && (
                  <p className="mt-0.5 truncate font-mono">Serie: {ticket.serial_number}</p>
                )}
                <p className="mt-0.5">
                  Creado: {formatDateOnlyForDisplay(ticket.created_at, "es-HN")}
                </p>
              </div>
              <ArrowUpRight
                className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </ScrollSafeLink>
    </li>
  )
}
