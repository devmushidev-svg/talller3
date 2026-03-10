-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  equipment_type TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  problem_description TEXT NOT NULL,
  accessories TEXT DEFAULT '[]',
  status TEXT DEFAULT 'received',
  technician_notes TEXT,
  diagnosis TEXT,
  repair_cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Parts inventory table
CREATE TABLE IF NOT EXISTS parts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  unit_cost DECIMAL(10,2),
  sell_price DECIMAL(10,2),
  supplier TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shop settings table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  shop_name TEXT DEFAULT 'Mi Taller',
  shop_address TEXT,
  shop_phone TEXT,
  shop_email TEXT,
  printer_width TEXT DEFAULT '80mm',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (id, shop_name, printer_width)
VALUES ('default', 'Mi Taller de Reparaciones', '80mm')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_parts_category ON parts(category);
CREATE INDEX IF NOT EXISTS idx_parts_quantity ON parts(quantity);
