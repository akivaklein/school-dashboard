import * as SQLite from 'expo-sqlite'
import { DATABASE_NAME, SQL_STATEMENTS } from './schema'

let db: SQLite.SQLiteDatabase | null = null

export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
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
