import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { getDatabase } from './database'
import type { Student, Product, Purchase, BalanceHistory } from './schema'
import {
  getAllStudents,
  getAllProducts,
  getPurchaseHistory,
  getBalanceHistory,
} from './queries'

export interface BackupData {
  version: string
  exportedAt: string
  students: Student[]
  products: Product[]
  purchases: Purchase[]
  balanceHistory: BalanceHistory[]
}

const BACKUP_FILENAME = 'TokenRegister_Backup.json'

function buildTxId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function createBackup(): Promise<string> {
  try {
    const students = await getAllStudents()
    const products = await getAllProducts()
    const purchases = await getPurchaseHistory(10000)
    
    // Get balance history for all students
    let balanceHistory: BalanceHistory[] = []
    for (const student of students) {
      const history = await getBalanceHistory(student.id, 10000)
      balanceHistory = balanceHistory.concat(history)
    }

    const backup: BackupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      students,
      products,
      purchases,
      balanceHistory,
    }

    const backupJson = JSON.stringify(backup, null, 2)
    const backupPath = `${FileSystem.documentDirectory}${BACKUP_FILENAME}`

    await FileSystem.writeAsStringAsync(backupPath, backupJson, {
      encoding: FileSystem.EncodingType.UTF8,
    })

    console.log(`Backup created at: ${backupPath}`)
    return backupPath
  } catch (error) {
    console.error('Backup creation error:', error)
    throw error
  }
}

export async function shareBackup(): Promise<void> {
  try {
    const backupPath = await createBackup()
    
    if (!(await Sharing.isAvailableAsync())) {
      throw new Error('Sharing is not available on this device')
    }

    await Sharing.shareAsync(backupPath, {
      mimeType: 'application/json',
      dialogTitle: 'Save Token Register Backup',
    })
  } catch (error) {
    console.error('Share backup error:', error)
    throw error
  }
}

export async function restoreFromBackup(backupPath: string): Promise<{ success: boolean; message: string }> {
  try {
    const backupContent = await FileSystem.readAsStringAsync(backupPath, {
      encoding: FileSystem.EncodingType.UTF8,
    })

    const backup: BackupData = JSON.parse(backupContent)

    // Validate backup structure
    if (!backup.version || !backup.students || !backup.products) {
      throw new Error('Invalid backup file format')
    }

    const db = getDatabase()

    // Clear existing data
    await db.runAsync('DELETE FROM purchases')
    await db.runAsync('DELETE FROM balance_history')
    await db.runAsync('DELETE FROM students')
    await db.runAsync('DELETE FROM products')

    // Restore students
    for (const student of backup.students) {
      await db.runAsync(
        `INSERT INTO students (id, barcode, name, balance, is_vip, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          student.id,
          student.barcode,
          student.name,
          student.balance,
          student.is_vip ? 1 : 0,
          student.is_active ? 1 : 0,
          student.created_at,
          student.updated_at,
        ]
      )
    }

    // Restore products
    for (const product of backup.products) {
      await db.runAsync(
        `INSERT INTO products (id, barcode, name, point_cost, quantity, low_stock_threshold, vip_only, image_url, emoji, category, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.id,
          product.barcode,
          product.name,
          product.point_cost,
          product.quantity || null,
          product.low_stock_threshold || null,
          product.vip_only ? 1 : 0,
          product.image_url || '',
          product.emoji || '',
          product.category || 'nosh',
          product.is_active ? 1 : 0,
          product.created_at,
          product.updated_at,
        ]
      )
    }

    // Restore purchases
    for (const purchase of backup.purchases) {
      await db.runAsync(
        `INSERT INTO purchases (id, transaction_uuid, source_device_id, student_id, product_id, student_barcode, student_name, product_name, point_cost, points_after, is_reversed, reversed_at, reverse_reason, synced_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          purchase.id,
          purchase.transaction_uuid || buildTxId('restore-purchase'),
          purchase.source_device_id || 'restore-file',
          purchase.student_id,
          purchase.product_id,
          purchase.student_barcode,
          purchase.student_name,
          purchase.product_name,
          purchase.point_cost,
          purchase.points_after,
          purchase.is_reversed ? 1 : 0,
          purchase.reversed_at || null,
          purchase.reverse_reason || null,
          purchase.synced_at || null,
          purchase.created_at,
        ]
      )
    }

    // Restore balance history
    for (const history of backup.balanceHistory) {
      await db.runAsync(
        `INSERT INTO balance_history (id, transaction_uuid, source_device_id, source_ref, student_id, student_barcode, student_name, old_balance, new_balance, change_amount, operation_type, reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          history.id,
          history.transaction_uuid || buildTxId('restore-balance'),
          history.source_device_id || 'restore-file',
          history.source_ref || null,
          history.student_id,
          history.student_barcode,
          history.student_name,
          history.old_balance,
          history.new_balance,
          history.change_amount,
          history.operation_type,
          history.reason,
          history.created_at,
        ]
      )
    }

    return {
      success: true,
      message: `Restored ${backup.students.length} students and ${backup.products.length} products`,
    }
  } catch (error) {
    console.error('Restore backup error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to restore backup',
    }
  }
}

export async function getBackupDirectory(): Promise<string> {
  return FileSystem.documentDirectory || ''
}

export async function listBackupFiles(): Promise<string[]> {
  try {
    const dir = FileSystem.documentDirectory
    if (!dir) return []
    const files = await FileSystem.readDirectoryAsync(dir)
    return files.filter(f => f.endsWith('.json') && f.includes('Backup'))
  } catch (error) {
    console.error('Error listing backup files:', error)
    return []
  }
}
