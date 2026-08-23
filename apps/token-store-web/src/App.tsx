import { useMemo, useState } from 'react'
import { listProducts, listRedemptions, listStudents, redeemStorePurchaseTx, reverseStorePurchaseTx } from './storeApi'
import type { CheckoutCartItem, StoreProduct, StoreRedemption, StoreStudent } from './types'

function createAttemptKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function App() {
  const [students, setStudents] = useState<StoreStudent[]>([])
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [redemptions, setRedemptions] = useState<StoreRedemption[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [studentQuery, setStudentQuery] = useState('')
  const [productQuery, setProductQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [cart, setCart] = useState<CheckoutCartItem[]>([])
  const [status, setStatus] = useState('Load students/products from Supabase to start.')
  const [busy, setBusy] = useState(false)

  const selectedStudent = students.find(student => student.id === selectedStudentId) || null

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase()
    if (!q) return students
    return students.filter(student => student.name.toLowerCase().includes(q))
  }, [students, studentQuery])

  const categories = useMemo(() => ['all', ...Array.from(new Set(products.map(product => product.category))).sort()], [products])

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase()
    return products.filter(product => {
      const matchesCategory = category === 'all' || product.category === category
      const matchesQuery = !q || product.name.toLowerCase().includes(q) || product.sku.toLowerCase().includes(q) || product.barcode.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [products, category, productQuery])

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.product.cost * item.quantity, 0), [cart])

  const studentRecentPurchases = useMemo(() => {
    if (!selectedStudent) return []
    return redemptions.filter(redemption => !redemption.reversedAt && redemption.studentId === selectedStudent.id).slice(0, 10)
  }, [redemptions, selectedStudent])

  function addToCart(product: StoreProduct) {
    if (!selectedStudent) {
      setStatus('Select a student first.')
      return
    }
    if (product.stock <= 0) {
      setStatus(`${product.name} is out of stock.`)
      return
    }
    if (product.vipOnly && !selectedStudent.isVip) {
      setStatus(`${product.name} is VIP only.`)
      return
    }
    if (selectedStudent.balance < cartTotal + product.cost) {
      setStatus('Not enough points for this cart.')
      return
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (!existing) return [...prev, { product, quantity: 1 }]
      return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
    })
  }

  function removeFromCart(productId: number) {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  async function refreshStoreData() {
    setBusy(true)
    try {
      const [nextStudents, nextProducts, nextRedemptions] = await Promise.all([
        listStudents(),
        listProducts(),
        listRedemptions(160),
      ])
      setStudents(nextStudents)
      setProducts(nextProducts)
      setRedemptions(nextRedemptions)
      setStatus(`Loaded ${nextStudents.length} students and ${nextProducts.length} products from Supabase.`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to load store data.')
    } finally {
      setBusy(false)
    }
  }

  async function checkout() {
    if (!selectedStudent || cart.length === 0) {
      setStatus('Select a student and add items first.')
      return
    }

    if (selectedStudent.balance < cartTotal) {
      setStatus('Insufficient points for checkout.')
      return
    }

    setBusy(true)
    try {
      for (const item of cart) {
        for (let i = 0; i < item.quantity; i += 1) {
          await redeemStorePurchaseTx({
            studentId: selectedStudent.id,
            itemId: item.product.id,
            staffName: 'Web Register',
            staffRole: 'staff',
            idempotencyKey: createAttemptKey(),
          })
        }
      }

      await refreshStoreData()
      setCart([])
      setSelectedStudentId(null)
      setStatus('Checkout complete. Returned to student list.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Checkout failed.')
    } finally {
      setBusy(false)
    }
  }

  async function runReturn(redemption: StoreRedemption) {
    if (!redemption.pointsEventId) {
      setStatus('This redemption has no points_event_id and cannot be reversed.')
      return
    }
    setBusy(true)
    try {
      await reverseStorePurchaseTx({
        pointsEventId: redemption.pointsEventId,
        staffName: 'Web Register',
        staffRole: 'staff',
      })
      await refreshStoreData()
      setStatus('Return complete. Points and stock restored.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Return failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Token Store</h1>
        <div className="topbar-actions">
          <button onClick={refreshStoreData} disabled={busy}>{busy ? 'Working...' : 'Refresh'}</button>
        </div>
      </header>

      <p className="status">{status}</p>

      <section className="layout">
        <aside className="panel">
          <h2>Students</h2>
          <input value={studentQuery} onChange={event => setStudentQuery(event.target.value)} placeholder="Find student..." />
          <div className="list">
            {filteredStudents.map(student => (
              <button key={student.id} className={selectedStudentId === student.id ? 'list-item active' : 'list-item'} onClick={() => setSelectedStudentId(student.id)}>
                <span>{student.isVip ? '⭐ ' : ''}{student.name}</span>
                <strong>{student.balance}</strong>
              </button>
            ))}
          </div>
        </aside>

        <main className="panel">
          <h2>{selectedStudent ? `${selectedStudent.name} Checkout` : 'Store Items'}</h2>
          <div className="row">
            <input value={productQuery} onChange={event => setProductQuery(event.target.value)} placeholder="Search name, SKU, barcode" />
            <div className="chips">
              {categories.map(option => (
                <button key={option} className={category === option ? 'chip active' : 'chip'} onClick={() => setCategory(option)}>{option}</button>
              ))}
            </div>
          </div>
          <div className="products">
            {filteredProducts.map(product => {
              const unavailableReason = !selectedStudent
                ? 'Select student'
                : product.stock <= 0
                  ? 'Out of stock'
                  : product.vipOnly && !selectedStudent.isVip
                    ? 'VIP only'
                    : selectedStudent.balance < cartTotal + product.cost
                      ? 'Need more points'
                      : ''

              return (
                <button key={product.id} className={unavailableReason ? 'product disabled' : 'product'} onClick={() => addToCart(product)}>
                  <div className="image-wrap">
                    {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <span>{product.emoji || '◼'}</span>}
                  </div>
                  <div className="name">{product.name}</div>
                  <div className="meta">{product.cost} pts · {product.stock} left</div>
                  {product.vipOnly && <div className="tag">VIP</div>}
                  {unavailableReason && <div className="reason">{unavailableReason}</div>}
                </button>
              )
            })}
          </div>
        </main>

        <aside className="panel">
          <h2>Cart</h2>
          <div className="list">
            {cart.length === 0 && <div className="empty">No items</div>}
            {cart.map(item => (
              <div key={item.product.id} className="cart-item">
                <div>
                  <div>{item.product.name}</div>
                  <div className="sub">{item.product.cost} pts × {item.quantity}</div>
                </div>
                <button onClick={() => removeFromCart(item.product.id)}>Remove</button>
              </div>
            ))}
          </div>
          <div className="totals">Total: {cartTotal} pts</div>
          <button className="checkout" disabled={busy || !selectedStudent || cart.length === 0} onClick={checkout}>Checkout</button>

          <h3>Return / Exchange</h3>
          <div className="list">
            {studentRecentPurchases.length === 0 && <div className="empty">No recent purchases</div>}
            {studentRecentPurchases.map(redemption => (
              <div key={redemption.id} className="return-item">
                <div>
                  <div>{redemption.itemName}</div>
                  <div className="sub">{redemption.cost} pts</div>
                </div>
                <button onClick={() => runReturn(redemption)} disabled={busy}>Return</button>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  )
}
