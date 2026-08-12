import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

export function getSafeErrorDetail(error: unknown): string {
  const raw = error instanceof Error
    ? `${error.name}: ${error.message}`
    : String(error ?? 'Unknown error')

  // Never surface credentials that may appear in URLs or messages.
  return raw
    .replace(/(access_token|refresh_token|apikey|api_key|token|password|secret)=[^&\s"']+/gi, '$1=[redacted]')
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}/g, '[redacted-token]')
    .slice(0, 500)
}

interface Props {
  children: ReactNode
  onLogout?: () => void | Promise<void>
}

interface State {
  detail: string
  hasError: boolean
}

class AppErrorBoundary extends Component<Props, State> {
  state: State = { detail: '', hasError: false }

  static getDerivedStateFromError(error: unknown): State {
    return { detail: getSafeErrorDetail(error), hasError: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Application error:', getSafeErrorDetail(error), info?.componentStack || '')
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#f3f6fb', fontFamily: "'Inter','DM Sans','Segoe UI',sans-serif" }}>
        <div style={{ maxWidth: 520, width: '100%', background: '#fff', border: '1px solid #fecaca', borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#991b1b', marginBottom: 8 }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: '#475569', marginBottom: 14 }}>
            The dashboard could not finish loading. You can reload the page or sign out and sign in again.
          </div>
          <pre style={{ fontSize: 11, color: '#7f1d1d', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 10, padding: 10, whiteSpace: 'pre-wrap', marginBottom: 14 }}>
            {this.state.detail}
          </pre>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => window.location.reload()}
              style={{ border: 'none', borderRadius: 10, background: '#1e3a5f', color: '#fff', fontWeight: 800, padding: '10px 14px', cursor: 'pointer' }}
            >
              Reload
            </button>
            <button
              onClick={() => { void this.props.onLogout?.() }}
              style={{ border: '1px solid #d8e1ec', borderRadius: 10, background: '#fff', color: '#1e3a5f', fontWeight: 800, padding: '10px 14px', cursor: 'pointer' }}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default AppErrorBoundary
