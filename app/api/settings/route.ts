import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()
    
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
    
    const settings: Record<string, string> = {}
    for (const row of rows) {
      settings[row.key] = row.value
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Error fetching settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const db = getDb()
    const data = await request.json()
    
    const stmt = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `)
    
    for (const [key, value] of Object.entries(data)) {
      stmt.run(key, String(value))
    }
    
    // Return all settings
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
    
    const settings: Record<string, string> = {}
    for (const row of rows) {
      settings[row.key] = row.value
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Error updating settings' }, { status: 500 })
  }
}
