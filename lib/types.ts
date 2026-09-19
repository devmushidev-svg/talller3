export type EquipmentType = 'impresora' | 'computadora' | 'laptop' | 'monitor' | 'otro'

export type TicketStatus = 
  | 'recibido' 
  | 'en_diagnostico' 
  | 'en_reparacion' 
  | 'listo' 
  | 'entregado'

export type PaymentStatus = 'pendiente' | 'parcial' | 'pagado'

export interface Ticket {
  id: string
  /** Número correlativo simple para mostrar al cliente (1, 2, 3…) */
  ticket_seq?: number | null
  created_at: string
  updated_at: string
  delivered_at?: string | null
  estimated_delivery_date?: string | null
  client_name: string
  client_phone: string
  /** Quien recibió el equipo en taller (p. ej. recepción) */
  received_by?: string | null
  equipment_type: EquipmentType
  brand?: string | null
  model?: string | null
  serial_number?: string | null
  /** Contraseña de acceso al equipo (Windows, BIOS, etc.) */
  device_password?: string | null
  problem_description: string
  diagnosis?: string | null
  repair_notes?: string | null
  internal_notes?: string | null
  parts_used?: string | null
  diagnosis_cost?: number | null
  repair_cost?: number | null
  labor_cost?: number | null
  parts_cost?: number | null
  total_cost?: number | null
  amount_paid?: number | null
  payment_status?: PaymentStatus | null
  status: TicketStatus
  accessories: string[]
  photos?: string[]
}

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string | null
  address?: string | null
  created_at?: string
  updated_at?: string
}

export type PartCondition = 'bueno' | 'medio' | 'malo'

export interface Part {
  id: string
  name: string
  model?: string | null
  size?: string | null
  category: string
  condition: PartCondition
  notes?: string | null
  quantity: number
  created_at?: string
  updated_at?: string
}

export const PART_CONDITION_LABELS: Record<PartCondition, string> = {
  bueno: 'Bueno',
  medio: 'Regular',
  malo: 'Malo'
}

export const PART_CONDITION_COLORS: Record<PartCondition, string> = {
  bueno: 'bg-success text-success-foreground',
  medio: 'bg-warning text-warning-foreground',
  malo: 'bg-destructive text-destructive-foreground'
}

export interface ShopSettings {
  id: string
  shop_name: string
  shop_address: string
  shop_phone: string
  printer_width: string
  created_at?: string
  updated_at?: string
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  recibido: 'Recibido',
  en_diagnostico: 'En Diagnóstico',
  en_reparacion: 'En Reparación',
  listo: 'Listo para Entrega',
  entregado: 'Entregado'
}

/**
 * Tokens de color por estado. Cada estado tiene DOS valores y esa es la
 * razon de que se lea:
 *   base -> color vivo: barras, puntos, iconos (minimo 3:1)
 *   fg   -> tinta: texto sobre el tinte del badge (minimo 4.5:1)
 * Los valores viven en app/globals.css y se invierten solos entre temas.
 * Ninguna pantalla debe volver a escribir un color de estado.
 */
export const STATUS_TOKENS: Record<TicketStatus, { base: string; fg: string }> = {
  recibido: { base: 'var(--st-recibido)', fg: 'var(--st-recibido-fg)' },
  en_diagnostico: { base: 'var(--st-diagnostico)', fg: 'var(--st-diagnostico-fg)' },
  en_reparacion: { base: 'var(--st-reparacion)', fg: 'var(--st-reparacion-fg)' },
  listo: { base: 'var(--st-listo)', fg: 'var(--st-listo-fg)' },
  entregado: { base: 'var(--st-entregado)', fg: 'var(--st-entregado-fg)' }
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pendiente: 'Pendiente',
  parcial: 'Pago Parcial',
  pagado: 'Pagado'
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pendiente: 'bg-destructive text-destructive-foreground',
  parcial: 'bg-warning text-warning-foreground',
  pagado: 'bg-success text-success-foreground'
}

/**
 * Tipos que se pueden ELEGIR al recibir un equipo.
 *
 * 'laptop' sigue existiendo en EquipmentType y en EQUIPMENT_LABELS a proposito:
 * hay tickets viejos guardados con ese valor y tienen que seguir mostrandose.
 * Lo que se quita es la opcion de elegirlo en tickets nuevos, porque en la
 * practica una laptop se recibe como computadora.
 */
export const EQUIPMENT_PICKER_TYPES: readonly EquipmentType[] = [
  'computadora',
  'impresora',
  'monitor',
  'otro'
]

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  impresora: 'Impresora',
  computadora: 'Computadora',
  laptop: 'Laptop',
  monitor: 'Monitor',
  otro: 'Otro'
}

/**
 * Checkboxes en nuevo ticket e impresión orden de trabajo.
 * El orden importa: los tres primeros son los que se marcan casi siempre.
 */
export const ACCESSORY_CHECKBOX_LABELS = [
  'Cargador',
  'Cable USB',
  'Cable de poder',
  'Mouse',
  'Teclado',
  'Funda',
] as const

export type AccessoryCheckboxLabel = (typeof ACCESSORY_CHECKBOX_LABELS)[number]

/** Coincide texto guardado con una opción estándar (incluye tickets viejos con Funda/Bolsa) */
export function accessoryMatchesCheckbox(
  stored: string,
  checkboxLabel: string
): boolean {
  if (stored === checkboxLabel) return true
  if (checkboxLabel === 'Funda' && stored === 'Funda/Bolsa') return true
  return false
}

export function isStandardAccessoryStored(stored: string): boolean {
  return ACCESSORY_CHECKBOX_LABELS.some((label) =>
    accessoryMatchesCheckbox(stored, label)
  )
}

export const PART_CATEGORIES = [
  'Pantallas',
  'Teclados',
  'Baterías',
  'Memorias RAM',
  'Discos Duros',
  'Fuentes de Poder',
  'Placas Madre',
  'Procesadores',
  'Tarjetas Gráficas',
  'Carcasas',
  'Bisagras',
  'Ventiladores',
  'Cables',
  'Otros'
]
