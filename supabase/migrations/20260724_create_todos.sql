-- Create todos table for task management
CREATE TABLE IF NOT EXISTS todos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date TEXT NOT NULL,
  time TEXT,
  text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_todos_date ON todos(date DESC);
CREATE INDEX IF NOT EXISTS idx_todos_done ON todos(done);
CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_todos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_todos_updated_at_trigger
BEFORE UPDATE ON todos
FOR EACH ROW
EXECUTE FUNCTION update_todos_updated_at();
