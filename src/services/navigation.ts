import type { GamePhase } from '@/types'

export const WISHLIST_PATH = '/wishlist'

export function getPhaseFromPath(pathname = getCurrentPathname()): GamePhase | null {
  return getWishlistIdFromPath(pathname) !== null || pathname === WISHLIST_PATH
    ? 'wishlist'
    : null
}

export function getWishlistIdFromPath(pathname = getCurrentPathname()): string | null {
  const match = pathname.match(/^\/wishlist\/([^/?#]+)/)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

export function getWishlistEditToken(): string | null {
  if (typeof window === 'undefined') return null

  const token = new URLSearchParams(window.location.search).get('edit')?.trim()
  return token && token.length > 0 ? token : null
}

export function pushWishlistPath(wishlistId?: string): void {
  pushPath(wishlistId ? `${WISHLIST_PATH}/${encodeURIComponent(wishlistId)}` : WISHLIST_PATH)
}

export function replaceWishlistPath(wishlistId: string, editToken?: string | null): void {
  const suffix = editToken ? `?edit=${encodeURIComponent(editToken)}` : ''
  replacePath(`${WISHLIST_PATH}/${encodeURIComponent(wishlistId)}${suffix}`)
}

export function pushHomePath(): void {
  pushPath('/')
}

function getCurrentPathname(): string {
  if (typeof window === 'undefined') return '/'
  return window.location.pathname
}

function pushPath(path: string): void {
  if (typeof window === 'undefined') return
  window.history.pushState(null, '', path)
}

function replacePath(path: string): void {
  if (typeof window === 'undefined') return
  window.history.replaceState(null, '', path)
}
