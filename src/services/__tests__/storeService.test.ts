import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getStoreSyncUiState,
  formatSupabaseError,
  normalizeStoreItemInput,
  normalizeStoreRedemptionInput,
  redeemStorePurchaseTx,
  reverseStorePurchaseTx,
  shouldUseDemoStoreActivity,
  findStoreItemByIdentifier,
} from '../storeService'
import { supabase } from '../../supabaseClient'

describe('store RPC wrapper contract validation', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('throws a contract error when redeem_store_purchase_tx omits required fields', async () => {
    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: {
        status: 'created',
        redemption_id: 11,
        points_event_id: 99,
        next_points: 21,
      },
      error: null,
    } as never)

    await expect(
      redeemStorePurchaseTx({
        studentId: 1,
        itemId: 2,
        staffName: 'Tester',
        idempotencyKey: 'test-key',
      })
    ).rejects.toThrow('Contract error from redeem_store_purchase_tx: required field next_stock is missing or invalid.')
  })

  it('throws a contract error when reverse_store_purchase_tx has invalid numeric fields', async () => {
    vi.spyOn(supabase, 'rpc').mockResolvedValue({
      data: {
        status: 'reversed',
        redemption_id: 44,
        target_event_id: 12,
        reversal_event_id: 66,
        student_id: 7,
        item_id: 8,
        next_points: 'NaN',
        next_stock: 3,
      },
      error: null,
    } as never)

    await expect(
      reverseStorePurchaseTx({
        targetPointsEventId: 12,
        staffName: 'Tester',
      })
    ).rejects.toThrow('Contract error from reverse_store_purchase_tx: required field next_points is missing or invalid.')
  })
})

describe('formatSupabaseError', () => {
  it('joins message, details, hint, and code in priority order', () => {
    expect(
      formatSupabaseError({
        message: 'Store item 99999 was not found.',
        details: 'Row missing in store_items.',
        hint: 'Check the item id.',
        code: 'P0001',
      })
    ).toBe('Store item 99999 was not found. Row missing in store_items. Check the item id. Code: P0001')
  })

  it('falls back to the generic message when no structured fields exist', () => {
    expect(formatSupabaseError({})).toBe('Unable to complete store redemption.')
  })
})

describe('normalizeStoreItemInput', () => {
  it('trims names, clamps numeric values, and defaults empty category values', () => {
    expect(
      normalizeStoreItemInput({
        name: '  Gummies  ',
        category: '   candy   ',
        cost: -5,
        stock: -1,
        lowStockAt: -3,
        emoji: '   ',
        vip: true,
      })
    ).toMatchObject({
      name: 'Gummies',
      category: 'candy',
      cost: 0,
      stock: 0,
      lowStockAt: 0,
      emoji: '▪️',
      vip: true,
    })
  })

  it('coerces invalid numeric input to zero for new store items', () => {
    expect(
      normalizeStoreItemInput({
        name: '  Juice  ',
        category: 'drinks',
        cost: 'abc',
        stock: 'not-a-number',
        lowStockAt: '',
        emoji: '   ',
        vip: false,
      } as never)
    ).toMatchObject({
      name: 'Juice',
      category: 'drinks',
      cost: 0,
      stock: 0,
      lowStockAt: 0,
      emoji: '▪️',
      vip: false,
    })
  })
})

describe('findStoreItemByIdentifier', () => {
  it('finds an item by exact barcode or sku lookup', () => {
    const items = [
      { id: 1, name: 'Water Bottle', sku: 'WB-1', barcode: '123456', cost: 8, stock: 2, lowStockAt: 1, category: 'drinks', vip: false, emoji: '💧', imageUrl: '', active: true },
      { id: 2, name: 'Pretzel Bag', sku: 'PB-2', barcode: '654321', cost: 12, stock: 4, lowStockAt: 2, category: 'snacks', vip: false, emoji: '🥨', imageUrl: '', active: true },
    ] as never[]

    expect(findStoreItemByIdentifier(items, '654321')).toMatchObject({ id: 2 })
    expect(findStoreItemByIdentifier(items, 'WB-1')).toMatchObject({ id: 1 })
  })
})

describe('normalizeStoreRedemptionInput', () => {
  it('trims names and provides a default source for token-store redemptions', () => {
    expect(
      normalizeStoreRedemptionInput({
        studentName: '  Avi  ',
        itemName: '   Candy   ',
        cost: '12',
      } as never)
    ).toMatchObject({
      studentName: 'Avi',
      itemName: 'Candy',
      cost: 12,
      source: 'token-store',
    })
  })
})

describe('shouldUseDemoStoreActivity', () => {
  it('uses demo activity only when there are no persisted items or redemptions', () => {
    expect(shouldUseDemoStoreActivity({ hasPersistedItems: false, hasPersistedRedemptions: false })).toBe(true)
    expect(shouldUseDemoStoreActivity({ hasPersistedItems: true, hasPersistedRedemptions: false })).toBe(false)
    expect(shouldUseDemoStoreActivity({ hasPersistedItems: false, hasPersistedRedemptions: true })).toBe(false)
  })
})

describe('getStoreSyncUiState', () => {
  it('reports pending sync when local changes are waiting to be sent', () => {
    expect(
      getStoreSyncUiState({ persistenceReady: false, pendingSync: true, syncState: 'error' })
    ).toMatchObject({
      label: 'Pending sync',
      color: '#9a6a2a',
      background: '#f7f1e8',
      isPending: true,
    })
  })

  it('reports connected when the remote store is ready', () => {
    expect(
      getStoreSyncUiState({ persistenceReady: true, pendingSync: false, syncState: 'ready' })
    ).toMatchObject({
      label: 'Connected',
      color: '#166534',
      background: '#dcfce7',
      isReady: true,
    })
  })

  it('reports loading while the store connection is being checked', () => {
    expect(
      getStoreSyncUiState({ persistenceReady: false, pendingSync: false, syncState: 'loading' })
    ).toMatchObject({
      label: 'Checking...',
      color: '#7c2d12',
      background: '#ffedd5',
      isPending: true,
    })
  })

  it('reports disconnected when the store is not available', () => {
    expect(
      getStoreSyncUiState({ persistenceReady: false, pendingSync: false, syncState: 'error' })
    ).toMatchObject({
      label: 'Sync error',
      color: '#9f1239',
      background: '#ffe4e6',
      isReady: false,
    })
  })

  it('keeps the error state visible even when persistence is ready again', () => {
    expect(
      getStoreSyncUiState({ persistenceReady: true, pendingSync: false, syncState: 'error' })
    ).toMatchObject({
      label: 'Sync error',
      color: '#9f1239',
      background: '#ffe4e6',
      isReady: false,
    })
  })
})
