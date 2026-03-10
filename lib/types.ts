export type EquipmentType = 'Computadora' | 'Impresora'

export type TicketStatus = 'Recibido' | 'En Diagnóstico' | 'En Reparación' | 'Listo' | 'Entregado'

export type AccessoryKey = 'cablePoder' | 'cableUSB' | 'cargador' | 'cartucho' | 'toner' | 'otros'

export interface Accessories {
  cablePoder: boolean
  cableUSB: boolean
  cargador: boolean
  cartucho: boolean
  toner: boolean
  otros: boolean
  otrosDetalle: string
}

export interface Ticket {
  id: string
  ticketNumber: number
  clientName: string
  phone: string
  equipmentType: EquipmentType
  brand: string
  model: string
  serialNumber: string
  reportedProblem: string
  internalNotes: string
  accessories: Accessories
  status: TicketStatus
  createdAt: Date
  updatedAt: Date
  deliveredAt?: Date
  totalRepair?: number
}

export interface Part {
  id: string
  name: string
  category: string
  compatibleWith: string
  stock: number
  minStock: number
  price: number
  supplier: string
}

export const ACCESSORY_LABELS: Record<AccessoryKey, string> = {
  cablePoder: 'Cable de Poder',
  cableUSB: 'Cable USB',
  cargador: 'Cargador',
  cartucho: 'Cartucho',
  toner: 'Toner',
  otros: 'Otros'
}

export const STATUS_COLORS: Record<TicketStatus, string> = {
  'Recibido': 'bg-chart-1 text-primary-foreground',
  'En Diagnóstico': 'bg-warning text-warning-foreground',
  'En Reparación': 'bg-chart-2 text-accent-foreground',
  'Listo': 'bg-success text-success-foreground',
  'Entregado': 'bg-muted text-muted-foreground'
}
