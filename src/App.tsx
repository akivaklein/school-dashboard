import { useEffect, useState } from 'react'
import Dashboard from './components/Dashboard'
import TeacherOnlyLoginPage from './components/TeacherOnlyLoginPage'

type AuthUser = {
  role: string
  name: string
}

const AUTH_USER_STORAGE_KEY = 'schoolDashboardAuthUser'

function loadStoredAuthUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(AUTH_USER_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (!parsed?.name || !parsed?.role) return null
    return parsed
  } catch {
    return null
  }
}

function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => loadStoredAuthUser())
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const syncPath = () => setCurrentPath(window.location.pathname)
    syncPath()
    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  }, [])

  const normalizedPath = currentPath.replace(/\/+$/, '') || '/'
  const isTeacherRoute =
    normalizedPath === '/teacher' ||
    normalizedPath === '/teacher-login' ||
    normalizedPath.endsWith('/teacher') ||
    normalizedPath.endsWith('/teacher-login')

  const handleTeacherLogin = (role: string, name: string) => {
    setCurrentUser({ role, name })
  }

  const handleTeacherSessionLogout = () => {
    setCurrentUser(null)
  }

  // If on teacher-only route, show ONLY the teacher login page (no redirect to main)
  if (isTeacherRoute) {
    // If not logged in, show login page; if logged in, show dashboard
    if (!currentUser) {
      return <TeacherOnlyLoginPage onLogin={handleTeacherLogin} />
    }
    // After login, show dashboard with teacher user info so it auto-logs in
    return <Dashboard teacherUser={currentUser} onTeacherSessionLogout={handleTeacherSessionLogout} />
  }

  // Otherwise, show normal Dashboard
  return <Dashboard />
}

export default App