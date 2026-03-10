import { NextRequest, NextResponse } from 'next/server'
import { getDb, queryAll, queryOne, runQuery, generateId } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    let query = 'SELECT * FROM tickets'
    const conditions: string[] = []
    const params: (string | number)[] = []
    
    if (status && status !== 'all') {
      if (status === 'active') {
        conditions.push("status IN ('recibido', 'en_diagnostico', 'en_reparacion', 'listo')")
      } else if (status === 'completed') {
        conditions.push("status = 'entregado'")
      } else {
        conditions.push('status = ?')
        params.push(status)
      }
    }
    
    if (search) {
      conditions.push(`(
        client_name LIKE ? OR 
        client_phone LIKE ? OR 
        serial_number LIKE ? OR
        id LIKE ?
      )`)
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm)
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }
    
    query += ' ORDER BY created_at DESC'
    
    const tickets = queryAll(db, query, params)
    
    // Parse accessories JSON
    const parsedTickets = tickets.map((ticket) => ({
      ...ticket,
      accessories: ticket.accessories ? JSON.parse(ticket.accessories as string) : []
    }))
    
    return NextResponse.json(parsedTickets)
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Error fetching tickets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb()
    const data = await request.json()
    
    const id = generateId()
    const now = new Date().toISOString()
    
    runQuery(db, `
      INSERT INTO tickets (
        id, created_at, updated_at, client_name, client_phone, client_email,
        equipment_type, brand, model, serial_number, reported_issue,
        diagnosis, solution, status, estimated_cost, final_cost, accessories, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      now,
      now,
      data.clientName,
      data.clientPhone,
      data.clientEmail || null,
      data.equipmentType,
      data.brand,
      data.model,
      data.serialNumber || null,
      data.reportedIssue,
      data.diagnosis || null,
      data.solution || null,
      'recibido',
      data.estimatedCost || null,
      data.finalCost || null,
      JSON.stringify(data.accessories || []),
      data.notes || null
    ])
    
    const newTicket = queryOne(db, 'SELECT * FROM tickets WHERE id = ?', [id])
    
    return NextResponse.json({
      ...newTicket,
      accessories: newTicket?.accessories ? JSON.parse(newTicket.accessories as string) : []
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json({ error: 'Error creating ticket' }, { status: 500 })
  }
}
