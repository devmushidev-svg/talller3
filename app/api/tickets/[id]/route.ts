import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as Record<string, unknown> | undefined
    
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      ...ticket,
      accessories: ticket.accessories ? JSON.parse(ticket.accessories as string) : []
    })
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json({ error: 'Error fetching ticket' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    const data = await request.json()
    
    // Check if ticket exists
    const existing = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id)
    if (!existing) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }
    
    const updates: string[] = []
    const values: (string | number | null)[] = []
    
    const fieldMap: Record<string, string> = {
      clientName: 'client_name',
      clientPhone: 'client_phone',
      clientEmail: 'client_email',
      equipmentType: 'equipment_type',
      brand: 'brand',
      model: 'model',
      serialNumber: 'serial_number',
      reportedIssue: 'reported_issue',
      diagnosis: 'diagnosis',
      solution: 'solution',
      status: 'status',
      estimatedCost: 'estimated_cost',
      finalCost: 'final_cost',
      notes: 'notes'
    }
    
    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        updates.push(`${dbField} = ?`)
        values.push(data[key])
      }
    }
    
    if (data.accessories !== undefined) {
      updates.push('accessories = ?')
      values.push(JSON.stringify(data.accessories))
    }
    
    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }
    
    updates.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)
    
    const stmt = db.prepare(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`)
    stmt.run(...values)
    
    const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as Record<string, unknown>
    
    return NextResponse.json({
      ...updated,
      accessories: updated.accessories ? JSON.parse(updated.accessories as string) : []
    })
  } catch (error) {
    console.error('Error updating ticket:', error)
    return NextResponse.json({ error: 'Error updating ticket' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    
    const stmt = db.prepare('DELETE FROM tickets WHERE id = ?')
    const result = stmt.run(id)
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ticket:', error)
    return NextResponse.json({ error: 'Error deleting ticket' }, { status: 500 })
  }
}
