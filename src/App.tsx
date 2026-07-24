import { useState } from 'react'
import Dashboard from './components/Dashboard'
import TeacherOnlyLoginPage from './components/TeacherOnlyLoginPage'

function App() {
  const [currentUser, setCurrentUser] = useState(null)

  // Check if current path is the teacher-only route
  const isTeacherRoute = window.location.pathname === '/teacher' || window.location.pathname === '/teacher-login'

  const handleTeacherLogin = (role: string, name: string) => {
    setCurrentUser({ role, name })
  }

  // If on teacher-only route, show ONLY the teacher login page (no redirect to main)
  if (isTeacherRoute) {
    // If not logged in, show login page; if logged in, show dashboard
    if (!currentUser) {
      return <TeacherOnlyLoginPage onLogin={handleTeacherLogin} />
    }
    // After login, show dashboard (teacher has access to main app)
    return <Dashboard />
  }

  // Otherwise, show normal Dashboard
  return <Dashboard />
}

export default App