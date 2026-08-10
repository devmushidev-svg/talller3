import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import type { EquipmentType } from "@/lib/types"

const EQUIPMENT_TYPES = new Set<EquipmentType>([
  "impresora",
  "computadora",
  "laptop",
  "monitor",
  "otro",
])

const INVALID_MODELS = new Set([
  "acer",
  "apple",
  "asus",
  "brother",
  "canon",
  "dell",
  "n/a",
  "na",
  "no",
  "ninguno",
  "ninguna",
  "no aplica",
  "epson",
  "hp",
  "lenovo",
  "papel trabado",
  "plata",
  "samsung",
  "si",
  "sí",
  "sin modelo",
  "desconocido",
  "s/modelo",
  "-",
  "--",
  "?",
])

interface TicketModelRow {
  model: string | null
  brand: string | null
  equipment_type: EquipmentType | null
  created_at: string | null
}

interface ModelGroup {
  model: string
  brand: string | null
  equipmentType: EquipmentType | null
  count: number
  latestAt: number
}

function normalizeSearchValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/\s+/g, " ")
    .trim()
}

function cleanBrand(value: string | null): string | null {
  const brand = value?.replace(/\s+/g, " ").trim()
  if (!brand) return null

  const knownBrands: Record<string, string> = {
    acer: "Acer",
    apple: "Apple",
    asus: "ASUS",
    brother: "Brother",
    canon: "Canon",
    dell: "Dell",
    epson: "Epson",
    hp: "HP",
    lenovo: "Lenovo",
    samsung: "Samsung",
  }

  return knownBrands[normalizeSearchValue(brand)] ?? brand
}

function cleanModel(value: string, brand: string | null): string | null {
  const model = value.replace(/\s+/g, " ").trim()
  const normalized = normalizeSearchValue(model)
  const compact = normalized.replace(/[^a-z0-9]/g, "")

  if (
    normalized.length < 2 ||
    normalized.length > 80 ||
    compact.length < 2 ||
    INVALID_MODELS.has(normalized) ||
    /^(.)\1+$/.test(compact)
  ) {
    return null
  }

  // En el historial Epson L3250 también suele escribirse como 3250 o "L 3250".
  if (normalizeSearchValue(brand ?? "") === "epson") {
    const epsonTankModel = model.toUpperCase().replace(/[\s_-]/g, "").match(/^L?(\d{4,5})$/)
    if (epsonTankModel) return `L${epsonTankModel[1]}`
  }

  return model
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const requestedType = searchParams.get("equipmentType")
  const equipmentType = EQUIPMENT_TYPES.has(requestedType as EquipmentType)
    ? (requestedType as EquipmentType)
    : null
  const brandQuery = normalizeSearchValue(searchParams.get("brand") ?? "")
  const modelQuery = normalizeSearchValue(searchParams.get("q") ?? "")
  const requestedLimit = Number.parseInt(searchParams.get("limit") ?? "6", 10)
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 12)
    : 6

  const supabase = await createClient()
  let query = supabase
    .from("tickets")
    .select("model, brand, equipment_type, created_at")
    .not("model", "is", null)
    .order("created_at", { ascending: false })
    .limit(1000)

  if (equipmentType) query = query.eq("equipment_type", equipmentType)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const groups = new Map<string, ModelGroup>()

  for (const row of (data ?? []) as TicketModelRow[]) {
    if (typeof row.model !== "string") continue

    const displayBrand = cleanBrand(row.brand)
    const normalizedBrand = normalizeSearchValue(displayBrand ?? "")
    if (brandQuery && !normalizedBrand.includes(brandQuery)) continue

    const displayModel = cleanModel(row.model, displayBrand)
    if (!displayModel) continue

    const normalizedModel = normalizeSearchValue(displayModel)
    if (modelQuery && !normalizedModel.includes(modelQuery)) continue

    const groupKey = `${normalizedBrand}|${normalizedModel}`
    const existing = groups.get(groupKey)
    const createdAt = row.created_at ? Date.parse(row.created_at) : 0

    if (existing) {
      existing.count += 1
      existing.latestAt = Math.max(existing.latestAt, Number.isNaN(createdAt) ? 0 : createdAt)
      continue
    }

    groups.set(groupKey, {
      model: displayModel,
      brand: displayBrand,
      equipmentType: row.equipment_type,
      count: 1,
      latestAt: Number.isNaN(createdAt) ? 0 : createdAt,
    })
  }

  const models = [...groups.values()]
    .sort(
      (a, b) =>
        b.count - a.count ||
        b.latestAt - a.latestAt ||
        a.model.localeCompare(b.model, "es", { sensitivity: "base" })
    )
    .slice(0, limit)
    .map(({ latestAt: _latestAt, ...suggestion }) => suggestion)

  return NextResponse.json(
    { models },
    { headers: { "Cache-Control": "private, no-store" } }
  )
}
