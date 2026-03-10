-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number SERIAL,
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  equipment_type TEXT NOT NULL CHECK (equipment_type IN ('Computadora', 'Impresora')),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  reported_problem TEXT NOT NULL,
  internal_notes TEXT DEFAULT '',
  accessories JSONB NOT NULL DEFAULT '{"cablePoder": false, "cableUSB": false, "cargador": false, "cartucho": false, "toner": false, "otros": false, "otrosDetalle": ""}',
  status TEXT NOT NULL DEFAULT 'Recibido' CHECK (status IN ('Recibido', 'En Diagnóstico', 'En Reparación', 'Listo', 'Entregado')),
  total_repair DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

-- Create parts inventory table
CREATE TABLE IF NOT EXISTS parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  compatible_with TEXT DEFAULT '',
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  supplier TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shop settings table
CREATE TABLE IF NOT EXISTS shop_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL DEFAULT 'Mi Taller',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  printer_width TEXT DEFAULT '80mm' CHECK (printer_width IN ('58mm', '80mm')),
  notify_whatsapp BOOLEAN DEFAULT false,
  notify_email BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_parts_updated_at ON parts;
CREATE TRIGGER update_parts_updated_at
  BEFORE UPDATE ON parts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shop_settings_updated_at ON shop_settings;
CREATE TRIGGER update_shop_settings_updated_at
  BEFORE UPDATE ON shop_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS for public access (single-user workshop system)
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE parts DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings DISABLE ROW LEVEL SECURITY;

-- Insert default shop settings if none exist
INSERT INTO shop_settings (shop_name, address, phone, printer_width)
SELECT 'Mi Taller', '', '', '80mm'
WHERE NOT EXISTS (SELECT 1 FROM shop_settings LIMIT 1);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_client_name ON tickets(client_name);
CREATE INDEX IF NOT EXISTS idx_parts_category ON parts(category);
CREATE INDEX IF NOT EXISTS idx_parts_stock ON parts(stock);
