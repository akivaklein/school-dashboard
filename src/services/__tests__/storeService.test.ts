import { describe, expect, it } from 'vitest'
import {
  getStoreSyncUiState,
  normalizeStoreItemInput,
  normalizeStoreRedemptionInput,
} from '../storeService'

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
