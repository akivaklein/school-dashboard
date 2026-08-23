import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { initializeDatabase } from './db/database'
import PINScreen from './screens/PINScreen'
import RegisterModeScreen from './screens/RegisterModeScreen'
import AdminModeScreen from './screens/AdminModeScreen'

const Stack = createNativeStackNavigator()

export default function App() {
  const [dbReady, setDbReady] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)

  useEffect(() => {
    initializeDatabase()
      .then(() => {
        setDbReady(true)
      })
      .catch(error => {
        console.error('Database initialization error:', error)
        setDbError(error.message || 'Failed to initialize database')
      })
  }, [])

  if (dbError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Database Error</Text>
        <Text style={styles.errorMessage}>{dbError}</Text>
      </View>
    )
  }

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Initializing database...</Text>
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            gestureEnabled: false,
          }}
        >
          <Stack.Screen name="PIN" component={PINScreen} />
          <Stack.Screen name="RegisterMode" component={RegisterModeScreen} />
          <Stack.Screen name="AdminMode" component={AdminModeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar hidden={true} />
    </GestureHandlerRootView>
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
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
})
