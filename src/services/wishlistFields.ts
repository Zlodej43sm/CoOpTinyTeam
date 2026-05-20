export const WISHLIST_FIELD_LIMITS = {
  participantName: 40,
  wishlistName: 80,
  itemTitle: 120,
  itemLink: 2048,
  itemDescription: 500,
} as const

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const TAG_LIKE = /<[^>]*>/g

import { normalizeWishlistLogoDataUrl } from '@/services/wishlistLogo'

export type WishlistItemFieldInput = {
  title: string
  link: string
  description: string
  image?: string | null
}

function stripUnsafeText(value: string, multiline = false): string {
  let next = value.replace(CONTROL_CHARS, '').replace(TAG_LIKE, '')

  if (multiline) {
    next = next.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  }

  return next
}

export function sanitizePlainTextInput(
  value: string,
  maxLength: number,
  options?: { multiline?: boolean },
): string {
  return stripUnsafeText(value, options?.multiline).slice(0, maxLength)
}

export function finalizePlainText(
  value: string,
  maxLength: number,
  options?: { multiline?: boolean },
): string {
  return stripUnsafeText(value, options?.multiline).slice(0, maxLength).trim()
}

export function sanitizeParticipantNameInput(value: string): string {
  return sanitizePlainTextInput(value, WISHLIST_FIELD_LIMITS.participantName)
}

export function finalizeParticipantName(value: string): string {
  return finalizePlainText(value, WISHLIST_FIELD_LIMITS.participantName)
}

export function sanitizeWishlistNameInput(value: string): string {
  return sanitizePlainTextInput(value, WISHLIST_FIELD_LIMITS.wishlistName)
}

export function finalizeWishlistName(value: string, fallback: string): string {
  const trimmed = finalizePlainText(value, WISHLIST_FIELD_LIMITS.wishlistName)
  return trimmed.length > 0 ? trimmed : fallback
}

export function sanitizeItemTitleInput(value: string): string {
  return sanitizePlainTextInput(value, WISHLIST_FIELD_LIMITS.itemTitle)
}

export function sanitizeItemLinkInput(value: string): string {
  return sanitizePlainTextInput(value, WISHLIST_FIELD_LIMITS.itemLink)
}

export function sanitizeItemDescriptionInput(value: string): string {
  return sanitizePlainTextInput(value, WISHLIST_FIELD_LIMITS.itemDescription, { multiline: true })
}

export function finalizeItemLink(value: string): string {
  const sanitized = finalizePlainText(value, WISHLIST_FIELD_LIMITS.itemLink)
  const normalized = normalizeExternalUrl(sanitized)
  return normalized || sanitized
}

export function sanitizeWishlistItemInput(input: WishlistItemFieldInput): WishlistItemFieldInput & {
  image: string | null
} {
  let image: string | null = null
  if (input.image !== undefined && input.image !== null && input.image.trim().length > 0) {
    image = normalizeWishlistLogoDataUrl(input.image)
  }

  return {
    title: finalizePlainText(input.title, WISHLIST_FIELD_LIMITS.itemTitle),
    link: finalizeItemLink(input.link),
    description: finalizePlainText(input.description, WISHLIST_FIELD_LIMITS.itemDescription, {
      multiline: true,
    }),
    image,
  }
}

export function normalizeExternalUrl(link: string): string {
  const trimmed = link.trim()
  if (!trimmed) return ''

  try {
    const url = trimmed.includes('://') ? new URL(trimmed) : new URL(`https://${trimmed}`)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    return url.toString()
  } catch {
    return ''
  }
}

export function hasDisplayableItemLink(link: string): boolean {
  return normalizeExternalUrl(link).length > 0
}
