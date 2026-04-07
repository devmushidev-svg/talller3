import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const query = searchParams.get('q') || ''
    const status = searchParams.get('status')
    const equipmentType = searchParams.get('equipment_type')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const paymentStatus = searchParams.get('payment_status')
    
    let dbQuery = supabase.from('tickets').select('*')
    
    // Text search + número de ticket impreso (ticket_seq), p. ej. "4" en "Ticket N° 4"
    if (query) {
      const q = query.trim()
      const orParts = [
        `id.ilike.%${q}%`,
        `client_name.ilike.%${q}%`,
        `client_phone.ilike.%${q}%`,
        `serial_number.ilike.%${q}%`,
        `brand.ilike.%${q}%`,
        `model.ilike.%${q}%`,
      ]
      if (/^\d+$/.test(q)) {
        const n = parseInt(q, 10)
        if (Number.isSafeInteger(n)) {
          orParts.push(`ticket_seq.eq.${n}`)
        }
      }
      dbQuery = dbQuery.or(orParts.join(","))
    }
    
    // Status filter
    if (status && status !== 'all') {
      dbQuery = dbQuery.eq('status', status)
    }
    
    // Equipment type filter
    if (equipmentType && equipmentType !== 'all') {
      dbQuery = dbQuery.eq('equipment_type', equipmentType)
    }
    
    // Date range filter
    if (dateFrom) {
      dbQuery = dbQuery.gte('created_at', dateFrom)
    }
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setDate(endDate.getDate() + 1)
      dbQuery = dbQuery.lt('created_at', endDate.toISOString())
    }
    
    // Order by created_at desc
    dbQuery = dbQuery.order('created_at', { ascending: false })
    
    const { data, error } = await dbQuery
    
    if (error) throw error
    
    // Payment status filter (client-side since it's calculated)
    let filteredData = data || []
    if (paymentStatus === 'pending') {
      filteredData = filteredData.filter(t => 
        (t.amount_paid || 0) < (t.total_cost || 0) && t.total_cost > 0
      )
    } else if (paymentStatus === 'paid') {
      filteredData = filteredData.filter(t => 
        (t.amount_paid || 0) >= (t.total_cost || 0) || t.total_cost === 0
      )
    }
    
    return NextResponse.json(filteredData)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Error en búsqueda' }, { status: 500 })
  }
}
