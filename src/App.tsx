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
    return (
      <div>
        <TeacherOnlyLoginPage onLogin={handleTeacherLogin} />
        {currentUser && (
          <div style={{ position: 'fixed', top: 20, right: 20, background: '#fff', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, color: '#334155', fontWeight: 600 }}>
            ✅ Logged in as {currentUser.name} ({currentUser.role})
          </div>
        )}
      </div>
    )
  }

  // Otherwise, show normal Dashboard
  return <Dashboard />
}

export default App