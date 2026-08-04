import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import TokenStorePage from '../TokenStorePage'

const baseProps = {
  S: {
    btn: () => ({}),
    badge: () => ({}),
    card: {},
    tag: () => ({}),
  },
  userAccess: { canManageStore: false },
  showStoreManager: false,
  setShowStoreManager: () => {},
  storeItems: [],
  updateStoreItem: () => {},
  adjustStoreStock: () => {},
  removeStoreItem: () => {},
  newStoreItem: {
    emoji: '',
    name: '',
    sku: '',
    barcode: '',
    cost: '',
    stock: '',
    lowStockAt: '5',
    category: 'nosh',
    vip: false,
  },
  setNewStoreItem: () => {},
  addStoreItem: () => {},
  storeStudent: null,
  setStoreStudent: () => {},
  visibleStudents: [],
  isVIP: () => false,
  students: [],
  storeCategoryFilter: 'all',
  setStoreCategoryFilter: () => {},
  storeItemSearch: '',
  setStoreItemSearch: () => {},
  buyItem: () => {},
  purchaseLog: [],
  isStoreItemRestrictedForStudent: () => false,
  STORE_CATEGORY_OPTIONS: [{ key: 'all', label: 'All' }, { key: 'nosh', label: 'Nosh' }],
  storePersistenceReady: false,
  storeSyncState: 'error',
  storeLastLoadError: '',
  refreshStoreData: () => {},
}

describe('TokenStorePage', () => {
  it('renders the token store view without crashing', () => {
    const markup = renderToStaticMarkup(<TokenStorePage {...baseProps} />)

    expect(markup).toContain('Token Store')
  })

  it('shows a pending-sync notice while local changes are syncing', () => {
    const markup = renderToStaticMarkup(
      <TokenStorePage {...baseProps} storePersistenceReady={true} storeSyncState="pending-sync" />,
    )

    expect(markup).toContain('Pending sync')
    expect(markup).toContain('Local changes pending')
  })

  it('finds store items by barcode in the redemption search box', () => {
    const markup = renderToStaticMarkup(
      <TokenStorePage
        {...baseProps}
        storeStudent={1}
        students={[{ id: 1, name: 'Avi', points: 100 }]}
        visibleStudents={[{ id: 1, name: 'Avi', points: 100 }]}
        storeItems={[
          {
            id: 1,
            name: 'Water Bottle',
            sku: 'WB-1',
            barcode: '1234567890',
            cost: 8,
            stock: 3,
            lowStockAt: 1,
            category: 'drinks',
            vip: false,
            emoji: '💧',
            imageUrl: '',
          },
        ]}
        storeItemSearch="1234567890"
      />,
    )

    expect(markup).toContain('Water Bottle')
    expect(markup).toContain('BAR 1234567890')
  })
})
