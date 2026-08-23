import { supabase } from './supabaseClient'
import type { StoreProduct, StoreRedemption, StoreStudent } from './types'

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

export async function listStudents(): Promise<StoreStudent[]> {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, token_balance, points, is_vip, is_active')
    .order('name', { ascending: true })

  if (error) throw error

  return (data || []).map((row: Record<string, unknown>) => ({
    id: toNumber(row.id),
    name: String(row.name || ''),
    balance: toNumber(row.token_balance ?? row.points ?? 0),
    isVip: Boolean(row.is_vip),
    isActive: row.is_active !== false,
  })).filter(student => student.isActive)
}

export async function listProducts(): Promise<StoreProduct[]> {
  const { data, error } = await supabase
    .from('store_items')
    .select('id, name, sku, barcode, category, cost, stock, low_stock_at, vip, image_url, emoji, active')
    .order('name', { ascending: true })

  if (error) throw error

  return (data || []).map((row: Record<string, unknown>) => ({
    id: toNumber(row.id),
    name: String(row.name || ''),
    sku: String(row.sku || ''),
    barcode: String(row.barcode || ''),
    category: String(row.category || 'nosh'),
    cost: toNumber(row.cost),
    stock: toNumber(row.stock),
    lowStockAt: toNumber(row.low_stock_at),
    vipOnly: Boolean(row.vip),
    imageUrl: String(row.image_url || ''),
    emoji: String(row.emoji || ''),
    active: row.active !== false,
  })).filter(product => product.active)
}

export async function listRedemptions(limit = 120): Promise<StoreRedemption[]> {
  const { data, error } = await supabase
    .from('store_redemptions')
    .select('id, created_at, student_id, student_name, item_id, item_name, cost, points_event_id, reversed_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data || []).map((row: Record<string, unknown>) => ({
    id: toNumber(row.id),
    createdAt: String(row.created_at || new Date().toISOString()),
    studentId: row.student_id === null ? null : toNumber(row.student_id),
    studentName: String(row.student_name || ''),
    itemId: row.item_id === null ? null : toNumber(row.item_id),
    itemName: String(row.item_name || ''),
    cost: toNumber(row.cost),
    pointsEventId: row.points_event_id === null ? null : toNumber(row.points_event_id),
    reversedAt: row.reversed_at ? String(row.reversed_at) : null,
  }))
}

export async function redeemStorePurchaseTx(input: {
  studentId: number
  itemId: number
  staffName: string
  staffRole: string
  idempotencyKey: string
}) {
  const { data, error } = await supabase.rpc('redeem_store_purchase_tx', {
    p_student_id: input.studentId,
    p_item_id: input.itemId,
    p_staff_name: input.staffName,
    p_staff_role: input.staffRole,
    p_idempotency_key: input.idempotencyKey,
    p_source: 'token-store-web',
    p_reason: 'Store purchase',
    p_note: 'Web checkout',
    p_source_page: 'store',
    p_source_context: 'token-store-web',
    p_metadata: {
      source: 'token-store-web',
    },
  })

  if (error) throw error
  return data
}

export async function reverseStorePurchaseTx(input: {
  pointsEventId: number
  staffName: string
  staffRole: string
}) {
  const { data, error } = await supabase.rpc('reverse_store_purchase_tx', {
    p_target_points_event_id: input.pointsEventId,
    p_staff_name: input.staffName,
    p_staff_role: input.staffRole,
    p_note: 'Web return/exchange',
    p_source_context: 'token-store-web',
  })

  if (error) throw error
  return data
}
