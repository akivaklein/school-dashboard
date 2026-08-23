import * as SQLite from 'expo-sqlite'
import { Platform } from 'react-native'
import { DATABASE_NAME, SQL_STATEMENTS } from './schema'
import type { BalanceHistory, Product, Purchase, Student } from './schema'

let db: SQLite.SQLiteDatabase | null = null

function createBrowserDatabase(): SQLite.SQLiteDatabase {
  const now = new Date().toISOString()
  const students: Student[] = [
    { id: 1, barcode: 'STU-1001', name: 'Ari Cohen', balance: 120, is_active: true, created_at: now, updated_at: now },
    { id: 2, barcode: 'STU-1002', name: 'David Levy', balance: 85, is_active: true, created_at: now, updated_at: now },
    { id: 3, barcode: 'STU-1003', name: 'Moshe Weiss', balance: 210, is_active: true, created_at: now, updated_at: now },
  ]
  const products: Product[] = [
    { id: 1, barcode: 'ITEM-1001', name: 'Chocolate Bar', point_cost: 20, quantity: 24, low_stock_threshold: 5, is_active: true, created_at: now, updated_at: now },
    { id: 2, barcode: 'ITEM-1002', name: 'Potato Chips', point_cost: 15, quantity: 18, low_stock_threshold: 5, is_active: true, created_at: now, updated_at: now },
    { id: 3, barcode: 'ITEM-1003', name: 'Juice Box', point_cost: 10, quantity: 30, low_stock_threshold: 8, is_active: true, created_at: now, updated_at: now },
  ]
  const purchases: Purchase[] = []
  const balanceHistory: BalanceHistory[] = []
  const adminConfig = new Map<string, string>()
  let nextId = 4

  const sortByName = <T extends { name: string }>(items: T[]) =>
    [...items].sort((left, right) => left.name.localeCompare(right.name))
  const firstMatch = <T>(items: T[], predicate: (item: T) => boolean) =>
    items.find(predicate) || null

  const browserDb = {
    async execAsync() {},
    async closeAsync() {},
    async getAllAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      if (sql.includes('FROM students')) {
        let result = sql.includes('is_active = 1') ? students.filter(student => student.is_active) : [...students]
        if (sql.includes('student_id = ?')) result = students.filter(student => student.id === params[0])
        return sortByName(result) as T[]
      }
      if (sql.includes('FROM products')) {
        let result = sql.includes('is_active = 1') ? products.filter(product => product.is_active) : [...products]
        if (sql.includes('product_id = ?')) result = products.filter(product => product.id === params[0])
        return sortByName(result) as T[]
      }
      if (sql.includes('FROM purchases')) {
        let result = sql.includes('student_id = ?') ? purchases.filter(purchase => purchase.student_id === params[0]) : [...purchases]
        return result.sort((left, right) => right.created_at.localeCompare(left.created_at)).slice(0, Number(params[sql.includes('student_id = ?') ? 1 : 0]) || 50) as T[]
      }
      if (sql.includes('FROM balance_history')) {
        return balanceHistory.filter(history => history.student_id === params[0]).slice(0, Number(params[1]) || 100) as T[]
      }
      return []
    },
    async getFirstAsync<T>(sql: string, params: unknown[] = []): Promise<T | null> {
      if (sql.includes('FROM students')) {
        const student = sql.includes('barcode = ?')
          ? firstMatch(students, item => item.barcode === params[0])
          : firstMatch(students, item => item.id === params[0])
        return student as T | null
      }
      if (sql.includes('FROM products')) {
        const product = sql.includes('barcode = ?')
          ? firstMatch(products, item => item.barcode === params[0])
          : firstMatch(products, item => item.id === params[0])
        return product as T | null
      }
      if (sql.includes('FROM purchases')) return firstMatch(purchases, item => item.id === params[0]) as T | null
      if (sql.includes('FROM admin_config')) return adminConfig.has(String(params[0])) ? ({ value: adminConfig.get(String(params[0])) } as T) : null
      if (sql.includes('FROM balance_history')) return firstMatch(balanceHistory, item => item.id === params[0]) as T | null
      return null
    },
    async runAsync(sql: string, params: unknown[] = []): Promise<{ lastInsertRowId: number }> {
      const timestamp = new Date().toISOString()
      if (sql.startsWith('INSERT INTO students')) {
        const student = { id: nextId++, barcode: String(params[0]), name: String(params[1]), balance: Number(params[2]), is_active: true, created_at: String(params[3]), updated_at: String(params[4]) }
        students.push(student)
        return { lastInsertRowId: student.id }
      }
      if (sql.startsWith('UPDATE students')) {
        const id = Number(params[params.length - 1])
        const student = students.find(item => item.id === id)
        if (student) {
          const fields = [...sql.matchAll(/(barcode|name|balance|is_active) = \?/g)].map(match => match[1])
          fields.forEach((field, index) => { (student as unknown as Record<string, unknown>)[field] = params[index] })
          student.updated_at = timestamp
        }
        return { lastInsertRowId: 0 }
      }
      if (sql.startsWith('INSERT INTO products')) {
        const product = { id: nextId++, barcode: String(params[0]), name: String(params[1]), point_cost: Number(params[2]), quantity: params[3] as number | null, low_stock_threshold: params[4] as number | null, is_active: true, created_at: String(params[5]), updated_at: String(params[6]) }
        products.push(product)
        return { lastInsertRowId: product.id }
      }
      if (sql.startsWith('UPDATE products')) {
        const id = Number(params[params.length - 1])
        const product = products.find(item => item.id === id)
        if (product) {
          const fields = [...sql.matchAll(/(barcode|name|point_cost|quantity|low_stock_threshold|is_active) = \?/g)].map(match => match[1])
          fields.forEach((field, index) => { (product as unknown as Record<string, unknown>)[field] = params[index] })
          product.updated_at = timestamp
        }
        return { lastInsertRowId: 0 }
      }
      if (sql.startsWith('INSERT INTO purchases')) {
        const purchase = { id: nextId++, student_id: Number(params[0]), product_id: Number(params[1]), student_barcode: String(params[2]), student_name: String(params[3]), product_name: String(params[4]), point_cost: Number(params[5]), points_after: Number(params[6]), is_reversed: false, created_at: String(params[7]) }
        purchases.push(purchase)
        return { lastInsertRowId: purchase.id }
      }
      if (sql.startsWith('UPDATE purchases')) {
        const purchase = purchases.find(item => item.id === Number(params[params.length - 1]))
        if (purchase) {
          purchase.is_reversed = true
          purchase.reversed_at = String(params[0])
          purchase.reverse_reason = String(params[1])
        }
        return { lastInsertRowId: 0 }
      }
      if (sql.startsWith('INSERT INTO balance_history')) {
        balanceHistory.push({ id: nextId++, student_id: Number(params[0]), student_barcode: String(params[1]), student_name: String(params[2]), old_balance: Number(params[3]), new_balance: Number(params[4]), change_amount: Number(params[5]), operation_type: String(params[6]) as BalanceHistory['operation_type'], reason: String(params[7]), created_at: String(params[8]) })
        return { lastInsertRowId: balanceHistory[balanceHistory.length - 1].id }
      }
      if (sql.startsWith('INSERT OR REPLACE INTO admin_config')) adminConfig.set(String(params[0]), String(params[1]))
      return { lastInsertRowId: 0 }
    },
  }

  return browserDb as unknown as SQLite.SQLiteDatabase
}

export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db
  }

  if (Platform.OS === 'web') {
    db = createBrowserDatabase()
    return db
  }

  try {
    db = await SQLite.openDatabaseAsync(DATABASE_NAME)
    
    // Execute initialization statements
    await db.execAsync(SQL_STATEMENTS.createStudents)
    await db.execAsync(SQL_STATEMENTS.createProducts)
    await db.execAsync(SQL_STATEMENTS.createPurchases)
    await db.execAsync(SQL_STATEMENTS.createBalanceHistory)
    await db.execAsync(SQL_STATEMENTS.createAdminConfig)

    // Create indexes
    for (const indexStmt of SQL_STATEMENTS.createIndexes) {
      await db.execAsync(indexStmt)
    }

    console.log('Database initialized successfully')
    return db
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.')
  }
  return db
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync()
    db = null
  }
}

// Utility function for safe database operations
export async function withDatabase<T>(
  operation: (db: SQLite.SQLiteDatabase) => Promise<T>
): Promise<T> {
  const database = getDatabase()
  try {
    return await operation(database)
  } catch (error) {
    console.error('Database operation error:', error)
    throw error
  }
}
