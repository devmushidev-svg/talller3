import { NextResponse } from 'next/server'
import { getDb, queryOne, queryAll } from '@/lib/db'

export async function GET() {
  try {
    const db = await getDb()
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString()
    
    // Get counts
    const receivedToday = queryOne(db, `
      SELECT COUNT(*) as count FROM tickets 
      WHERE created_at >= ? AND status = 'recibido'
    `, [todayStr]) as { count: number } | null
    
    const activeTickets = queryOne(db, `
      SELECT COUNT(*) as count FROM tickets 
      WHERE status IN ('recibido', 'en_diagnostico', 'en_reparacion')
    `) as { count: number } | null
    
    const readyForPickup = queryOne(db, `
      SELECT COUNT(*) as count FROM tickets 
      WHERE status = 'listo'
    `) as { count: number } | null
    
    const deliveredToday = queryOne(db, `
      SELECT COUNT(*) as count FROM tickets 
      WHERE updated_at >= ? AND status = 'entregado'
    `, [todayStr]) as { count: number } | null
    
    const lowStockParts = queryOne(db, `
      SELECT COUNT(*) as count FROM parts 
      WHERE quantity <= min_stock
    `) as { count: number } | null
    
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
      
      const count = queryOne(db, `
        SELECT COUNT(*) as count FROM tickets 
        WHERE created_at >= ? AND created_at < ?
      `, [startStr, endStr]) as { count: number } | null
      
      ticketsPerDay.push({
        date: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
        count: count?.count ?? 0
      })
    }
    
    return NextResponse.json({
      receivedToday: receivedToday?.count ?? 0,
      activeTickets: activeTickets?.count ?? 0,
      readyForPickup: readyForPickup?.count ?? 0,
      deliveredToday: deliveredToday?.count ?? 0,
      lowStockParts: lowStockParts?.count ?? 0,
      ticketsPerDay
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Error fetching stats' }, { status: 500 })
  }
}
