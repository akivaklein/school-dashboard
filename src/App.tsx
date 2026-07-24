import { useEffect, useState } from 'react'
import Dashboard from './components/Dashboard'

function App() {
  const [loginMode, setLoginMode] = useState('normal')

  useEffect(() => {
    // Check URL for teacher login indicators
    const params = new URLSearchParams(window.location.search)
    const hash = window.location.hash
    const path = window.location.pathname
    
    if (
      params.get('teacher-login') === 'true' || 
      hash.includes('teacher-login') ||
      path.includes('/teacher-login')
    ) {
      setLoginMode('teacher-only')
    }
  }, [])

  return <Dashboard loginMode={loginMode} setLoginMode={setLoginMode} />
}

export default App