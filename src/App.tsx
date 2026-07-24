import { useEffect, useState } from 'react'
import Dashboard from './components/Dashboard'

function App() {
  const [loginMode, setLoginMode] = useState('normal')

  useEffect(() => {
    // Check if URL has ?teacher-login or /teacher-login
    const params = new URLSearchParams(window.location.search)
    const path = window.location.pathname
    if (params.get('teacher-login') === 'true' || path.includes('/teacher-login')) {
      setLoginMode('teacher-only')
    }
  }, [])

  return <Dashboard loginMode={loginMode} setLoginMode={setLoginMode} />
}

export default App