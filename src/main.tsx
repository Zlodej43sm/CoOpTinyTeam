import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import posthog from 'posthog-js'
import App from './App'
import './index.css'

const posthogKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined
if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: import.meta.env.VITE_POSTHOG_HOST ?? 'https://app.posthog.com',
    persistence: 'memory', // cookieless — no consent banner needed
    autocapture: false,
  })
}

const root = document.getElementById('root')!
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
