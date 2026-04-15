import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import posthog from 'posthog-js'
import App from './App'
import './index.css'

function normalizePostHogHost(rawHost: string | undefined): { apiHost?: string; uiHost?: string } {
  const host = (rawHost?.trim() ?? '').replace(/\/+$/, '')
  if (!host) return {}

  if (host === 'https://app.posthog.com') {
    return { uiHost: host }
  }

  return { apiHost: host }
}

const posthogKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined
if (posthogKey) {
  const { apiHost, uiHost } = normalizePostHogHost(import.meta.env.VITE_POSTHOG_HOST as string | undefined)

  posthog.init(posthogKey, {
    ...(apiHost ? { api_host: apiHost } : {}),
    ...(uiHost ? { ui_host: uiHost } : {}),
    persistence: 'memory', // keep analytics session-scoped unless a real consent flow is added
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_exceptions: true,
  })
} else if (import.meta.env.DEV) {
  console.info('[analytics] PostHog disabled: set VITE_POSTHOG_KEY in your .env to enable event capture.')
}

const root = document.getElementById('root')!
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
