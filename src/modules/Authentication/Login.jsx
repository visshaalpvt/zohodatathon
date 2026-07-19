import { useEffect, useRef } from 'react'

const getWidgetInitGuard = () => {
  if (typeof window === 'undefined') {
    return { initialized: false }
  }

  if (!window.__crimevisionAuthWidgetInitGuard) {
    window.__crimevisionAuthWidgetInitGuard = { initialized: false }
  }

  return window.__crimevisionAuthWidgetInitGuard
}

export default function Login() {
  const initAttemptedRef = useRef(false)

  useEffect(() => {
    const auth = window.catalyst?.auth
    if (!auth) {
      console.error('Catalyst SDK not loaded')
      return
    }

    let isCancelled = false

    const initializeAuthWidget = async () => {
      const guard = getWidgetInitGuard()
      if (guard.initialized || initAttemptedRef.current) {
        return
      }

      initAttemptedRef.current = true
      guard.initialized = true

      const url = new URL(window.location.href)
      const hasAuthCallback = url.searchParams.has('code') || url.searchParams.has('state') || url.hash.includes('auth')
      if (hasAuthCallback) {
        return
      }

      try {
        const isAuthenticated = typeof auth.isUserAuthenticated === 'function'
          ? await auth.isUserAuthenticated()
          : false

        if (isCancelled || isAuthenticated) {
          return
        }
      } catch (error) {
        console.warn('Catalyst auth state check failed:', error)
      }

      if (isCancelled) {
        return
      }

      // Inject dark enterprise styling into the Catalyst auth widget
      const customCss = `
        body {
          background-color: transparent !important;
          color: #E2E8F0 !important;
          font-family: 'Inter', sans-serif !important;
        }
        .zcc-login-container, .za-login-container, .zcc-form-container {
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
          color: #E2E8F0 !important;
        }
        .zcc-input, input, .za-input {
          background-color: #0F172A !important;
          border: 1px solid #334155 !important;
          color: white !important;
          border-radius: 6px !important;
        }
        .zcc-btn-primary, .za-btn-primary, button[type="submit"] {
          background-color: #3B82F6 !important;
          color: white !important;
          border: none !important;
          border-radius: 6px !important;
          font-weight: 500 !important;
        }
        .zcc-btn-primary:hover, .za-btn-primary:hover, button[type="submit"]:hover {
          background-color: #2563EB !important;
        }
        a, .zcc-link, .za-link {
          color: #3B82F6 !important;
        }
        .zcc-text-muted, .za-text-muted {
          color: #94A3B8 !important;
        }
      `;

      // Mount the official widget once per full page load, even if the component remounts
      auth.signIn('catalyst-login-container', { css: customCss })
    }

    initializeAuthWidget()

    return () => {
      isCancelled = true
    }
  }, [])

  return (
    <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="card" style={{ width: 440, maxWidth: '90%', overflow: 'hidden' }}>
        <div className="card-header" style={{ justifyContent: 'center', borderBottom: 'none', paddingBottom: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div className="topbar-logo-icon" style={{ width: 48, height: 48 }}>
              <svg width="24" height="26" viewBox="0 0 18 20" fill="none">
                <path d="M9 0L0 3.5V9.5C0 14.7 3.9 19.6 9 21C14.1 19.6 18 14.7 18 9.5V3.5L9 0Z" fill="#3B82F6"/>
                <path d="M7 10.5L5 8.5L3.5 10L7 13.5L14.5 6L13 4.5L7 10.5Z" fill="white"/>
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h1 className="page-title" style={{ fontSize: 24 }}>CrimeVision AI</h1>
              <p className="page-subtitle" style={{ marginTop: 4 }}>Enterprise Intelligence Portal</p>
            </div>
          </div>
        </div>
        
        <div className="card-body" style={{ padding: '24px 20px', minHeight: 300 }}>
          <div id="catalyst-login-container" style={{ width: '100%', height: '100%' }}>
            {/* The Catalyst Embedded Widget will render here */}
          </div>
        </div>
      </div>
    </div>
  )
}
