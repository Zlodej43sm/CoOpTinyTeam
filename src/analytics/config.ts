// EU cloud — the project this app reports to lives on eu.posthog.com.
const DEFAULT_POSTHOG_HOST = 'https://eu.i.posthog.com'

export function getPostHogKey(): string | undefined {
  const rawKey = import.meta.env.VITE_POSTHOG_KEY
  const key = rawKey?.trim()
  return key ? key : undefined
}

// Never return an empty host: posthog-js would then post to a relative /e/ path
// on our own origin and every event would be silently dropped.
export function getPostHogHost(): string {
  const host = import.meta.env.VITE_POSTHOG_HOST?.trim()
  return host ? host.replace(/\/+$/, '') : DEFAULT_POSTHOG_HOST
}

export function isPostHogEnabled(): boolean {
  return typeof window !== 'undefined' && Boolean(getPostHogKey())
}
