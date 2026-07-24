-- Create teaching_actions table for custom point actions
CREATE TABLE IF NOT EXISTS teaching_actions (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  points INTEGER NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_teaching_actions_category ON teaching_actions(category);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_teaching_actions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teaching_actions_updated_at_trigger
BEFORE UPDATE ON teaching_actions
FOR EACH ROW
EXECUTE FUNCTION update_teaching_actions_updated_at();

-- Create vip_rules table (singleton config)
CREATE TABLE IF NOT EXISTS vip_rules (
  id TEXT PRIMARY KEY DEFAULT 'default',
  minimum_points INTEGER NOT NULL DEFAULT 80,
  maximum_reminders INTEGER NOT NULL DEFAULT 2,
  minimum_attendance INTEGER NOT NULL DEFAULT 90,
  require_all BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_vip_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vip_rules_updated_at_trigger
BEFORE UPDATE ON vip_rules
FOR EACH ROW
EXECUTE FUNCTION update_vip_rules_updated_at();

-- Create store_sales table for store promotions/discounts
CREATE TABLE IF NOT EXISTS store_sales (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  value INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_store_sales_active ON store_sales(active);
CREATE INDEX IF NOT EXISTS idx_store_sales_type ON store_sales(type);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_store_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_store_sales_updated_at_trigger
BEFORE UPDATE ON store_sales
FOR EACH ROW
EXECUTE FUNCTION update_store_sales_updated_at();
