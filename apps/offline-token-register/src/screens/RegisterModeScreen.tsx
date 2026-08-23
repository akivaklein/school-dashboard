import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  TextInput,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { getActiveStudents, getActiveProducts, recordPurchase, updateStudent, getStudentPurchaseHistory, reversePurchase } from '../db/queries'
import { generateStudentBarcode, generateProductBarcode, BarcodeBuffer, isStudentBarcode, isProductBarcode, extractIdFromBarcode } from '../utils/barcode'
import type { Student, Product, Purchase } from '../db/schema'

type Props = NativeStackScreenProps<any, 'RegisterMode'>

const { width, height } = Dimensions.get('window')
const isCompactTablet = width <= 900

interface CartItem {
  product: Product
  quantity: number
}

const INACTIVITY_TIMEOUT = 60000 // 60 seconds

export default function RegisterModeScreen({ navigation }: Props) {
  const [students, setStudents] = useState<Student[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [totalCost, setTotalCost] = useState(0)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showStudentSelect, setShowStudentSelect] = useState(true)
  const [studentSearch, setStudentSearch] = useState('')
  const [registerTab, setRegisterTab] = useState<'products' | 'cart'>('products')
  const [productSearch, setProductSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [studentPurchases, setStudentPurchases] = useState<Purchase[]>([])
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<number, boolean>>({})

  const barcodeBufferRef = useRef(new BarcodeBuffer())
  const barcodeInputRef = useRef<TextInput>(null)
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Focus on barcode input
    if (!showStudentSelect && barcodeInputRef.current) {
      setTimeout(() => {
        barcodeInputRef.current?.focus()
      }, 100)
    }
  }, [showStudentSelect])

  useEffect(() => {
    resetInactivityTimer()
  }, [selectedStudent, barcodeInput])

  useEffect(() => {
    if (!selectedStudent) {
      setStudentPurchases([])
      return
    }

    getStudentPurchaseHistory(selectedStudent.id, 20)
      .then(history => setStudentPurchases(history.filter(purchase => !purchase.is_reversed)))
      .catch(error => console.error('Unable to load student purchase history:', error))
  }, [selectedStudent])

  const loadData = async () => {
    try {
      setLoading(true)
      const [studentsList, productsList] = await Promise.all([getActiveStudents(), getActiveProducts()])
      setStudents(studentsList)
      setProducts(productsList)
      setError('')
    } catch (err) {
      setError('Failed to load data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const resetInactivityTimer = () => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
    }

    if (selectedStudent && !showStudentSelect && cart.length === 0) {
      inactivityTimeoutRef.current = setTimeout(() => {
        clearCheckout()
      }, INACTIVITY_TIMEOUT)
    }
  }

  const selectStudent = (student: Student) => {
    setSelectedStudent(student)
    setShowStudentSelect(false)
    setCart([])
    setTotalCost(0)
    setBarcodeInput('')
    setProductSearch('')
    setCategoryFilter('all')
  }

  const handleBarcodeInput = (barcode: string) => {
    if (isStudentBarcode(barcode)) {
      // Student selected via barcode
      const id = extractIdFromBarcode(barcode)
      if (id) {
        const student = students.find(s => s.id === id)
        if (student) {
          selectStudent(student)
        } else {
          setError('Student not found')
        }
      }
    } else if (isProductBarcode(barcode)) {
      // Product scanned
      const id = extractIdFromBarcode(barcode)
      if (id && selectedStudent) {
        const product = products.find(p => p.id === id)
        if (product) {
          addToCart(product)
        } else {
          setError('Product not found')
        }
      } else if (!selectedStudent) {
        setError('Select a student first')
      }
    } else {
      setError('Invalid barcode')
    }

    setBarcodeInput('')
  }

  const addToCart = (product: Product) => {
    if (product.quantity !== null && product.quantity !== undefined && product.quantity <= 0) {
      setError('Item is out of stock')
      return
    }
    if (product.vip_only && !selectedStudent?.is_vip) {
      setError('This item is VIP only')
      return
    }
    if (selectedStudent && selectedStudent.balance < totalCost + product.point_cost) {
      setError('Not enough points for this item')
      return
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })

    setTotalCost(prev => prev + product.point_cost)
  }

  const removeFromCart = (productId: number) => {
    const item = cart.find(i => i.product.id === productId)
    if (item) {
      setTotalCost(prev => prev - item.product.point_cost * item.quantity)
      setCart(prev => prev.filter(i => i.product.id !== productId))
    }
  }

  const handleCheckout = async () => {
    if (!selectedStudent || cart.length === 0) {
      setError('No items to checkout')
      return
    }

    if (selectedStudent.balance < totalCost) {
      Alert.alert('Insufficient Balance', `Student has ${selectedStudent.balance} points but needs ${totalCost}`)
      return
    }

    try {
      setLoading(true)
      const newBalance = selectedStudent.balance - totalCost

      // Record each purchase
      for (const item of cart) {
        for (let i = 0; i < item.quantity; i++) {
          await recordPurchase({
            student_id: selectedStudent.id,
            product_id: item.product.id,
            student_barcode: selectedStudent.barcode,
            student_name: selectedStudent.name,
            product_name: item.product.name,
            point_cost: item.product.point_cost,
            points_after: newBalance,
          })
        }
      }

      // Update student balance
      await updateStudent(selectedStudent.id, { balance: newBalance })

      const refreshedStudents = await getActiveStudents()
      setStudents(refreshedStudents)
      const refreshedProducts = await getActiveProducts()
      setProducts(refreshedProducts)

      // Show confirmation and clear
      Alert.alert('Checkout Complete', `${selectedStudent.name} spent ${totalCost} points.`, [
        {
          text: 'Back to Student List',
          onPress: () => {
            clearCheckout()
          },
        },
      ])
    } catch (err) {
      setError('Checkout failed')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReturnPurchase = (purchase: Purchase) => {
    Alert.alert(
      'Return / Exchange',
      `Return ${purchase.product_name} for ${purchase.student_name} and restore ${purchase.point_cost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Return',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true)
              await reversePurchase(purchase.id, 'Register return/exchange')

              const [nextStudents, nextProducts, history] = await Promise.all([
                getActiveStudents(),
                getActiveProducts(),
                selectedStudent ? getStudentPurchaseHistory(selectedStudent.id, 20) : Promise.resolve([]),
              ])

              setStudents(nextStudents)
              setProducts(nextProducts)
              if (selectedStudent) {
                const nextStudent = nextStudents.find(student => student.id === selectedStudent.id) || null
                setSelectedStudent(nextStudent)
              }
              setStudentPurchases(history.filter(entry => !entry.is_reversed))

              Alert.alert(
                'Return Complete',
                'Points and inventory were restored. You can now add replacement items to the cart for an exchange.',
                [{ text: 'Continue Exchange', onPress: () => setRegisterTab('products') }],
              )
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Return failed')
            } finally {
              setLoading(false)
            }
          },
        },
      ],
    )
  }

  const clearCheckout = () => {
    setSelectedStudent(null)
    setCart([])
    setTotalCost(0)
    setBarcodeInput('')
    setShowStudentSelect(true)
    setStudentSearch('')
    setProductSearch('')
    setCategoryFilter('all')
    setRegisterTab('products')
  }

  const handleLockScreen = () => {
    Alert.alert('Lock Register', 'Return to PIN screen?', [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Lock',
        onPress: () => {
          clearCheckout()
          navigation.reset({
            index: 0,
            routes: [{ name: 'PIN' }],
          })
        },
        style: 'destructive',
      },
    ])
  }

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()))

  if (loading && students.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  if (showStudentSelect) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>SELECT STUDENT</Text>
          <TouchableOpacity style={styles.lockButton} onPress={handleLockScreen}>
            <Text style={styles.lockButtonText}>🔒</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search student..."
          value={studentSearch}
          onChangeText={setStudentSearch}
          placeholderTextColor="#999"
        />

        <FlatList
          data={filteredStudents}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.studentButton, item.is_vip && styles.studentButtonVip]} onPress={() => selectStudent(item)}>
              <View style={styles.studentButtonContent}>
                <View style={styles.studentNameRow}>
                  {item.is_vip && <Text style={styles.vipStar}>⭐</Text>}
                  <Text style={styles.studentName}>{item.name}</Text>
                  {item.is_vip && <Text style={styles.vipLabel}>VIP</Text>}
                </View>
                <Text style={styles.studentBalance}>{item.balance} pts</Text>
              </View>
              <Text style={styles.studentArrow}>›</Text>
            </TouchableOpacity>
          )}
          scrollEnabled
          nestedScrollEnabled
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    )
  }

  const getProductUnavailableReason = (product: Product): string => {
    if (!selectedStudent) return ''
    if (product.quantity !== null && product.quantity !== undefined && product.quantity <= 0) return 'Out of stock'
    if (product.vip_only && !selectedStudent.is_vip) return 'VIP only'
    if (selectedStudent.balance - totalCost < product.point_cost) return 'Need more pts'
    return ''
  }

  const productCategories = ['all', ...Array.from(new Set(products.map(product => String(product.category || 'nosh')))).sort((left, right) => left.localeCompare(right))]
  const visibleProducts = products.filter(product => {
    const query = productSearch.trim().toLowerCase()
    const matchesCategory = categoryFilter === 'all' || String(product.category || 'nosh') === categoryFilter
    const matchesSearch = !query
      || product.name.toLowerCase().includes(query)
      || product.barcode.toLowerCase().includes(query)
    return matchesCategory && matchesSearch
  })

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.studentDisplayRow}>
            <Text style={styles.studentDisplayName}>{selectedStudent?.name}</Text>
            {selectedStudent?.is_vip && <Text style={styles.headerVipBadge}>⭐ VIP</Text>}
          </View>
          <Text style={styles.studentDisplayBalance}>{selectedStudent?.balance} points</Text>
        </View>
        <TouchableOpacity style={styles.changStudentButton} onPress={() => setShowStudentSelect(true)}>
          <Text style={styles.changeStudentText}>CHANGE</Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={styles.regTabBar}>
        <TouchableOpacity
          style={[styles.regTab, registerTab === 'products' && styles.regTabActive]}
          onPress={() => setRegisterTab('products')}
        >
          <Text style={[styles.regTabText, registerTab === 'products' && styles.regTabTextActive]}>
            PRODUCTS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.regTab, registerTab === 'cart' && styles.regTabActive]}
          onPress={() => setRegisterTab('cart')}
        >
          <Text style={[styles.regTabText, registerTab === 'cart' && styles.regTabTextActive]}>
            CART{cart.length > 0 ? ` (${cart.reduce((s, i) => s + i.quantity, 0)})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {registerTab === 'products' ? (
        <ScrollView style={styles.productGrid} contentContainerStyle={styles.productGridContent}>
          <TextInput
            style={styles.productSearchInput}
            placeholder="Search name or barcode..."
            value={productSearch}
            onChangeText={setProductSearch}
            placeholderTextColor="#94a3b8"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {productCategories.map(category => {
              const active = categoryFilter === category
              return (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  onPress={() => setCategoryFilter(category)}
                >
                  <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                    {category === 'all' ? 'All' : category}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          <View style={styles.productRow}>
            {visibleProducts.map(product => {
              const reason = getProductUnavailableReason(product)
              const unavailable = !!reason
              const dimmed = !!selectedStudent && unavailable
              const hasImage = !!product.image_url && !imageLoadErrors[product.id]
              return (
                <TouchableOpacity
                  key={product.id}
                  style={[styles.productCard, dimmed && styles.productCardDimmed]}
                  onPress={() => {
                    if (!selectedStudent) {
                      setError('Select a student first')
                      return
                    }
                    if (unavailable) {
                      setError(reason)
                      return
                    }
                    addToCart(product)
                  }}
                  activeOpacity={unavailable ? 0.9 : 0.7}
                >
                  {product.vip_only && (
                    <View style={styles.productVipTag}>
                      <Text style={styles.productVipTagText}>VIP</Text>
                    </View>
                  )}
                  {dimmed && (
                    <View style={styles.productUnavailableTag}>
                      <Text style={styles.productUnavailableTagText}>{reason}</Text>
                    </View>
                  )}
                  <View style={styles.productImageWrap}>
                    {hasImage ? (
                      <Image
                        source={{ uri: String(product.image_url) }}
                        style={styles.productImage}
                        onError={() => setImageLoadErrors(prev => ({ ...prev, [product.id]: true }))}
                      />
                    ) : (
                      <Text style={styles.productEmojiFallback}>{product.emoji || '◼'}</Text>
                    )}
                  </View>
                  <Text style={styles.productCardName}>{product.name}</Text>
                  <Text style={[styles.productCardCost, dimmed && styles.productCardCostDimmed]}>
                    {product.point_cost} pts
                  </Text>
                  {product.quantity !== null && product.quantity !== undefined && (
                    <Text style={[
                      styles.productCardStock,
                      product.quantity <= 0 && styles.productCardStockOut,
                      product.low_stock_threshold !== null &&
                      product.low_stock_threshold !== undefined &&
                      product.quantity > 0 &&
                      product.quantity <= product.low_stock_threshold &&
                        styles.productCardStockLow,
                    ]}>
                      {product.quantity <= 0
                        ? 'Out of stock'
                        : product.low_stock_threshold !== null &&
                          product.low_stock_threshold !== undefined &&
                          product.quantity <= product.low_stock_threshold
                        ? `${product.quantity} left · Low`
                        : `${product.quantity} left`}
                    </Text>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>
      ) : (
        <>
          <TextInput
            ref={barcodeInputRef}
            style={styles.barcodeInput}
            placeholder="Scan product barcode..."
            value={barcodeInput}
            onChangeText={setBarcodeInput}
            onSubmitEditing={() => {
              if (barcodeInput) handleBarcodeInput(barcodeInput)
            }}
            autoFocus
            placeholderTextColor="#999"
            editable={!loading}
          />
          <ScrollView style={styles.cartContainer}>
            {cart.length === 0 ? (
              <Text style={styles.emptyCart}>No items in cart</Text>
            ) : (
              cart.map(item => (
                <View key={item.product.id} style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.product.name}</Text>
                    <Text style={styles.cartItemCost}>{item.product.point_cost} pts</Text>
                  </View>
                  <View style={styles.cartItemControls}>
                    <Text style={styles.cartItemQty}>× {item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeFromCart(item.product.id)}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            {selectedStudent && (
              <View style={styles.returnSection}>
                <Text style={styles.returnSectionTitle}>Return / Exchange</Text>
                <Text style={styles.returnSectionSubtitle}>Tap a recent purchase to return it and restore points/stock, then choose replacement items.</Text>
                {studentPurchases.length === 0 ? (
                  <Text style={styles.returnEmptyText}>No recent purchases for this student.</Text>
                ) : (
                  studentPurchases.slice(0, 8).map(purchase => (
                    <View key={purchase.id} style={styles.returnRow}>
                      <View style={styles.returnRowInfo}>
                        <Text style={styles.returnItemName}>{purchase.product_name}</Text>
                        <Text style={styles.returnItemMeta}>{purchase.point_cost} pts · {new Date(purchase.created_at).toLocaleString()}</Text>
                      </View>
                      <TouchableOpacity style={styles.returnButton} onPress={() => handleReturnPurchase(purchase)}>
                        <Text style={styles.returnButtonText}>Return</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </>
      )}

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>TOTAL:</Text>
          <Text style={styles.totalAmount}>{totalCost} pts</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.checkoutButton,
            (!selectedStudent || cart.length === 0 || loading || totalCost > (selectedStudent?.balance || 0)) &&
              styles.checkoutButtonDisabled,
          ]}
          onPress={handleCheckout}
          disabled={!selectedStudent || cart.length === 0 || loading}
        >
          <Text style={styles.checkoutButtonText}>CHECKOUT</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearButton} onPress={clearCheckout}>
          <Text style={styles.clearButtonText}>CLEAR</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: isCompactTablet ? 18 : 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerLeft: {
    flex: 1,
  },
  studentDisplayName: {
    fontSize: isCompactTablet ? 16 : 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  studentDisplayBalance: {
    fontSize: 14,
    color: '#e3f2fd',
    marginTop: 4,
  },
  lockButton: {
    padding: 8,
    marginLeft: 8,
  },
  lockButtonText: {
    fontSize: 24,
  },
  changStudentButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
  },
  changeStudentText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  searchInput: {
    margin: 12,
    padding: isCompactTablet ? 10 : 12,
    fontSize: isCompactTablet ? 14 : 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  studentButton: {
    marginHorizontal: 12,
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  studentButtonVip: {
    backgroundColor: '#fffaf0',
    borderWidth: 1,
    borderColor: '#d6b75d',
  },
  studentButtonContent: {
    flex: 1,
  },
  studentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vipStar: {
    fontSize: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  vipLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#7a5c1e',
    backgroundColor: '#f7e9c3',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  studentBalance: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  studentArrow: {
    fontSize: 24,
    color: '#999',
  },
  barcodeInput: {
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1976D2',
    backgroundColor: '#fff',
  },
  cartContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    padding: 8,
  },
  emptyCart: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 16,
  },
  cartItem: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cartItemCost: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartItemQty: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 40,
    textAlign: 'right',
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeButtonText: {
    fontSize: 18,
    color: '#d32f2f',
  },
  footer: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#ccc',
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  clearButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  error: {
    color: '#d32f2f',
    fontSize: 12,
    marginHorizontal: 12,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  // Header VIP badge
  studentDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerVipBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffe082',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  // Register tab bar
  regTabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  regTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  regTabActive: {
    borderBottomColor: '#1976D2',
  },
  regTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.5,
  },
  regTabTextActive: {
    color: '#1976D2',
  },
  // Product grid
  productGrid: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  productGridContent: {
    padding: 10,
  },
  productSearchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d8dee9',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: isCompactTablet ? 8 : 10,
    fontSize: isCompactTablet ? 13 : 14,
    marginBottom: 8,
  },
  categoryRow: {
    paddingBottom: 8,
    gap: 6,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: '#d8dee9',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryChipActive: {
    borderColor: '#1e3a8a',
    backgroundColor: '#1e3a8a',
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'capitalize',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  productRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  productCard: {
    width: isCompactTablet ? '48%' : '47%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: isCompactTablet ? 10 : 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    position: 'relative',
    minHeight: isCompactTablet ? 118 : 128,
  },
  productImageWrap: {
    height: isCompactTablet ? 40 : 48,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: isCompactTablet ? 50 : 62,
    height: isCompactTablet ? 40 : 48,
    resizeMode: 'contain',
    borderRadius: 8,
  },
  productEmojiFallback: {
    fontSize: isCompactTablet ? 22 : 26,
  },
  productCardDimmed: {
    opacity: 0.45,
  },
  productVipTag: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#7a5c1e',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  productVipTagText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  productUnavailableTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  productUnavailableTagText: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
  },
  productCardName: {
    fontSize: isCompactTablet ? 12 : 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    marginTop: 4,
  },
  productCardCost: {
    fontSize: isCompactTablet ? 14 : 15,
    fontWeight: '700',
    color: '#9a6a2a',
    marginBottom: 4,
  },
  productCardCostDimmed: {
    color: '#94a3b8',
  },
  productCardStock: {
    fontSize: 10,
    color: '#64748b',
  },
  productCardStockLow: {
    color: '#9a6a2a',
    fontWeight: '600',
  },
  productCardStockOut: {
    color: '#9f1239',
    fontWeight: '600',
  },
  returnSection: {
    marginTop: 12,
    backgroundColor: '#eef6ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c7ddff',
    padding: 10,
  },
  returnSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e3a8a',
  },
  returnSectionSubtitle: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
    marginBottom: 8,
  },
  returnEmptyText: {
    fontSize: 11,
    color: '#64748b',
  },
  returnRow: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  returnRowInfo: {
    flex: 1,
  },
  returnItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  returnItemMeta: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  returnButton: {
    backgroundColor: '#1e3a8a',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
})
