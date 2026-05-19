import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import posthog from 'posthog-js'
import { getPostHogKey } from '@/analytics/config'

import App from './App'
import './index.css'

const posthogKey = getPostHogKey()
if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || '',
    persistence: 'memory', // keep analytics session-scoped unless a real consent flow is added
    autocapture: false,
    defaults: '2026-01-30',
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
