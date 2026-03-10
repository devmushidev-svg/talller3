import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    
    const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(id)
    
    if (!part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 })
    }
    
    return NextResponse.json(part)
  } catch (error) {
    console.error('Error fetching part:', error)
    return NextResponse.json({ error: 'Error fetching part' }, { status: 500 })
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
    
    const existing = db.prepare('SELECT * FROM parts WHERE id = ?').get(id)
    if (!existing) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 })
    }
    
    const updates: string[] = []
    const values: (string | number | null)[] = []
    
    const fieldMap: Record<string, string> = {
      name: 'name',
      category: 'category',
      sku: 'sku',
      quantity: 'quantity',
      minStock: 'min_stock',
      costPrice: 'cost_price',
      sellPrice: 'sell_price',
      supplier: 'supplier',
      location: 'location'
    }
    
    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        updates.push(`${dbField} = ?`)
        values.push(data[key])
      }
    }
    
    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }
    
    values.push(id)
    
    const stmt = db.prepare(`UPDATE parts SET ${updates.join(', ')} WHERE id = ?`)
    stmt.run(...values)
    
    const updated = db.prepare('SELECT * FROM parts WHERE id = ?').get(id)
    
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating part:', error)
    return NextResponse.json({ error: 'Error updating part' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    
    const stmt = db.prepare('DELETE FROM parts WHERE id = ?')
    const result = stmt.run(id)
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting part:', error)
    return NextResponse.json({ error: 'Error deleting part' }, { status: 500 })
  }
}
