import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("*")
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  const allTickets = tickets || []
  
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
  
  // Get tickets per day for last 7 days
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    
    const count = allTickets.filter(t => {
      const created = new Date(t.created_at)
      return created >= date && created < nextDate
    }).length
    
    last7Days.push({
      date: date.toLocaleDateString("es-ES", { weekday: "short" }),
      tickets: count
    })
  }
  
  return NextResponse.json({
    receivedToday: todayTickets.length,
    activeTickets: activeTickets.length,
    readyForPickup: readyTickets.length,
    deliveredToday: deliveredToday.length,
    ticketsPerDay: last7Days
  })
}
