import initSqlJs, { Database } from 'sql.js'
import fs from 'fs'
import path from 'path'

let db: Database | null = null
let sqlPromise: Promise<typeof import('sql.js')> | null = null

const dbPath = path.join(process.cwd(), 'taller.db')

async function initSQL() {
  if (!sqlPromise) {
    sqlPromise = initSqlJs()
  }
  return sqlPromise
}

export async function getDb(): Promise<Database> {
  if (db) return db
  
  const SQL = await initSQL()
  
  // Try to load existing database
  try {
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath)
      db = new SQL.Database(fileBuffer)
    } else {
      db = new SQL.Database()
    }
  } catch {
    db = new SQL.Database()
  }
  
  // Initialize tables
  db.run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_phone TEXT NOT NULL,
      client_email TEXT,
      equipment_type TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      serial_number TEXT,
      reported_issue TEXT NOT NULL,
      diagnosis TEXT,
      solution TEXT,
      status TEXT NOT NULL DEFAULT 'recibido',
      estimated_cost REAL,
      final_cost REAL,
      accessories TEXT,
      notes TEXT
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS parts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sku TEXT,
      quantity INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL DEFAULT 5,
      cost_price REAL NOT NULL,
      sell_price REAL NOT NULL,
      supplier TEXT,
      location TEXT
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  // Insert default settings
  const defaultSettings = [
    ['shop_name', 'Mi Taller de Reparaciones'],
    ['shop_address', ''],
    ['shop_phone', ''],
    ['shop_email', ''],
    ['printer_width', '80'],
    ['print_logo', 'true'],
    ['notify_ready', 'true'],
    ['notify_delivered', 'true']
  ]

  for (const [key, value] of defaultSettings) {
    db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value])
  }

  saveDb()
  return db
}

export function saveDb() {
  if (db) {
    try {
      const data = db.export()
      const buffer = Buffer.from(data)
      fs.writeFileSync(dbPath, buffer)
    } catch (error) {
      console.error('Error saving database:', error)
    }
  }
}

// Helper to run queries and get results as objects
export function queryAll(db: Database, sql: string, params: unknown[] = []): Record<string, unknown>[] {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const results: Record<string, unknown>[] = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

export function queryOne(db: Database, sql: string, params: unknown[] = []): Record<string, unknown> | null {
  const results = queryAll(db, sql, params)
  return results.length > 0 ? results[0] : null
}

export function runQuery(db: Database, sql: string, params: unknown[] = []) {
  db.run(sql, params)
  saveDb()
}

// Helper to generate IDs
export function generateId(): string {
  return `T${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`
}

export function generatePartId(): string {
  return `P${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`
}
