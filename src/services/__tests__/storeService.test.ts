import { describe, expect, it } from 'vitest'
import { getStoreSyncUiState } from '../storeService'

describe('getStoreSyncUiState', () => {
  it('reports pending sync when local changes are waiting to be sent', () => {
    expect(
      getStoreSyncUiState({ persistenceReady: false, pendingSync: true, syncState: 'error' })
    ).toMatchObject({
      label: 'Pending sync',
      color: '#9a6a2a',
      background: '#f7f1e8',
    })
  })

  it('reports connected when the remote store is ready', () => {
    expect(
      getStoreSyncUiState({ persistenceReady: true, pendingSync: false, syncState: 'ready' })
    ).toMatchObject({
      label: 'Connected',
      color: '#166534',
      background: '#dcfce7',
    })
  })
})
