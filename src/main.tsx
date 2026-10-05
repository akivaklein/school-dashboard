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

if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    const controlledByAppWorker = navigator.serviceWorker.controller?.scriptURL === new URL('/sw.js', window.location.origin).href
    void navigator.serviceWorker.getRegistrations()
      .then(registrations => Promise.all(registrations
        .filter(registration => registration.scope === new URL('/', window.location.origin).href)
        .map(registration => registration.unregister())))
      .then(unregistered => {
        if (controlledByAppWorker && unregistered.some(Boolean)) window.location.reload()
      })
      .catch(error => console.warn('Local service worker cleanup failed:', error))
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(error => {
        console.warn('Service worker registration failed:', error)
      })
    })
  }
}
