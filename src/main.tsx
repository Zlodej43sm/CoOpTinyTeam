import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import posthog from 'posthog-js'
import { getPostHogHost, getPostHogKey } from '@/analytics/config'

import App from './App'
import './index.css'

const posthogKey = getPostHogKey()
if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: getPostHogHost(),
    // No cookies, no localStorage — visitor identity is a privacy-preserving hash
    // derived server-side, so we get real unique-visitor/session counts without a
    // consent banner. Supersedes the old `persistence: 'memory'`, which reset the
    // distinct_id on every reload and inflated those counts.
    // REQUIRES "cookieless mode" to be enabled in the PostHog project settings —
    // if it is off, PostHog silently discards every event sent this way.
    cookieless_mode: 'always',
    autocapture: false,
    defaults: '2026-01-30',
    // SPA: routing goes through history.pushState (see services/navigation), so
    // 'history_change' is what emits $pageview on load *and* on route changes.
    capture_pageview: 'history_change',
    capture_pageleave: 'if_capture_pageview',
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
