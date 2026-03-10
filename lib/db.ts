import Database from 'better-sqlite3'
import path from 'path'

// Database file will be stored in the project root
const dbPath = path.join(process.cwd(), 'taller.db')

// Create singleton database connection
let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL') // Better performance for concurrent reads
    initializeDatabase()
  }
  return db
}

function initializeDatabase() {
  const database = db!
  
  // Create tickets table
  database.exec(`
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

  // Create parts inventory table
  database.exec(`
    CREATE TABLE IF NOT EXISTS parts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sku TEXT UNIQUE,
      quantity INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL DEFAULT 5,
      cost_price REAL NOT NULL,
      sell_price REAL NOT NULL,
      supplier TEXT,
      location TEXT
    )
  `)

  // Create shop settings table
  database.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  // Insert default settings if not exists
  const insertSetting = database.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
  `)
  
  insertSetting.run('shop_name', 'Mi Taller de Reparaciones')
  insertSetting.run('shop_address', '')
  insertSetting.run('shop_phone', '')
  insertSetting.run('shop_email', '')
  insertSetting.run('printer_width', '80')
  insertSetting.run('print_logo', 'true')
  insertSetting.run('notify_ready', 'true')
  insertSetting.run('notify_delivered', 'true')
}

// Helper to generate IDs
export function generateId(): string {
  return `T${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`
}

export function generatePartId(): string {
  return `P${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`
}
