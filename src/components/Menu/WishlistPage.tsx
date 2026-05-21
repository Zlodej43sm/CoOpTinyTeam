import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentProps } from 'react'
import type { CSSProperties } from 'react'
import QRCode from 'react-qr-code'
import type { ThemeDefinition } from '@/game/config/theme'
import { getWishlistEditToken, getWishlistIdFromPath, pushHomePath, replaceWishlistPath } from '@/services/navigation'
import {
  addWishlistItem,
  claimWishlistItem,
  createOwnedWishlist,
  deleteWishlist,
  deleteWishlistItem,
  getStoredParticipantName,
  listOwnedWishlists,
  type OwnedWishlist,
  loadWishlist,
  refreshWishlist,
  releaseWishlistItem,
  renameWishlist,
  saveParticipantName,
  updateWishlistItem,
  updateWishlistLogo,
} from '@/services/wishlist'
import { readWishlistLogoFile } from '@/services/wishlistLogo'
import {
  finalizeParticipantName,
  hasDisplayableItemLink,
  normalizeExternalUrl,
  sanitizeItemDescriptionInput,
  sanitizeItemLinkInput,
  sanitizeItemTitleInput,
  sanitizeParticipantNameInput,
  sanitizeWishlistNameInput,
  WISHLIST_FIELD_LIMITS,
} from '@/services/wishlistFields'
import {
  getJoinedViewerName,
  saveJoinedViewerName,
} from '@/services/wishlistViewer'
import { useResolvedColorScheme } from '@/hooks/useResolvedColorScheme'
import { useTranslation } from '@/hooks/useTranslation'
import { useGameStore } from '@/store/gameStore'
import type { Wishlist, WishlistAccess, WishlistItem } from '@/types'
import type { Messages } from '@/i18n/types'
import { formatMessage } from '@/i18n'
import { trackNavigationClick } from '@/analytics/events'
import { WishlistLinkPreview } from '@/components/Menu/WishlistLinkPreview'
import { WishlistItemImageField, WishlistItemPhoto } from '@/components/Menu/WishlistItemImageField'

type WishlistMode = 'cloud' | 'local'
type WishlistUi = ThemeDefinition['ui']
type BusyAction =
  | 'load'
  | 'new-list'
  | 'open-list'
  | 'delete-list'
  | 'copy-share'
  | 'copy-edit'
  | 'save-name'
  | 'save-logo'
  | 'add-item'
  | 'refresh'
  | `claim-${string}`
  | `delete-${string}`
  | `release-${string}`
  | `edit-${string}`
  | null

const APP_LOGO_URL = '/assets/logo.mini.webp'

const EMPTY_ACCESS: WishlistAccess = {
  canEdit: false,
  editToken: null,
}

const EMPTY_ITEM_DRAFT = {
  title: '',
  link: '',
  description: '',
  image: null as string | null,
}

const WISHLIST_UI_DARK: WishlistUi = {
  appBackground:
    'radial-gradient(circle at 18% 12%, rgba(109, 220, 255, 0.16) 0%, rgba(109, 220, 255, 0) 26%), radial-gradient(circle at 82% 10%, rgba(255, 216, 112, 0.1) 0%, rgba(255, 216, 112, 0) 24%), radial-gradient(circle at top, rgba(28, 63, 70, 0.92) 0%, rgba(10, 15, 24, 0.98) 48%, rgba(4, 6, 10, 1) 100%)',
  panelBorder: 'rgba(109, 220, 255, 0.24)',
  panelBackground: 'linear-gradient(180deg, rgba(18, 34, 43, 0.95) 0%, rgba(9, 15, 22, 0.98) 100%)',
  panelShadow: '0 24px 64px rgba(0, 0, 0, 0.34), 0 0 24px rgba(109, 220, 255, 0.08)',
  text: '#e8fff5',
  muted: '#a6c7c1',
  accent: '#7dffb2',
  secondary: '#79d9ff',
  warning: '#ffd870',
  danger: '#ff8a9c',
  logoGlow: 'none',
  hudGradient: 'transparent',
  controlBg: 'rgba(12, 24, 38, 0.84)',
  score: '#7dffb2',
  scoreShadow: 'none',
  badge: '#79d9ff',
  badgeShadow: 'none',
  livesColor: '#ff8a9c',
  livesBackground: 'rgba(82, 18, 30, 0.42)',
  livesBorder: 'rgba(255, 138, 156, 0.36)',
  livesShadow: 'none',
  subtleBorder: 'rgba(255, 255, 255, 0.12)',
  inactiveButtonBorder: 'rgba(166, 199, 193, 0.28)',
  inactiveButtonColor: '#8ea7a3',
  selectorBackground: 'rgba(255, 255, 255, 0.045)',
}

const WISHLIST_UI_LIGHT: WishlistUi = {
  appBackground:
    'radial-gradient(circle at 18% 12%, rgba(109, 220, 255, 0.24) 0%, rgba(109, 220, 255, 0) 28%), radial-gradient(circle at 82% 10%, rgba(255, 216, 112, 0.2) 0%, rgba(255, 216, 112, 0) 26%), radial-gradient(circle at top, rgba(244, 250, 252, 1) 0%, rgba(228, 241, 245, 0.98) 48%, rgba(210, 228, 234, 1) 100%)',
  panelBorder: 'rgba(16, 78, 92, 0.28)',
  panelBackground: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 250, 252, 0.98) 100%)',
  panelShadow: '0 24px 64px rgba(24, 52, 68, 0.12), 0 0 24px rgba(109, 220, 255, 0.1)',
  text: '#0a2228',
  muted: '#2a454c',
  accent: '#146b44',
  secondary: '#0a6280',
  warning: '#9a6800',
  danger: '#a82f44',
  logoGlow: 'none',
  hudGradient: 'transparent',
  controlBg: 'rgba(255, 255, 255, 0.94)',
  score: '#146b44',
  scoreShadow: 'none',
  badge: '#0a6280',
  badgeShadow: 'none',
  livesColor: '#a82f44',
  livesBackground: 'rgba(255, 220, 225, 0.72)',
  livesBorder: 'rgba(168, 47, 68, 0.36)',
  livesShadow: 'none',
  subtleBorder: 'rgba(10, 34, 40, 0.22)',
  inactiveButtonBorder: 'rgba(42, 69, 76, 0.45)',
  inactiveButtonColor: '#254047',
  selectorBackground: 'rgba(10, 34, 40, 0.06)',
}

const WISHLIST_UI_BY_SCHEME = {
  dark: WISHLIST_UI_DARK,
  light: WISHLIST_UI_LIGHT,
} as const

const relaxedFontStack = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
const arcadeFontStack = '"Press Start 2P", monospace'

function LoadingSpinner({ ui }: { ui: WishlistUi }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        border: `2px solid ${alpha(ui.secondary, 0.24)}`,
        borderTopColor: ui.secondary,
        animation: 'wishlist-button-spin 0.75s linear infinite',
        flexShrink: 0,
      }}
    />
  )
}

function ActionButton({
  ui,
  busy = false,
  busyLabel,
  children,
  style,
  ...props
}: ComponentProps<'button'> & { ui: WishlistUi; busy?: boolean; busyLabel?: string }) {
  const disabled = busy || props.disabled

  return (
    <button
      {...props}
      disabled={disabled}
      aria-busy={busy || undefined}
      style={{
        ...style,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.45rem',
        cursor: disabled ? 'not-allowed' : style?.cursor ?? 'pointer',
        opacity: disabled && !props.disabled ? 0.72 : style?.opacity,
      }}
    >
      {busy ? (
        <>
          <LoadingSpinner ui={ui} />
          <span>{busyLabel ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 20h9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconActionButton({
  ui,
  label,
  tone = 'neutral',
  busy = false,
  busyLabel,
  style,
  children,
  ...props
}: ComponentProps<'button'> & {
  ui: WishlistUi
  label: string
  tone?: 'neutral' | 'danger'
  busy?: boolean
  busyLabel?: string
}) {
  const disabled = busy || props.disabled

  return (
    <button
      {...props}
      type="button"
      aria-label={label}
      title={busy && busyLabel ? busyLabel : label}
      disabled={disabled}
      aria-busy={busy || undefined}
      style={{
        ...iconActionButtonStyle(ui, tone),
        ...style,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled && !props.disabled ? 0.72 : undefined,
      }}
    >
      {busy ? <LoadingSpinner ui={ui} /> : children}
    </button>
  )
}

function ExpandableDescription({
  text,
  ui,
  muted = false,
}: {
  text: string
  ui: WishlistUi
  muted?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [canExpand, setCanExpand] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)
  const { messages } = useTranslation()
  const c = messages.common

  useLayoutEffect(() => {
    const element = textRef.current
    if (!element || expanded) return
    setCanExpand(element.scrollHeight > element.clientHeight + 1)
  }, [expanded, text])

  if (!text) return null

  return (
    <div style={descriptionBlockStyle}>
      <p
        ref={textRef}
        style={{
          ...itemDescriptionStyle(ui, muted),
          ...(expanded ? {} : descriptionClampStyle),
        }}
      >
        {text}
      </p>
      {(canExpand || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          style={descriptionToggleStyle(ui)}
        >
          {expanded ? c.showLess : c.showMore}
        </button>
      )}
    </div>
  )
}

export default function WishlistPage() {
  const setPhase = useGameStore((s) => s.setPhase)
  const { messages, t } = useTranslation()
  const wl = messages.wishlist
  const notices = wl.notices
  const resolvedColorScheme = useResolvedColorScheme()
  const ui = WISHLIST_UI_BY_SCHEME[resolvedColorScheme]
  const [wishlist, setWishlist] = useState<Wishlist | null>(null)
  const [ownedWishlists, setOwnedWishlists] = useState<OwnedWishlist[]>([])
  const [mode, setMode] = useState<WishlistMode>('local')
  const [access, setAccess] = useState<WishlistAccess>(EMPTY_ACCESS)
  const [busyAction, setBusyAction] = useState<BusyAction>('load')
  const [notice, setNotice] = useState('')
  const [participantName, setParticipantName] = useState(() => getStoredParticipantName())
  const [wishlistName, setWishlistName] = useState('')
  const [itemDraft, setItemDraft] = useState(EMPTY_ITEM_DRAFT)
  const [sharedViewerMode, setSharedViewerMode] = useState(false)
  const [viewerNameAccepted, setViewerNameAccepted] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [pendingListId, setPendingListId] = useState<string | null>(null)
  const participantNameLocked = sharedViewerMode && viewerNameAccepted
  const participantNameValid = finalizeParticipantName(participantName).length > 0

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      setBusyAction('load')
      const requestedId = getWishlistIdFromPath()
      const requestedEditToken = getWishlistEditToken()
      const isSharedViewer = Boolean(requestedId) && !requestedEditToken
      const result = await loadWishlist(requestedId, requestedEditToken, { forceViewer: isSharedViewer })

      if (cancelled) return

      setSharedViewerMode(isSharedViewer)
      if (isSharedViewer) {
        const joinedName = requestedId ? getJoinedViewerName(requestedId) : null
        if (joinedName) {
          setParticipantName(joinedName)
          setViewerNameAccepted(true)
        } else {
          setViewerNameAccepted(false)
        }
      } else {
        setViewerNameAccepted(true)
      }
      setWishlist(result.wishlist)
      setWishlistName(result.wishlist.name)
      setMode(result.mode)
      setAccess(result.access)
      setItemDraft(createEmptyItemDraft(result.wishlist, wl))
      replaceWishlistPath(result.wishlist.id, isSharedViewer ? null : result.access.editToken)
      if (isSharedViewer) {
        setOwnedWishlists([])
      } else {
        await refreshOwnedWishlists(cancelled)
      }
      setBusyAction(null)
    }

    void hydrate()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    saveParticipantName(participantName)
  }, [participantName])

  const shareUrl = useMemo(() => {
    if (!wishlist || typeof window === 'undefined') return ''
    return `${window.location.origin}/wishlist/${encodeURIComponent(wishlist.id)}`
  }, [wishlist])

  const editUrl = useMemo(() => {
    if (!wishlist || !access.editToken || typeof window === 'undefined') return ''
    return `${shareUrl}?edit=${encodeURIComponent(access.editToken)}`
  }, [access.editToken, shareUrl, wishlist])

  async function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!wishlist) return

    if (!access.canEdit) {
      setNotice(notices.renameDenied)
      return
    }

    const nextParticipantName = finalizeParticipantName(participantName)
    if (nextParticipantName.length === 0) {
      setNotice(notices.nameRequired)
      return
    }

    setBusyAction('save-name')
    setParticipantName(nextParticipantName)
    const result = await renameWishlist(wishlist, wishlistName, access)
    setWishlist(result.wishlist)
    setWishlistName(result.wishlist.name)
    setMode(result.mode)
    setAccess(result.access)
    setNotice(notices.nameSaved)
    void refreshOwnedWishlists()
    setBusyAction(null)
  }

  async function handleAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!wishlist || itemDraft.title.trim().length === 0) return

    if (!access.canEdit) {
      setNotice(notices.addDenied)
      return
    }

    setBusyAction('add-item')
    const result = await addWishlistItem(wishlist, itemDraft, access)
    setWishlist(result.wishlist)
    setMode(result.mode)
    setAccess(result.access)
    setItemDraft(createEmptyItemDraft(result.wishlist, wl))
    setNotice(notices.itemAdded)
    void refreshOwnedWishlists()
    setBusyAction(null)
  }

  async function handleEditItem(
    item: WishlistItem,
    input: { title: string; link: string; description: string; image: string | null },
  ) {
    if (!wishlist) return

    if (!access.canEdit) {
      setNotice(notices.editDenied)
      return
    }

    setBusyAction(`edit-${item.id}`)
    const result = await updateWishlistItem(wishlist, item.id, input, access)
    setWishlist(result.wishlist)
    setMode(result.mode)
    setAccess(result.access)
    setNotice(notices.itemUpdated)
    void refreshOwnedWishlists()
    setBusyAction(null)
  }

  async function handleDeleteItem(item: WishlistItem) {
    if (!wishlist) return

    if (!access.canEdit) {
      setNotice(notices.deleteDenied)
      return
    }

    const confirmed = window.confirm(t(wl.confirmRemove, { title: item.title }))
    if (!confirmed) return

    setBusyAction(`delete-${item.id}`)
    const result = await deleteWishlistItem(wishlist, item.id, access)
    setWishlist(result.wishlist)
    setMode(result.mode)
    setAccess(result.access)
    setItemDraft(createEmptyItemDraft(result.wishlist, wl))
    setNotice(notices.itemRemoved)
    void refreshOwnedWishlists()
    setBusyAction(null)
  }

  async function handleNewList() {
    setBusyAction('new-list')
    const result = await createOwnedWishlist()

    setWishlist(result.wishlist)
    setWishlistName(result.wishlist.name)
    setMode(result.mode)
    setAccess(result.access)
    setItemDraft(createEmptyItemDraft(result.wishlist, wl))
    setSharedViewerMode(false)
    setViewerNameAccepted(true)
    replaceWishlistPath(result.wishlist.id, result.access.editToken)
    setNotice(notices.listCreated)
    await refreshOwnedWishlists()
    setBusyAction(null)
  }

  async function handleOpenOwnedList(owned: OwnedWishlist) {
    setBusyAction('open-list')
    setPendingListId(owned.wishlist.id)

    try {
      const result = await loadWishlist(owned.wishlist.id, owned.access.editToken)

      setWishlist(result.wishlist)
      setWishlistName(result.wishlist.name)
      setMode(result.mode)
      setAccess(result.access)
      setItemDraft(createEmptyItemDraft(result.wishlist, wl))
      setSharedViewerMode(false)
      setViewerNameAccepted(true)
      replaceWishlistPath(result.wishlist.id, result.access.editToken)
      setNotice(notices.listOpened)
      await refreshOwnedWishlists()
    } finally {
      setPendingListId(null)
      setBusyAction(null)
    }
  }

  async function handleDeleteCurrentList() {
    if (!wishlist) return

    if (!access.canEdit) {
      setNotice(notices.deleteListDenied)
      return
    }

    const confirmed = window.confirm(t(wl.confirmDelete, { name: wishlist.name }))
    if (!confirmed) return

    setBusyAction('delete-list')
    const deleted = await deleteWishlist(wishlist, access)

    if (!deleted) {
      setNotice(notices.deleteFailed)
      setBusyAction(null)
      return
    }

    const remaining = await listOwnedWishlists()
    setOwnedWishlists(remaining)

    if (remaining[0]) {
      const result = await loadWishlist(remaining[0].wishlist.id, remaining[0].access.editToken)
      setWishlist(result.wishlist)
      setWishlistName(result.wishlist.name)
      setMode(result.mode)
      setAccess(result.access)
      setItemDraft(createEmptyItemDraft(result.wishlist, wl))
      setSharedViewerMode(false)
      setViewerNameAccepted(true)
      replaceWishlistPath(result.wishlist.id, result.access.editToken)
      setNotice(notices.listDeleted)
    } else {
      const result = await createOwnedWishlist()
      setWishlist(result.wishlist)
      setWishlistName(result.wishlist.name)
      setMode(result.mode)
      setAccess(result.access)
      setItemDraft(createEmptyItemDraft(result.wishlist, wl))
      setSharedViewerMode(false)
      setViewerNameAccepted(true)
      replaceWishlistPath(result.wishlist.id, result.access.editToken)
      setNotice(notices.listDeletedEmpty)
      await refreshOwnedWishlists()
    }

    setBusyAction(null)
  }

  async function handleClaim(item: WishlistItem) {
    if (!wishlist) return

    if (participantName.trim().length === 0) {
      setNotice(notices.nameRequired)
      return
    }

    const nextName = finalizeParticipantName(participantName)
    if (nextName.length === 0) {
      setNotice(notices.nameRequired)
      return
    }

    setBusyAction(`claim-${item.id}`)
    const result = await claimWishlistItem(wishlist, item.id, nextName, access)
    setWishlist(result.wishlist)
    setMode(result.mode)
    setAccess(result.access)
    setNotice(result.claimed ? notices.giftClaimed : notices.giftTaken)
    setBusyAction(null)
  }

  async function handleRelease(item: WishlistItem) {
    if (!wishlist) return

    setBusyAction(`release-${item.id}`)
    const result = await releaseWishlistItem(wishlist, item.id, participantName, access)
    setWishlist(result.wishlist)
    setMode(result.mode)
    setAccess(result.access)
    setNotice(notices.giftReleased)
    setBusyAction(null)
  }

  async function handleRefresh() {
    if (!wishlist) return

    setBusyAction('refresh')
    const result = await refreshWishlist(wishlist, access)
    setWishlist(result.wishlist)
    setWishlistName(result.wishlist.name)
    setMode(result.mode)
    setAccess(result.access)
    setNotice(notices.refreshed)
    if (!sharedViewerMode) {
      void refreshOwnedWishlists()
    }
    setBusyAction(null)
  }

  function handleEnterSharedList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!wishlist) return

    const nextName = finalizeParticipantName(participantName)
    if (nextName.length === 0) {
      setNotice(notices.sharedNameRequired)
      return
    }

    setParticipantName(nextName)
    saveParticipantName(nextName)
    saveJoinedViewerName(wishlist.id, nextName)
    setViewerNameAccepted(true)
    setNotice('')
  }

  async function handleCopyLink() {
    if (!shareUrl || busyAction !== null) return

    setBusyAction('copy-share')
    try {
      await navigator.clipboard.writeText(shareUrl)
      setNotice(notices.shareCopied)
    } catch {
      setNotice(notices.copyFailed)
    } finally {
      setBusyAction(null)
    }
  }

  async function handleCopyEditLink() {
    if (!editUrl || busyAction !== null) return

    setBusyAction('copy-edit')
    try {
      await navigator.clipboard.writeText(editUrl)
      setNotice(notices.editCopied)
    } catch {
      setNotice(notices.copyEditFailed)
    } finally {
      setBusyAction(null)
    }
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!wishlist || !file) return

    if (!access.canEdit) {
      setNotice(notices.editDenied)
      return
    }

    try {
      setBusyAction('save-logo')
      const dataUrl = await readWishlistLogoFile(file)
      const result = await updateWishlistLogo(wishlist, dataUrl, access)
      setWishlist(result.wishlist)
      setMode(result.mode)
      setAccess(result.access)
      setNotice(notices.logoSaved)
      void refreshOwnedWishlists()
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message === 'too-large') {
        setNotice(notices.logoTooLarge)
      } else if (message === 'invalid-type' || message === 'invalid-data') {
        setNotice(notices.logoInvalidType)
      } else {
        setNotice(notices.logoUploadFailed)
      }
    } finally {
      setBusyAction(null)
    }
  }

  async function handleLogoRemove() {
    if (!wishlist || !access.canEdit) return

    setBusyAction('save-logo')
    const result = await updateWishlistLogo(wishlist, null, access)
    setWishlist(result.wishlist)
    setMode(result.mode)
    setAccess(result.access)
    setNotice(notices.logoRemoved)
    void refreshOwnedWishlists()
    setBusyAction(null)
  }

  function handleGoHome() {
    trackNavigationClick({ cta: 'logo', source: 'wishlist', targetPhase: 'hub' })
    pushHomePath()
    setPhase('hub')
  }

  function handleBackToMenu() {
    trackNavigationClick({ cta: 'back', source: 'wishlist', targetPhase: 'hub' })
    pushHomePath()
    setPhase('hub')
  }

  async function refreshOwnedWishlists(cancelled = false) {
    const owned = await listOwnedWishlists()
    if (!cancelled) {
      setOwnedWishlists(owned)
    }
  }

  function renderWishlistItems(canEditItems: boolean) {
    if (!wishlist) return null

    return (
      <section style={itemsGridStyle} aria-label={wl.itemsAriaLabel}>
        {wishlist.items.length === 0 ? (
          <div style={emptyStateStyle(ui)}>{wl.noItems}</div>
        ) : (
          wishlist.items.map((item) => (
            <WishlistItemCard
              key={item.id}
              item={item}
              ui={ui}
              canEdit={canEditItems}
              participantName={participantName}
              busyAction={busyAction}
              onSave={(input) => handleEditItem(item, input)}
              onDelete={() => handleDeleteItem(item)}
              onClaim={() => handleClaim(item)}
              onRelease={() => handleRelease(item)}
              onImageError={setNotice}
            />
          ))
        )}
      </section>
    )
  }

  return (
    <main style={pageStyle(ui)}>
      <section style={panelStyle(ui)}>
        <header style={headerStyle}>
          <div style={headerTopRowStyle}>
            <button
              type="button"
              onClick={handleGoHome}
              style={logoHomeButtonStyle()}
              aria-label={wl.backToMain}
            >
              <img
                src={APP_LOGO_URL}
                alt=""
                style={logoPreviewStyle(ui)}
              />
            </button>
            <div style={headerCopyStyle}>
              <div style={eyebrowStyle(ui)}>{wl.eyebrow}</div>
              <h1 style={titleStyle(ui)}>{wl.title}</h1>
            </div>
          </div>
          <div style={statusRowStyle}>
            <span style={pillStyle(mode === 'cloud' ? ui.accent : ui.warning)}>
              {mode === 'cloud' ? wl.cloudSaved : wl.localOnly}
            </span>
            {sharedViewerMode && (
              <span style={pillStyle(ui.warning)}>
                {wl.shareView}
              </span>
            )}
            {access.canEdit && !sharedViewerMode && (
              <span style={pillStyle(ui.secondary)}>
                {wl.canEdit}
              </span>
            )}
            <ActionButton
              ui={ui}
              type="button"
              onClick={handleRefresh}
              disabled={!wishlist || (busyAction !== null && busyAction !== 'refresh')}
              busy={busyAction === 'refresh'}
              busyLabel={messages.common.refreshing}
              style={smallButtonStyle(ui)}
            >
              {messages.common.refresh}
            </ActionButton>
          </div>
        </header>

        {!wishlist ? (
          <div style={emptyStateStyle(ui)}>{wl.loading}</div>
        ) : sharedViewerMode && !viewerNameAccepted ? (
          <form onSubmit={handleEnterSharedList} style={sharedGateStyle(ui)}>
            <div style={formHeadingStyle(ui)}>{wl.openShared}</div>
            <WishlistTitleBlock ui={ui} wishlist={wishlist} />
            <label style={fieldStyle}>
              <span style={labelStyle(ui)}>{wl.yourName}</span>
              <input
                value={participantName}
                onChange={(event) => setParticipantName(sanitizeParticipantNameInput(event.target.value))}
                style={inputStyle(ui)}
                maxLength={WISHLIST_FIELD_LIMITS.participantName}
                placeholder={wl.namePlaceholder}
                autoFocus
                required
              />
            </label>
            <ActionButton
              ui={ui}
              type="submit"
              disabled={!participantNameValid}
              style={primaryButtonStyle(ui)}
            >
              {wl.openList}
            </ActionButton>
            {notice && <div style={noticeStyle(ui)}>{notice}</div>}
          </form>
        ) : sharedViewerMode ? (
          <>
            <section style={sharedViewerStyle(ui)}>
              <WishlistTitleBlock ui={ui} wishlist={wishlist} heading={wl.sharedWishlist} />
              <label style={{ ...fieldStyle, ...fieldShellStyle(participantNameLocked) }}>
                <span style={labelStyle(ui)}>{wl.reservedAs}</span>
                <input
                  value={participantName}
                  onChange={(event) => setParticipantName(sanitizeParticipantNameInput(event.target.value))}
                  style={lockedInputStyle(ui, participantNameLocked)}
                  maxLength={WISHLIST_FIELD_LIMITS.participantName}
                  placeholder={wl.namePlaceholder}
                  readOnly={participantNameLocked}
                  disabled={participantNameLocked}
                  aria-readonly={participantNameLocked}
                  required
                />
                {participantNameLocked && (
                  <span style={helperTextStyle(ui)}>{wl.nameLockedHint}</span>
                )}
              </label>
            </section>

            {notice && <div style={noticeStyle(ui)}>{notice}</div>}

            {renderWishlistItems(false)}
          </>
        ) : (
          <>
            <section style={ownedListStyle(ui)} aria-labelledby="owned-wishlists-heading">
              <div style={ownedListHeaderStyle}>
                <div>
                  <div id="owned-wishlists-heading" style={formHeadingStyle(ui)}>{wl.yourLists}</div>
                  <div style={ownedListSubtitleStyle(ui)}>
                    {wl.yourListsHint}
                  </div>
                </div>
                <ActionButton
                  ui={ui}
                  type="button"
                  onClick={handleNewList}
                  disabled={busyAction !== null && busyAction !== 'new-list'}
                  busy={busyAction === 'new-list'}
                  busyLabel={messages.common.loading}
                  style={secondaryButtonStyle(ui)}
                >
                  {wl.newList}
                </ActionButton>
              </div>
              {ownedWishlists.length === 0 ? (
                <div style={ownedListSubtitleStyle(ui)}>{wl.noOwnerLists}</div>
              ) : (
                <div style={ownedListGridStyle}>
                  {ownedWishlists.map((owned) => {
                    const active = owned.wishlist.id === wishlist.id

                    return (
                      <ActionButton
                        ui={ui}
                        key={owned.wishlist.id}
                        type="button"
                        onClick={() => handleOpenOwnedList(owned)}
                        disabled={active || (busyAction !== null && busyAction !== 'open-list')}
                        busy={busyAction === 'open-list' && pendingListId === owned.wishlist.id}
                        busyLabel={messages.common.loading}
                        style={ownedListButtonStyle(ui, active)}
                      >
                        {owned.wishlist.name}
                      </ActionButton>
                    )
                  })}
                </div>
              )}
            </section>

            <form onSubmit={handleRename} style={topGridStyle}>
              <label style={{ ...fieldStyle, ...fieldShellStyle(!access.canEdit) }}>
                <span style={labelStyle(ui)}>{wl.wishlistName}</span>
                <input
                  value={wishlistName}
                  onChange={(event) => setWishlistName(sanitizeWishlistNameInput(event.target.value))}
                  style={lockedInputStyle(ui, !access.canEdit)}
                  maxLength={WISHLIST_FIELD_LIMITS.wishlistName}
                  disabled={!access.canEdit}
                  readOnly={!access.canEdit}
                  required
                />
              </label>
              <label style={fieldStyle}>
                <span style={labelStyle(ui)}>{wl.yourName}</span>
                <input
                  value={participantName}
                  onChange={(event) => setParticipantName(sanitizeParticipantNameInput(event.target.value))}
                  style={inputStyle(ui)}
                  maxLength={WISHLIST_FIELD_LIMITS.participantName}
                  placeholder={wl.namePlaceholder}
                  required
                />
              </label>
              <ActionButton
                ui={ui}
                type="submit"
                disabled={
                  !access.canEdit
                  || !participantNameValid
                  || (busyAction !== null && busyAction !== 'save-name')
                }
                busy={busyAction === 'save-name'}
                busyLabel={messages.common.saving}
                style={{
                  ...primaryButtonStyle(ui),
                  ...(access.canEdit ? {} : disabledButtonStyle(ui)),
                }}
              >
                {wl.save}
              </ActionButton>
            </form>

            {access.canEdit && (
              <section style={logoPanelStyle(ui)} aria-label={wl.logoLabel}>
                <div style={formHeadingStyle(ui)}>{wl.logoLabel}</div>
                <div style={logoPanelRowStyle}>
                  {wishlist.logo ? (
                    <img src={wishlist.logo} alt="" style={logoEditorPreviewStyle(ui)} />
                  ) : (
                    <div style={logoPlaceholderStyle(ui)} aria-hidden="true">
                      ★
                    </div>
                  )}
                  <div style={logoPanelActionsStyle}>
                    <p style={helperTextStyle(ui)}>{wl.logoHint}</p>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={(event) => void handleLogoUpload(event)}
                      style={{ display: 'none' }}
                    />
                    <div style={logoButtonRowStyle}>
                      <ActionButton
                        ui={ui}
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={busyAction !== null && busyAction !== 'save-logo'}
                        busy={busyAction === 'save-logo'}
                        busyLabel={messages.common.saving}
                        style={secondaryButtonStyle(ui)}
                      >
                        {wishlist.logo ? wl.changeLogo : wl.uploadLogo}
                      </ActionButton>
                      {wishlist.logo && (
                        <ActionButton
                          ui={ui}
                          type="button"
                          onClick={() => void handleLogoRemove()}
                          disabled={busyAction !== null && busyAction !== 'save-logo'}
                          busy={busyAction === 'save-logo'}
                          busyLabel={messages.common.deleting}
                          style={dangerButtonStyle(ui)}
                        >
                          {wl.removeLogo}
                        </ActionButton>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <ShareLinkPanel
              ui={ui}
              shareUrl={shareUrl}
              wishlistName={wishlist.name}
              onCopy={handleCopyLink}
              onDownload={() => setNotice(notices.qrDownloaded)}
              copyLabel={wl.copyShareLink}
              copyBusy={busyAction === 'copy-share'}
            />

            {access.canEdit && (
              <div style={editLinkPanelStyle(ui)}>
                <div style={formHeadingStyle(ui)}>{wl.ownerEditLink}</div>
                <div style={shareRowStyle}>
                  <span style={shareTextStyle(ui)}>{editUrl}</span>
                  <ActionButton
                    ui={ui}
                    type="button"
                    onClick={handleCopyEditLink}
                    disabled={busyAction !== null && busyAction !== 'copy-edit'}
                    busy={busyAction === 'copy-edit'}
                    busyLabel={messages.common.copying}
                    style={secondaryButtonStyle(ui)}
                  >
                    {wl.copyEditLink}
                  </ActionButton>
                </div>
              </div>
            )}

            {access.canEdit && (
              <ActionButton
                ui={ui}
                type="button"
                onClick={handleDeleteCurrentList}
                disabled={busyAction !== null && busyAction !== 'delete-list'}
                busy={busyAction === 'delete-list'}
                busyLabel={messages.common.deleting}
                style={dangerButtonStyle(ui)}
              >
                {wl.deleteList}
              </ActionButton>
            )}

            <form onSubmit={handleAddItem} style={addFormStyle(ui)}>
              <div style={formHeadingStyle(ui)}>{wl.addGiftItem}</div>
              <label style={fieldStyle}>
                <span style={labelStyle(ui)}>{wl.itemName}</span>
                <input
                  value={itemDraft.title}
                  onChange={(event) => setItemDraft((draft) => ({
                    ...draft,
                    title: sanitizeItemTitleInput(event.target.value),
                  }))}
                  style={inputStyle(ui)}
                  maxLength={WISHLIST_FIELD_LIMITS.itemTitle}
                  required
                  disabled={!access.canEdit}
                />
              </label>
              <label style={fieldStyle}>
                <span style={labelStyle(ui)}>{wl.productLink}</span>
                <input
                  value={itemDraft.link}
                  onChange={(event) => setItemDraft((draft) => ({
                    ...draft,
                    link: sanitizeItemLinkInput(event.target.value),
                  }))}
                  style={inputStyle(ui)}
                  maxLength={WISHLIST_FIELD_LIMITS.itemLink}
                  inputMode="url"
                  disabled={!access.canEdit}
                />
              </label>
              <WishlistItemImageField
                ui={ui}
                value={itemDraft.image}
                onChange={(image) => setItemDraft((draft) => ({ ...draft, image }))}
                onError={setNotice}
                disabled={!access.canEdit}
              />
              <label style={fieldStyle}>
                <span style={labelStyle(ui)}>{wl.notes}</span>
                <textarea
                  value={itemDraft.description}
                  onChange={(event) => setItemDraft((draft) => ({
                    ...draft,
                    description: sanitizeItemDescriptionInput(event.target.value),
                  }))}
                  style={textareaStyle(ui)}
                  maxLength={WISHLIST_FIELD_LIMITS.itemDescription}
                  disabled={!access.canEdit}
                />
              </label>
              <ActionButton
                ui={ui}
                type="submit"
                disabled={
                  !access.canEdit
                  || itemDraft.title.trim().length === 0
                  || (busyAction !== null && busyAction !== 'add-item')
                }
                busy={busyAction === 'add-item'}
                busyLabel={wl.adding}
                style={{ ...primaryButtonStyle(ui), gridColumn: '1 / -1' }}
              >
                {wl.addGift}
              </ActionButton>
            </form>

            {!access.canEdit && (
              <div style={noticeStyle(ui)}>
                {wl.editLinkNotice}
              </div>
            )}

            {notice && <div style={noticeStyle(ui)}>{notice}</div>}

            {renderWishlistItems(access.canEdit)}
          </>
        )}

        <button type="button" onClick={handleBackToMenu} style={backButtonStyle(ui)}>
          {wl.backToMain}
        </button>
      </section>
    </main>
  )
}

function WishlistTitleBlock({
  ui,
  wishlist,
  heading,
}: {
  ui: WishlistUi
  wishlist: Wishlist
  heading?: string
}) {
  return (
    <div style={wishlistTitleBlockStyle}>
      {wishlist.logo ? (
        <img src={wishlist.logo} alt="" style={logoInlinePreviewStyle(ui)} />
      ) : null}
      <div style={wishlistTitleCopyStyle}>
        {heading ? <div style={formHeadingStyle(ui)}>{heading}</div> : null}
        <h2 style={sharedListTitleStyle(ui)}>{wishlist.name}</h2>
      </div>
    </div>
  )
}

function ShareLinkPanel({
  ui,
  shareUrl,
  wishlistName,
  onCopy,
  onDownload,
  copyLabel,
  copyBusy = false,
  compact = false,
}: {
  ui: WishlistUi
  shareUrl: string
  wishlistName: string
  onCopy: () => void
  onDownload: () => void
  copyLabel: string
  copyBusy?: boolean
  compact?: boolean
}) {
  const { messages } = useTranslation()
  const wl = messages.wishlist
  const c = messages.common

  if (!shareUrl) return null

  return (
    <section style={sharePanelStyle(ui, compact)} aria-label={wl.shareAriaLabel}>
      <ShareQrCode
        value={shareUrl}
        ui={ui}
        wishlistName={wishlistName}
        onDownload={onDownload}
      />
      <div style={shareDetailsStyle}>
        <div style={formHeadingStyle(ui)}>{wl.shareThisList}</div>
        <div style={shareRowStyle}>
          <a href={shareUrl} target="_blank" rel="noreferrer" style={shareTextStyle(ui)}>
            {shareUrl}
          </a>
          <ActionButton
            ui={ui}
            type="button"
            onClick={onCopy}
            busy={copyBusy}
            busyLabel={c.copying}
            style={secondaryButtonStyle(ui)}
          >
            {copyLabel}
          </ActionButton>
        </div>
      </div>
    </section>
  )
}

function ShareQrCode({
  value,
  ui,
  wishlistName,
  onDownload,
}: {
  value: string
  ui: WishlistUi
  wishlistName: string
  onDownload: () => void
}) {
  const qrRef = useRef<HTMLDivElement>(null)
  const [downloadBusy, setDownloadBusy] = useState(false)
  const { messages } = useTranslation()
  const wl = messages.wishlist
  const c = messages.common

  async function handleDownload() {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg || downloadBusy) return

    setDownloadBusy(true)
    try {
      await downloadQrCodePng(svg, createQrFilename(wishlistName))
      onDownload()
    } finally {
      setDownloadBusy(false)
    }
  }

  return (
    <div style={qrWrapStyle(ui)}>
      <a href={value} target="_blank" rel="noreferrer" style={qrLinkStyle} aria-label={wl.openSharedAriaLabel}>
        <div ref={qrRef} style={qrCanvasStyle}>
          <QRCode
            value={value}
            size={128}
            bgColor="#ffffff"
            fgColor="#0a0f18"
            level="M"
            style={qrCodeStyle}
          />
        </div>
      </a>
      <span style={qrCaptionStyle(ui)}>{wl.scanOrTap}</span>
      <ActionButton
        ui={ui}
        type="button"
        onClick={() => void handleDownload()}
        busy={downloadBusy}
        busyLabel={c.downloading}
        style={qrDownloadButtonStyle(ui)}
      >
        {wl.downloadQr}
      </ActionButton>
    </div>
  )
}

function WishlistItemCard({
  item,
  ui,
  canEdit,
  participantName,
  busyAction,
  onSave,
  onDelete,
  onClaim,
  onRelease,
  onImageError,
}: {
  item: WishlistItem
  ui: WishlistUi
  canEdit: boolean
  participantName: string
  busyAction: BusyAction
  onSave: (input: { title: string; link: string; description: string; image: string | null }) => void
  onDelete: () => void
  onClaim: () => void
  onRelease: () => void
  onImageError: (message: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const { messages, t } = useTranslation()
  const wl = messages.wishlist
  const c = messages.common
  const [draft, setDraft] = useState(() => ({
    title: item.title,
    link: item.link,
    description: item.description,
    image: item.image ?? null,
  }))
  const currentName = participantName.trim()
  const selectedByMe = item.selectedBy !== null && item.selectedBy === currentName
  const selectedByOther = item.selectedBy !== null && !selectedByMe
  const busy =
    busyAction === `claim-${item.id}` ||
    busyAction === `delete-${item.id}` ||
    busyAction === `release-${item.id}` ||
    busyAction === `edit-${item.id}`
  const href = hasDisplayableItemLink(item.link) ? normalizeExternalUrl(item.link) : ''

  useEffect(() => {
    if (!editing) {
      setDraft({
        title: item.title,
        link: item.link,
        description: item.description,
        image: item.image ?? null,
      })
    }
  }, [editing, item.description, item.image, item.link, item.title])

  return (
    <article style={itemCardStyle(ui, selectedByOther)}>
      {editing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSave(draft)
            setEditing(false)
          }}
          style={editItemFormStyle}
        >
          <label style={fieldStyle}>
            <span style={labelStyle(ui)}>{wl.itemName}</span>
            <input
              value={draft.title}
              onChange={(event) => setDraft((next) => ({
                ...next,
                title: sanitizeItemTitleInput(event.target.value),
              }))}
              style={inputStyle(ui)}
              maxLength={WISHLIST_FIELD_LIMITS.itemTitle}
              required
            />
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle(ui)}>{wl.productLink}</span>
            <input
              value={draft.link}
              onChange={(event) => setDraft((next) => ({
                ...next,
                link: sanitizeItemLinkInput(event.target.value),
              }))}
              style={inputStyle(ui)}
              maxLength={WISHLIST_FIELD_LIMITS.itemLink}
              inputMode="url"
            />
          </label>
          <WishlistItemImageField
            ui={ui}
            value={draft.image}
            onChange={(image) => setDraft((next) => ({ ...next, image }))}
            onError={onImageError}
            compact
          />
          <label style={fieldStyle}>
            <span style={labelStyle(ui)}>{wl.notes}</span>
            <textarea
              value={draft.description}
              onChange={(event) => setDraft((next) => ({
                ...next,
                description: sanitizeItemDescriptionInput(event.target.value),
              }))}
              style={textareaStyle(ui)}
              maxLength={WISHLIST_FIELD_LIMITS.itemDescription}
            />
          </label>
          <div style={itemActionRowStyle}>
            <ActionButton
              ui={ui}
              type="submit"
              disabled={busy || draft.title.trim().length === 0}
              busy={busyAction === `edit-${item.id}`}
              busyLabel={c.saving}
              style={primaryButtonStyle(ui)}
            >
              {wl.saveGift}
            </ActionButton>
            <ActionButton
              ui={ui}
              type="button"
              onClick={() => setEditing(false)}
              disabled={busy}
              style={secondaryButtonStyle(ui)}
            >
              {c.cancel}
            </ActionButton>
          </div>
        </form>
      ) : (
        <>
          <div>
            <div style={itemIconToolbarStyle}>
              <div style={pillStyle(item.selectedBy ? ui.warning : ui.accent)}>
                {item.selectedBy ? wl.itemSelected : wl.itemOpen}
              </div>
              {canEdit && (
              <div style={itemIconToolbarStyle}>
                <IconActionButton
                  ui={ui}
                  label={wl.edit}
                  onClick={() => setEditing(true)}
                  disabled={busy}
                >
                  <EditIcon />
                </IconActionButton>
                <IconActionButton
                  ui={ui}
                  label={wl.remove}
                  tone="danger"
                  onClick={onDelete}
                  disabled={busy}
                  busy={busyAction === `delete-${item.id}`}
                  busyLabel={wl.removing}
                >
                  <TrashIcon />
                </IconActionButton>
                </div>
              )}
            </div>

            <div style={itemCardTopStyle}>
              <h2 style={itemTitleStyle(ui, selectedByOther)} title={item.title}>
                {href ? (
                  <a
                    className={`wishlist-item-title-link${selectedByOther ? ' wishlist-item-title-link--locked' : ''}`}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    style={itemTitleTextStyle()}
                  >
                    {item.title}
                  </a>
                ) : (
                  <span style={itemTitleTextStyle(selectedByOther)}>{item.title}</span>
                )}
              </h2>
            </div>

            {item.image ? (
              href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  style={itemPhotoLinkStyle(selectedByOther)}
                  aria-label={wl.openLink}
                >
                  <WishlistItemPhoto ui={ui} src={item.image} locked={selectedByOther} />
                </a>
              ) : (
                <WishlistItemPhoto ui={ui} src={item.image} locked={selectedByOther} />
              )
            ) : null}

            {!item.image && href ? (
              <WishlistLinkPreview href={href} ui={ui} locked={selectedByOther} />
            ) : null}
          </div>

          {item.description ? (
            <ExpandableDescription text={item.description} ui={ui} muted={selectedByOther} />
          ) : null}
        </>
      )}
      <div>
        {item.selectedBy && (
          <div style={selectedByStyle(ui)}>
            {t(wl.selectedBy, { name: item.selectedBy })}
          </div>
        )}
        {selectedByMe ? (
          <ActionButton
            ui={ui}
            type="button"
            onClick={onRelease}
            disabled={busy}
            busy={busyAction === `release-${item.id}`}
            busyLabel={c.updating}
            style={secondaryButtonStyle(ui)}
          >
            {wl.release}
          </ActionButton>
        ) : (
          <ActionButton
            ui={ui}
            type="button"
            onClick={onClaim}
            disabled={busy || selectedByOther}
            busy={busyAction === `claim-${item.id}`}
            busyLabel={wl.selecting}
            style={selectedByOther ? disabledButtonStyle(ui) : primaryButtonStyle(ui)}
          >
            {selectedByOther ? wl.itemSelected : wl.select}
          </ActionButton>
        )}
      </div>

    </article>
  )
}

function createEmptyItemDraft(
  wishlist: Wishlist,
  wl: Messages['wishlist'],
): { title: string; link: string; description: string; image: string | null } {
  return {
    title: formatMessage(wl.defaultItemTitle, { n: wishlist.items.length + 1 }),
    link: '',
    description: '',
    image: null,
  }
}

function createQrFilename(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return `${slug || 'wishlist'}-qr.png`
}

async function downloadQrCodePng(svg: SVGSVGElement, filename: string): Promise<void> {
  const svgString = new XMLSerializer().serializeToString(svg)
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  try {
    await new Promise<void>((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 512
        const context = canvas.getContext('2d')

        if (!context) {
          reject(new Error('Could not create QR download'))
          return
        }

        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0, canvas.width, canvas.height)

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Could not create QR download'))
            return
          }

          const pngUrl = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = pngUrl
          link.download = filename
          link.click()
          URL.revokeObjectURL(pngUrl)
          resolve()
        }, 'image/png')
      }
      image.onerror = () => reject(new Error('Could not create QR download'))
      image.src = svgUrl
    })
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}

const pageStyle = (ui: WishlistUi): CSSProperties => ({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: 'auto',
  minHeight: '100%',
  overflowY: 'auto',
  overflowX: 'hidden',
  WebkitOverflowScrolling: 'touch',
  overscrollBehaviorY: 'contain',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '1.2rem 0.85rem 2.4rem',
  background: ui.appBackground,
  color: ui.text,
})

function panelStyle(ui: WishlistUi): CSSProperties {
  return {
    width: '100%',
    maxWidth: 1080,
    minHeight: 'min-content',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.15rem',
    overflow: 'hidden',
    padding: 'clamp(1rem, 2.5vw, 1.6rem)',
    border: `1px solid ${ui.panelBorder}`,
    borderRadius: 20,
    background: ui.panelBackground,
    boxShadow: ui.panelShadow,
    fontFamily: relaxedFontStack,
  }
}

const headerTopRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.85rem',
  width: '100%',
}

const headerCopyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  minWidth: 0,
}

const wishlistTitleBlockStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.85rem',
  minWidth: 0,
}

const wishlistTitleCopyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  minWidth: 0,
}

function logoPreviewStyle(ui: WishlistUi): CSSProperties {
  return {
    width: 56,
    height: 56,
    objectFit: 'cover',
    borderRadius: 14,
    border: `1px solid ${ui.subtleBorder}`,
    background: ui.controlBg,
    flexShrink: 0,
  }
}

function logoInlinePreviewStyle(ui: WishlistUi): CSSProperties {
  return {
    width: 64,
    height: 64,
    objectFit: 'cover',
    borderRadius: 16,
    border: `1px solid ${ui.subtleBorder}`,
    background: ui.controlBg,
    flexShrink: 0,
  }
}

function logoEditorPreviewStyle(ui: WishlistUi): CSSProperties {
  return {
    width: 88,
    height: 88,
    objectFit: 'cover',
    borderRadius: 18,
    border: `1px solid ${ui.subtleBorder}`,
    background: ui.controlBg,
    flexShrink: 0,
  }
}

function logoPlaceholderStyle(ui: WishlistUi): CSSProperties {
  return {
    width: 88,
    height: 88,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    border: `1px dashed ${ui.subtleBorder}`,
    background: ui.selectorBackground,
    color: ui.muted,
    fontSize: '1.6rem',
    flexShrink: 0,
  }
}

function logoPanelStyle(ui: WishlistUi): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    border: `1px solid ${ui.subtleBorder}`,
    borderRadius: 14,
    background: ui.selectorBackground,
  }
}

const logoPanelRowStyle: CSSProperties = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
}

const logoPanelActionsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.55rem',
  flex: '1 1 220px',
  minWidth: 0,
}

const logoButtonRowStyle: CSSProperties = {
  display: 'flex',
  gap: '0.55rem',
  flexWrap: 'wrap',
}

function fieldShellStyle(locked: boolean): CSSProperties {
  return locked ? { opacity: 0.7 } : {}
}

function lockedInputStyle(ui: WishlistUi, locked: boolean): CSSProperties {
  return {
    ...inputStyle(ui),
    cursor: locked ? 'not-allowed' : 'text',
  }
}

function helperTextStyle(ui: WishlistUi): CSSProperties {
  return {
    margin: 0,
    color: ui.muted,
    fontSize: '0.82rem',
    lineHeight: 1.5,
  }
}

const headerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '0.75rem',
  width: '100%',
}

function eyebrowStyle(ui: WishlistUi): CSSProperties {
  return {
    width: '100%',
    color: ui.warning,
    fontFamily: arcadeFontStack,
    fontSize: '0.58rem',
    fontWeight: 400,
    letterSpacing: '0.08em',
  }
}

function titleStyle(ui: WishlistUi): CSSProperties {
  return {
    color: ui.accent,
    fontFamily: arcadeFontStack,
    fontSize: 'clamp(1.15rem, 3.4vw, 2rem)',
    lineHeight: 1.45,
    letterSpacing: '0.04em',
    margin: 0,
    overflowWrap: 'anywhere',
  }
}

const statusRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  flexWrap: 'wrap',
}

const topGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
  gap: '0.75rem',
  alignItems: 'end',
}

const fieldStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.42rem',
  minWidth: 0,
}

function labelStyle(ui: WishlistUi): CSSProperties {
  return {
    color: ui.muted,
    fontSize: '0.78rem',
    fontWeight: 700,
    letterSpacing: '0.02em',
  }
}

function inputStyle(ui: WishlistUi): CSSProperties {
  return {
    width: '100%',
    minWidth: 0,
    minHeight: 44,
    background: alpha(ui.controlBg, 0.92),
    border: `1px solid ${ui.subtleBorder}`,
    borderRadius: 10,
    color: ui.text,
    padding: '0.7rem 0.75rem',
    fontFamily: relaxedFontStack,
    fontSize: '1rem',
    outline: 'none',
    boxShadow: 'inset 0 1px 2px rgba(74, 92, 84, 0.08)',
  }
}

function textareaStyle(ui: WishlistUi): CSSProperties {
  return {
    ...inputStyle(ui),
    minHeight: 92,
    resize: 'vertical',
    lineHeight: 1.45,
  }
}

function editLinkPanelStyle(ui: WishlistUi): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    border: `1px solid ${ui.subtleBorder}`,
    borderRadius: 14,
    background: ui.selectorBackground,
  }
}

function sharePanelStyle(ui: WishlistUi, compact = false): CSSProperties {
  return {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: compact ? '0.85rem' : '1rem',
    border: `1px solid ${ui.subtleBorder}`,
    borderRadius: 14,
    background: ui.selectorBackground,
    width: compact ? '100%' : undefined,
  }
}

const shareDetailsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  flex: '1 1 220px',
  minWidth: 0,
}

const shareRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
  gap: '0.7rem',
  alignItems: 'center',
}

const qrCanvasStyle: CSSProperties = {
  display: 'block',
  lineHeight: 0,
}

const qrLinkStyle: CSSProperties = {
  display: 'block',
  lineHeight: 0,
  borderRadius: 8,
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
}

function qrDownloadButtonStyle(ui: WishlistUi): CSSProperties {
  return {
    ...secondaryButtonStyle(ui),
    minHeight: 36,
    padding: '0.45rem 0.7rem',
    fontSize: '0.5rem',
  }
}

function qrWrapStyle(ui: WishlistUi): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.45rem',
    padding: '0.65rem',
    borderRadius: 12,
    background: '#ffffff',
    border: `1px solid ${ui.subtleBorder}`,
    flexShrink: 0,
  }
}

const qrCodeStyle: CSSProperties = {
  display: 'block',
  width: 128,
  height: 128,
}

function qrCaptionStyle(ui: WishlistUi): CSSProperties {
  return {
    color: ui.muted,
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  }
}

function shareTextStyle(ui: WishlistUi): CSSProperties {
  return {
    color: ui.secondary,
    fontFamily: relaxedFontStack,
    fontSize: '0.95rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
  }
}

function addFormStyle(ui: WishlistUi): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(270px, 100%), 1fr))',
    gap: '0.8rem',
    alignItems: 'start',
    padding: '1rem',
    border: `1px solid ${ui.subtleBorder}`,
    borderRadius: 14,
    background: `linear-gradient(180deg, ${alpha(ui.warning, 0.06)} 0%, ${ui.selectorBackground} 100%)`,
  }
}

function sharedGateStyle(ui: WishlistUi): CSSProperties {
  return {
    alignSelf: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: 'min(520px, 100%)',
    padding: '1.25rem',
    border: `1px solid ${ui.subtleBorder}`,
    borderRadius: 16,
    background: ui.selectorBackground,
    boxShadow: '0 14px 34px rgba(0, 0, 0, 0.16)',
  }
}

function sharedViewerStyle(ui: WishlistUi): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
    gap: '0.85rem',
    alignItems: 'end',
    padding: '1rem',
    border: `1px solid ${ui.subtleBorder}`,
    borderRadius: 14,
    background: ui.selectorBackground,
  }
}

function sharedListTitleStyle(ui: WishlistUi): CSSProperties {
  return {
    margin: '0.25rem 0 0',
    color: ui.accent,
    fontFamily: arcadeFontStack,
    fontSize: 'clamp(0.85rem, 2.8vw, 1.25rem)',
    lineHeight: 1.7,
    letterSpacing: '0.04em',
    overflowWrap: 'anywhere',
  }
}

function formHeadingStyle(ui: WishlistUi): CSSProperties {
  return {
    gridColumn: '1 / -1',
    color: ui.text,
    fontFamily: arcadeFontStack,
    fontSize: '0.62rem',
    fontWeight: 400,
    letterSpacing: '0.05em',
  }
}

const itemsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(230px, 100%), 1fr))',
  gap: '0.85rem',
}

function ownedListStyle(ui: WishlistUi): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    border: `1px solid ${ui.subtleBorder}`,
    borderRadius: 14,
    background: ui.selectorBackground,
  }
}

const ownedListHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '0.85rem',
  flexWrap: 'wrap',
}

function ownedListSubtitleStyle(ui: WishlistUi): CSSProperties {
  return {
    color: ui.muted,
    fontFamily: relaxedFontStack,
    fontSize: '0.9rem',
    lineHeight: 1.45,
    marginTop: '0.3rem',
  }
}

const ownedListGridStyle: CSSProperties = {
  display: 'flex',
  gap: '0.55rem',
  flexWrap: 'wrap',
}

function ownedListButtonStyle(
  ui: WishlistUi,
  active: boolean,
): CSSProperties {
  return {
    background: active ? alpha(ui.accent, 0.12) : alpha(ui.controlBg, 0.72),
    border: `1px solid ${active ? ui.accent : ui.subtleBorder}`,
    color: active ? ui.accent : ui.text,
    padding: '0.58rem 0.75rem',
    fontSize: '0.88rem',
    fontFamily: relaxedFontStack,
    fontWeight: 700,
    cursor: active ? 'default' : 'pointer',
    lineHeight: 1.35,
    letterSpacing: 0,
    borderRadius: 999,
    maxWidth: 260,
    minWidth: 0,
    overflowWrap: 'anywhere',
  }
}

const editItemFormStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
}

const itemActionRowStyle: CSSProperties = {
  display: 'flex',
  gap: '0.65rem',
  flexWrap: 'wrap',
}

function itemCardStyle(
  ui: WishlistUi,
  locked: boolean,
): CSSProperties {
  return {
    position: 'relative',
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'column',
    gap: '0.75rem',
    minHeight: 170,
    padding: '1rem',
    border: `1px solid ${locked ? alpha(ui.warning, 0.48) : ui.subtleBorder}`,
    borderRadius: 14,
    background: locked
      ? `linear-gradient(180deg, ${alpha(ui.warning, 0.08)} 0%, ${alpha(ui.controlBg, 0.72)} 100%)`
      : alpha(ui.controlBg, 0.62),
    boxShadow: '0 10px 28px rgba(0, 0, 0, 0.18)',
    opacity: locked ? 0.86 : 1,
  }
}

const itemCardTopStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '0.7rem',
  marginBottom: '0.7rem',
  marginTop: '0.7rem',
}

const itemIconToolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.35rem',
}

function logoHomeButtonStyle(): CSSProperties {
  return {
    border: 'none',
    background: 'transparent',
    padding: 0,
    cursor: 'pointer',
    flexShrink: 0,
    lineHeight: 0,
    borderRadius: 14,
  }
}

function iconActionButtonStyle(
  ui: WishlistUi,
  tone: 'neutral' | 'danger',
): CSSProperties {
  return {
    width: 28,
    height: 28,
    minHeight: 28,
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    border: `1px solid ${tone === 'danger' ? alpha(ui.danger, 0.42) : alpha(ui.secondary, 0.34)}`,
    background: alpha(ui.controlBg, 0.82),
    color: tone === 'danger' ? ui.danger : ui.secondary,
  }
}

function itemTitleStyle(ui: WishlistUi, locked: boolean): CSSProperties {
  return {
    color: ui.text,
    fontFamily: arcadeFontStack,
    fontSize: '0.64rem',
    lineHeight: 1.7,
    margin: 0,
    flex: 1,
    minWidth: 0,
    overflowWrap: 'anywhere',
    opacity: locked ? 0.68 : 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }
}

function itemTitleTextStyle(locked = false): CSSProperties {
  return {
    color: 'inherit',
    textDecorationLine: locked ? 'line-through' : 'none',
    textDecorationThickness: locked ? 2 : undefined,
    textUnderlineOffset: '0.18em',
  }
}

function itemDescriptionStyle(ui: WishlistUi, locked: boolean): CSSProperties {
  return {
    color: ui.muted,
    fontFamily: relaxedFontStack,
    fontSize: '0.95rem',
    lineHeight: 1.45,
    overflowWrap: 'anywhere',
    flexGrow: 1,
    margin: 0,
    textDecoration: locked ? 'line-through' : 'none',
    opacity: locked ? 0.72 : 1,
  }
}

const descriptionBlockStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '0.35rem',
}

const descriptionClampStyle: CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

function descriptionToggleStyle(ui: WishlistUi): CSSProperties {
  return {
    background: 'transparent',
    border: 'none',
    color: ui.secondary,
    cursor: 'pointer',
    fontFamily: relaxedFontStack,
    fontSize: '0.88rem',
    fontWeight: 700,
    padding: 0,
  }
}

function itemPhotoLinkStyle(locked: boolean): CSSProperties {
  return {
    display: 'block',
    lineHeight: 0,
    marginBottom: '0.65rem',
    textDecoration: locked ? 'line-through' : 'none',
    opacity: locked ? 0.78 : 1,
  }
}

function selectedByStyle(ui: WishlistUi): CSSProperties {
  return {
    color: ui.warning,
    fontFamily: relaxedFontStack,
    fontSize: '0.9rem',
  }
}

function noticeStyle(ui: WishlistUi): CSSProperties {
  return {
    color: ui.accent,
    fontSize: '0.95rem',
    fontWeight: 700,
    letterSpacing: 0,
    lineHeight: 1.55,
    padding: '0.75rem 0.9rem',
    border: `1px solid ${alpha(ui.accent, 0.2)}`,
    borderRadius: 12,
    background: alpha(ui.accent, 0.08),
  }
}

function emptyStateStyle(ui: WishlistUi): CSSProperties {
  return {
    gridColumn: '1 / -1',
    color: ui.muted,
    padding: '1.4rem',
    border: `1px dashed ${ui.subtleBorder}`,
    borderRadius: 14,
    textAlign: 'center',
    fontSize: '1rem',
    letterSpacing: 0,
    lineHeight: 1.8,
  }
}

function pillStyle(color: string): CSSProperties {
  return {
    flexShrink: 0,
    color,
    border: `1px solid ${alpha(color, 0.62)}`,
    background: alpha(color, 0.12),
    borderRadius: 999,
    padding: '0.32rem 0.6rem',
    fontSize: '0.55rem',
    fontFamily: arcadeFontStack,
    fontWeight: 400,
    letterSpacing: '0.05em',
  }
}

function primaryButtonStyle(ui: WishlistUi): CSSProperties {
  return {
    minHeight: 44,
    background: `linear-gradient(180deg, ${alpha(ui.accent, 0.18)} 0%, ${alpha(ui.controlBg, 0.94)} 100%)`,
    border: `1px solid ${ui.accent}`,
    color: ui.accent,
    padding: '0.7rem 1rem',
    fontSize: '0.58rem',
    fontFamily: arcadeFontStack,
    fontWeight: 400,
    cursor: 'pointer',
    letterSpacing: 0,
    borderRadius: 10,
    boxShadow: `0 8px 18px ${alpha(ui.accent, 0.18)}`,
    maxWidth: '100%',
    whiteSpace: 'normal',
  }
}

function secondaryButtonStyle(ui: WishlistUi): CSSProperties {
  return {
    minHeight: 44,
    background: alpha(ui.controlBg, 0.74),
    border: `1px solid ${alpha(ui.secondary, 0.44)}`,
    color: ui.secondary,
    padding: '0.62rem 0.9rem',
    fontSize: '0.55rem',
    fontFamily: arcadeFontStack,
    fontWeight: 400,
    cursor: 'pointer',
    letterSpacing: 0,
    borderRadius: 10,
    maxWidth: '100%',
    whiteSpace: 'normal',
  }
}

function smallButtonStyle(ui: WishlistUi): CSSProperties {
  return {
    ...secondaryButtonStyle(ui),
    minHeight: 36,
    padding: '0.45rem 0.7rem',
    fontSize: '0.5rem',
  }
}

function disabledButtonStyle(ui: WishlistUi): CSSProperties {
  return {
    ...primaryButtonStyle(ui),
    borderColor: ui.inactiveButtonBorder,
    color: ui.inactiveButtonColor,
    cursor: 'not-allowed',
    opacity: 0.62,
  }
}

function dangerButtonStyle(ui: WishlistUi): CSSProperties {
  return {
    minHeight: 44,
    alignSelf: 'flex-start',
    background: alpha(ui.controlBg, 0.72),
    border: `1px solid ${alpha(ui.danger, 0.5)}`,
    color: ui.danger,
    padding: '0.62rem 0.9rem',
    fontSize: '0.55rem',
    fontFamily: arcadeFontStack,
    fontWeight: 400,
    cursor: 'pointer',
    letterSpacing: 0,
    borderRadius: 10,
    maxWidth: '100%',
    whiteSpace: 'normal',
  }
}

function backButtonStyle(ui: WishlistUi): CSSProperties {
  return {
    alignSelf: 'center',
    background: 'transparent',
    border: 'none',
    color: ui.muted,
    padding: '0.6rem 1rem',
    fontSize: '0.55rem',
    fontFamily: arcadeFontStack,
    fontWeight: 400,
    cursor: 'pointer',
    letterSpacing: '0.05em',
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
