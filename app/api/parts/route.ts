import { NextRequest, NextResponse } from 'next/server'
import { getDb, generatePartId } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const lowStock = searchParams.get('lowStock')
    
    let query = 'SELECT * FROM parts'
    const conditions: string[] = []
    const params: string[] = []
    
    if (search) {
      conditions.push(`(name LIKE ? OR sku LIKE ? OR supplier LIKE ?)`)
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }
    
    if (category && category !== 'all') {
      conditions.push('category = ?')
      params.push(category)
    }
    
    if (lowStock === 'true') {
      conditions.push('quantity <= min_stock')
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }
    
    query += ' ORDER BY name ASC'
    
    const stmt = db.prepare(query)
    const parts = stmt.all(...params)
    
    return NextResponse.json(parts)
  } catch (error) {
    console.error('Error fetching parts:', error)
    return NextResponse.json({ error: 'Error fetching parts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb()
    const data = await request.json()
    
    const id = generatePartId()
    
    const stmt = db.prepare(`
      INSERT INTO parts (
        id, name, category, sku, quantity, min_stock, cost_price, sell_price, supplier, location
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run(
      id,
      data.name,
      data.category,
      data.sku || null,
      data.quantity || 0,
      data.minStock || 5,
      data.costPrice,
      data.sellPrice,
      data.supplier || null,
      data.location || null
    )
    
    const newPart = db.prepare('SELECT * FROM parts WHERE id = ?').get(id)
    
    return NextResponse.json(newPart, { status: 201 })
  } catch (error) {
    console.error('Error creating part:', error)
    return NextResponse.json({ error: 'Error creating part' }, { status: 500 })
  }
}
