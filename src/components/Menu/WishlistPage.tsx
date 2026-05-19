import { FormEvent, useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
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
} from '@/services/wishlist'
import { useGameStore } from '@/store/gameStore'
import type { Wishlist, WishlistAccess, WishlistItem } from '@/types'
import { trackNavigationClick } from '@/analytics/events'

type WishlistMode = 'cloud' | 'local'
type WishlistUi = ThemeDefinition['ui']
type BusyAction =
  | 'load'
  | 'save-name'
  | 'add-item'
  | 'refresh'
  | `claim-${string}`
  | `delete-${string}`
  | `release-${string}`
  | `edit-${string}`
  | null

const EMPTY_ACCESS: WishlistAccess = {
  canEdit: false,
  editToken: null,
}

const EMPTY_ITEM_DRAFT = {
  title: 'Item 1',
  link: '',
  description: '',
}

const WISHLIST_UI: WishlistUi = {
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

const relaxedFontStack = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
const arcadeFontStack = '"Press Start 2P", monospace'

export default function WishlistPage() {
  const setPhase = useGameStore((s) => s.setPhase)
  const ui = WISHLIST_UI
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
      setViewerNameAccepted(!isSharedViewer)
      setWishlist(result.wishlist)
      setWishlistName(result.wishlist.name)
      setMode(result.mode)
      setAccess(result.access)
      setItemDraft(createEmptyItemDraft(result.wishlist))
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
      setNotice('Open the edit link to rename this wishlist.')
      return
    }

    setBusyAction('save-name')
    const result = await renameWishlist(wishlist, wishlistName, access)
    setWishlist(result.wishlist)
    setWishlistName(result.wishlist.name)
    setMode(result.mode)
    setAccess(result.access)
    setNotice('Wishlist name saved.')
    void refreshOwnedWishlists()
    setBusyAction(null)
  }

  async function handleAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!wishlist || itemDraft.title.trim().length === 0) return

    if (!access.canEdit) {
      setNotice('Open the edit link to add gift items.')
      return
    }

    setBusyAction('add-item')
    const result = await addWishlistItem(wishlist, itemDraft, access)
    setWishlist(result.wishlist)
    setMode(result.mode)
    setAccess(result.access)
    setItemDraft(createEmptyItemDraft(result.wishlist))
    setNotice('Gift item added.')
    void refreshOwnedWishlists()
    setBusyAction(null)
  }

  async function handleEditItem(item: WishlistItem, input: { title: string; link: string; description: string }) {
    if (!wishlist) return

    if (!access.canEdit) {
      setNotice('Open the edit link to update gift items.')
      return
    }

    setBusyAction(`edit-${item.id}`)
    const result = await updateWishlistItem(wishlist, item.id, input, access)
    setWishlist(result.wishlist)
    setMode(result.mode)
    setAccess(result.access)
    setNotice('Gift item updated.')
    void refreshOwnedWishlists()
    setBusyAction(null)
  }

  async function handleDeleteItem(item: WishlistItem) {
    if (!wishlist) return

    if (!access.canEdit) {
      setNotice('Open the edit link to remove gift items.')
      return
    }

    const confirmed = window.confirm(`Remove "${item.title}" from this wishlist?`)
    if (!confirmed) return

    setBusyAction(`delete-${item.id}`)
    const result = await deleteWishlistItem(wishlist, item.id, access)
    setWishlist(result.wishlist)
    setMode(result.mode)
    setAccess(result.access)
    setItemDraft(createEmptyItemDraft(result.wishlist))
    setNotice('Gift item removed.')
    void refreshOwnedWishlists()
    setBusyAction(null)
  }

  async function handleNewList() {
    setBusyAction('load')
    const result = await createOwnedWishlist()

    setWishlist(result.wishlist)
    setWishlistName(result.wishlist.name)
    setMode(result.mode)
    setAccess(result.access)
    setItemDraft(createEmptyItemDraft(result.wishlist))
    setSharedViewerMode(false)
    setViewerNameAccepted(true)
    replaceWishlistPath(result.wishlist.id, result.access.editToken)
    setNotice('New wishlist created.')
    await refreshOwnedWishlists()
    setBusyAction(null)
  }

  async function handleOpenOwnedList(owned: OwnedWishlist) {
    setBusyAction('load')
    const result = await loadWishlist(owned.wishlist.id, owned.access.editToken)

    setWishlist(result.wishlist)
    setWishlistName(result.wishlist.name)
    setMode(result.mode)
    setAccess(result.access)
    setItemDraft(createEmptyItemDraft(result.wishlist))
    setSharedViewerMode(false)
    setViewerNameAccepted(true)
    replaceWishlistPath(result.wishlist.id, result.access.editToken)
    setNotice('Wishlist opened.')
    await refreshOwnedWishlists()
    setBusyAction(null)
  }

  async function handleDeleteCurrentList() {
    if (!wishlist) return

    if (!access.canEdit) {
      setNotice('Open the edit link to delete this wishlist.')
      return
    }

    const confirmed = window.confirm(`Delete "${wishlist.name}"? This removes the wishlist and all gift items.`)
    if (!confirmed) return

    setBusyAction('load')
    const deleted = await deleteWishlist(wishlist, access)

    if (!deleted) {
      setNotice('Could not delete this wishlist. Check that you are using the edit link.')
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
      setItemDraft(createEmptyItemDraft(result.wishlist))
      setSharedViewerMode(false)
      setViewerNameAccepted(true)
      replaceWishlistPath(result.wishlist.id, result.access.editToken)
      setNotice('Wishlist deleted.')
    } else {
      const result = await createOwnedWishlist()
      setWishlist(result.wishlist)
      setWishlistName(result.wishlist.name)
      setMode(result.mode)
      setAccess(result.access)
      setItemDraft(createEmptyItemDraft(result.wishlist))
      setSharedViewerMode(false)
      setViewerNameAccepted(true)
      replaceWishlistPath(result.wishlist.id, result.access.editToken)
      setNotice('Wishlist deleted. A new empty wishlist is ready.')
      await refreshOwnedWishlists()
    }

    setBusyAction(null)
  }

  async function handleClaim(item: WishlistItem) {
    if (!wishlist) return

    if (participantName.trim().length === 0) {
      setNotice('Add your name before selecting a gift.')
      return
    }

    setBusyAction(`claim-${item.id}`)
    const result = await claimWishlistItem(wishlist, item.id, participantName, access)
    setWishlist(result.wishlist)
    setMode(result.mode)
    setAccess(result.access)
    setNotice(result.claimed ? 'Gift selected for you.' : 'Someone already selected this gift.')
    setBusyAction(null)
  }

  async function handleRelease(item: WishlistItem) {
    if (!wishlist) return

    setBusyAction(`release-${item.id}`)
    const result = await releaseWishlistItem(wishlist, item.id, participantName, access)
    setWishlist(result.wishlist)
    setMode(result.mode)
    setAccess(result.access)
    setNotice('Gift released.')
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
    setNotice('Wishlist refreshed.')
    if (!sharedViewerMode) {
      void refreshOwnedWishlists()
    }
    setBusyAction(null)
  }

  function handleEnterSharedList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (participantName.trim().length === 0) {
      setNotice('Add your name before opening this shared wishlist.')
      return
    }

    saveParticipantName(participantName)
    setViewerNameAccepted(true)
    setNotice('')
  }

  async function handleCopyLink() {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setNotice('Share link copied.')
    } catch {
      setNotice('Copy failed. Select the link manually.')
    }
  }

  async function handleCopyEditLink() {
    if (!editUrl) return

    try {
      await navigator.clipboard.writeText(editUrl)
      setNotice('Edit link copied. Anyone with it can change the wishlist.')
    } catch {
      setNotice('Copy failed. Select the edit link manually.')
    }
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
      <section style={itemsGridStyle} aria-label="Wishlist items">
        {wishlist.items.length === 0 ? (
          <div style={emptyStateStyle(ui)}>No gift ideas yet</div>
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
            />
          ))
        )}
      </section>
    )
  }

  return (
    <main style={pageStyle}>
      <section style={panelStyle(ui)}>
        <header style={headerStyle}>
          <div style={eyebrowStyle(ui)}>Shared gift list</div>
          <h1 style={titleStyle(ui)}>Wishlist</h1>
          <div style={statusRowStyle}>
            <span style={pillStyle(mode === 'cloud' ? ui.accent : ui.warning)}>
              {mode === 'cloud' ? 'Cloud saved' : 'Local only'}
            </span>
            {sharedViewerMode && (
              <span style={pillStyle(ui.warning)}>
                Share view
              </span>
            )}
            {access.canEdit && !sharedViewerMode && (
              <span style={pillStyle(ui.secondary)}>
                Can edit
              </span>
            )}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={!wishlist || busyAction !== null}
              style={smallButtonStyle(ui)}
            >
              Refresh
            </button>
          </div>
        </header>

        {busyAction === 'load' || !wishlist ? (
          <div style={emptyStateStyle(ui)}>Loading wishlist...</div>
        ) : sharedViewerMode && !viewerNameAccepted ? (
          <form onSubmit={handleEnterSharedList} style={sharedGateStyle(ui)}>
            <div style={formHeadingStyle(ui)}>Open shared wishlist</div>
            <h2 style={sharedListTitleStyle(ui)}>{wishlist.name}</h2>
            <label style={fieldStyle}>
              <span style={labelStyle(ui)}>Your name</span>
              <input
                value={participantName}
                onChange={(event) => setParticipantName(event.target.value)}
                style={inputStyle(ui)}
                maxLength={48}
                placeholder="Name"
                autoFocus
                required
              />
            </label>
            <button
              type="submit"
              disabled={busyAction !== null || participantName.trim().length === 0}
              style={primaryButtonStyle(ui)}
            >
              Open list
            </button>
            {notice && <div style={noticeStyle(ui)}>{notice}</div>}
          </form>
        ) : sharedViewerMode ? (
          <>
            <section style={sharedViewerStyle(ui)}>
              <div>
                <div style={formHeadingStyle(ui)}>Shared wishlist</div>
                <h2 style={sharedListTitleStyle(ui)}>{wishlist.name}</h2>
              </div>
              <label style={fieldStyle}>
                <span style={labelStyle(ui)}>Reserved as</span>
                <input
                  value={participantName}
                  onChange={(event) => setParticipantName(event.target.value)}
                  style={inputStyle(ui)}
                  maxLength={48}
                  placeholder="Name"
                />
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
                  <div id="owned-wishlists-heading" style={formHeadingStyle(ui)}>Your lists</div>
                  <div style={ownedListSubtitleStyle(ui)}>
                    Created or editable wishlists saved in this browser.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleNewList}
                  disabled={busyAction !== null}
                  style={secondaryButtonStyle(ui)}
                >
                  New list
                </button>
              </div>
              {ownedWishlists.length === 0 ? (
                <div style={ownedListSubtitleStyle(ui)}>No owner lists saved yet.</div>
              ) : (
                <div style={ownedListGridStyle}>
                  {ownedWishlists.map((owned) => {
                    const active = owned.wishlist.id === wishlist.id

                    return (
                      <button
                        key={owned.wishlist.id}
                        type="button"
                        onClick={() => handleOpenOwnedList(owned)}
                        disabled={busyAction !== null || active}
                        style={ownedListButtonStyle(ui, active)}
                      >
                        {owned.wishlist.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </section>

            <form onSubmit={handleRename} style={topGridStyle}>
              <label style={fieldStyle}>
                <span style={labelStyle(ui)}>Wishlist name</span>
                <input
                  value={wishlistName}
                  onChange={(event) => setWishlistName(event.target.value)}
                  style={inputStyle(ui)}
                  maxLength={80}
                  disabled={!access.canEdit}
                />
              </label>
              <label style={fieldStyle}>
                <span style={labelStyle(ui)}>Your name</span>
                <input
                  value={participantName}
                  onChange={(event) => setParticipantName(event.target.value)}
                  style={inputStyle(ui)}
                  maxLength={48}
                  placeholder="Name"
                />
              </label>
              <button
                type="submit"
                disabled={busyAction !== null || !access.canEdit}
                style={primaryButtonStyle(ui)}
              >
                {busyAction === 'save-name' ? 'Saving...' : 'Save'}
              </button>
            </form>

            <div style={shareRowStyle(ui)}>
              <span style={shareTextStyle(ui)}>{shareUrl}</span>
              <button
                type="button"
                onClick={handleCopyLink}
                style={secondaryButtonStyle(ui)}
              >
                Copy share link
              </button>
            </div>

            {access.canEdit && (
              <div style={shareRowStyle(ui)}>
                <span style={shareTextStyle(ui)}>{editUrl}</span>
                <button
                  type="button"
                  onClick={handleCopyEditLink}
                  style={secondaryButtonStyle(ui)}
                >
                  Copy CO-OP edit link
                </button>
              </div>
            )}

            {access.canEdit && (
              <button
                type="button"
                onClick={handleDeleteCurrentList}
                disabled={busyAction !== null}
                style={dangerButtonStyle(ui)}
              >
                Delete this list
              </button>
            )}

            <form onSubmit={handleAddItem} style={addFormStyle(ui)}>
              <div style={formHeadingStyle(ui)}>Add gift item</div>
              <label style={fieldStyle}>
                <span style={labelStyle(ui)}>Item name</span>
                <input
                  value={itemDraft.title}
                  onChange={(event) => setItemDraft((draft) => ({ ...draft, title: event.target.value }))}
                  style={inputStyle(ui)}
                  maxLength={90}
                  required
                  disabled={!access.canEdit}
                />
              </label>
              <label style={fieldStyle}>
                <span style={labelStyle(ui)}>Product link</span>
                <input
                  value={itemDraft.link}
                  onChange={(event) => setItemDraft((draft) => ({ ...draft, link: event.target.value }))}
                  style={inputStyle(ui)}
                  maxLength={240}
                  inputMode="url"
                  disabled={!access.canEdit}
                />
              </label>
              <label style={fieldStyle}>
                <span style={labelStyle(ui)}>Notes</span>
                <textarea
                  value={itemDraft.description}
                  onChange={(event) => setItemDraft((draft) => ({ ...draft, description: event.target.value }))}
                  style={textareaStyle(ui)}
                  maxLength={360}
                  disabled={!access.canEdit}
                />
              </label>
              <button
                type="submit"
                disabled={busyAction !== null || !access.canEdit || itemDraft.title.trim().length === 0}
                style={{ ...primaryButtonStyle(ui), gridColumn: '1 / -1' }}
              >
                {busyAction === 'add-item' ? 'Adding...' : 'Add gift'}
              </button>
            </form>

            {!access.canEdit && (
              <div style={noticeStyle(ui)}>
                This share link can select gifts. Use the edit link from the wishlist owner to change names, links, or descriptions.
              </div>
            )}

            {notice && <div style={noticeStyle(ui)}>{notice}</div>}

            {renderWishlistItems(access.canEdit)}
          </>
        )}

        <button type="button" onClick={handleBackToMenu} style={backButtonStyle(ui)}>
          Back to main page
        </button>
      </section>
    </main>
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
}: {
  item: WishlistItem
  ui: WishlistUi
  canEdit: boolean
  participantName: string
  busyAction: BusyAction
  onSave: (input: { title: string; link: string; description: string }) => void
  onDelete: () => void
  onClaim: () => void
  onRelease: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => ({
    title: item.title,
    link: item.link,
    description: item.description,
  }))
  const currentName = participantName.trim()
  const selectedByMe = item.selectedBy !== null && item.selectedBy === currentName
  const selectedByOther = item.selectedBy !== null && !selectedByMe
  const busy =
    busyAction === `claim-${item.id}` ||
    busyAction === `delete-${item.id}` ||
    busyAction === `release-${item.id}` ||
    busyAction === `edit-${item.id}`
  const href = normalizeExternalLink(item.link)

  useEffect(() => {
    if (!editing) {
      setDraft({
        title: item.title,
        link: item.link,
        description: item.description,
      })
    }
  }, [editing, item.description, item.link, item.title])

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
            <span style={labelStyle(ui)}>Item name</span>
            <input
              value={draft.title}
              onChange={(event) => setDraft((next) => ({ ...next, title: event.target.value }))}
              style={inputStyle(ui)}
              maxLength={90}
              required
            />
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle(ui)}>Product link</span>
            <input
              value={draft.link}
              onChange={(event) => setDraft((next) => ({ ...next, link: event.target.value }))}
              style={inputStyle(ui)}
              maxLength={240}
              inputMode="url"
            />
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle(ui)}>Notes</span>
            <textarea
              value={draft.description}
              onChange={(event) => setDraft((next) => ({ ...next, description: event.target.value }))}
              style={textareaStyle(ui)}
              maxLength={360}
            />
          </label>
          <div style={itemActionRowStyle}>
            <button
              type="submit"
              disabled={busy || draft.title.trim().length === 0}
              style={primaryButtonStyle(ui)}
            >
              {busy ? 'Saving...' : 'Save gift'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              style={secondaryButtonStyle(ui)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div style={itemCardTopStyle}>
            <h2 style={itemTitleStyle(ui, selectedByOther)}>{item.title}</h2>
            <span style={pillStyle(item.selectedBy ? ui.warning : ui.accent)}>
              {item.selectedBy ? 'Selected' : 'Open'}
            </span>
          </div>
          {item.description && <p style={itemDescriptionStyle(ui, selectedByOther)}>{item.description}</p>}
          {href && (
            <a href={href} target="_blank" rel="noreferrer" style={itemLinkStyle(ui, selectedByOther)}>
              Open link
            </a>
          )}
          {canEdit && (
            <div style={itemActionRowStyle}>
              <button type="button" onClick={() => setEditing(true)} style={secondaryButtonStyle(ui)}>
                Edit
              </button>
              <button type="button" onClick={onDelete} disabled={busy} style={dangerButtonStyle(ui)}>
                {busyAction === `delete-${item.id}` ? 'Removing...' : 'Remove'}
              </button>
            </div>
          )}
        </>
      )}
      {item.selectedBy && (
        <div style={selectedByStyle(ui)}>
          Selected by {item.selectedBy}
        </div>
      )}
      {selectedByMe ? (
        <button type="button" onClick={onRelease} disabled={busy} style={secondaryButtonStyle(ui)}>
          {busy ? 'Updating...' : 'Release'}
        </button>
      ) : (
        <button
          type="button"
          onClick={onClaim}
          disabled={busy || selectedByOther}
          style={selectedByOther ? disabledButtonStyle(ui) : primaryButtonStyle(ui)}
        >
          {selectedByOther ? 'Selected' : busy ? 'Selecting...' : 'Select'}
        </button>
      )}
    </article>
  )
}

function createEmptyItemDraft(wishlist: Wishlist): { title: string; link: string; description: string } {
  return {
    title: `Item ${wishlist.items.length + 1}`,
    link: '',
    description: '',
  }
}

function normalizeExternalLink(link: string): string {
  const trimmed = link.trim()
  if (!trimmed) return ''

  try {
    return new URL(trimmed).toString()
  } catch {
    try {
      return new URL(`https://${trimmed}`).toString()
    } catch {
      return ''
    }
  }
}

const pageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  overflowY: 'auto',
  overflowX: 'hidden',
  display: 'flex',
  justifyContent: 'center',
  padding: '1.2rem 0.85rem 2.4rem',
  background: WISHLIST_UI.appBackground,
  color: WISHLIST_UI.text,
}

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

function shareRowStyle(ui: WishlistUi): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
    gap: '0.7rem',
    alignItems: 'center',
    padding: '0.8rem',
    border: `1px solid ${ui.subtleBorder}`,
    borderRadius: 12,
    background: ui.selectorBackground,
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
  }
}

function addFormStyle(ui: WishlistUi): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
    gap: '0.8rem',
    alignItems: 'end',
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
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    minHeight: 230,
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
}

function itemTitleStyle(ui: WishlistUi, locked: boolean): CSSProperties {
  return {
    color: ui.text,
    fontFamily: arcadeFontStack,
    fontSize: '0.64rem',
    lineHeight: 1.7,
    margin: 0,
    overflowWrap: 'anywhere',
    textDecoration: locked ? 'line-through' : 'none',
    textDecorationThickness: locked ? 2 : undefined,
    opacity: locked ? 0.68 : 1,
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
    textDecoration: locked ? 'line-through' : 'none',
    opacity: locked ? 0.72 : 1,
  }
}

function itemLinkStyle(ui: WishlistUi, locked: boolean): CSSProperties {
  return {
    color: ui.secondary,
    fontSize: '0.92rem',
    fontWeight: 700,
    letterSpacing: 0,
    textDecoration: locked ? 'line-through' : 'none',
    opacity: locked ? 0.7 : 1,
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
