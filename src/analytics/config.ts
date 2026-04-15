export function getPostHogKey(): string | undefined {
  const rawKey = import.meta.env.VITE_POSTHOG_KEY
  const key = rawKey?.trim()
  return key ? key : undefined
}

export function isPostHogEnabled(): boolean {
  return typeof window !== 'undefined' && Boolean(getPostHogKey())
}
