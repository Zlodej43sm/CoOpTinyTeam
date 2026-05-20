export const WISHLIST_LOGO_MAX_BYTES = 300 * 1024

const ALLOWED_LOGO_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
])

export type WishlistLogoError = 'invalid-type' | 'too-large' | 'read-failed' | 'invalid-data'

export async function readWishlistLogoFile(file: File): Promise<string> {
  if (!ALLOWED_LOGO_MIME_TYPES.has(file.type)) {
    throw new Error('invalid-type')
  }

  if (file.size > WISHLIST_LOGO_MAX_BYTES) {
    throw new Error('too-large')
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('read-failed'))
        return
      }
      resolve(reader.result)
    }
    reader.onerror = () => reject(new Error('read-failed'))
    reader.readAsDataURL(file)
  })

  const normalized = normalizeWishlistLogoDataUrl(dataUrl)
  if (!normalized) {
    throw new Error('invalid-data')
  }

  return normalized
}

export function normalizeWishlistLogoDataUrl(value: string | null | undefined): string | null {
  if (!value) return null

  const trimmed = value.trim()
  if (!trimmed) return null

  const match = trimmed.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,([a-z0-9+/=\s]+)$/i)
  if (!match) {
    throw new Error('invalid-data')
  }

  const mime = match[1]?.toLowerCase()
  const base64 = match[2]?.replace(/\s/g, '') ?? ''

  if (!mime || !ALLOWED_LOGO_MIME_TYPES.has(mime)) {
    throw new Error('invalid-type')
  }

  const byteLength = estimateBase64Bytes(base64)
  if (byteLength > WISHLIST_LOGO_MAX_BYTES) {
    throw new Error('too-large')
  }

  return `data:${mime};base64,${base64}`
}

function estimateBase64Bytes(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}
