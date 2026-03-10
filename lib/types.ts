export type EquipmentType = 'impresora' | 'computadora' | 'laptop' | 'monitor' | 'otro'

export type TicketStatus = 
  | 'recibido' 
  | 'en_diagnostico' 
  | 'en_reparacion' 
  | 'listo' 
  | 'entregado'

export interface Ticket {
  id: string
  created_at: string
  updated_at: string
  client_name: string
  client_phone: string
  client_email?: string | null
  equipment_type: EquipmentType
  brand: string
  model: string
  serial_number?: string | null
  reported_issue: string
  diagnosis?: string | null
  solution?: string | null
  status: TicketStatus
  estimated_cost?: number | null
  final_cost?: number | null
  accessories: string[]
  notes?: string | null
}

export interface Part {
  id: string
  name: string
  category: string
  sku?: string | null
  quantity: number
  min_stock: number
  cost_price: number
  sell_price: number
  supplier?: string | null
  location?: string | null
}

export interface ShopSettings {
  shop_name: string
  shop_address: string
  shop_phone: string
  shop_email: string
  printer_width: '58' | '80'
  print_logo: string
  notify_ready: string
  notify_delivered: string
}

export interface Stats {
  receivedToday: number
  activeTickets: number
  readyForPickup: number
  deliveredToday: number
  lowStockParts: number
  ticketsPerDay: { date: string; count: number }[]
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
