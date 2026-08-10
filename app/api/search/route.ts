import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const DEFAULT_RESULT_LIMIT = 50
const MAX_RESULT_LIMIT = 100
const MAX_QUERY_LENGTH = 80
const PAYMENT_FILTERS = new Set([
  "pending",
  "pendiente",
  "paid",
  "pagado",
  "partial",
  "parcial",
])
const ACTIVE_TICKET_STATUSES = [
  "recibido",
  "received",
  "en_diagnostico",
  "en_reparacion",
  "listo",
]

const SUMMARY_COLUMNS = [
  "id",
  "ticket_seq",
  "created_at",
  "client_name",
  "client_phone",
  "equipment_type",
  "brand",
  "model",
  "serial_number",
  "status",
  "amount_paid",
  "total_cost",
].join(",")

function parseResultLimit(value: string | null) {
  if (!value) return DEFAULT_RESULT_LIMIT

  if (!/^\d{1,4}$/.test(value)) return DEFAULT_RESULT_LIMIT

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 1) return DEFAULT_RESULT_LIMIT

  return Math.min(parsed, MAX_RESULT_LIMIT)
}

/**
 * PostgREST's `.or()` receives a filter expression. Quoting and escaping the
 * value keeps commas, parentheses and quotes in user input inside the ILIKE
 * value instead of allowing them to become extra filters.
 */
function toPostgrestContainsPattern(value: string) {
  const escaped = value
    .replace(/[\\"]/g, "\\$&")
    // Do not let user-provided wildcard characters turn a search into a dump.
    .replace(/[%_*]/g, "")

  return escaped ? `"*${escaped}*"` : null
}

function parseTicketSequence(value: string) {
  const match = value.match(
    /^(?:ticket\s*)?(?:n(?:ro|um|[.º°o])?\s*)?#?\s*(\d+)$/i
  )
  if (!match) return null

  const sequence = Number.parseInt(match[1], 10)
  return Number.isSafeInteger(sequence) ? sequence : null
}

function isValidFilterValue(value: string) {
  return /^[a-z_]{1,32}$/i.test(value)
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

function workshopDayBoundary(value: string, daysToAdd = 0) {
  const date = new Date(`${value}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + daysToAdd)
  // El taller opera en Honduras (UTC-6, sin horario de verano). La medianoche
  // local corresponde a las 06:00 UTC.
  date.setUTCHours(6, 0, 0, 0)
  return date.toISOString()
}

function toNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawQuery = searchParams.get("q")?.trim() ?? ""

    if (rawQuery.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        { error: `La búsqueda admite hasta ${MAX_QUERY_LENGTH} caracteres` },
        { status: 400 }
      )
    }

    const status = searchParams.get("status")
    const scope = searchParams.get("scope")
    const equipmentType = searchParams.get("equipment_type")
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")
    const paymentStatus = searchParams.get("payment_status")
    const summaryOnly = searchParams.get("view") === "summary"
    const limit = parseResultLimit(searchParams.get("limit"))

    if (status && status !== "all" && !isValidFilterValue(status)) {
      return NextResponse.json({ error: "Estado no válido" }, { status: 400 })
    }
    if (scope && scope !== "all" && scope !== "active") {
      return NextResponse.json({ error: "Alcance no válido" }, { status: 400 })
    }
    if (
      equipmentType &&
      equipmentType !== "all" &&
      !isValidFilterValue(equipmentType)
    ) {
      return NextResponse.json(
        { error: "Tipo de equipo no válido" },
        { status: 400 }
      )
    }
    if (dateFrom && !isIsoDate(dateFrom)) {
      return NextResponse.json({ error: "Fecha inicial no válida" }, { status: 400 })
    }
    if (dateTo && !isIsoDate(dateTo)) {
      return NextResponse.json({ error: "Fecha final no válida" }, { status: 400 })
    }
    if (paymentStatus && !PAYMENT_FILTERS.has(paymentStatus)) {
      return NextResponse.json({ error: "Estado de pago no válido" }, { status: 400 })
    }

    const supabase = await createClient()
    let dbQuery = supabase
      .from("tickets")
      .select(summaryOnly ? SUMMARY_COLUMNS : "*")
    let ticketSequence: number | null = null

    // Sin filtro de estado por defecto: incluye activos, entregados y cualquier
    // estado de cancelación/desactivación que exista en la base de datos.
    if (rawQuery) {
      const containsPattern = toPostgrestContainsPattern(rawQuery)
      const orParts: string[] = []

      if (containsPattern) {
        for (const field of [
          "id",
          "client_name",
          "client_phone",
          "equipment_type",
          "brand",
          "model",
          "serial_number",
        ]) {
          orParts.push(`${field}.ilike.${containsPattern}`)
        }
      }

      // Los teléfonos se guardan normalizados; esto permite buscar aunque el
      // usuario escriba espacios, guiones o paréntesis.
      const phoneDigits = rawQuery.replace(/\D/g, "")
      if (phoneDigits.length >= 3 && phoneDigits !== rawQuery) {
        orParts.push(`client_phone.ilike."*${phoneDigits}*"`)
      }

      ticketSequence = parseTicketSequence(rawQuery)
      if (ticketSequence !== null) {
        orParts.push(`ticket_seq.eq.${ticketSequence}`)
      }

      if (orParts.length === 0) {
        return NextResponse.json([], {
          headers: { "Cache-Control": "private, no-store" },
        })
      }

      dbQuery = dbQuery.or(orParts.join(","))
    }

    if (status && status !== "all") {
      dbQuery = dbQuery.eq("status", status)
    } else if (scope === "active") {
      dbQuery = dbQuery.in("status", ACTIVE_TICKET_STATUSES)
    }
    if (equipmentType && equipmentType !== "all") {
      dbQuery = dbQuery.eq("equipment_type", equipmentType)
    }
    if (dateFrom) {
      dbQuery = dbQuery.gte("created_at", workshopDayBoundary(dateFrom))
    }
    if (dateTo) {
      dbQuery = dbQuery.lt("created_at", workshopDayBoundary(dateTo, 1))
    }

    dbQuery = dbQuery.order("created_at", { ascending: false })

    // Cuando el estado de pago se calcula con dos columnas, hay que filtrar
    // antes de recortar los resultados; de lo contrario un pendiente antiguo
    // puede quedar oculto por tickets pagados más recientes.
    if (!paymentStatus) {
      dbQuery = dbQuery.limit(limit)
    }

    // La coincidencia exacta por correlativo se consulta también por separado
    // para que un ticket antiguo no quede fuera del límite por coincidencias
    // parciales recientes (por ejemplo, al buscar simplemente "4").
    let exactTicketQuery = ticketSequence === null
      ? null
      : supabase
          .from("tickets")
          .select(summaryOnly ? SUMMARY_COLUMNS : "*")
          .eq("ticket_seq", ticketSequence)

    if (exactTicketQuery && status && status !== "all") {
      exactTicketQuery = exactTicketQuery.eq("status", status)
    } else if (exactTicketQuery && scope === "active") {
      exactTicketQuery = exactTicketQuery.in("status", ACTIVE_TICKET_STATUSES)
    }
    if (exactTicketQuery && equipmentType && equipmentType !== "all") {
      exactTicketQuery = exactTicketQuery.eq("equipment_type", equipmentType)
    }
    if (exactTicketQuery && dateFrom) {
      exactTicketQuery = exactTicketQuery.gte(
        "created_at",
        workshopDayBoundary(dateFrom)
      )
    }
    if (exactTicketQuery && dateTo) {
      exactTicketQuery = exactTicketQuery.lt(
        "created_at",
        workshopDayBoundary(dateTo, 1)
      )
    }

    const [searchResult, exactTicketResult] = await Promise.all([
      dbQuery,
      exactTicketQuery?.limit(1) ??
        Promise.resolve({ data: [], error: null }),
    ])
    const { data, error } = searchResult
    if (error) throw error
    if (exactTicketResult.error) throw exactTicketResult.error

    const rawMergedData = [
      ...(exactTicketResult.data ?? []),
      ...(data ?? []),
    ] as unknown as Array<Record<string, unknown>>
    const mergedData = rawMergedData.filter(
      (ticket, index, tickets) =>
        tickets.findIndex((candidate) => candidate.id === ticket.id) === index
    )

    // Mantiene compatibilidad con los nombres históricos usados por esta API.
    let filteredData = mergedData
    if (paymentStatus === "pending" || paymentStatus === "pendiente") {
      filteredData = filteredData.filter((ticket) => {
        const amountPaid = toNumber(ticket.amount_paid)
        const totalCost = toNumber(ticket.total_cost)
        return amountPaid < totalCost && totalCost > 0
      })
    } else if (paymentStatus === "paid" || paymentStatus === "pagado") {
      filteredData = filteredData.filter((ticket) => {
        const amountPaid = toNumber(ticket.amount_paid)
        const totalCost = toNumber(ticket.total_cost)
        return amountPaid >= totalCost || totalCost === 0
      })
    } else if (paymentStatus === "partial" || paymentStatus === "parcial") {
      filteredData = filteredData.filter((ticket) => {
        const amountPaid = toNumber(ticket.amount_paid)
        const totalCost = toNumber(ticket.total_cost)
        return amountPaid > 0 && amountPaid < totalCost
      })
    }

    return NextResponse.json(filteredData.slice(0, limit), {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "No se pudo completar la búsqueda" },
      {
        status: 500,
        headers: { "Cache-Control": "private, no-store" },
      }
    )
  }
}
