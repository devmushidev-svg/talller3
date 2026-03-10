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
