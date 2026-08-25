export type ArchivableRecord = {
  id?: number | string
  archivedAt?: string | null
  archivedBy?: string | null
  archiveReason?: string | null
  deletedAt?: string | null
  [key: string]: unknown
}

export function isArchivedRecord(record: ArchivableRecord) {
  return Boolean(record.archivedAt) && !record.deletedAt
}

export function isDeletedRecord(record: ArchivableRecord) {
  return Boolean(record.deletedAt)
}

export function archiveRecord<T extends ArchivableRecord>(record: T, archivedBy = 'Staff', now = new Date().toISOString()): T {
  return {
    ...record,
    archivedAt: now,
    archivedBy,
  }
}

export function restoreArchivedRecord<T extends ArchivableRecord>(record: T): T {
  const { archivedAt, archivedBy, archiveReason, ...restored } = record
  void archivedAt
  void archivedBy
  void archiveReason
  return restored as T
}

export function permanentlyDeleteRecord<T extends ArchivableRecord>(record: T, now = new Date().toISOString()): T {
  return {
    ...record,
    deletedAt: now,
  }
}