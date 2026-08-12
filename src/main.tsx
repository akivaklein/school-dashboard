import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AppErrorBoundary from './components/AppErrorBoundary.tsx'
import { supabase } from './supabaseClient.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary
      onLogout={async () => {
        await supabase.auth.signOut()
        window.location.assign('/')
      }}
    >
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
