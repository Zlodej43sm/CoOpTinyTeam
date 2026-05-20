import {
  isDirectImageUrl,
  normalizePreviewUrl,
  type LinkPreviewData,
} from '@/services/linkPreviewShared'

export type { LinkPreviewData } from '@/services/linkPreviewShared'
export { getLinkPreviewHostname, isDirectImageUrl } from '@/services/linkPreviewShared'

export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreviewData | null> {
  const normalized = normalizePreviewUrl(rawUrl)
  if (!normalized) return null

  if (isDirectImageUrl(normalized)) {
    return {
      kind: 'image',
      url: normalized,
      image: normalized,
    }
  }

  try {
    const response = await fetch(
      `/api/link-preview?url=${encodeURIComponent(normalized)}`,
    )

    if (!response.ok) return null

    const data = await response.json() as Partial<LinkPreviewData>
    if (!data.url) return null

    return {
      kind: data.kind === 'image' ? 'image' : 'page',
      url: data.url,
      title: data.title,
      description: data.description,
      image: data.image,
      siteName: data.siteName,
    }
  } catch {
    return null
  }
}

export function getPreviewImageSrc(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined
  if (imageUrl.startsWith('/')) return imageUrl

  const normalized = normalizePreviewUrl(imageUrl)
  if (!normalized) return undefined

  if (normalized.includes('google.com/s2/favicons')) {
    return normalized
  }

  return `/api/link-preview/image?url=${encodeURIComponent(normalized)}`
}
