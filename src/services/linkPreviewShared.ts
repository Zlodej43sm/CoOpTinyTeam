export type LinkPreviewData = {
  kind: 'image' | 'page'
  url: string
  title?: string
  description?: string
  image?: string
  siteName?: string
}

const IMAGE_EXTENSION_PATTERN = /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)(\?|#|$)/i

const PREVIEW_CANONICAL_HOSTS = new Set([
  'empik.com',
  'allegro.pl',
  'allegro.com',
])

const TRACKING_QUERY_PREFIXES = [
  'utm_',
  'gad_',
  'gcl',
  'cq_',
  'fbclid',
  'mc_',
  'ref',
]

export const PREVIEW_FETCH_HEADERS: HeadersInit = {
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'accept-language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
}

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

export function canonicalizePreviewFetchUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')

    if (PREVIEW_CANONICAL_HOSTS.has(host)) {
      parsed.search = ''
      parsed.hash = ''
      return parsed.toString()
    }

    for (const key of [...parsed.searchParams.keys()]) {
      if (TRACKING_QUERY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        parsed.searchParams.delete(key)
      }
    }

    return parsed.toString()
  } catch {
    return url
  }
}

export function getFaviconPreviewUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`
  } catch {
    return 'https://www.google.com/s2/favicons?domain=web&sz=128'
  }
}

export function titleFromPreviewUrl(url: string): string | undefined {
  try {
    const { pathname } = new URL(url)
    const segments = pathname.split('/').filter(Boolean)
    const slug = segments[segments.length - 1]
    if (!slug) return undefined

    const cleaned = slug
      .replace(/-\d{8,}$/, '')
      .replace(/[_-]+/g, ' ')
      .trim()

    if (cleaned.length < 3) return undefined

    return cleaned
      .split(/\s+/)
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  } catch {
    return undefined
  }
}

export function buildLinkPreviewFallback(url: string): LinkPreviewData {
  const hostname = getLinkPreviewHostname(url)

  return {
    kind: 'page',
    url,
    title: titleFromPreviewUrl(url),
    siteName: hostname,
    image: getFaviconPreviewUrl(url),
  }
}

export function getLinkPreviewHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '')
  } catch {
    return url
  }
}

export function parseLinkPreviewHtml(
  html: string,
  pageUrl: string,
): Pick<LinkPreviewData, 'title' | 'description' | 'image' | 'siteName'> {
  const jsonLd = parseJsonLdPreview(html, pageUrl)

  const title =
    extractMetaContent(html, 'property', 'og:title')
    || extractMetaContent(html, 'name', 'twitter:title')
    || jsonLd.title
    || decodeHtmlEntities(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? '')

  const description =
    extractMetaContent(html, 'property', 'og:description')
    || extractMetaContent(html, 'name', 'description')
    || extractMetaContent(html, 'name', 'twitter:description')
    || jsonLd.description

  let image =
    extractMetaContent(html, 'property', 'og:image')
    || extractMetaContent(html, 'name', 'twitter:image')
    || extractMetaContent(html, 'name', 'twitter:image:src')
    || extractLinkTagHref(html, 'image_src')
    || jsonLd.image

  if (image) {
    image = resolvePreviewAssetUrl(pageUrl, image)
  }

  const siteName =
    extractMetaContent(html, 'property', 'og:site_name')
    || jsonLd.siteName

  return {
    title: title || undefined,
    description: description || undefined,
    image: image || undefined,
    siteName: siteName || undefined,
  }
}

export function mergeLinkPreviewData(
  url: string,
  preview: Pick<LinkPreviewData, 'title' | 'description' | 'image' | 'siteName'>,
): LinkPreviewData {
  const fallback = buildLinkPreviewFallback(url)

  return {
    kind: 'page',
    url,
    title: preview.title || fallback.title,
    description: preview.description,
    image: preview.image || fallback.image,
    siteName: preview.siteName || fallback.siteName,
  }
}

function extractLinkTagHref(html: string, rel: string): string {
  const escapedRel = escapeRegExp(rel)
  const patterns = [
    new RegExp(`<link[^>]+rel=["']${escapedRel}["'][^>]+href=["']([^"']+)["']`, 'i'),
    new RegExp(`<link[^>]+href=["']([^"']+)["'][^>]+rel=["']${escapedRel}["']`, 'i'),
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      return decodeHtmlEntities(match[1].trim())
    }
  }

  return ''
}

function parseJsonLdPreview(
  html: string,
  pageUrl: string,
): Pick<LinkPreviewData, 'title' | 'description' | 'image' | 'siteName'> {
  const scripts = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  ) ?? []

  for (const script of scripts) {
    const payload = script.replace(/^[\s\S]*?>/, '').replace(/<\/script>\s*$/i, '').trim()
    if (!payload) continue

    try {
      const parsed = JSON.parse(payload) as unknown
      const node = findJsonLdProductNode(parsed)
      if (!node) continue

      const image = normalizeJsonLdImage(node.image, pageUrl)
      const title = typeof node.name === 'string' ? node.name : undefined
      const description = typeof node.description === 'string' ? node.description : undefined

      if (title || description || image) {
        return { title, description, image, siteName: undefined }
      }
    } catch {
      // ignore invalid JSON-LD blocks
    }
  }

  return {}
}

function findJsonLdProductNode(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const match = findJsonLdProductNode(entry)
      if (match) return match
    }
    return null
  }

  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const typeValue = record['@type']
  const types = Array.isArray(typeValue) ? typeValue : [typeValue]
  const isProduct = types.some((type) => (
    typeof type === 'string' && /product/i.test(type)
  ))

  if (isProduct) return record

  if (Array.isArray(record['@graph'])) {
    return findJsonLdProductNode(record['@graph'])
  }

  return null
}

function normalizeJsonLdImage(image: unknown, pageUrl: string): string | undefined {
  if (typeof image === 'string') {
    return resolvePreviewAssetUrl(pageUrl, image)
  }

  if (Array.isArray(image)) {
    for (const entry of image) {
      const normalized = normalizeJsonLdImage(entry, pageUrl)
      if (normalized) return normalized
    }
    return undefined
  }

  if (image && typeof image === 'object') {
    const url = (image as { url?: unknown }).url
    if (typeof url === 'string') {
      return resolvePreviewAssetUrl(pageUrl, url)
    }
  }

  return undefined
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
