import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
  
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("*")
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  const allTickets = tickets || []
  
  // Today's stats
  const todayTickets = allTickets.filter(t => {
    const created = new Date(t.created_at)
    return created >= today
  })
  
  const activeTickets = allTickets.filter(t => 
    t.status !== "entregado"
  )
  
  const readyTickets = allTickets.filter(t => 
    t.status === "listo"
  )
  
  const deliveredToday = allTickets.filter(t => {
    if (t.status !== "entregado" || !t.delivered_at) return false
    const delivered = new Date(t.delivered_at)
    return delivered >= today
  })
  
  // Weekly stats
  const weekTickets = allTickets.filter(t => {
    const created = new Date(t.created_at)
    return created >= thisWeekStart
  })
  
  const weekRevenue = weekTickets
    .filter(t => t.status === "entregado")
    .reduce((sum, t) => sum + (t.total_cost || 0), 0)
  
  // Monthly stats
  const monthTickets = allTickets.filter(t => {
    const created = new Date(t.created_at)
    return created >= thisMonthStart
  })
  
  const monthRevenue = monthTickets
    .filter(t => t.status === "entregado")
    .reduce((sum, t) => sum + (t.total_cost || 0), 0)
  
  const monthDelivered = monthTickets.filter(t => t.status === "entregado").length
  
  // Status breakdown
  const statusBreakdown = {
    recibido: allTickets.filter(t => t.status === "recibido").length,
    en_diagnostico: allTickets.filter(t => t.status === "en_diagnostico").length,
    en_reparacion: allTickets.filter(t => t.status === "en_reparacion").length,
    listo: allTickets.filter(t => t.status === "listo").length,
    entregado: allTickets.filter(t => t.status === "entregado").length,
  }
  
  // Equipment type breakdown (active only)
  const equipmentBreakdown = activeTickets.reduce((acc, t) => {
    acc[t.equipment_type] = (acc[t.equipment_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Get tickets per day for last 7 days
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    
    const received = allTickets.filter(t => {
      const created = new Date(t.created_at)
      return created >= date && created < nextDate
    }).length
    
    const delivered = allTickets.filter(t => {
      if (!t.delivered_at) return false
      const deliveredDate = new Date(t.delivered_at)
      return deliveredDate >= date && deliveredDate < nextDate
    }).length
    
    last7Days.push({
      date: date.toLocaleDateString("es-ES", { weekday: "short" }),
      recibidos: received,
      entregados: delivered
    })
  }
  
  // Average repair time (for delivered tickets this month)
  const deliveredWithTimes = monthTickets.filter(t => 
    t.status === "entregado" && t.delivered_at && t.created_at
  )
  
  let avgRepairDays = 0
  if (deliveredWithTimes.length > 0) {
    const totalDays = deliveredWithTimes.reduce((sum, t) => {
      const created = new Date(t.created_at)
      const delivered = new Date(t.delivered_at)
      const days = Math.ceil((delivered.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0)
    avgRepairDays = Math.round(totalDays / deliveredWithTimes.length)
  }
  
  // Pending payments
  const pendingPayments = activeTickets
    .filter(t => t.status === "listo" && (t.amount_paid || 0) < (t.total_cost || 0))
    .reduce((sum, t) => sum + ((t.total_cost || 0) - (t.amount_paid || 0)), 0)
  
  return NextResponse.json({
    // Today
    receivedToday: todayTickets.length,
    activeTickets: activeTickets.length,
    readyForPickup: readyTickets.length,
    deliveredToday: deliveredToday.length,
    
    // Week
    weekTickets: weekTickets.length,
    weekRevenue,
    
    // Month
    monthTickets: monthTickets.length,
    monthRevenue,
    monthDelivered,
    avgRepairDays,
    
    // Breakdowns
    statusBreakdown,
    equipmentBreakdown,
    ticketsPerDay: last7Days,
    
    // Financial
    pendingPayments,
  })
}
