import { useEffect, useState, type CSSProperties } from 'react'
import type { ThemeDefinition } from '@/game/config/theme'
import {
  fetchLinkPreview,
  getLinkPreviewHostname,
  isDirectImageUrl,
  type LinkPreviewData,
} from '@/services/linkPreview'
import { useTranslation } from '@/hooks/useTranslation'

type WishlistUi = ThemeDefinition['ui']

export function WishlistLinkPreview({
  href,
  ui,
  locked,
}: {
  href: string
  ui: WishlistUi
  locked: boolean
}) {
  const { messages } = useTranslation()
  const wl = messages.wishlist
  const directImage = isDirectImageUrl(href)
  const [preview, setPreview] = useState<LinkPreviewData | null>(
    directImage ? { kind: 'image', url: href, image: href } : null,
  )
  const [loading, setLoading] = useState(!directImage)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    if (directImage) {
      setPreview({ kind: 'image', url: href, image: href })
      setLoading(false)
      setImageFailed(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setImageFailed(false)
    setPreview(null)

    void fetchLinkPreview(href).then((result) => {
      if (cancelled) return
      setPreview(result)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [directImage, href])

  if (loading) {
    return <div style={previewSkeletonStyle(ui)} aria-hidden="true" />
  }

  const previewImage = preview?.image && !imageFailed ? preview.image : null

  if (preview?.kind === 'image' && previewImage) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        style={previewLinkStyle(locked)}
        aria-label={wl.openLink}
      >
        <img
          src={previewImage}
          alt=""
          style={previewImageStyle(ui, locked)}
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      </a>
    )
  }

  if (preview && (previewImage || preview.title || preview.description)) {
    const hostname = getLinkPreviewHostname(preview.url)

    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        style={previewCardStyle(ui, locked)}
        aria-label={preview.title || wl.openLink}
      >
        {previewImage ? (
          <img
            src={previewImage}
            alt=""
            style={previewCardImageStyle(ui)}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        ) : null}
        <div style={previewCardBodyStyle}>
          {preview.title ? (
            <div style={previewCardTitleStyle(ui, locked)}>{preview.title}</div>
          ) : null}
          {preview.description ? (
            <div style={previewCardDescriptionStyle(ui, locked)}>{preview.description}</div>
          ) : null}
          <div style={previewCardHostStyle(ui)}>{preview.siteName || hostname}</div>
        </div>
      </a>
    )
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" style={fallbackLinkStyle(ui, locked)}>
      {wl.openLink}
    </a>
  )
}

function previewLinkStyle(locked: boolean): CSSProperties {
  return {
    display: 'block',
    lineHeight: 0,
    borderRadius: 10,
    overflow: 'hidden',
    textDecoration: locked ? 'line-through' : 'none',
    opacity: locked ? 0.72 : 1,
  }
}

function previewImageStyle(ui: WishlistUi, locked: boolean): CSSProperties {
  return {
    display: 'block',
    width: '100%',
    maxHeight: 180,
    objectFit: 'cover',
    borderRadius: 10,
    border: previewBorder(ui),
    background: previewImageBg(ui),
    boxShadow: previewShadow(ui),
    opacity: locked ? 0.82 : 1,
  }
}

function previewSkeletonStyle(ui: WishlistUi): CSSProperties {
  return {
    width: '100%',
    height: 120,
    borderRadius: 10,
    border: previewBorder(ui),
    background: previewSkeletonBg(ui),
    backgroundSize: '200% 100%',
    boxShadow: previewShadow(ui),
    animation: 'wishlist-preview-shimmer 1.2s ease-in-out infinite',
  }
}

function previewCardStyle(ui: WishlistUi, locked: boolean): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: 'minmax(72px, 96px) minmax(0, 1fr)',
    gap: '0.75rem',
    alignItems: 'stretch',
    padding: '0.65rem',
    borderRadius: 10,
    border: previewBorder(ui),
    background: previewSurfaceBg(ui),
    color: ui.text,
    textDecoration: locked ? 'line-through' : 'none',
    opacity: locked ? 0.78 : 1,
    overflow: 'hidden',
    boxShadow: previewShadow(ui),
  }
}

function previewCardImageStyle(ui: WishlistUi): CSSProperties {
  return {
    width: '100%',
    height: '100%',
    minHeight: 72,
    objectFit: 'cover',
    borderRadius: 8,
    border: previewBorder(ui),
    background: previewImageBg(ui),
  }
}

const previewCardBodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
  minWidth: 0,
}

function previewCardTitleStyle(ui: WishlistUi, locked: boolean): CSSProperties {
  return {
    color: ui.text,
    fontSize: '0.92rem',
    fontWeight: 700,
    lineHeight: 1.35,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    textDecoration: locked ? 'line-through' : 'none',
  }
}

function previewCardDescriptionStyle(ui: WishlistUi, locked: boolean): CSSProperties {
  return {
    color: previewMutedText(ui),
    fontSize: '0.82rem',
    lineHeight: 1.4,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    textDecoration: locked ? 'line-through' : 'none',
  }
}

function previewCardHostStyle(ui: WishlistUi): CSSProperties {
  return {
    color: ui.secondary,
    fontSize: '0.78rem',
    fontWeight: 700,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }
}

function previewSurfaceBg(ui: WishlistUi): string {
  if (isDarkWishlistUi(ui)) {
    return `linear-gradient(180deg, ${alpha('#ffffff', 0.18)} 0%, ${alpha('#ffffff', 0.1)} 100%)`
  }

  return `linear-gradient(180deg, ${alpha('#ffffff', 0.98)} 0%, ${alpha('#f5fbfd', 0.94)} 100%)`
}

function previewImageBg(ui: WishlistUi): string {
  return isDarkWishlistUi(ui) ? alpha('#ffffff', 0.12) : alpha('#ffffff', 0.96)
}

function previewSkeletonBg(ui: WishlistUi): string {
  if (isDarkWishlistUi(ui)) {
    return `linear-gradient(90deg, ${alpha('#ffffff', 0.08)} 0%, ${alpha('#ffffff', 0.22)} 50%, ${alpha('#ffffff', 0.08)} 100%)`
  }

  return `linear-gradient(90deg, ${alpha('#d8ebf0', 0.55)} 0%, ${alpha('#ffffff', 0.95)} 50%, ${alpha('#d8ebf0', 0.55)} 100%)`
}

function previewBorder(ui: WishlistUi): string {
  return isDarkWishlistUi(ui)
    ? `1px solid ${alpha('#ffffff', 0.22)}`
    : `1px solid ${alpha(ui.secondary, 0.24)}`
}

function previewShadow(ui: WishlistUi): string {
  return isDarkWishlistUi(ui)
    ? `0 8px 20px ${alpha('#000000', 0.16)}, inset 0 1px 0 ${alpha('#ffffff', 0.08)}`
    : `0 8px 18px ${alpha('#183444', 0.08)}`
}

function previewMutedText(ui: WishlistUi): string {
  return isDarkWishlistUi(ui) ? alpha('#e8fff5', 0.82) : ui.muted
}

function isDarkWishlistUi(ui: WishlistUi): boolean {
  return relativeLuminance(ui.text) > 0.55
}

function fallbackLinkStyle(ui: WishlistUi, locked: boolean): CSSProperties {
  return {
    color: ui.secondary,
    fontSize: '0.92rem',
    fontWeight: 700,
    letterSpacing: 0,
    textDecoration: locked ? 'line-through' : 'none',
    opacity: locked ? 0.7 : 1,
  }
}

function alpha(color: string, opacity: number): string {
  if (color.startsWith('rgba(') || color.startsWith('rgb(')) {
    const parts = color.match(/[\d.]+/g)
    if (parts && parts.length >= 3) {
      const [red, green, blue] = parts
      return `rgba(${red}, ${green}, ${blue}, ${opacity})`
    }
  }

  const normalized = color.replace('#', '')
  const step = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized
  const red = parseInt(step.slice(0, 2), 16)
  const green = parseInt(step.slice(2, 4), 16)
  const blue = parseInt(step.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`
}

function relativeLuminance(color: string): number {
  const rgb = parseHexColor(color)
  if (!rgb) return 0

  const channels = [rgb.red, rgb.green, rgb.blue].map((value) => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

function parseHexColor(color: string): { red: number; green: number; blue: number } | null {
  if (!color.startsWith('#')) return null

  const normalized = color.slice(1)
  const step = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized

  if (step.length !== 6) return null

  return {
    red: parseInt(step.slice(0, 2), 16),
    green: parseInt(step.slice(2, 4), 16),
    blue: parseInt(step.slice(4, 6), 16),
  }
}
