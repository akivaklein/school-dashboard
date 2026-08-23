import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import {
  getAllStudents,
  getAllProducts,
  createStudent,
  updateStudent,
  archiveStudent,
  restoreStudent,
  updateStudentBalance,
  createProduct,
  updateProduct,
  archiveProduct,
  restoreProduct,
  getPurchaseHistory,
  reversePurchase,
  getStudentById,
  replaceStudentsAndProducts,
} from '../db/queries'
import { shareBackup, restoreFromBackup, listBackupFiles } from '../db/backup'
import { FULL_PRODUCT_SEED, FULL_STUDENT_SEED } from '../db/webSeedData'
import { generateStudentBarcode, generateProductBarcode } from '../utils/barcode'
import type { Student, Product, Purchase } from '../db/schema'

type Props = NativeStackScreenProps<any, 'AdminMode'>

type Tab = 'quickpoints' | 'students' | 'products' | 'history' | 'backup'

export default function AdminModeScreen({ navigation }: Props) {
  const [tab, setTab] = useState<Tab>('quickpoints')
  const [students, setStudents] = useState<Student[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])

  const [showArchivedStudents, setShowArchivedStudents] = useState(false)
  const [showArchivedProducts, setShowArchivedProducts] = useState(false)

  const [studentModal, setStudentModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [studentForm, setStudentForm] = useState({ name: '', barcode: '', balance: '0', is_vip: false })

  const [productModal, setProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({ name: '', barcode: '', cost: '0', quantity: '', lowStock: '', vip_only: false, image_url: '', emoji: '', category: 'nosh' })

  const [pointsStudent, setPointsStudent] = useState<Student | null>(null)
  const [pointsModal, setPointsModal] = useState(false)
  const [pointsForm, setPointsForm] = useState({ amount: '', operation: 'add' as 'add' | 'set' | 'subtract' })

  // Quick Points / Batch Entry
  const [batchMode, setBatchMode] = useState(false)
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0)
  const [pointsAmount, setPointsAmount] = useState('')
  const [selectedOperation, setSelectedOperation] = useState<'add' | 'set' | 'subtract'>('add')
  const activeStudents = students.filter(s => s.is_active)
  const currentBatchStudent = activeStudents[currentStudentIndex] || null

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [studentsList, productsList, purchasesList] = await Promise.all([
        getAllStudents(),
        getAllProducts(),
        getPurchaseHistory(100),
      ])
      setStudents(studentsList)
      setProducts(productsList)
      setPurchases(purchasesList)
      setError('')
    } catch (err) {
      setError('Failed to load data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const exitAdminMode = () => {
    Alert.alert('Exit Admin Mode', 'Return to PIN screen?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Exit',
        onPress: () => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'PIN' }],
          })
        },
        style: 'destructive',
      },
    ])
  }

  // ==================== STUDENTS ====================

  const openStudentForm = (student?: Student) => {
    if (student) {
      setEditingStudent(student)
      setStudentForm({
        name: student.name,
        barcode: student.barcode,
        balance: String(student.balance),
        is_vip: student.is_vip ?? false,
      })
    } else {
      setEditingStudent(null)
      setStudentForm({ name: '', barcode: generateStudentBarcode(students.length + 1), balance: '0', is_vip: false })
    }
    setStudentModal(true)
  }

  const saveStudent = async () => {
    if (!studentForm.name.trim()) {
      Alert.alert('Error', 'Student name is required')
      return
    }

    try {
      setLoading(true)
      const balance = parseInt(studentForm.balance, 10) || 0

      if (editingStudent) {
        await updateStudent(editingStudent.id, {
          name: studentForm.name.trim(),
          barcode: studentForm.barcode.trim(),
          balance,
          is_vip: studentForm.is_vip,
        })
      } else {
        await createStudent({
          name: studentForm.name.trim(),
          barcode: studentForm.barcode.trim() || generateStudentBarcode(students.length + 1),
          balance,
          is_vip: studentForm.is_vip,
        })
      }

      setStudentModal(false)
      await loadData()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save student')
    } finally {
      setLoading(false)
    }
  }

  const handleArchiveStudent = async (student: Student) => {
    Alert.alert(
      'Archive Student',
      `Archive ${student.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: async () => {
            try {
              setLoading(true)
              await archiveStudent(student.id)
              await loadData()
            } catch (err) {
              Alert.alert('Error', 'Failed to archive student')
            } finally {
              setLoading(false)
            }
          },
          style: 'destructive',
        },
      ]
    )
  }

  const handleRestoreStudent = async (student: Student) => {
    try {
      setLoading(true)
      await restoreStudent(student.id)
      await loadData()
    } catch (err) {
      Alert.alert('Error', 'Failed to restore student')
    } finally {
      setLoading(false)
    }
  }

  // ==================== PRODUCTS ====================

  const openProductForm = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setProductForm({
        name: product.name,
        barcode: product.barcode,
        cost: String(product.point_cost),
        quantity: String(product.quantity || ''),
        lowStock: String(product.low_stock_threshold || ''),
        vip_only: product.vip_only ?? false,
        image_url: product.image_url || '',
        emoji: product.emoji || '',
        category: product.category || 'nosh',
      })
    } else {
      setEditingProduct(null)
      setProductForm({
        name: '',
        barcode: generateProductBarcode(products.length + 1),
        cost: '0',
        quantity: '',
        lowStock: '',
        vip_only: false,
        image_url: '',
        emoji: '',
        category: 'nosh',
      })
    }
    setProductModal(true)
  }

  const saveProduct = async () => {
    if (!productForm.name.trim()) {
      Alert.alert('Error', 'Product name is required')
      return
    }

    const cost = parseInt(productForm.cost, 10) || 0
    if (cost <= 0) {
      Alert.alert('Error', 'Point cost must be greater than 0')
      return
    }

    try {
      setLoading(true)
      const quantity = productForm.quantity ? parseInt(productForm.quantity, 10) : null
      const lowStock = productForm.lowStock ? parseInt(productForm.lowStock, 10) : null

      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: productForm.name.trim(),
          barcode: productForm.barcode.trim(),
          point_cost: cost,
          quantity: quantity ?? undefined,
          low_stock_threshold: lowStock ?? undefined,
          vip_only: productForm.vip_only,
          image_url: productForm.image_url.trim(),
          emoji: productForm.emoji.trim(),
          category: (productForm.category || 'nosh').trim() || 'nosh',
        })
      } else {
        await createProduct({
          name: productForm.name.trim(),
          barcode: productForm.barcode.trim() || generateProductBarcode(products.length + 1),
          point_cost: cost,
          quantity: quantity ?? undefined,
          low_stock_threshold: lowStock ?? undefined,
          vip_only: productForm.vip_only,
          image_url: productForm.image_url.trim(),
          emoji: productForm.emoji.trim(),
          category: (productForm.category || 'nosh').trim() || 'nosh',
        })
      }

      setProductModal(false)
      await loadData()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  const handleArchiveProduct = async (product: Product) => {
    Alert.alert(
      'Archive Product',
      `Archive ${product.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: async () => {
            try {
              setLoading(true)
              await archiveProduct(product.id)
              await loadData()
            } catch (err) {
              Alert.alert('Error', 'Failed to archive product')
            } finally {
              setLoading(false)
            }
          },
          style: 'destructive',
        },
      ]
    )
  }

  const handleRestoreProduct = async (product: Product) => {
    try {
      setLoading(true)
      await restoreProduct(product.id)
      await loadData()
    } catch (err) {
      Alert.alert('Error', 'Failed to restore product')
    } finally {
      setLoading(false)
    }
  }

  // ==================== POINTS ====================

  const openPointsForm = (student: Student) => {
    setPointsStudent(student)
    setPointsForm({ amount: '', operation: 'add' })
    setPointsModal(true)
  }

  const savePoints = async () => {
    if (!pointsStudent || !pointsForm.amount) {
      Alert.alert('Error', 'Amount is required')
      return
    }

    const amount = parseInt(pointsForm.amount, 10)
    if (isNaN(amount)) {
      Alert.alert('Error', 'Invalid amount')
      return
    }

    Alert.alert(
      'Confirm',
      `${pointsForm.operation === 'add' ? 'Add' : pointsForm.operation === 'set' ? 'Set to' : 'Subtract'} ${Math.abs(amount)} points for ${pointsStudent.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setLoading(true)
              let newBalance = pointsStudent.balance

              if (pointsForm.operation === 'add') {
                newBalance += amount
              } else if (pointsForm.operation === 'set') {
                newBalance = amount
              } else if (pointsForm.operation === 'subtract') {
                if (pointsStudent.balance < amount) {
                  Alert.alert('Error', 'Insufficient balance')
                  setLoading(false)
                  return
                }
                newBalance -= amount
              }

              await updateStudentBalance(
                pointsStudent.id,
                Math.max(0, newBalance),
                `${pointsForm.operation === 'add' ? '+' : '-'}${Math.abs(amount)} points`,
                pointsForm.operation as any
              )

              setPointsModal(false)
              await loadData()
            } catch (err) {
              Alert.alert('Error', 'Failed to update points')
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  // ==================== QUICK POINTS / BATCH ENTRY ====================

  const handleBatchAddPoints = async () => {
    if (!currentBatchStudent || !pointsAmount) {
      Alert.alert('Error', 'Please enter an amount')
      return
    }

    const amount = parseInt(pointsAmount, 10)
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Error', 'Please enter a valid amount')
      return
    }

    try {
      setLoading(true)
      let newBalance = currentBatchStudent.balance

      if (selectedOperation === 'add') {
        newBalance += amount
      } else if (selectedOperation === 'set') {
        newBalance = amount
      } else if (selectedOperation === 'subtract') {
        if (currentBatchStudent.balance < amount) {
          Alert.alert('Error', `Insufficient balance. ${currentBatchStudent.name} only has ${currentBatchStudent.balance} points.`)
          setLoading(false)
          return
        }
        newBalance -= amount
      }

      await updateStudentBalance(
        currentBatchStudent.id,
        Math.max(0, newBalance),
        `${selectedOperation === 'add' ? '+' : selectedOperation === 'set' ? '=' : '-'}${Math.abs(amount)} (batch)`,
        selectedOperation as any
      )

      // Clear input and move to next student
      setPointsAmount('')
      if (currentStudentIndex < activeStudents.length - 1) {
        setCurrentStudentIndex(currentStudentIndex + 1)
      } else {
        // Loop back to start or stay on last
        setCurrentStudentIndex(0)
      }

      // Reload data to show updated balance
      await loadData()
    } catch (err) {
      Alert.alert('Error', 'Failed to update points')
    } finally {
      setLoading(false)
    }
  }

  const handleSkipStudent = () => {
    if (currentStudentIndex < activeStudents.length - 1) {
      setCurrentStudentIndex(currentStudentIndex + 1)
      setPointsAmount('')
    }
  }

  const handlePreviousStudent = () => {
    if (currentStudentIndex > 0) {
      setCurrentStudentIndex(currentStudentIndex - 1)
      setPointsAmount('')
    }
  }

  const calculateNewBalance = (): number => {
    if (!currentBatchStudent || !pointsAmount) return currentBatchStudent?.balance || 0
    const amount = parseInt(pointsAmount, 10)
    if (isNaN(amount)) return currentBatchStudent.balance

    switch (selectedOperation) {
      case 'add':
        return currentBatchStudent.balance + amount
      case 'set':
        return amount
      case 'subtract':
        return Math.max(0, currentBatchStudent.balance - amount)
      default:
        return currentBatchStudent.balance
    }
  }

  // ==================== HISTORY ====================

  const handleReversePurchase = async (purchase: Purchase) => {
    if (purchase.is_reversed) {
      Alert.alert('Info', 'This purchase has already been reversed')
      return
    }

    Alert.alert(
      'Reverse Purchase',
      `Reverse ${purchase.product_name} purchase for ${purchase.student_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reverse',
          onPress: async () => {
            try {
              setLoading(true)
              await reversePurchase(purchase.id, 'Manual reversal from admin')
              await loadData()
              Alert.alert('Success', 'Purchase reversed and points restored')
            } catch (err) {
              Alert.alert('Error', 'Failed to reverse purchase')
            } finally {
              setLoading(false)
            }
          },
          style: 'destructive',
        },
      ]
    )
  }

  // ==================== BACKUP ====================

  const handleCreateBackup = async () => {
    try {
      setLoading(true)
      await shareBackup()
      Alert.alert('Success', 'Backup created and ready to share')
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create backup')
    } finally {
      setLoading(false)
    }
  }

  const handleImportFullCatalog = () => {
    Alert.alert(
      'Import Preview Catalog',
      'This replaces local students/products/history with preview seed data. VIP status in this preview dataset is NOT verified and must be set manually or synced from Supabase records. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true)
              await replaceStudentsAndProducts(FULL_STUDENT_SEED, FULL_PRODUCT_SEED)
              await loadData()
              Alert.alert(
                'Preview import complete',
                `Loaded ${FULL_STUDENT_SEED.length} preview students and ${FULL_PRODUCT_SEED.length} preview products. Confirm VIP status from real records before production use.`,
              )
            } catch (error) {
              Alert.alert('Import failed', error instanceof Error ? error.message : 'Unable to import full catalog.')
            } finally {
              setLoading(false)
            }
          },
        },
      ],
    )
  }

  // ==================== RENDER ====================

  const visibleStudents = showArchivedStudents ? students.filter(s => !s.is_active) : students.filter(s => s.is_active)
  const visibleProducts = showArchivedProducts ? products.filter(p => !p.is_active) : products.filter(p => p.is_active)

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ADMIN MODE</Text>
        <TouchableOpacity style={styles.exitButton} onPress={exitAdminMode}>
          <Text style={styles.exitButtonText}>EXIT</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {['quickpoints', 'students', 'products', 'history', 'backup'].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t as Tab)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'quickpoints' ? '⚡ Points' : t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {/* QUICK POINTS TAB - OPTIMIZED FOR BATCH ENTRY */}
        {tab === 'quickpoints' && (
          <View style={styles.quickPointsContainer}>
            {batchMode ? (
              <View>
                {/* BATCH MODE */}
                <Text style={styles.quickPointsTitle}>Fast Batch Entry</Text>

                {currentBatchStudent ? (
                  <View style={styles.batchCard}>
                    {/* STUDENT DISPLAY */}
                    <View style={styles.batchStudentSection}>
                      <Text style={styles.batchStudentNumber}>
                        {currentStudentIndex + 1} of {activeStudents.length}
                      </Text>
                      <Text style={styles.batchStudentName}>{currentBatchStudent.name}</Text>
                      <Text style={styles.batchStudentBarcode}>{currentBatchStudent.barcode}</Text>
                    </View>

                    {/* BALANCE DISPLAY */}
                    <View style={styles.balanceSection}>
                      <View style={styles.balanceRow}>
                        <Text style={styles.balanceLabel}>Current Balance:</Text>
                        <Text style={styles.balanceValue}>{currentBatchStudent.balance}</Text>
                      </View>

                      {/* OPERATION SELECTOR - LARGE BUTTONS */}
                      <View style={styles.operationSelector}>
                        <TouchableOpacity
                          style={[
                            styles.operationTab,
                            selectedOperation === 'add' && styles.operationTabActive,
                          ]}
                          onPress={() => setSelectedOperation('add')}
                        >
                          <Text
                            style={[
                              styles.operationTabText,
                              selectedOperation === 'add' && styles.operationTabTextActive,
                            ]}
                          >
                            ADD
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.operationTab,
                            selectedOperation === 'set' && styles.operationTabActive,
                          ]}
                          onPress={() => setSelectedOperation('set')}
                        >
                          <Text
                            style={[
                              styles.operationTabText,
                              selectedOperation === 'set' && styles.operationTabTextActive,
                            ]}
                          >
                            SET
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.operationTab,
                            selectedOperation === 'subtract' && styles.operationTabActive,
                          ]}
                          onPress={() => setSelectedOperation('subtract')}
                        >
                          <Text
                            style={[
                              styles.operationTabText,
                              selectedOperation === 'subtract' && styles.operationTabTextActive,
                            ]}
                          >
                            SUBTRACT
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* AMOUNT INPUT */}
                      <TextInput
                        style={styles.amountInput}
                        placeholder="Enter amount"
                        value={pointsAmount}
                        onChangeText={setPointsAmount}
                        keyboardType="numeric"
                        placeholderTextColor="#ccc"
                        autoFocus
                      />

                      {/* NEW BALANCE PREVIEW */}
                      <View style={styles.previewSection}>
                        <Text style={styles.previewLabel}>
                          {selectedOperation === 'add'
                            ? 'New balance after adding:'
                            : selectedOperation === 'set'
                            ? 'New balance if set to:'
                            : 'New balance after subtracting:'}
                        </Text>
                        <Text style={styles.previewValue}>{calculateNewBalance()}</Text>
                      </View>
                    </View>

                    {/* ACTION BUTTONS - LARGE */}
                    <View style={styles.batchActionButtons}>
                      <TouchableOpacity
                        style={[styles.batchActionButton, styles.primaryActionButton]}
                        onPress={handleBatchAddPoints}
                      >
                        <Text style={styles.batchActionButtonText}>
                          {currentStudentIndex < activeStudents.length - 1 ? '✓ NEXT' : '✓ DONE'}
                        </Text>
                      </TouchableOpacity>

                      {currentStudentIndex > 0 && (
                        <TouchableOpacity
                          style={[styles.batchActionButton, styles.secondaryActionButton]}
                          onPress={handlePreviousStudent}
                        >
                          <Text style={styles.batchActionButtonText}>← PREV</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[styles.batchActionButton, styles.tertiaryActionButton]}
                        onPress={handleSkipStudent}
                      >
                        <Text style={styles.batchActionButtonText}>→ SKIP</Text>
                      </TouchableOpacity>
                    </View>

                    {/* DONE BUTTON */}
                    {currentStudentIndex === activeStudents.length - 1 && (
                      <TouchableOpacity
                        style={[styles.largeButton, styles.successButton]}
                        onPress={() => {
                          setBatchMode(false)
                          setPointsAmount('')
                          setCurrentStudentIndex(0)
                        }}
                      >
                        <Text style={styles.largeButtonText}>BATCH COMPLETE</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={styles.emptyMessage}>
                    <Text style={styles.emptyMessageText}>No active students found</Text>
                  </View>
                )}
              </View>
            ) : (
              <View>
                {/* QUICK ENTRY MODE */}
                <Text style={styles.quickPointsTitle}>Add Points</Text>
                <Text style={styles.quickPointsSubtitle}>Select a student to adjust points</Text>

                <TouchableOpacity
                  style={[styles.largeButton, styles.primaryButton]}
                  onPress={() => {
                    setBatchMode(true)
                    setCurrentStudentIndex(0)
                    setPointsAmount('')
                  }}
                >
                  <Text style={styles.largeButtonText}>START BATCH ENTRY</Text>
                </TouchableOpacity>

                <Text style={styles.instructionText}>
                  Quickly add points to multiple students in sequence
                </Text>

                {/* SINGLE ENTRY - STUDENT LIST */}
                <Text style={styles.sectionTitle}>Or select a single student:</Text>

                <FlatList
                  data={activeStudents}
                  keyExtractor={item => String(item.id)}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <View style={styles.studentQuickCard}>
                      <View style={styles.quickStudentInfo}>
                        <Text style={styles.quickStudentName}>{item.name}</Text>
                        <Text style={styles.quickStudentBalance}>{item.balance} pts</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => openPointsForm(item)}
                      >
                        <Text style={styles.actionButtonText}>Modify</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
              </View>
            )}
          </View>
        )}

        {/* STUDENTS TAB */}
        {tab === 'students' && (
          <View>
            <View style={styles.tabHeader}>
              <Text style={styles.tabTitle}>Students</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => openStudentForm()}>
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Show Archived</Text>
              <Switch value={showArchivedStudents} onValueChange={setShowArchivedStudents} />
            </View>

            <FlatList
              data={visibleStudents}
              keyExtractor={item => String(item.id)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.itemCard}>
                  <View style={styles.itemContent}>
                    <View style={styles.itemNameRow}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.is_vip && <Text style={styles.vipBadge}>VIP</Text>}
                    </View>
                    <Text style={styles.itemSubtitle}>{item.barcode}</Text>
                    <Text style={styles.itemBalance}>{item.balance} points</Text>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => openStudentForm(item)}
                    >
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    {item.is_active ? (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.dangerButton]}
                        onPress={() => handleArchiveStudent(item)}
                      >
                        <Text style={styles.actionButtonText}>Archive</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.successButton]}
                        onPress={() => handleRestoreStudent(item)}
                      >
                        <Text style={styles.actionButtonText}>Restore</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            />
          </View>
        )}

        {/* PRODUCTS TAB */}
        {tab === 'products' && (
          <View>
            <View style={styles.tabHeader}>
              <Text style={styles.tabTitle}>Products/Snacks</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => openProductForm()}>
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Show Archived</Text>
              <Switch value={showArchivedProducts} onValueChange={setShowArchivedProducts} />
            </View>

            <FlatList
              data={visibleProducts}
              keyExtractor={item => String(item.id)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.itemCard}>
                  <View style={styles.itemContent}>
                    <View style={styles.itemNameRow}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.vip_only && <Text style={styles.vipBadge}>VIP Only</Text>}
                    </View>
                    <Text style={styles.itemSubtitle}>{item.barcode}</Text>
                    <Text style={styles.itemBalance}>{item.point_cost} pts</Text>
                    <Text style={styles.itemQuantity}>Category: {item.category || 'nosh'}</Text>
                    {item.quantity !== null && (
                      <Text style={styles.itemQuantity}>Stock: {item.quantity}</Text>
                    )}
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => openProductForm(item)}
                    >
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    {item.is_active ? (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.dangerButton]}
                        onPress={() => handleArchiveProduct(item)}
                      >
                        <Text style={styles.actionButtonText}>Archive</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.successButton]}
                        onPress={() => handleRestoreProduct(item)}
                      >
                        <Text style={styles.actionButtonText}>Restore</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            />
          </View>
        )}

        {/* POINTS TAB */}
        {tab === 'quickpoints' && (
          <View>
            <View style={styles.tabHeader}>
              <Text style={styles.tabTitle}>Manage Points</Text>
            </View>

            <FlatList
              data={students.filter(s => s.is_active)}
              keyExtractor={item => String(item.id)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.itemCard}>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemBalance}>{item.balance} points</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => openPointsForm(item)}
                  >
                    <Text style={styles.actionButtonText}>Modify</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <View>
            <Text style={styles.tabTitle}>Purchase History</Text>

            <FlatList
              data={purchases.slice(0, 50)}
              keyExtractor={item => String(item.id)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View
                  style={[styles.itemCard, item.is_reversed && styles.reversedItem]}
                >
                  <View style={styles.itemContent}>
                    <Text style={styles.itemName}>{item.student_name}</Text>
                    <Text style={styles.itemSubtitle}>{item.product_name}</Text>
                    <Text style={styles.itemBalance}>
                      {item.point_cost} pts {item.is_reversed ? '(REVERSED)' : ''}
                    </Text>
                    <Text style={styles.itemDate}>
                      {new Date(item.created_at).toLocaleString()}
                    </Text>
                  </View>
                  {!item.is_reversed && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.dangerButton]}
                      onPress={() => handleReversePurchase(item)}
                    >
                      <Text style={styles.actionButtonText}>Undo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          </View>
        )}

        {/* BACKUP TAB */}
        {tab === 'backup' && (
          <View>
            <Text style={styles.tabTitle}>Backup & Restore</Text>

            <TouchableOpacity style={[styles.largeButton, styles.dangerButton]} onPress={handleImportFullCatalog}>
              <Text style={styles.largeButtonText}>Import Preview Student/Product Catalog</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.largeButton, styles.primaryButton]} onPress={handleCreateBackup}>
              <Text style={styles.largeButtonText}>Create Backup</Text>
            </TouchableOpacity>

            <Text style={styles.backupInfo}>
              Tap to create a backup file. You can transfer this file to your computer via USB.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* STUDENT MODAL */}
      <Modal visible={studentModal} transparent animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingStudent ? 'Edit Student' : 'Add Student'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Student Name"
              value={studentForm.name}
              onChangeText={text => setStudentForm(prev => ({ ...prev, name: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Barcode"
              value={studentForm.barcode}
              onChangeText={text => setStudentForm(prev => ({ ...prev, barcode: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Starting Balance"
              value={studentForm.balance}
              onChangeText={text => setStudentForm(prev => ({ ...prev, balance: text }))}
              keyboardType="numeric"
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>VIP Student</Text>
              <Switch
                value={studentForm.is_vip}
                onValueChange={v => setStudentForm(prev => ({ ...prev, is_vip: v }))}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setStudentModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={saveStudent}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PRODUCT MODAL */}
      <Modal visible={productModal} transparent animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Product Name"
              value={productForm.name}
              onChangeText={text => setProductForm(prev => ({ ...prev, name: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Barcode"
              value={productForm.barcode}
              onChangeText={text => setProductForm(prev => ({ ...prev, barcode: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Point Cost"
              value={productForm.cost}
              onChangeText={text => setProductForm(prev => ({ ...prev, cost: text }))}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Quantity (optional)"
              value={productForm.quantity}
              onChangeText={text => setProductForm(prev => ({ ...prev, quantity: text }))}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Low Stock Threshold (optional)"
              value={productForm.lowStock}
              onChangeText={text => setProductForm(prev => ({ ...prev, lowStock: text }))}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Category (drinks, nosh, snacks...)"
              value={productForm.category}
              onChangeText={text => setProductForm(prev => ({ ...prev, category: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Emoji fallback (optional)"
              value={productForm.emoji}
              onChangeText={text => setProductForm(prev => ({ ...prev, emoji: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Picture URL (optional)"
              value={productForm.image_url}
              onChangeText={text => setProductForm(prev => ({ ...prev, image_url: text }))}
              autoCapitalize="none"
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>VIP Only Item</Text>
              <Switch
                value={productForm.vip_only}
                onValueChange={v => setProductForm(prev => ({ ...prev, vip_only: v }))}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setProductModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={saveProduct}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* POINTS MODAL */}
      <Modal visible={pointsModal} transparent animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Manage Points: {pointsStudent?.name}</Text>
            <Text style={styles.modalSubtitle}>Current balance: {pointsStudent?.balance} points</Text>

            <View style={styles.operationSegments}>
              {['add', 'set', 'subtract'].map(op => (
                <TouchableOpacity
                  key={op}
                  style={[
                    styles.operationButton,
                    pointsForm.operation === op && styles.operationButtonActive,
                  ]}
                  onPress={() => setPointsForm(prev => ({ ...prev, operation: op as any }))}
                >
                  <Text
                    style={[
                      styles.operationButtonText,
                      pointsForm.operation === op && styles.operationButtonTextActive,
                    ]}
                  >
                    {op === 'add' ? 'Add' : op === 'set' ? 'Set' : 'Subtract'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Amount"
              value={pointsForm.amount}
              onChangeText={text => setPointsForm(prev => ({ ...prev, amount: text }))}
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPointsModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={savePoints}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  exitButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
  },
  exitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#d32f2f',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#d32f2f',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  toggleLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  reversedItem: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  vipBadge: {
    backgroundColor: '#7a5c1e',
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 4,
  },
  switchLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  itemBalance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginTop: 4,
  },
  itemQuantity: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  itemDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  dangerButton: {
    backgroundColor: '#f44336',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  largeButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  largeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  backupInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  modal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  operationSegments: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  operationButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  operationButtonActive: {
    backgroundColor: '#2196F3',
  },
  operationButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  operationButtonTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#2196F3',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  error: {
    color: '#d32f2f',
    fontSize: 12,
    padding: 12,
    textAlign: 'center',
  },

  // ==================== QUICK POINTS STYLES ====================
  quickPointsContainer: {
    flex: 1,
  },
  quickPointsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  quickPointsSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },

  // Batch Mode Styles
  batchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  batchStudentSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  batchStudentNumber: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    fontWeight: '600',
  },
  batchStudentName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  batchStudentBarcode: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },

  // Balance Section
  balanceSection: {
    marginBottom: 24,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
  },

  // Operation Selector
  operationSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  operationTab: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  operationTabActive: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  operationTabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  operationTabTextActive: {
    color: '#fff',
  },

  // Amount Input
  amountInput: {
    fontSize: 28,
    fontWeight: 'bold',
    borderWidth: 3,
    borderColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: '#f8f8f8',
  },

  // Preview Section
  previewSection: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 13,
    color: '#2E7D32',
    marginBottom: 4,
    fontWeight: '600',
  },
  previewValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B5E20',
  },

  // Batch Action Buttons
  batchActionButtons: {
    gap: 12,
  },
  batchActionButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  primaryActionButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryActionButton: {
    backgroundColor: '#2196F3',
  },
  tertiaryActionButton: {
    backgroundColor: '#FF9800',
  },
  batchActionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Quick Student Card (for single entry mode)
  studentQuickCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  quickStudentInfo: {
    flex: 1,
  },
  quickStudentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  quickStudentBalance: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: 'bold',
  },

  // Empty Message
  emptyMessage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyMessageText: {
    fontSize: 16,
    color: '#999',
  },
})
