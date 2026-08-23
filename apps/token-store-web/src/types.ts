export type StoreStudent = {
  id: number
  name: string
  balance: number
  isVip: boolean
  isActive: boolean
}

export type StoreProduct = {
  id: number
  name: string
  sku: string
  barcode: string
  category: string
  cost: number
  stock: number
  lowStockAt: number
  vipOnly: boolean
  imageUrl: string
  emoji: string
  active: boolean
}

export type StoreRedemption = {
  id: number
  createdAt: string
  studentId: number | null
  studentName: string
  itemId: number | null
  itemName: string
  cost: number
  pointsEventId: number | null
  reversedAt: string | null
}

export type CheckoutCartItem = {
  product: StoreProduct
  quantity: number
}
