import { supabase } from '../supabaseClient'

export type StoreItem = {
  id: number
  name: string
  category: string
  cost: number
  emoji: string
  vip: boolean
  stock: number
  lowStockAt: number
  imageUrl: string
  active: boolean
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

export type StoreRedemption = {
  id: number
  createdAt: string
  studentId: number | null
  studentName: string
  itemId: number | null
  itemName: string
  cost: number
  staffName: string
  source: string
  metadata: Record<string, unknown>
  pointsEventId: number | null
  reversedAt: string | null
  reversedBy: string | null
  reversalEventId: number | null
}

type StoreItemRow = {
  id: number
  name: string
  category: string
  cost: number
  emoji: string
  vip: boolean
  stock: number
  low_stock_at: number
  image_url: string
  active: boolean
  updated_by: string | null
  created_at: string
  updated_at: string
}

type StoreRedemptionRow = {
  id: number
  created_at: string
  student_id: number | null
  student_name: string
  item_id: number | null
  item_name: string
  cost: number
  staff_name: string
  source: string
  metadata: Record<string, unknown> | null
  points_event_id: number | null
  reversed_at: string | null
  reversed_by: string | null
  reversal_event_id: number | null
}

export type RedeemStorePurchaseTxInput = {
  studentId: number
  itemId: number
  staffName: string
  staffRole?: string
  idempotencyKey: string
  source?: string
  metadata?: Record<string, unknown>
  reason?: string
  note?: string | null
  sourcePage?: string | null
  sourceContext?: string | null
}

export type RedeemStorePurchaseTxResult = {
  status: string
  redemptionId: number
  pointsEventId: number
  nextPoints: number
  nextStock: number
  studentId: number
  itemId: number
}

export type ReverseStorePurchaseTxResult = {
  status: string
  redemptionId: number
  targetEventId: number
  reversalEventId: number
  studentId: number
  itemId: number
  nextPoints: number
  nextStock: number
}

export function formatSupabaseError(error: unknown): string {
  const fallback = 'Unable to complete store redemption.'

  if (typeof error !== 'object' || error === null) {
    return fallback
  }

  const typedError = error as Record<string, unknown>
  const parts: string[] = []

  const message = String(typedError.message || '').trim()
  const details = String(typedError.details || '').trim()
  const hint = String(typedError.hint || '').trim()
  const code = String(typedError.code || '').trim()

  if (message) parts.push(message)
  if (details) parts.push(details)
  if (hint) parts.push(hint)
  if (code) parts.push(`Code: ${code}`)

  return parts.length > 0 ? parts.join(' ') : fallback
}

function toRequiredNumberField(
  payload: unknown,
  field: string,
  rpcName: string,
): number {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error(`Contract error from ${rpcName}: response payload is missing.`)
  }

  const value = (payload as Record<string, unknown>)[field]
  const numeric = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(numeric)) {
    throw new Error(`Contract error from ${rpcName}: required field ${field} is missing or invalid.`)
  }

  return numeric
}

function toRequiredStringField(
  payload: unknown,
  field: string,
  rpcName: string,
): string {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error(`Contract error from ${rpcName}: response payload is missing.`)
  }

  const value = String((payload as Record<string, unknown>)[field] || '').trim()
  if (!value) {
    throw new Error(`Contract error from ${rpcName}: required field ${field} is missing or invalid.`)
  }

  return value
}

export type CreateStoreItemInput = {
  name: string
  category?: string
  cost?: number
  emoji?: string
  vip?: boolean
  stock?: number
  lowStockAt?: number
  imageUrl?: string
  updatedBy?: string | null
}

export type CreateStoreRedemptionInput = {
  studentId?: number | null
  studentName: string
  itemId?: number | null
  itemName: string
  cost: number
  staffName: string
  source?: string
  metadata?: Record<string, unknown>
}

export function normalizeStoreItemInput(input: Partial<CreateStoreItemInput> & Partial<StoreItem>): {
  name: string
  category: string
  cost: number
  emoji: string
  vip: boolean
  stock: number
  lowStockAt: number
  imageUrl: string
  updatedBy: string | null
} {
  const name = String(input.name || '').trim()
  const category = String(input.category || 'nosh').trim() || 'nosh'
  const cost = Math.max(0, Number(input.cost || 0))
  const emoji = String(input.emoji || '').trim() || '▪️'
  const vip = !!input.vip
  const stock = Math.max(0, Number(input.stock || 0))
  const lowStockAt = Math.max(0, Number(input.lowStockAt || 0))
  const imageUrl = String(input.imageUrl || '')
  const updatedBy = input.updatedBy ?? null

  return {
    name,
    category,
    cost,
    emoji,
    vip,
    stock,
    lowStockAt,
    imageUrl,
    updatedBy,
  }
}

export function normalizeStoreRedemptionInput(input: Partial<CreateStoreRedemptionInput>): {
  studentId: number | null
  studentName: string
  itemId: number | null
  itemName: string
  cost: number
  staffName: string
  source: string
  metadata: Record<string, unknown>
} {
  return {
    studentId: input.studentId ?? null,
    studentName: String(input.studentName || '').trim(),
    itemId: input.itemId ?? null,
    itemName: String(input.itemName || '').trim(),
    cost: Math.max(0, Number(input.cost || 0)),
    staffName: String(input.staffName || '').trim(),
    source: String(input.source || 'token-store').trim() || 'token-store',
    metadata: input.metadata || {},
  }
}

function toStoreItem(row: StoreItemRow): StoreItem {
  return {
    id: Number(row.id),
    name: row.name,
    category: row.category,
    cost: Number(row.cost || 0),
    emoji: row.emoji || '',
    vip: !!row.vip,
    stock: Number(row.stock || 0),
    lowStockAt: Number(row.low_stock_at || 0),
    imageUrl: row.image_url || '',
    active: !!row.active,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toStoreRedemption(row: StoreRedemptionRow): StoreRedemption {
  return {
    id: Number(row.id),
    createdAt: row.created_at,
    studentId: row.student_id === null ? null : Number(row.student_id),
    studentName: row.student_name,
    itemId: row.item_id === null ? null : Number(row.item_id),
    itemName: row.item_name,
    cost: Number(row.cost || 0),
    staffName: row.staff_name,
    source: row.source,
    metadata: row.metadata || {},
    pointsEventId: row.points_event_id === null ? null : Number(row.points_event_id),
    reversedAt: row.reversed_at || null,
    reversedBy: row.reversed_by || null,
    reversalEventId: row.reversal_event_id === null ? null : Number(row.reversal_event_id),
  }
}

export async function listStoreItems(): Promise<StoreItem[]> {
  const { data, error } = await supabase
    .from('store_items')
    .select('*')
    .eq('active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return ((data || []) as StoreItemRow[]).map(toStoreItem)
}

export async function seedStoreItems(items: Array<Partial<StoreItem>>): Promise<void> {
  const { data: existingRows, error: existingError } = await supabase
    .from('store_items')
    .select('id')
    .limit(1)

  if (existingError) throw existingError
  if ((existingRows || []).length > 0) return

  const payload = items.map(item => {
    const normalized = normalizeStoreItemInput(item)
    return {
      id: item.id,
      name: normalized.name,
      category: normalized.category,
      cost: normalized.cost,
      emoji: normalized.emoji,
      vip: normalized.vip,
      stock: normalized.stock,
      low_stock_at: normalized.lowStockAt,
      image_url: normalized.imageUrl,
      active: true,
      updated_at: new Date().toISOString(),
    }
  })

  if (payload.length === 0) return

  const { error: insertError } = await supabase
    .from('store_items')
    .upsert(payload, { onConflict: 'id' })

  if (insertError) throw insertError
}

export async function updateStoreItem(item: StoreItem, updatedBy?: string): Promise<StoreItem> {
  const normalized = normalizeStoreItemInput({ ...item, updatedBy })
  const payload = {
    id: Number(item.id),
    name: normalized.name,
    category: normalized.category,
    cost: normalized.cost,
    emoji: normalized.emoji,
    vip: normalized.vip,
    stock: normalized.stock,
    low_stock_at: normalized.lowStockAt,
    image_url: normalized.imageUrl,
    active: item.active !== false,
    updated_by: normalized.updatedBy,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('store_items')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) throw error
  return toStoreItem(data as StoreItemRow)
}

export async function createStoreItem(input: CreateStoreItemInput, updatedBy?: string): Promise<StoreItem> {
  const normalized = normalizeStoreItemInput({ ...input, updatedBy })
  const payload = {
    name: normalized.name,
    category: normalized.category,
    cost: normalized.cost,
    emoji: normalized.emoji,
    vip: normalized.vip,
    stock: normalized.stock,
    low_stock_at: normalized.lowStockAt,
    image_url: normalized.imageUrl,
    active: true,
    updated_by: normalized.updatedBy,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('store_items')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return toStoreItem(data as StoreItemRow)
}

export async function setStoreItemActive(
  id: number,
  active: boolean,
  updatedBy?: string,
): Promise<StoreItem> {
  const { data, error } = await supabase
    .from('store_items')
    .update({
      active,
      updated_by: updatedBy || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', Number(id))
    .select('*')
    .single()

  if (error) throw error
  return toStoreItem(data as StoreItemRow)
}

export async function adjustStoreItemStockBy(
  id: number,
  delta: number,
  updatedBy?: string,
): Promise<StoreItem> {
  const { data: row, error: readError } = await supabase
    .from('store_items')
    .select('*')
    .eq('id', Number(id))
    .eq('active', true)
    .single()

  if (readError) throw readError

  const current = toStoreItem(row as StoreItemRow)
  const nextStock = Number(current.stock || 0) + Number(delta || 0)

  if (nextStock < 0) {
    throw new Error(`${current.name} is out of stock.`)
  }

  const { data: updated, error: updateError } = await supabase
    .from('store_items')
    .update({
      stock: nextStock,
      updated_by: updatedBy || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', Number(id))
    .eq('stock', Number(current.stock || 0))
    .select('*')
    .single()

  if (updateError) throw updateError

  return toStoreItem(updated as StoreItemRow)
}

export async function listStoreRedemptions(limit = 25): Promise<StoreRedemption[]> {
  const { data, error } = await supabase
    .from('store_redemptions')
    .select('*')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)

  if (error) throw error
  return ((data || []) as StoreRedemptionRow[]).map(toStoreRedemption)
}

export async function createStoreRedemption(
  input: CreateStoreRedemptionInput,
): Promise<StoreRedemption> {
  const normalized = normalizeStoreRedemptionInput(input)
  const { data, error } = await supabase
    .from('store_redemptions')
    .insert({
      student_id: normalized.studentId,
      student_name: normalized.studentName,
      item_id: normalized.itemId,
      item_name: normalized.itemName,
      cost: normalized.cost,
      staff_name: normalized.staffName,
      source: normalized.source,
      metadata: normalized.metadata,
    })
    .select('*')
    .single()

  if (error) throw error
  return toStoreRedemption(data as StoreRedemptionRow)
}

export async function deleteStoreRedemption(id: number): Promise<void> {
  const { error } = await supabase
    .from('store_redemptions')
    .delete()
    .eq('id', Number(id))

  if (error) throw error
}

export async function redeemStorePurchaseTx(
  input: RedeemStorePurchaseTxInput,
): Promise<RedeemStorePurchaseTxResult> {
  const rpcName = 'redeem_store_purchase_tx'
  const { data, error } = await supabase.rpc('redeem_store_purchase_tx', {
    p_student_id: Number(input.studentId),
    p_item_id: Number(input.itemId),
    p_staff_name: input.staffName,
    p_staff_role: input.staffRole || 'staff',
    p_idempotency_key: input.idempotencyKey,
    p_source: input.source || 'token-store',
    p_metadata: input.metadata || {},
    p_reason: input.reason || null,
    p_note: input.note || null,
    p_source_page: input.sourcePage || 'store',
    p_source_context: input.sourceContext || 'token-store-redeem',
  })

  if (error) throw error

  return {
    status: toRequiredStringField(data, 'status', rpcName),
    redemptionId: toRequiredNumberField(data, 'redemption_id', rpcName),
    pointsEventId: toRequiredNumberField(data, 'points_event_id', rpcName),
    nextPoints: toRequiredNumberField(data, 'next_points', rpcName),
    nextStock: toRequiredNumberField(data, 'next_stock', rpcName),
    studentId: toRequiredNumberField(data, 'student_id', rpcName),
    itemId: toRequiredNumberField(data, 'item_id', rpcName),
  }
}

export async function reverseStorePurchaseTx(input: {
  targetPointsEventId: number
  staffName: string
  staffRole?: string
  note?: string | null
  sourceContext?: string | null
}): Promise<ReverseStorePurchaseTxResult> {
  const rpcName = 'reverse_store_purchase_tx'
  const { data, error } = await supabase.rpc('reverse_store_purchase_tx', {
    p_target_points_event_id: Number(input.targetPointsEventId),
    p_staff_name: input.staffName,
    p_staff_role: input.staffRole || 'staff',
    p_note: input.note || null,
    p_source_context: input.sourceContext || 'history-undo',
  })

  if (error) throw error

  return {
    status: toRequiredStringField(data, 'status', rpcName),
    redemptionId: toRequiredNumberField(data, 'redemption_id', rpcName),
    targetEventId: toRequiredNumberField(data, 'target_event_id', rpcName),
    reversalEventId: toRequiredNumberField(data, 'reversal_event_id', rpcName),
    studentId: toRequiredNumberField(data, 'student_id', rpcName),
    itemId: toRequiredNumberField(data, 'item_id', rpcName),
    nextPoints: toRequiredNumberField(data, 'next_points', rpcName),
    nextStock: toRequiredNumberField(data, 'next_stock', rpcName),
  }
}

export type StoreSyncUiState = {
  label: string
  color: string
  background: string
  isReady: boolean
  isPending: boolean
}

export function getStoreSyncUiState(input: {
  persistenceReady: boolean
  pendingSync?: boolean
  syncState?: string
}): StoreSyncUiState {
  const persistenceReady = !!input.persistenceReady
  const pendingSync = !!input.pendingSync
  const syncState = input.syncState || (persistenceReady ? 'ready' : 'error')

  if (pendingSync) {
    return {
      label: 'Pending sync',
      color: '#9a6a2a',
      background: '#f7f1e8',
      isReady: false,
      isPending: true,
    }
  }

  if (syncState === 'loading') {
    return {
      label: 'Checking...',
      color: '#7c2d12',
      background: '#ffedd5',
      isReady: false,
      isPending: true,
    }
  }

  if (syncState === 'error') {
    return {
      label: 'Sync error',
      color: '#9f1239',
      background: '#ffe4e6',
      isReady: false,
      isPending: false,
    }
  }

  if (persistenceReady) {
    return {
      label: 'Connected',
      color: '#166534',
      background: '#dcfce7',
      isReady: true,
      isPending: false,
    }
  }

  return {
    label: 'Not connected',
    color: '#9f1239',
    background: '#ffe4e6',
    isReady: false,
    isPending: false,
  }
}
