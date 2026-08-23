import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

type Props = NativeStackScreenProps<any, 'PIN'>

const { width, height } = Dimensions.get('window')

const PIN_SCREEN = '0000' // Admin PIN to access settings
const REGISTER_CODE = '1111' // Code to enter Register Mode

export default function PINScreen({ navigation }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [showPinInput, setShowPinInput] = useState(false)

  useEffect(() => {
    // Auto-enter Register Mode on startup if no pin entered
    const timeout = setTimeout(() => {
      if (pin === '') {
        enterRegisterMode()
      }
    }, 5000)

    return () => clearTimeout(timeout)
  }, [pin])

  const handlePinPress = (digit: string) => {
    if (pin.length < 4) {
      setError('')
      setPin(pin + digit)
    }
  }

  const handleBackspace = () => {
    setPin(pin.slice(0, -1))
    setError('')
  }

  const handleClear = () => {
    setPin('')
    setError('')
  }

  const handleSubmit = () => {
    if (pin === PIN_SCREEN) {
      setPin('')
      navigation.reset({
        index: 0,
        routes: [{ name: 'AdminMode' }],
      })
    } else if (pin === REGISTER_CODE || pin === '') {
      enterRegisterMode()
    } else {
      setError('Invalid PIN')
      setPin('')
    }
  }

  const enterRegisterMode = () => {
    setPin('')
    setError('')
    navigation.reset({
      index: 0,
      routes: [{ name: 'RegisterMode' }],
    })
  }

  const pinPadButtons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['0', '⌫', 'C'],
  ]

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Token Store Register</Text>
        <Text style={styles.subtitle}>Enter PIN or press Start</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.pinDisplay}>
          <Text style={styles.pinText}>{pin ? '●'.repeat(pin.length) : '____'}</Text>
        </View>

        <View style={styles.buttonGrid}>
          {pinPadButtons.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.buttonRow}>
              {row.map(digit => (
                <TouchableOpacity
                  key={digit}
                  style={[styles.pinButton, digit === 'C' && styles.clearButton, digit === '⌫' && styles.backButton]}
                  onPress={() => {
                    if (digit === 'C') handleClear()
                    else if (digit === '⌫') handleBackspace()
                    else handlePinPress(digit)
                  }}
                >
                  <Text style={[styles.pinButtonText, (digit === 'C' || digit === '⌫') && styles.specialText]}>
                    {digit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.largeButton, styles.registerButton]} onPress={enterRegisterMode}>
            <Text style={styles.largeButtonText}>START REGISTER</Text>
          </TouchableOpacity>

          {pin.length === 4 && (
            <TouchableOpacity style={[styles.largeButton, styles.submitButton]} onPress={handleSubmit}>
              <Text style={styles.largeButtonText}>ENTER</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.hint}>Enter 4-digit PIN to access admin settings</Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  pinDisplay: {
    width: 200,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  pinText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 8,
  },
  buttonGrid: {
    width: '100%',
    maxWidth: 280,
    marginBottom: 30,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pinButton: {
    flex: 1,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  pinButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  specialText: {
    fontSize: 20,
    color: '#666',
  },
  clearButton: {
    backgroundColor: '#ffebee',
    borderColor: '#ef5350',
  },
  backButton: {
    backgroundColor: '#f3e5f5',
    borderColor: '#ab47bc',
  },
  actionButtons: {
    width: '100%',
    maxWidth: 280,
    gap: 12,
  },
  largeButton: {
    paddingVertical: 18,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  registerButton: {
    backgroundColor: '#4CAF50',
  },
  submitButton: {
    backgroundColor: '#2196F3',
  },
  largeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 20,
    textAlign: 'center',
  },
})
