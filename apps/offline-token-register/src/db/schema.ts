// Database schema for offline token register

export interface Student {
  id: number
  barcode: string
  name: string
  balance: number
  is_vip: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  barcode: string
  name: string
  point_cost: number
  quantity?: number | null
  low_stock_threshold?: number | null
  vip_only: boolean
  image_url?: string
  emoji?: string
  category?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Purchase {
  id: number
  student_id: number
  product_id: number
  student_barcode: string
  student_name: string
  product_name: string
  point_cost: number
  points_after: number
  is_reversed: boolean
  reversed_at?: string | null
  reverse_reason?: string | null
  created_at: string
}

export interface BalanceHistory {
  id: number
  student_id: number
  student_barcode: string
  student_name: string
  old_balance: number
  new_balance: number
  change_amount: number
  operation_type: 'add' | 'set' | 'subtract' | 'purchase' | 'reversal'
  reason: string
  created_at: string
}

export interface AdminConfig {
  key: string
  value: string
  updated_at: string
}

export const DATABASE_NAME = 'TokenRegister.db'

export const SQL_STATEMENTS = {
  createStudents: `
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      balance INTEGER NOT NULL DEFAULT 0,
      is_vip INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,

  createProducts: `
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      point_cost INTEGER NOT NULL,
      quantity INTEGER,
      low_stock_threshold INTEGER,
      vip_only INTEGER NOT NULL DEFAULT 0,
      image_url TEXT NOT NULL DEFAULT '',
      emoji TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'nosh',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,

  createPurchases: `
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      student_barcode TEXT NOT NULL,
      student_name TEXT NOT NULL,
      product_name TEXT NOT NULL,
      point_cost INTEGER NOT NULL,
      points_after INTEGER NOT NULL,
      is_reversed INTEGER NOT NULL DEFAULT 0,
      reversed_at TEXT,
      reverse_reason TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `,

  createBalanceHistory: `
    CREATE TABLE IF NOT EXISTS balance_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      student_barcode TEXT NOT NULL,
      student_name TEXT NOT NULL,
      old_balance INTEGER NOT NULL,
      new_balance INTEGER NOT NULL,
      change_amount INTEGER NOT NULL,
      operation_type TEXT NOT NULL CHECK(operation_type IN ('add', 'set', 'subtract', 'purchase', 'reversal')),
      reason TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id)
    )
  `,

  createAdminConfig: `
    CREATE TABLE IF NOT EXISTS admin_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,

  // Migration-safe ALTER TABLE for existing databases
  migrationAddVipColumns: [
    'ALTER TABLE students ADD COLUMN is_vip INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE products ADD COLUMN vip_only INTEGER NOT NULL DEFAULT 0',
    "ALTER TABLE products ADD COLUMN image_url TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE products ADD COLUMN emoji TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT 'nosh'",
  ],

  createIndexes: [
    'CREATE INDEX IF NOT EXISTS idx_students_barcode ON students(barcode)',
    'CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)',
    'CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_purchases_student_id ON purchases(student_id)',
    'CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON purchases(product_id)',
    'CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_balance_history_student_id ON balance_history(student_id)',
    'CREATE INDEX IF NOT EXISTS idx_balance_history_created_at ON balance_history(created_at)',
  ],
}
