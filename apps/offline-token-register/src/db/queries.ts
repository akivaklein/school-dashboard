import { getDatabase, withDatabase } from './database'
import type { Student, Product, Purchase, BalanceHistory, AdminConfig } from './schema'

// ==================== STUDENTS ====================

export async function getAllStudents(): Promise<Student[]> {
  return withDatabase(async db => {
    const result = await db.getAllAsync<Student>(
      'SELECT * FROM students ORDER BY name ASC'
    )
    return result || []
  })
}

export async function getActiveStudents(): Promise<Student[]> {
  return withDatabase(async db => {
    const result = await db.getAllAsync<Student>(
      'SELECT * FROM students WHERE is_active = 1 ORDER BY name ASC'
    )
    return result || []
  })
}

export async function getStudentByBarcode(barcode: string): Promise<Student | null> {
  return withDatabase(async db => {
    const result = await db.getFirstAsync<Student>(
      'SELECT * FROM students WHERE barcode = ?',
      [barcode]
    )
    return result || null
  })
}

export async function getStudentById(id: number): Promise<Student | null> {
  return withDatabase(async db => {
    const result = await db.getFirstAsync<Student>(
      'SELECT * FROM students WHERE id = ?',
      [id]
    )
    return result || null
  })
}

export async function createStudent(input: {
  barcode: string
  name: string
  balance?: number
}): Promise<Student> {
  return withDatabase(async db => {
    const now = new Date().toISOString()
    const balance = input.balance || 0

    const result = await db.runAsync(
      `INSERT INTO students (barcode, name, balance, is_active, created_at, updated_at)
       VALUES (?, ?, ?, 1, ?, ?)`,
      [input.barcode, input.name, balance, now, now]
    )

    const student = await db.getFirstAsync<Student>(
      'SELECT * FROM students WHERE id = ?',
      [result.lastInsertRowId]
    )

    if (!student) throw new Error('Failed to create student')
    return student
  })
}

export async function updateStudent(id: number, updates: Partial<Omit<Student, 'id' | 'created_at'>>): Promise<Student> {
  return withDatabase(async db => {
    const now = new Date().toISOString()
    const allowedFields = ['barcode', 'name', 'balance', 'is_active']
    const fields = Object.keys(updates).filter(k => allowedFields.includes(k))

    if (fields.length === 0) {
      const student = await getStudentById(id)
      if (!student) throw new Error('Student not found')
      return student
    }

    const setClause = fields.map(f => `${f} = ?`).join(', ')
    const values = fields.map(f => updates[f as keyof typeof updates])

    await db.runAsync(
      `UPDATE students SET ${setClause}, updated_at = ? WHERE id = ?`,
      [...values, now, id]
    )

    const student = await db.getFirstAsync<Student>(
      'SELECT * FROM students WHERE id = ?',
      [id]
    )

    if (!student) throw new Error('Student not found after update')
    return student
  })
}

export async function archiveStudent(id: number): Promise<Student> {
  return updateStudent(id, { is_active: false })
}

export async function restoreStudent(id: number): Promise<Student> {
  return updateStudent(id, { is_active: true })
}

export async function updateStudentBalance(id: number, newBalance: number, reason: string, operationType: 'add' | 'set' | 'subtract'): Promise<{ student: Student; history: BalanceHistory }> {
  return withDatabase(async db => {
    const student = await getStudentById(id)
    if (!student) throw new Error('Student not found')

    const oldBalance = student.balance
    const changeAmount = operationType === 'set' ? (newBalance - oldBalance) : newBalance

    // Update student balance
    const updatedStudent = await updateStudent(id, { balance: newBalance })

    // Record in balance history
    const now = new Date().toISOString()
    const historyResult = await db.runAsync(
      `INSERT INTO balance_history (student_id, student_barcode, student_name, old_balance, new_balance, change_amount, operation_type, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, student.barcode, student.name, oldBalance, newBalance, changeAmount, operationType, reason, now]
    )

    const history = await db.getFirstAsync<BalanceHistory>(
      'SELECT * FROM balance_history WHERE id = ?',
      [historyResult.lastInsertRowId]
    )

    if (!history) throw new Error('Failed to record balance history')

    return { student: updatedStudent, history }
  })
}

// ==================== PRODUCTS ====================

export async function getAllProducts(): Promise<Product[]> {
  return withDatabase(async db => {
    const result = await db.getAllAsync<Product>(
      'SELECT * FROM products ORDER BY name ASC'
    )
    return result || []
  })
}

export async function getActiveProducts(): Promise<Product[]> {
  return withDatabase(async db => {
    const result = await db.getAllAsync<Product>(
      'SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC'
    )
    return result || []
  })
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  return withDatabase(async db => {
    const result = await db.getFirstAsync<Product>(
      'SELECT * FROM products WHERE barcode = ?',
      [barcode]
    )
    return result || null
  })
}

export async function getProductById(id: number): Promise<Product | null> {
  return withDatabase(async db => {
    const result = await db.getFirstAsync<Product>(
      'SELECT * FROM products WHERE id = ?',
      [id]
    )
    return result || null
  })
}

export async function createProduct(input: {
  barcode: string
  name: string
  point_cost: number
  quantity?: number
  low_stock_threshold?: number
}): Promise<Product> {
  return withDatabase(async db => {
    const now = new Date().toISOString()

    const result = await db.runAsync(
      `INSERT INTO products (barcode, name, point_cost, quantity, low_stock_threshold, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        input.barcode,
        input.name,
        input.point_cost,
        input.quantity || null,
        input.low_stock_threshold || null,
        now,
        now,
      ]
    )

    const product = await db.getFirstAsync<Product>(
      'SELECT * FROM products WHERE id = ?',
      [result.lastInsertRowId]
    )

    if (!product) throw new Error('Failed to create product')
    return product
  })
}

export async function updateProduct(id: number, updates: Partial<Omit<Product, 'id' | 'created_at'>>): Promise<Product> {
  return withDatabase(async db => {
    const now = new Date().toISOString()
    const allowedFields = ['barcode', 'name', 'point_cost', 'quantity', 'low_stock_threshold', 'is_active']
    const fields = Object.keys(updates).filter(k => allowedFields.includes(k))

    if (fields.length === 0) {
      const product = await getProductById(id)
      if (!product) throw new Error('Product not found')
      return product
    }

    const setClause = fields.map(f => `${f} = ?`).join(', ')
    const values = fields.map(f => updates[f as keyof typeof updates])

    await db.runAsync(
      `UPDATE products SET ${setClause}, updated_at = ? WHERE id = ?`,
      [...values, now, id]
    )

    const product = await db.getFirstAsync<Product>(
      'SELECT * FROM products WHERE id = ?',
      [id]
    )

    if (!product) throw new Error('Product not found after update')
    return product
  })
}

export async function archiveProduct(id: number): Promise<Product> {
  return updateProduct(id, { is_active: false })
}

export async function restoreProduct(id: number): Promise<Product> {
  return updateProduct(id, { is_active: true })
}

// ==================== PURCHASES ====================

export async function recordPurchase(input: {
  student_id: number
  product_id: number
  student_barcode: string
  student_name: string
  product_name: string
  point_cost: number
  points_after: number
}): Promise<Purchase> {
  return withDatabase(async db => {
    const now = new Date().toISOString()

    const result = await db.runAsync(
      `INSERT INTO purchases (student_id, product_id, student_barcode, student_name, product_name, point_cost, points_after, is_reversed, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        input.student_id,
        input.product_id,
        input.student_barcode,
        input.student_name,
        input.product_name,
        input.point_cost,
        input.points_after,
        now,
      ]
    )

    const purchase = await db.getFirstAsync<Purchase>(
      'SELECT * FROM purchases WHERE id = ?',
      [result.lastInsertRowId]
    )

    if (!purchase) throw new Error('Failed to record purchase')
    return purchase
  })
}

export async function getPurchaseHistory(limit: number = 50, offset: number = 0): Promise<Purchase[]> {
  return withDatabase(async db => {
    const result = await db.getAllAsync<Purchase>(
      'SELECT * FROM purchases ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    )
    return result || []
  })
}

export async function getStudentPurchaseHistory(studentId: number, limit: number = 50): Promise<Purchase[]> {
  return withDatabase(async db => {
    const result = await db.getAllAsync<Purchase>(
      'SELECT * FROM purchases WHERE student_id = ? ORDER BY created_at DESC LIMIT ?',
      [studentId, limit]
    )
    return result || []
  })
}

export async function reversePurchase(purchaseId: number, reason: string): Promise<Purchase> {
  return withDatabase(async db => {
    const now = new Date().toISOString()
    const purchase = await db.getFirstAsync<Purchase>(
      'SELECT * FROM purchases WHERE id = ?',
      [purchaseId]
    )

    if (!purchase) throw new Error('Purchase not found')
    if (purchase.is_reversed) throw new Error('Purchase already reversed')

    // Mark as reversed
    await db.runAsync(
      'UPDATE purchases SET is_reversed = 1, reversed_at = ?, reverse_reason = ? WHERE id = ?',
      [now, reason, purchaseId]
    )

    // Restore student balance
    const student = await getStudentById(purchase.student_id)
    if (!student) throw new Error('Student not found')

    const restoredBalance = student.balance + purchase.point_cost
    await updateStudent(purchase.student_id, { balance: restoredBalance })

    // Record in balance history
    await db.runAsync(
      `INSERT INTO balance_history (student_id, student_barcode, student_name, old_balance, new_balance, change_amount, operation_type, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'reversal', ?, ?)`,
      [
        purchase.student_id,
        purchase.student_barcode,
        purchase.student_name,
        student.balance,
        restoredBalance,
        purchase.point_cost,
        `Reversal: ${reason}`,
        now,
      ]
    )

    const updatedPurchase = await db.getFirstAsync<Purchase>(
      'SELECT * FROM purchases WHERE id = ?',
      [purchaseId]
    )

    if (!updatedPurchase) throw new Error('Failed to reverse purchase')
    return updatedPurchase
  })
}

// ==================== BALANCE HISTORY ====================

export async function getBalanceHistory(studentId: number, limit: number = 100): Promise<BalanceHistory[]> {
  return withDatabase(async db => {
    const result = await db.getAllAsync<BalanceHistory>(
      'SELECT * FROM balance_history WHERE student_id = ? ORDER BY created_at DESC LIMIT ?',
      [studentId, limit]
    )
    return result || []
  })
}

// ==================== ADMIN CONFIG ====================

export async function getAdminConfig(key: string): Promise<string | null> {
  return withDatabase(async db => {
    const result = await db.getFirstAsync<AdminConfig>(
      'SELECT value FROM admin_config WHERE key = ?',
      [key]
    )
    return result?.value || null
  })
}

export async function setAdminConfig(key: string, value: string): Promise<void> {
  return withDatabase(async db => {
    const now = new Date().toISOString()
    await db.runAsync(
      `INSERT OR REPLACE INTO admin_config (key, value, updated_at) VALUES (?, ?, ?)`,
      [key, value, now]
    )
  })
}
