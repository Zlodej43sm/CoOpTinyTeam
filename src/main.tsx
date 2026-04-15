import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import posthog from 'posthog-js'
import { getPostHogKey } from '@/analytics/config'
import App from './App'
import './index.css'

const POSTHOG_US_UI_HOST = 'https://app.posthog.com'
const POSTHOG_US_API_HOST = 'https://us.i.posthog.com'
const POSTHOG_EU_UI_HOST = 'https://eu.posthog.com'
const POSTHOG_EU_API_HOST = 'https://eu.i.posthog.com'

function normalizePostHogHost(rawHost: string | undefined): { apiHost?: string; uiHost?: string } {
  const host = (rawHost?.trim() ?? '').replace(/\/+$/, '')
  if (!host) return {}

  if (host === POSTHOG_US_UI_HOST) {
    return { apiHost: POSTHOG_US_API_HOST, uiHost: host }
  }

  if (host === POSTHOG_EU_UI_HOST) {
    return { apiHost: POSTHOG_EU_API_HOST, uiHost: host }
  }

  if (host === POSTHOG_US_API_HOST) {
    return { apiHost: host, uiHost: POSTHOG_US_UI_HOST }
  }

  if (host === POSTHOG_EU_API_HOST) {
    return { apiHost: host, uiHost: POSTHOG_EU_UI_HOST }
  }

  return { apiHost: host }
}

const posthogKey = getPostHogKey()
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
