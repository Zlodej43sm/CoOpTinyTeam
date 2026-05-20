export type LinkPreviewData = {
  kind: 'image' | 'page'
  url: string
  title?: string
  description?: string
  image?: string
  siteName?: string
}

const IMAGE_EXTENSION_PATTERN = /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)(\?|#|$)/i

export function isDirectImageUrl(url: string): boolean {
  try {
    const { pathname } = new URL(url)
    return IMAGE_EXTENSION_PATTERN.test(pathname)
  } catch {
    return false
  }
}

export function normalizePreviewUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  try {
    const url = trimmed.includes('://') ? new URL(trimmed) : new URL(`https://${trimmed}`)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

export function isPrivateOrBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (
    host === 'localhost'
    || host.endsWith('.localhost')
    || host.endsWith('.local')
    || host.endsWith('.internal')
    || host === 'metadata.google.internal'
  ) {
    return true
  }

  if (host === '0.0.0.0' || host === '::1' || host === '::') {
    return true
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4) {
    const octets = ipv4.slice(1, 5).map(Number)
    if (octets.some((value) => value > 255)) return true

    const [a, b] = octets
    if (a === 127 || a === 0) return true
    if (a === 10) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 169 && b === 254) return true
  }

  return false
}

export function isAllowedPreviewUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (isPrivateOrBlockedHost(parsed.hostname)) return false
    if (parsed.username || parsed.password) return false
    return true
  } catch {
    return false
  }
}

export function parseLinkPreviewHtml(
  html: string,
  pageUrl: string,
): Pick<LinkPreviewData, 'title' | 'description' | 'image' | 'siteName'> {
  const title =
    extractMetaContent(html, 'property', 'og:title')
    || extractMetaContent(html, 'name', 'twitter:title')
    || decodeHtmlEntities(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? '')

  const description =
    extractMetaContent(html, 'property', 'og:description')
    || extractMetaContent(html, 'name', 'description')
    || extractMetaContent(html, 'name', 'twitter:description')

  let image =
    extractMetaContent(html, 'property', 'og:image')
    || extractMetaContent(html, 'name', 'twitter:image')
    || extractMetaContent(html, 'name', 'twitter:image:src')

  if (image) {
    image = resolvePreviewAssetUrl(pageUrl, image)
  }

  const siteName = extractMetaContent(html, 'property', 'og:site_name')

  return {
    title: title || undefined,
    description: description || undefined,
    image: image || undefined,
    siteName: siteName || undefined,
  }
}

function extractMetaContent(html: string, attr: 'property' | 'name', key: string): string {
  const escapedKey = escapeRegExp(key)
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${escapedKey}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${escapedKey}["']`, 'i'),
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      return decodeHtmlEntities(match[1].trim())
    }
  }

  return ''
}

function resolvePreviewAssetUrl(baseUrl: string, assetUrl: string): string {
  try {
    return new URL(assetUrl, baseUrl).toString()
  } catch {
    return assetUrl
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
