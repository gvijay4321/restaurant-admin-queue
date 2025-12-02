-- SQL Migration: Create restaurant_tables table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  table_number TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  current_token_id UUID REFERENCES queue_tokens(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: each table number must be unique per organization
  CONSTRAINT unique_table_per_org UNIQUE (org_id, table_number)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_org_id ON restaurant_tables(org_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_status ON restaurant_tables(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_token ON restaurant_tables(current_token_id);

-- Enable Row Level Security
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can customize this based on your auth requirements)
CREATE POLICY "Allow all operations on restaurant_tables" 
  ON restaurant_tables 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_restaurant_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER trigger_update_restaurant_tables_updated_at
  BEFORE UPDATE ON restaurant_tables
  FOR EACH ROW
  EXECUTE FUNCTION update_restaurant_tables_updated_at();
