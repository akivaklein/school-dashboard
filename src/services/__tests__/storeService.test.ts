import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getStoreSyncUiState,
  normalizeStoreItemInput,
  normalizeStoreRedemptionInput,
  redeemStorePurchaseTx,
  reverseStorePurchaseTx,
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
      label: 'Not connected',
      color: '#9f1239',
      background: '#ffe4e6',
      isReady: false,
    })
  })
})
