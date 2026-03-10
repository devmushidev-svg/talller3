"use client"

import { Ticket, Part, TicketStatus, EquipmentType } from "./types"

// In-memory store for the preview
// When you run locally, this can be replaced with SQLite

const initialTickets: Ticket[] = [
  {
    id: "TKT-001",
    client_name: "Juan Pérez",
    client_phone: "555-1234",
    client_email: null,
    equipment_type: "laptop",
    brand: "HP",
    model: "Pavilion 15",
    serial_number: "HP123456",
    reported_issue: "No enciende, posible problema de batería",
    diagnosis: null,
    solution: null,
    accessories: ["Cargador", "Funda/Bolsa"],
    status: "en_reparacion",
    estimated_cost: 850,
    final_cost: null,
    notes: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "TKT-002", 
    client_name: "María García",
    client_phone: "555-5678",
    client_email: "maria@email.com",
    equipment_type: "impresora",
    brand: "Epson",
    model: "L3150",
    serial_number: "EPS789012",
    reported_issue: "Atasco de papel frecuente",
    diagnosis: null,
    solution: null,
    accessories: ["Cable USB", "Cable de poder"],
    status: "recibido",
    estimated_cost: null,
    final_cost: null,
    notes: null,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "TKT-003",
    client_name: "Carlos López",
    client_phone: "555-9012",
    client_email: null,
    equipment_type: "computadora",
    brand: "Dell",
    model: "OptiPlex 7080",
    serial_number: "DELL345678",
    reported_issue: "Pantalla azul al iniciar Windows",
    diagnosis: "Disco duro con sectores dañados",
    solution: "Se reemplazó disco duro",
    accessories: ["Teclado", "Mouse"],
    status: "listo",
    estimated_cost: 450,
    final_cost: 400,
    notes: "Cliente pagó 50% de anticipo",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const initialParts: Part[] = [
  {
    id: "PRT-001",
    name: "Tóner HP 85A",
    sku: "TON-HP85A",
    category: "Tóners",
    quantity: 15,
    min_stock: 5,
    cost_price: 350,
    sell_price: 550,
    supplier: "Distribuidora ABC",
    location: "Estante A1",
  },
  {
    id: "PRT-002",
    name: "Batería Laptop Universal",
    sku: "BAT-UNI-01",
    category: "Baterías",
    quantity: 3,
    min_stock: 5,
    cost_price: 600,
    sell_price: 950,
    supplier: "TechParts MX",
    location: "Estante B2",
  },
  {
    id: "PRT-003",
    name: "Disco SSD 480GB",
    sku: "SSD-480-01",
    category: "Discos Duros",
    quantity: 8,
    min_stock: 3,
    cost_price: 750,
    sell_price: 1200,
    supplier: "CompuMayoreo",
    location: "Estante C1",
  },
]

// Simple in-memory data store
class TicketStore {
  private tickets: Ticket[] = [...initialTickets]
  private parts: Part[] = [...initialParts]
  private ticketCounter = 4
  private partCounter = 4

  // Tickets
  getAllTickets(): Ticket[] {
    return [...this.tickets]
  }

  getActiveTickets(): Ticket[] {
    return this.tickets.filter(t => t.status !== "entregado")
  }

  getCompletedTickets(): Ticket[] {
    return this.tickets.filter(t => t.status === "entregado")
  }

  getTicketById(id: string): Ticket | undefined {
    return this.tickets.find(t => t.id === id)
  }

  searchTickets(query: string, activeOnly: boolean = false): Ticket[] {
    let filtered = activeOnly ? this.getActiveTickets() : this.getAllTickets()
    
    if (query) {
      const q = query.toLowerCase()
      filtered = filtered.filter(t => 
        t.id.toLowerCase().includes(q) ||
        t.client_name.toLowerCase().includes(q) ||
        t.client_phone.includes(q) ||
        (t.serial_number && t.serial_number.toLowerCase().includes(q))
      )
    }
    
    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  createTicket(data: Omit<Ticket, "id" | "created_at" | "updated_at">): Ticket {
    const ticket: Ticket = {
      ...data,
      id: `TKT-${String(this.ticketCounter++).padStart(3, "0")}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.tickets.push(ticket)
    return ticket
  }

  updateTicket(id: string, data: Partial<Ticket>): Ticket | null {
    const index = this.tickets.findIndex(t => t.id === id)
    if (index === -1) return null
    
    this.tickets[index] = {
      ...this.tickets[index],
      ...data,
      updated_at: new Date().toISOString(),
    }
    return this.tickets[index]
  }

  deleteTicket(id: string): boolean {
    const index = this.tickets.findIndex(t => t.id === id)
    if (index === -1) return false
    this.tickets.splice(index, 1)
    return true
  }

  // Parts
  getAllParts(): Part[] {
    return [...this.parts]
  }

  getPartById(id: string): Part | undefined {
    return this.parts.find(p => p.id === id)
  }

  searchParts(query: string): Part[] {
    if (!query) return this.getAllParts()
    
    const q = query.toLowerCase()
    return this.parts.filter(p => 
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q)
    )
  }

  createPart(data: Omit<Part, "id">): Part {
    const part: Part = {
      ...data,
      id: `PRT-${String(this.partCounter++).padStart(3, "0")}`,
    }
    this.parts.push(part)
    return part
  }

  updatePart(id: string, data: Partial<Part>): Part | null {
    const index = this.parts.findIndex(p => p.id === id)
    if (index === -1) return null
    
    this.parts[index] = {
      ...this.parts[index],
      ...data,
    }
    return this.parts[index]
  }

  deletePart(id: string): boolean {
    const index = this.parts.findIndex(p => p.id === id)
    if (index === -1) return false
    this.parts.splice(index, 1)
    return true
  }

  getLowStockParts(): Part[] {
    return this.parts.filter(p => p.quantity <= p.min_stock)
  }

  // Stats
  getStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const receivedToday = this.tickets.filter(t => {
      const created = new Date(t.created_at)
      created.setHours(0, 0, 0, 0)
      return created.getTime() === today.getTime()
    }).length

    const active = this.tickets.filter(t => 
      t.status !== "entregado" && t.status !== "listo"
    ).length

    const ready = this.tickets.filter(t => t.status === "listo").length

    const deliveredToday = this.tickets.filter(t => {
      if (t.status !== "entregado") return false
      const updated = new Date(t.updated_at)
      updated.setHours(0, 0, 0, 0)
      return updated.getTime() === today.getTime()
    }).length

    // Get last 7 days chart data
    const chartData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
      const dayName = dayNames[date.getDay()]
      
      const count = this.tickets.filter(t => {
        const created = new Date(t.created_at)
        created.setHours(0, 0, 0, 0)
        return created.getTime() === date.getTime()
      }).length

      chartData.push({ name: dayName, tickets: count })
    }

    return {
      receivedToday,
      active,
      ready,
      deliveredToday,
      chartData,
    }
  }
}

// Singleton instance
export const store = new TicketStore()
