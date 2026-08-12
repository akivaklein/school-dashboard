import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import AppErrorBoundary, { getSafeErrorDetail } from '../AppErrorBoundary'

function renderErrorState(error: unknown, onLogout = () => {}) {
  const boundary = new AppErrorBoundary({ children: null, onLogout })
  boundary.state = AppErrorBoundary.getDerivedStateFromError(error)
  return renderToStaticMarkup(boundary.render() as ReactElement)
}

describe('AppErrorBoundary', () => {
  it('renders children when nothing fails', () => {
    const markup = renderToStaticMarkup(
      <AppErrorBoundary>
        <div>dashboard ok</div>
      </AppErrorBoundary>,
    )

    expect(markup).toContain('dashboard ok')
  })

  it('shows a useful error state instead of a blank page', () => {
    const markup = renderErrorState(new ReferenceError('someRemovedHelper is not defined'))

    expect(markup).toContain('Something went wrong')
    expect(markup).toContain('someRemovedHelper is not defined')
  })

  it('keeps logout available from the error state', () => {
    const onLogout = vi.fn()
    const markup = renderErrorState(new Error('missing staff profile'), onLogout)

    expect(markup).toContain('Log Out')
  })
})

describe('getSafeErrorDetail', () => {
  it('redacts tokens and secrets from error text', () => {
    const detail = getSafeErrorDetail(
      new Error('failed at /#access_token=abc123&refresh_token=def456&apikey=ghi789'),
    )

    expect(detail).not.toContain('abc123')
    expect(detail).not.toContain('def456')
    expect(detail).not.toContain('ghi789')
    expect(detail).toContain('[redacted]')
  })

  it('redacts JWT-shaped values', () => {
    const detail = getSafeErrorDetail('bad jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U')

    expect(detail).toContain('[redacted-token]')
    expect(detail).not.toContain('dozjgNryP4J3')
  })

  it('handles non-error values safely', () => {
    expect(getSafeErrorDetail(undefined)).toBe('Unknown error')
  })
})
