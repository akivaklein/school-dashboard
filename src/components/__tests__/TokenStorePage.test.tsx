import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import TokenStorePage, { findExactStoreCodeMatch, getStoreUnavailableReasonForStudent, shouldIgnoreScannerTarget } from '../TokenStorePage'

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
    imageUrl: '',
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

  it('matches scanner input only by exact barcode or SKU', () => {
    const items = [
      { id: 1, name: 'Water Bottle', sku: 'WB-1', barcode: '1234567890' },
      { id: 2, name: 'Chocolate Bar', sku: 'CB-2', barcode: '5555' },
    ]

    expect(findExactStoreCodeMatch(items, '1234567890')?.id).toBe(1)
    expect(findExactStoreCodeMatch(items, 'wb-1')?.id).toBe(1)
    expect(findExactStoreCodeMatch(items, '123')).toBeNull()
  })

  it('does not treat regular input fields as scanner targets', () => {
    const originalHTMLElement = globalThis.HTMLElement
    class FakeHTMLElement extends EventTarget {
      tagName: string
      isContentEditable = false

      constructor(tagName: string) {
        super()
        this.tagName = tagName
      }
    }

    Object.defineProperty(globalThis, 'HTMLElement', { value: FakeHTMLElement, configurable: true })

    try {
      expect(shouldIgnoreScannerTarget(new FakeHTMLElement('INPUT'))).toBe(true)
      expect(shouldIgnoreScannerTarget(new FakeHTMLElement('TEXTAREA'))).toBe(true)
      expect(shouldIgnoreScannerTarget(new FakeHTMLElement('SELECT'))).toBe(true)
      expect(shouldIgnoreScannerTarget(new FakeHTMLElement('BUTTON'))).toBe(false)
    } finally {
      Object.defineProperty(globalThis, 'HTMLElement', { value: originalHTMLElement, configurable: true })
    }
  })

  it('reports checkout restrictions for VIP, insufficient points, stock, and eligibility', () => {
    const student = { id: 1, name: 'Avi', points: 25 }
    const item = { id: 1, name: 'Chocolate', cost: 20, stock: 3, vip: false }

    expect(getStoreUnavailableReasonForStudent(null, item, false, false)).toBe('Select a student first')
    expect(getStoreUnavailableReasonForStudent(student, { ...item, stock: 0 }, false, false)).toBe('Out of stock')
    expect(getStoreUnavailableReasonForStudent(student, item, false, true)).toBe('Restricted')
    expect(getStoreUnavailableReasonForStudent(student, { ...item, vip: true }, false, false)).toBe('VIP only')
    expect(getStoreUnavailableReasonForStudent(student, { ...item, cost: 30 }, false, false)).toBe('Need more points')
    expect(getStoreUnavailableReasonForStudent(student, { ...item, vip: true }, true, false)).toBe('')
  })
})
