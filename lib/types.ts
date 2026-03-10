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
  created_at: string
  updated_at: string
  delivered_at?: string | null
  estimated_delivery_date?: string | null
  client_name: string
  client_phone: string
  equipment_type: EquipmentType
  brand?: string | null
  model?: string | null
  serial_number?: string | null
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

export interface Part {
  id: string
  name: string
  category: string
  quantity: number
  min_stock: number
  cost_price: number
  sell_price: number
  supplier?: string | null
  created_at?: string
  updated_at?: string
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

export const STATUS_COLORS: Record<TicketStatus, string> = {
  recibido: 'bg-chart-1 text-primary-foreground',
  en_diagnostico: 'bg-warning text-warning-foreground',
  en_reparacion: 'bg-chart-2 text-white',
  listo: 'bg-success text-success-foreground',
  entregado: 'bg-muted text-muted-foreground'
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

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  impresora: 'Impresora',
  computadora: 'Computadora',
  laptop: 'Laptop',
  monitor: 'Monitor',
  otro: 'Otro'
}

export const ACCESSORY_OPTIONS = [
  'Cable de poder',
  'Cable USB',
  'Cargador',
  'Mouse',
  'Teclado',
  'Funda/Bolsa',
  'Control remoto',
  'Tóner/Cartuchos',
  'Disco duro externo',
  'Memoria USB'
]

export const PART_CATEGORIES = [
  'Tóners',
  'Cartuchos',
  'Fusores',
  'Rodillos',
  'Memorias RAM',
  'Discos Duros',
  'Fuentes de Poder',
  'Pantallas',
  'Teclados',
  'Baterías',
  'Cables',
  'Otros'
]
