import { Ticket, Part, TicketStatus } from './types'

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Generate ticket number
let ticketCounter = 1000

export function getNextTicketNumber(): number {
  ticketCounter++
  return ticketCounter
}

// In-memory store (would be replaced with database in production)
let tickets: Ticket[] = []
let parts: Part[] = [
  {
    id: generateId(),
    name: 'Cable USB',
    category: 'Cables',
    compatibleWith: 'Universal',
    stock: 25,
    minStock: 10,
    price: 50,
    supplier: 'TechParts MX'
  },
  {
    id: generateId(),
    name: 'Cable de Poder',
    category: 'Cables',
    compatibleWith: 'Universal',
    stock: 15,
    minStock: 10,
    price: 80,
    supplier: 'TechParts MX'
  },
  {
    id: generateId(),
    name: 'Cartucho HP 664',
    category: 'Cartuchos',
    compatibleWith: 'HP DeskJet 2135, 3635',
    stock: 8,
    minStock: 5,
    price: 350,
    supplier: 'HP México'
  },
  {
    id: generateId(),
    name: 'Toner HP 85A',
    category: 'Toner',
    compatibleWith: 'HP LaserJet P1102',
    stock: 3,
    minStock: 5,
    price: 850,
    supplier: 'HP México'
  },
  {
    id: generateId(),
    name: 'Fuente de Poder ATX 500W',
    category: 'Componentes',
    compatibleWith: 'PC Desktop',
    stock: 6,
    minStock: 3,
    price: 650,
    supplier: 'CompuPartes'
  },
  {
    id: generateId(),
    name: 'Cabezal Epson L355',
    category: 'Impresoras',
    compatibleWith: 'Epson L355, L365, L375',
    stock: 2,
    minStock: 2,
    price: 1200,
    supplier: 'Epson México'
  }
]

// Sample tickets for demo
const sampleTickets: Ticket[] = [
  {
    id: generateId(),
    ticketNumber: 1001,
    clientName: 'María García',
    phone: '555-123-4567',
    equipmentType: 'Impresora',
    brand: 'HP',
    model: 'LaserJet P1102',
    serialNumber: 'CNB1234567',
    reportedProblem: 'No enciende, hace ruido extraño',
    internalNotes: 'Revisar fuente de poder',
    accessories: {
      cablePoder: true,
      cableUSB: true,
      cargador: false,
      cartucho: false,
      toner: true,
      otros: false,
      otrosDetalle: ''
    },
    status: 'En Diagnóstico',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: generateId(),
    ticketNumber: 1002,
    clientName: 'Juan Pérez',
    phone: '555-987-6543',
    equipmentType: 'Computadora',
    brand: 'Dell',
    model: 'Inspiron 15',
    serialNumber: 'SVC123456789',
    reportedProblem: 'Pantalla azul, reinicia constantemente',
    internalNotes: 'Posible falla de disco duro',
    accessories: {
      cablePoder: true,
      cableUSB: false,
      cargador: true,
      cartucho: false,
      toner: false,
      otros: false,
      otrosDetalle: ''
    },
    status: 'En Reparación',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: generateId(),
    ticketNumber: 1003,
    clientName: 'Ana López',
    phone: '555-456-7890',
    equipmentType: 'Impresora',
    brand: 'Epson',
    model: 'L355',
    serialNumber: 'X2PT123456',
    reportedProblem: 'No imprime colores correctamente',
    internalNotes: 'Limpiar cabezales',
    accessories: {
      cablePoder: true,
      cableUSB: true,
      cargador: false,
      cartucho: false,
      toner: false,
      otros: true,
      otrosDetalle: 'Tintas originales'
    },
    status: 'Listo',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    totalRepair: 450
  },
  {
    id: generateId(),
    ticketNumber: 1004,
    clientName: 'Carlos Rodríguez',
    phone: '555-321-6549',
    equipmentType: 'Computadora',
    brand: 'Lenovo',
    model: 'ThinkPad T480',
    serialNumber: 'PF1ABCD12',
    reportedProblem: 'Batería no carga',
    internalNotes: 'Reemplazar batería',
    accessories: {
      cablePoder: false,
      cableUSB: false,
      cargador: true,
      cartucho: false,
      toner: false,
      otros: false,
      otrosDetalle: ''
    },
    status: 'Recibido',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

tickets = [...sampleTickets]
ticketCounter = 1004

// Ticket operations
export function getTickets(): Ticket[] {
  return [...tickets]
}

export function getActiveTickets(): Ticket[] {
  return tickets.filter(t => t.status !== 'Entregado')
}

export function getCompletedTickets(): Ticket[] {
  return tickets.filter(t => t.status === 'Entregado')
}

export function getTicketById(id: string): Ticket | undefined {
  return tickets.find(t => t.id === id)
}

export function createTicket(ticket: Omit<Ticket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>): Ticket {
  const newTicket: Ticket = {
    ...ticket,
    id: generateId(),
    ticketNumber: getNextTicketNumber(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
  tickets.unshift(newTicket)
  return newTicket
}

export function updateTicket(id: string, updates: Partial<Ticket>): Ticket | undefined {
  const index = tickets.findIndex(t => t.id === id)
  if (index === -1) return undefined
  
  tickets[index] = {
    ...tickets[index],
    ...updates,
    updatedAt: new Date()
  }
  return tickets[index]
}

export function updateTicketStatus(id: string, status: TicketStatus): Ticket | undefined {
  const updates: Partial<Ticket> = { status }
  if (status === 'Entregado') {
    updates.deliveredAt = new Date()
  }
  return updateTicket(id, updates)
}

export function deleteTicket(id: string): boolean {
  const index = tickets.findIndex(t => t.id === id)
  if (index === -1) return false
  tickets.splice(index, 1)
  return true
}

// Parts operations
export function getParts(): Part[] {
  return [...parts]
}

export function getLowStockParts(): Part[] {
  return parts.filter(p => p.stock <= p.minStock)
}

export function getPartById(id: string): Part | undefined {
  return parts.find(p => p.id === id)
}

export function createPart(part: Omit<Part, 'id'>): Part {
  const newPart: Part = {
    ...part,
    id: generateId()
  }
  parts.push(newPart)
  return newPart
}

export function updatePart(id: string, updates: Partial<Part>): Part | undefined {
  const index = parts.findIndex(p => p.id === id)
  if (index === -1) return undefined
  
  parts[index] = {
    ...parts[index],
    ...updates
  }
  return parts[index]
}

export function deletePart(id: string): boolean {
  const index = parts.findIndex(p => p.id === id)
  if (index === -1) return false
  parts.splice(index, 1)
  return true
}

// Statistics
export function getTodayStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const receivedToday = tickets.filter(t => {
    const created = new Date(t.createdAt)
    created.setHours(0, 0, 0, 0)
    return created.getTime() === today.getTime()
  }).length
  
  const activeTickets = tickets.filter(t => t.status !== 'Entregado').length
  const readyToDeliver = tickets.filter(t => t.status === 'Listo').length
  const deliveredToday = tickets.filter(t => {
    if (!t.deliveredAt) return false
    const delivered = new Date(t.deliveredAt)
    delivered.setHours(0, 0, 0, 0)
    return delivered.getTime() === today.getTime()
  }).length
  
  return {
    receivedToday,
    activeTickets,
    readyToDeliver,
    deliveredToday
  }
}

export function getTicketsPerDay(days: number = 7): { date: string; count: number }[] {
  const result: { date: string; count: number }[] = []
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    
    const count = tickets.filter(t => {
      const created = new Date(t.createdAt)
      created.setHours(0, 0, 0, 0)
      return created.getTime() === date.getTime()
    }).length
    
    result.push({
      date: date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }),
      count
    })
  }
  
  return result
}
