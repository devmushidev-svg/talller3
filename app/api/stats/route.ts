import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString()
    
    // Get counts
    const receivedToday = db.prepare(`
      SELECT COUNT(*) as count FROM tickets 
      WHERE created_at >= ? AND status = 'recibido'
    `).get(todayStr) as { count: number }
    
    const activeTickets = db.prepare(`
      SELECT COUNT(*) as count FROM tickets 
      WHERE status IN ('recibido', 'en_diagnostico', 'en_reparacion')
    `).get() as { count: number }
    
    const readyForPickup = db.prepare(`
      SELECT COUNT(*) as count FROM tickets 
      WHERE status = 'listo'
    `).get() as { count: number }
    
    const deliveredToday = db.prepare(`
      SELECT COUNT(*) as count FROM tickets 
      WHERE updated_at >= ? AND status = 'entregado'
    `).get(todayStr) as { count: number }
    
    const lowStockParts = db.prepare(`
      SELECT COUNT(*) as count FROM parts 
      WHERE quantity <= min_stock
    `).get() as { count: number }
    
    // Get tickets per day for last 7 days
    const ticketsPerDay: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const startStr = date.toISOString()
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      const endStr = nextDate.toISOString()
      
      const count = db.prepare(`
        SELECT COUNT(*) as count FROM tickets 
        WHERE created_at >= ? AND created_at < ?
      `).get(startStr, endStr) as { count: number }
      
      ticketsPerDay.push({
        date: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
        count: count.count
      })
    }
    
    return NextResponse.json({
      receivedToday: receivedToday.count,
      activeTickets: activeTickets.count,
      readyForPickup: readyForPickup.count,
      deliveredToday: deliveredToday.count,
      lowStockParts: lowStockParts.count,
      ticketsPerDay
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Error fetching stats' }, { status: 500 })
  }
}
