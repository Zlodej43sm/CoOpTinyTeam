import { useRef, type CSSProperties } from 'react'
import type { ThemeDefinition } from '@/game/config/theme'
import { readWishlistLogoFile } from '@/services/wishlistLogo'
import { useTranslation } from '@/hooks/useTranslation'

type WishlistUi = ThemeDefinition['ui']

export type WishlistItemImageFieldProps = {
  ui: WishlistUi
  value: string | null
  onChange: (image: string | null) => void
  onError?: (message: string) => void
  disabled?: boolean
  compact?: boolean
}

export function WishlistItemImageField({
  ui,
  value,
  onChange,
  onError,
  disabled = false,
  compact = false,
}: WishlistItemImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { messages } = useTranslation()
  const wl = messages.wishlist
  const notices = wl.notices

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const dataUrl = await readWishlistLogoFile(file)
      onChange(dataUrl)
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      if (code === 'too-large') {
        onError?.(notices.logoTooLarge)
      } else if (code === 'invalid-type' || code === 'invalid-data') {
        onError?.(notices.logoInvalidType)
      } else {
        onError?.(notices.logoUploadFailed)
      }
    }
  }

  return (
    <div style={wrapStyle(compact)}>
      <span style={labelStyle(ui)}>{wl.itemPhotoLabel}</span>
      <div style={rowStyle(compact)}>
        {value ? (
          <img src={value} alt="" style={previewStyle(ui, compact)} />
        ) : (
          <div style={placeholderStyle(ui, compact)} aria-hidden="true">
            <PhotoIcon />
          </div>
        )}
        <div style={actionsStyle}>
          <p style={hintStyle(ui)}>{wl.itemPhotoHint}</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => void handleFileChange(event)}
            disabled={disabled}
            style={{ display: 'none' }}
          />
          <div style={buttonRowStyle}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              style={secondaryButtonStyle(ui, disabled)}
            >
              {value ? wl.changeItemPhoto : wl.uploadItemPhoto}
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => onChange(null)}
                disabled={disabled}
                style={dangerButtonStyle(ui, disabled)}
              >
                {wl.removeItemPhoto}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function PhotoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8.5" cy="10" r="1.6" fill="currentColor" />
      <path d="M7 16l3.5-3.5 2.5 2.5L15 12l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

const wrapStyle = (compact: boolean): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  gap: compact ? '0.42rem' : '0.55rem',
  gridColumn: compact ? undefined : '1 / -1',
})

const rowStyle = (compact: boolean): CSSProperties => ({
  display: 'flex',
  gap: compact ? '0.75rem' : '1rem',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
})

const actionsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.55rem',
  flex: '1 1 180px',
  minWidth: 0,
}

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  gap: '0.55rem',
  flexWrap: 'wrap',
}

function previewStyle(ui: WishlistUi, compact: boolean): CSSProperties {
  return {
    width: compact ? 72 : 88,
    height: compact ? 72 : 88,
    objectFit: 'cover',
    borderRadius: compact ? 12 : 14,
    border: `1px solid ${ui.subtleBorder}`,
    background: ui.controlBg,
    flexShrink: 0,
  }
}

function placeholderStyle(ui: WishlistUi, compact: boolean): CSSProperties {
  return {
    width: compact ? 72 : 88,
    height: compact ? 72 : 88,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: compact ? 12 : 14,
    border: `1px dashed ${ui.subtleBorder}`,
    background: ui.selectorBackground,
    color: ui.muted,
    flexShrink: 0,
  }
}

function labelStyle(ui: WishlistUi): CSSProperties {
  return {
    color: ui.muted,
    fontSize: '0.78rem',
    fontWeight: 700,
    letterSpacing: '0.02em',
  }
}

function hintStyle(ui: WishlistUi): CSSProperties {
  return {
    margin: 0,
    color: ui.muted,
    fontSize: '0.82rem',
    lineHeight: 1.45,
  }
}

function secondaryButtonStyle(ui: WishlistUi, disabled: boolean): CSSProperties {
  return {
    minHeight: 40,
    background: ui.controlBg,
    border: `1px solid ${ui.subtleBorder}`,
    color: ui.secondary,
    padding: '0.5rem 0.75rem',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 10,
    opacity: disabled ? 0.65 : 1,
  }
}

function dangerButtonStyle(ui: WishlistUi, disabled: boolean): CSSProperties {
  return {
    minHeight: 40,
    background: ui.controlBg,
    border: `1px solid ${ui.subtleBorder}`,
    color: ui.danger,
    padding: '0.5rem 0.75rem',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 10,
    opacity: disabled ? 0.65 : 1,
  }
}

export function WishlistItemPhoto({
  ui,
  src,
  locked = false,
}: {
  ui: WishlistUi
  src: string
  locked?: boolean
}) {
  return (
    <img
      src={src}
      alt=""
      style={{
        display: 'block',
        width: '100%',
        maxHeight: 160,
        objectFit: 'cover',
        borderRadius: 10,
        border: `1px solid ${ui.subtleBorder}`,
        background: ui.selectorBackground,
        opacity: locked ? 0.78 : 1,
      }}
    />
  )
}
