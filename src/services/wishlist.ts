import type { Wishlist, WishlistAccess, WishlistItem } from '@/types'
import { getCurrentMessages } from '@/hooks/useTranslation'
import { normalizeWishlistLogoDataUrl } from '@/services/wishlistLogo'
import {
  finalizeParticipantName,
  finalizeWishlistName,
  sanitizeWishlistItemInput,
} from '@/services/wishlistFields'

const LISTS_KEY = 'coop-tiny-team-wishlists'
const ACTIVE_LIST_KEY = 'coop-tiny-team-active-wishlist'
const PARTICIPANT_KEY = 'coop-tiny-team-wishlist-participant'
const EDIT_TOKENS_KEY = 'coop-tiny-team-wishlist-edit-tokens'

function getDefaultWishlistName(): string {
  return getCurrentMessages().wishlist.defaultName
}

type WishlistRecord = Record<string, Wishlist>
type WishlistEditTokens = Record<string, string>
type WishlistMode = 'cloud' | 'local'

type WishlistResult = {
  wishlist: Wishlist
  mode: WishlistMode
  access: WishlistAccess
}

export type OwnedWishlist = {
  wishlist: Wishlist
  access: WishlistAccess
}

type BuildWishlistAccessOptions = {
  useStoredToken?: boolean
}

type LoadWishlistOptions = {
  forceViewer?: boolean
}

type SaveLocalWishlistOptions = {
  setActive?: boolean
}

type WishlistItemInput = {
  title: string
  link: string
  description: string
  image?: string | null
}

type WishlistApiResponse = {
  wishlist?: Wishlist
}

type WishlistClaimResponse = {
  wishlist?: Wishlist
  claimed?: boolean
}

export function getStoredParticipantName(): string {
  if (typeof window === 'undefined') return ''

  try {
    return window.localStorage.getItem(PARTICIPANT_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveParticipantName(name: string): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(PARTICIPANT_KEY, finalizeParticipantName(name))
  } catch {
    // ignore storage failures and keep the in-memory value
  }
}

export function getActiveWishlistId(): string | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage.getItem(ACTIVE_LIST_KEY)
  } catch {
    return null
  }
}

export function getStoredWishlistEditToken(wishlistId: string): string | null {
  return getStoredEditTokens()[wishlistId] ?? null
}

export function buildWishlistAccess(
  wishlistId: string,
  editToken?: string | null,
  options: BuildWishlistAccessOptions = {},
): WishlistAccess {
  const token = editToken?.trim() || (options.useStoredToken === false ? null : getStoredWishlistEditToken(wishlistId))

  return {
    canEdit: Boolean(token),
    editToken: token || null,
  }
}

export async function listOwnedWishlists(): Promise<OwnedWishlist[]> {
  const editTokens = getStoredEditTokens()
  const localWishlists = getLocalWishlists()
  const owned = await Promise.all(
    Object.entries(editTokens).map(async ([wishlistId, editToken]) => {
      const cloudWishlist = await loadCloudWishlist(wishlistId)
      const wishlist = cloudWishlist ?? localWishlists[wishlistId]

      if (!wishlist) return null
      if (cloudWishlist) saveLocalWishlist(cloudWishlist, { setActive: false })

      const access: WishlistAccess = {
        canEdit: true,
        editToken,
      }

      return {
        wishlist,
        access,
      }
    }),
  )

  return owned
    .filter((entry): entry is OwnedWishlist => entry !== null)
    .sort((a, b) => Date.parse(b.wishlist.updatedAt) - Date.parse(a.wishlist.updatedAt))
}

export async function createOwnedWishlist(): Promise<WishlistResult> {
  const editToken = createId('edit')
  const wishlist = createWishlist()
  const access: WishlistAccess = { canEdit: true, editToken }

  saveWishlistEditToken(wishlist.id, editToken)
  saveLocalWishlist(wishlist)
  setActiveWishlistId(wishlist.id)

  const cloudWishlist = await saveCloudWishlist(wishlist, editToken)
  if (cloudWishlist) {
    saveLocalWishlist(cloudWishlist)
    return { wishlist: cloudWishlist, mode: 'cloud', access }
  }

  return { wishlist, mode: 'local', access }
}

export async function loadWishlist(
  requestedId?: string | null,
  requestedEditToken?: string | null,
  options: LoadWishlistOptions = {},
): Promise<WishlistResult> {
  const id = requestedId ?? getActiveWishlistId()

  if (id) {
    const access = buildWishlistAccess(id, requestedEditToken, {
      useStoredToken: options.forceViewer !== true,
    })
    const cloudWishlist = await loadCloudWishlist(id)

    if (cloudWishlist) {
      rememberEditAccess(cloudWishlist.id, access)
      saveLocalWishlist(cloudWishlist, { setActive: options.forceViewer !== true })
      return { wishlist: cloudWishlist, mode: 'cloud', access }
    }

    const localWishlist = getLocalWishlist(id)
    if (localWishlist) {
      return { wishlist: localWishlist, mode: 'local', access }
    }
  }

  const editToken = createId('edit')
  const wishlist = createWishlist()
  const access: WishlistAccess = { canEdit: true, editToken }

  saveWishlistEditToken(wishlist.id, editToken)
  saveLocalWishlist(wishlist)
  setActiveWishlistId(wishlist.id)

  const cloudWishlist = await saveCloudWishlist(wishlist, editToken)
  if (cloudWishlist) {
    saveLocalWishlist(cloudWishlist)
    return { wishlist: cloudWishlist, mode: 'cloud', access }
  }

  return { wishlist, mode: 'local', access }
}

export async function deleteWishlist(wishlist: Wishlist, access: WishlistAccess): Promise<boolean> {
  const cloudDeleted = await deleteCloudWishlist(wishlist.id, access.editToken)

  if (cloudDeleted || canEditLocally(wishlist.id, access)) {
    removeLocalWishlist(wishlist.id)
    removeWishlistEditToken(wishlist.id)
    return true
  }

  return false
}

export async function updateWishlistLogo(
  wishlist: Wishlist,
  logo: string | null,
  access: WishlistAccess,
): Promise<WishlistResult> {
  const normalizedLogo = logo === null ? null : normalizeWishlistLogoDataUrl(logo)
  const updated = {
    ...wishlist,
    logo: normalizedLogo,
    updatedAt: new Date().toISOString(),
  }

  const cloudWishlist = await patchCloudWishlist(
    updated.id,
    { logo: normalizedLogo },
    access.editToken,
  )
  if (cloudWishlist) {
    rememberEditAccess(updated.id, access)
    saveLocalWishlist(cloudWishlist)
    return { wishlist: cloudWishlist, mode: 'cloud', access }
  }

  if (!canEditLocally(wishlist.id, access)) {
    return { wishlist, mode: 'local', access }
  }

  saveLocalWishlist(updated)
  return { wishlist: updated, mode: 'local', access }
}

export async function renameWishlist(
  wishlist: Wishlist,
  name: string,
  access: WishlistAccess,
): Promise<WishlistResult> {
  const updated = {
    ...wishlist,
    name: normalizeWishlistName(name),
    updatedAt: new Date().toISOString(),
  }

  const cloudWishlist = await patchCloudWishlist(updated.id, { name: updated.name }, access.editToken)
  if (cloudWishlist) {
    rememberEditAccess(updated.id, access)
    saveLocalWishlist(cloudWishlist)
    return { wishlist: cloudWishlist, mode: 'cloud', access }
  }

  if (!canEditLocally(wishlist.id, access)) {
    return { wishlist, mode: 'local', access }
  }

  saveLocalWishlist(updated)
  return { wishlist: updated, mode: 'local', access }
}

export async function addWishlistItem(
  wishlist: Wishlist,
  input: WishlistItemInput,
  access: WishlistAccess,
): Promise<WishlistResult> {
  const now = new Date().toISOString()
  const sanitized = sanitizeWishlistItemInput(input)
  const item: WishlistItem = {
    id: createId('gift'),
    title: sanitized.title,
    link: sanitized.link,
    description: sanitized.description,
    image: sanitized.image,
    selectedBy: null,
    createdAt: now,
    updatedAt: now,
  }
  const updated = {
    ...wishlist,
    items: [...wishlist.items, item],
    updatedAt: now,
  }

  const cloudWishlist = await addCloudWishlistItem(wishlist.id, item, access.editToken)
  if (cloudWishlist) {
    rememberEditAccess(wishlist.id, access)
    saveLocalWishlist(cloudWishlist)
    return { wishlist: cloudWishlist, mode: 'cloud', access }
  }

  if (!canEditLocally(wishlist.id, access)) {
    return { wishlist, mode: 'local', access }
  }

  saveLocalWishlist(updated)
  return { wishlist: updated, mode: 'local', access }
}

export async function updateWishlistItem(
  wishlist: Wishlist,
  itemId: string,
  input: WishlistItemInput,
  access: WishlistAccess,
): Promise<WishlistResult> {
  const now = new Date().toISOString()
  const sanitized = sanitizeWishlistItemInput(input)
  const updated = {
    ...wishlist,
    items: wishlist.items.map((item) => (
      item.id === itemId
        ? {
          ...item,
          title: sanitized.title,
          link: sanitized.link,
          description: sanitized.description,
          image: sanitized.image,
          updatedAt: now,
        }
        : item
    )),
    updatedAt: now,
  }

  const cloudWishlist = await patchCloudWishlistItem(wishlist.id, itemId, input, access.editToken)
  if (cloudWishlist) {
    rememberEditAccess(wishlist.id, access)
    saveLocalWishlist(cloudWishlist)
    return { wishlist: cloudWishlist, mode: 'cloud', access }
  }

  if (!canEditLocally(wishlist.id, access)) {
    return { wishlist, mode: 'local', access }
  }

  saveLocalWishlist(updated)
  return { wishlist: updated, mode: 'local', access }
}

export async function deleteWishlistItem(
  wishlist: Wishlist,
  itemId: string,
  access: WishlistAccess,
): Promise<WishlistResult> {
  const updated = {
    ...wishlist,
    items: wishlist.items.filter((item) => item.id !== itemId),
    updatedAt: new Date().toISOString(),
  }

  const cloudWishlist = await deleteCloudWishlistItem(wishlist.id, itemId, access.editToken)
  if (cloudWishlist) {
    rememberEditAccess(wishlist.id, access)
    saveLocalWishlist(cloudWishlist)
    return { wishlist: cloudWishlist, mode: 'cloud', access }
  }

  if (!canEditLocally(wishlist.id, access)) {
    return { wishlist, mode: 'local', access }
  }

  saveLocalWishlist(updated)
  return { wishlist: updated, mode: 'local', access }
}

export async function claimWishlistItem(
  wishlist: Wishlist,
  itemId: string,
  participantName: string,
  access: WishlistAccess,
): Promise<{ wishlist: Wishlist; mode: WishlistMode; access: WishlistAccess; claimed: boolean }> {
  const selectedBy = normalizeParticipantName(participantName)
  const cloudResult = await claimCloudWishlistItem(wishlist.id, itemId, selectedBy)

  if (cloudResult?.wishlist) {
    saveLocalWishlist(cloudResult.wishlist, { setActive: access.canEdit })
    return {
      wishlist: cloudResult.wishlist,
      mode: 'cloud',
      access,
      claimed: cloudResult.claimed ?? false,
    }
  }

  const item = wishlist.items.find((candidate) => candidate.id === itemId)
  if (!item || item.selectedBy) {
    return { wishlist, mode: 'local', access, claimed: false }
  }

  const updated = updateLocalItem(wishlist, itemId, {
    selectedBy,
    updatedAt: new Date().toISOString(),
  })
  return { wishlist: updated, mode: 'local', access, claimed: true }
}

export async function releaseWishlistItem(
  wishlist: Wishlist,
  itemId: string,
  participantName: string,
  access: WishlistAccess,
): Promise<WishlistResult> {
  const selectedBy = normalizeParticipantName(participantName)
  const cloudWishlist = await releaseCloudWishlistItem(wishlist.id, itemId, selectedBy)

  if (cloudWishlist) {
    saveLocalWishlist(cloudWishlist, { setActive: access.canEdit })
    return { wishlist: cloudWishlist, mode: 'cloud', access }
  }

  const item = wishlist.items.find((candidate) => candidate.id === itemId)
  if (!item || item.selectedBy !== selectedBy) {
    return { wishlist, mode: 'local', access }
  }

  return {
    wishlist: updateLocalItem(wishlist, itemId, {
      selectedBy: null,
      updatedAt: new Date().toISOString(),
    }),
    mode: 'local',
    access,
  }
}

export async function refreshWishlist(wishlist: Wishlist, access: WishlistAccess): Promise<WishlistResult> {
  const cloudWishlist = await loadCloudWishlist(wishlist.id)
  if (cloudWishlist) {
    saveLocalWishlist(cloudWishlist, { setActive: access.canEdit })
    return { wishlist: cloudWishlist, mode: 'cloud', access }
  }

  return { wishlist: getLocalWishlist(wishlist.id) ?? wishlist, mode: 'local', access }
}

function createWishlist(): Wishlist {
  const now = new Date().toISOString()
  return {
    id: createId('wish'),
    name: getDefaultWishlistName(),
    logo: null,
    items: [],
    createdAt: now,
    updatedAt: now,
  }
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function normalizeWishlistName(name: string): string {
  return finalizeWishlistName(name, getDefaultWishlistName())
}

function normalizeParticipantName(name: string): string {
  return finalizeParticipantName(name)
}

function getStoredEditTokens(): WishlistEditTokens {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(EDIT_TOKENS_KEY)
    return raw ? (JSON.parse(raw) as WishlistEditTokens) : {}
  } catch {
    return {}
  }
}

function saveWishlistEditToken(wishlistId: string, editToken: string): void {
  if (typeof window === 'undefined') return

  try {
    const tokens = getStoredEditTokens()
    tokens[wishlistId] = editToken
    window.localStorage.setItem(EDIT_TOKENS_KEY, JSON.stringify(tokens))
  } catch {
    // ignore storage failures and keep the in-memory value
  }
}

function removeWishlistEditToken(wishlistId: string): void {
  if (typeof window === 'undefined') return

  try {
    const tokens = getStoredEditTokens()
    delete tokens[wishlistId]
    window.localStorage.setItem(EDIT_TOKENS_KEY, JSON.stringify(tokens))
  } catch {
    // ignore storage failures and keep the in-memory value
  }
}

function rememberEditAccess(wishlistId: string, access: WishlistAccess): void {
  if (access.editToken) {
    saveWishlistEditToken(wishlistId, access.editToken)
  }
}

function canEditLocally(wishlistId: string, access: WishlistAccess): boolean {
  if (!access.editToken) return false
  return getStoredWishlistEditToken(wishlistId) === access.editToken
}

function getLocalWishlists(): WishlistRecord {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(LISTS_KEY)
    return raw ? (JSON.parse(raw) as WishlistRecord) : {}
  } catch {
    return {}
  }
}

function getLocalWishlist(id: string): Wishlist | null {
  return getLocalWishlists()[id] ?? null
}

function saveLocalWishlist(wishlist: Wishlist, options: SaveLocalWishlistOptions = {}): void {
  if (typeof window === 'undefined') return

  try {
    const wishlists = getLocalWishlists()
    wishlists[wishlist.id] = wishlist
    window.localStorage.setItem(LISTS_KEY, JSON.stringify(wishlists))
    if (options.setActive !== false) {
      setActiveWishlistId(wishlist.id)
    }
  } catch {
    // ignore storage failures and keep the in-memory value
  }
}

function removeLocalWishlist(wishlistId: string): void {
  if (typeof window === 'undefined') return

  try {
    const wishlists = getLocalWishlists()
    delete wishlists[wishlistId]
    window.localStorage.setItem(LISTS_KEY, JSON.stringify(wishlists))

    if (getActiveWishlistId() === wishlistId) {
      window.localStorage.removeItem(ACTIVE_LIST_KEY)
    }
  } catch {
    // ignore storage failures and keep the in-memory value
  }
}

function setActiveWishlistId(id: string): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(ACTIVE_LIST_KEY, id)
  } catch {
    // ignore storage failures and keep the in-memory value
  }
}

function updateLocalItem(
  wishlist: Wishlist,
  itemId: string,
  patch: Pick<WishlistItem, 'selectedBy' | 'updatedAt'>,
): Wishlist {
  const updated = {
    ...wishlist,
    items: wishlist.items.map((item) => (
      item.id === itemId ? { ...item, ...patch } : item
    )),
    updatedAt: patch.updatedAt,
  }
  saveLocalWishlist(updated)
  return updated
}

async function loadCloudWishlist(id: string): Promise<Wishlist | null> {
  const response = await apiRequest<WishlistApiResponse>(`/api/wishlists/${encodeURIComponent(id)}`)
  return response?.wishlist ?? null
}

async function saveCloudWishlist(wishlist: Wishlist, editToken: string): Promise<Wishlist | null> {
  const response = await apiRequest<WishlistApiResponse>('/api/wishlists', {
    method: 'POST',
    body: JSON.stringify({ ...wishlist, editToken }),
  })

  return response?.wishlist ?? null
}

async function patchCloudWishlist(
  wishlistId: string,
  patch: { name?: string; logo?: string | null },
  editToken: string | null,
): Promise<Wishlist | null> {
  const response = await apiRequest<WishlistApiResponse>(`/api/wishlists/${encodeURIComponent(wishlistId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...patch, editToken }),
  })

  return response?.wishlist ?? null
}

async function addCloudWishlistItem(
  wishlistId: string,
  item: WishlistItem,
  editToken: string | null,
): Promise<Wishlist | null> {
  const response = await apiRequest<WishlistApiResponse>(
    `/api/wishlists/${encodeURIComponent(wishlistId)}/items`,
    {
      method: 'POST',
      body: JSON.stringify({ ...item, editToken }),
    },
  )

  return response?.wishlist ?? null
}

async function patchCloudWishlistItem(
  wishlistId: string,
  itemId: string,
  input: WishlistItemInput,
  editToken: string | null,
): Promise<Wishlist | null> {
  const response = await apiRequest<WishlistApiResponse>(
    `/api/wishlists/${encodeURIComponent(wishlistId)}/items/${encodeURIComponent(itemId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ ...input, editToken }),
    },
  )

  return response?.wishlist ?? null
}

async function deleteCloudWishlistItem(
  wishlistId: string,
  itemId: string,
  editToken: string | null,
): Promise<Wishlist | null> {
  const response = await apiRequest<WishlistApiResponse>(
    `/api/wishlists/${encodeURIComponent(wishlistId)}/items/${encodeURIComponent(itemId)}`,
    {
      method: 'DELETE',
      body: JSON.stringify({ editToken }),
    },
  )

  return response?.wishlist ?? null
}

async function claimCloudWishlistItem(
  wishlistId: string,
  itemId: string,
  selectedBy: string,
): Promise<WishlistClaimResponse | null> {
  return apiRequest<WishlistClaimResponse>(
    `/api/wishlists/${encodeURIComponent(wishlistId)}/items/${encodeURIComponent(itemId)}/claim`,
    {
      method: 'POST',
      body: JSON.stringify({ selectedBy }),
    },
  )
}

async function releaseCloudWishlistItem(
  wishlistId: string,
  itemId: string,
  selectedBy: string,
): Promise<Wishlist | null> {
  const response = await apiRequest<WishlistApiResponse>(
    `/api/wishlists/${encodeURIComponent(wishlistId)}/items/${encodeURIComponent(itemId)}/release`,
    {
      method: 'POST',
      body: JSON.stringify({ selectedBy }),
    },
  )

  return response?.wishlist ?? null
}

async function deleteCloudWishlist(
  wishlistId: string,
  editToken: string | null,
): Promise<boolean> {
  const response = await apiRequest<{ deleted?: boolean }>(
    `/api/wishlists/${encodeURIComponent(wishlistId)}`,
    {
      method: 'DELETE',
      body: JSON.stringify({ editToken }),
    },
  )

  return response?.deleted === true
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  try {
    const response = await fetch(path, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init.headers,
      },
    })

    if (!response.ok) return null
    return await response.json() as T
  } catch {
    return null
  }
}
