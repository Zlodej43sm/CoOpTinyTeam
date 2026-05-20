import type { Wishlist, WishlistItem } from '@/types'
import {
  isAllowedPreviewUrl,
  isDirectImageUrl,
  normalizePreviewUrl,
  parseLinkPreviewHtml,
} from '@/services/linkPreviewShared'
import {
  finalizeParticipantName,
  finalizeWishlistName,
  sanitizeWishlistItemInput,
} from '@/services/wishlistFields'

type D1Result<T = unknown> = {
  results?: T[]
  meta?: {
    changes?: number
  }
}

type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement
  first: <T = unknown>() => Promise<T | null>
  all: <T = unknown>() => Promise<D1Result<T>>
  run: () => Promise<D1Result>
}

type D1DatabaseBinding = {
  prepare: (query: string) => D1PreparedStatement
  batch: <T = unknown>(statements: D1PreparedStatement[]) => Promise<D1Result<T>[]>
}

type AssetsBinding = {
  fetch: (request: Request) => Promise<Response>
}

type ExecutionCtx = {
  waitUntil: (promise: Promise<unknown>) => void
}

type ScheduledCtrl = {
  cron: string
  scheduledTime: number
  type: 'scheduled'
}

type Env = {
  ASSETS: AssetsBinding
  WISHLIST_DB: D1DatabaseBinding
}

type WishlistRow = {
  id: string
  name: string | null
  logo: string | null
  created_at: string | null
  updated_at: string | null
}

type WishlistItemRow = {
  id: string
  title: string | null
  link: string | null
  description: string | null
  selected_by: string | null
  created_at: string | null
  updated_at: string | null
}

type WishlistWriteInput = Partial<Wishlist> & {
  editToken?: string
}

type WishlistEditInput = {
  editToken?: string
}

type WishlistNameInput = WishlistEditInput & {
  name?: string
  logo?: string | null
}

type WishlistItemInput = WishlistEditInput & Partial<WishlistItem>

const CLEANUP_AFTER_DAYS = 365
const CLEANUP_AFTER_MS = CLEANUP_AFTER_DAYS * 24 * 60 * 60 * 1000
const DEFAULT_WISHLIST_NAME = 'Family Gift Wishlist'
const SITE_URL = 'https://cooptinyteam.com'
const WISHLIST_TITLE = 'CoOp Tiny Team Wishlist | Shared gift lists for family and friends'
const WISHLIST_DESCRIPTION =
  'Create a shared gift wishlist for birthdays, holidays, kids, family, and friends. Add gift item links and descriptions, share the wishlist URL, and let one person select each gift so everyone else knows it is taken.'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/wishlists')) {
      return handleWishlistApi(request, env)
    }

    if (url.pathname === '/api/link-preview') {
      return handleLinkPreview(request)
    }

    if (isWishlistRoute(url.pathname)) {
      return serveWishlistHtml(request, env)
    }

    return env.ASSETS.fetch(request)
  },

  async scheduled(_controller: ScheduledCtrl, env: Env, ctx: ExecutionCtx): Promise<void> {
    ctx.waitUntil(cleanupExpiredData(env.WISHLIST_DB))
  },
}

async function handleLinkPreview(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url')
  if (!targetUrl) {
    return json({ error: 'Missing url' }, 400)
  }

  const normalized = normalizePreviewUrl(targetUrl)
  if (!normalized) {
    return json({ error: 'Invalid url' }, 400)
  }

  if (!isAllowedPreviewUrl(normalized)) {
    return json({ error: 'Blocked url' }, 403)
  }

  if (isDirectImageUrl(normalized)) {
    return json(
      { kind: 'image', url: normalized, image: normalized },
      200,
      previewCacheHeaders(),
    )
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const response = await fetch(normalized, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'user-agent': 'CoOpTinyTeam-LinkPreview/1.0',
      },
    })
    clearTimeout(timeout)

    if (!response.ok) {
      return json({ error: 'Failed to fetch preview' }, 502)
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.startsWith('image/')) {
      return json(
        { kind: 'image', url: normalized, image: normalized },
        200,
        previewCacheHeaders(),
      )
    }

    const html = (await response.text()).slice(0, 150_000)
    const preview = parseLinkPreviewHtml(html, normalized)

    return json(
      {
        kind: 'page',
        url: normalized,
        ...preview,
      },
      200,
      previewCacheHeaders(),
    )
  } catch {
    return json({ error: 'Failed to fetch preview' }, 502)
  }
}

function previewCacheHeaders(): HeadersInit {
  return {
    'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
  }
}

async function serveWishlistHtml(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const response = await env.ASSETS.fetch(request)
  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('text/html')) {
    return response
  }

  const noindexSharedList = url.pathname.startsWith('/wishlist/')
  const html = withWishlistSeo(await response.text(), noindexSharedList)
  const headers = new Headers(response.headers)
  headers.set('content-type', 'text/html; charset=UTF-8')

  if (noindexSharedList) {
    headers.set('x-robots-tag', 'noindex,follow')
  }

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function withWishlistSeo(html: string, noindex: boolean): string {
  const robots = noindex
    ? 'noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
    : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'

  let updated = html
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(WISHLIST_TITLE)}</title>`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${SITE_URL}/wishlist" />`)

  updated = replaceMetaName(updated, 'description', WISHLIST_DESCRIPTION)
  updated = replaceMetaName(
    updated,
    'keywords',
    'family gift wishlist, shared gift list, birthday wishlist, holiday wishlist, kids gifts, toddler gifts, gift ideas for children, family wishlist, online wishlist, gift item links',
  )
  updated = replaceMetaName(updated, 'robots', robots)
  updated = replaceMetaName(updated, 'googlebot', robots)
  updated = replaceMetaProperty(updated, 'og:url', `${SITE_URL}/wishlist`)
  updated = replaceMetaProperty(updated, 'og:title', WISHLIST_TITLE)
  updated = replaceMetaProperty(updated, 'og:description', WISHLIST_DESCRIPTION)
  updated = replaceMetaName(updated, 'twitter:title', WISHLIST_TITLE)
  updated = replaceMetaName(updated, 'twitter:description', WISHLIST_DESCRIPTION)

  return updated
}

function replaceMetaName(html: string, name: string, content: string): string {
  return html.replace(
    new RegExp(`<meta name="${escapeRegExp(name)}" content="[^"]*" \\/>`),
    `<meta name="${name}" content="${escapeHtml(content)}" />`,
  )
}

function replaceMetaProperty(html: string, property: string, content: string): string {
  return html.replace(
    new RegExp(`<meta property="${escapeRegExp(property)}" content="[^"]*" \\/>`),
    `<meta property="${property}" content="${escapeHtml(content)}" />`,
  )
}

function isWishlistRoute(pathname: string): boolean {
  return pathname === '/wishlist' || pathname.startsWith('/wishlist/')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function handleWishlistApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const parts = url.pathname.split('/').filter(Boolean)
  const [, resource, wishlistId, nestedResource, itemId, action] = parts

  if (resource !== 'wishlists') {
    return json({ error: 'Not found' }, 404)
  }

  try {
    if (request.method === 'POST' && !wishlistId) {
      const input = await readJson<WishlistWriteInput>(request)
      const wishlist = await createWishlist(env.WISHLIST_DB, input)
      return json({ wishlist })
    }

    if (!wishlistId) {
      return json({ error: 'Wishlist id is required' }, 400)
    }

    if (request.method === 'GET' && !nestedResource) {
      const wishlist = await loadWishlist(env.WISHLIST_DB, wishlistId, true)
      return wishlist ? json({ wishlist }) : json({ error: 'Wishlist not found' }, 404)
    }

    if (request.method === 'PATCH' && !nestedResource) {
      const input = await readJson<WishlistNameInput>(request)
      if (!await canEditWishlist(env.WISHLIST_DB, wishlistId, input.editToken)) {
        return json({ error: 'Edit link required' }, 403)
      }
      const wishlist = await patchWishlist(env.WISHLIST_DB, wishlistId, input)
      return wishlist ? json({ wishlist }) : json({ error: 'Wishlist not found' }, 404)
    }

    if (request.method === 'DELETE' && !nestedResource) {
      const input = await readJson<WishlistEditInput>(request)
      if (!await canEditWishlist(env.WISHLIST_DB, wishlistId, input.editToken)) {
        return json({ error: 'Edit link required' }, 403)
      }

      const deleted = await deleteWishlist(env.WISHLIST_DB, wishlistId)
      return deleted ? json({ deleted: true }) : json({ error: 'Wishlist not found' }, 404)
    }

    if (request.method === 'POST' && nestedResource === 'items' && !itemId) {
      const input = await readJson<WishlistItemInput>(request)
      if (!await canEditWishlist(env.WISHLIST_DB, wishlistId, input.editToken)) {
        return json({ error: 'Edit link required' }, 403)
      }
      const wishlist = await addWishlistItem(env.WISHLIST_DB, wishlistId, input)
      return wishlist ? json({ wishlist }) : json({ error: 'Wishlist not found' }, 404)
    }

    if (request.method === 'PATCH' && nestedResource === 'items' && itemId && !action) {
      const input = await readJson<WishlistItemInput>(request)
      if (!await canEditWishlist(env.WISHLIST_DB, wishlistId, input.editToken)) {
        return json({ error: 'Edit link required' }, 403)
      }
      const wishlist = await updateWishlistItem(env.WISHLIST_DB, wishlistId, itemId, input)
      return wishlist ? json({ wishlist }) : json({ error: 'Wishlist item not found' }, 404)
    }

    if (request.method === 'DELETE' && nestedResource === 'items' && itemId && !action) {
      const input = await readJson<WishlistEditInput>(request)
      if (!await canEditWishlist(env.WISHLIST_DB, wishlistId, input.editToken)) {
        return json({ error: 'Edit link required' }, 403)
      }
      const wishlist = await deleteWishlistItem(env.WISHLIST_DB, wishlistId, itemId)
      return wishlist ? json({ wishlist }) : json({ error: 'Wishlist item not found' }, 404)
    }

    if (request.method === 'POST' && nestedResource === 'items' && itemId && action === 'claim') {
      const input = await readJson<{ selectedBy?: string }>(request)
      const result = await claimWishlistItem(env.WISHLIST_DB, wishlistId, itemId, input.selectedBy)
      return result.wishlist
        ? json(result)
        : json({ error: 'Wishlist item not found' }, 404)
    }

    if (request.method === 'POST' && nestedResource === 'items' && itemId && action === 'release') {
      const input = await readJson<{ selectedBy?: string }>(request)
      const wishlist = await releaseWishlistItem(env.WISHLIST_DB, wishlistId, itemId, input.selectedBy)
      return wishlist ? json({ wishlist }) : json({ error: 'Wishlist item not found' }, 404)
    }

    return json({ error: 'Not found' }, 404)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed'
    return json({ error: message }, 400)
  }
}

async function createWishlist(db: D1DatabaseBinding, input: WishlistWriteInput): Promise<Wishlist> {
  const now = new Date().toISOString()
  const id = input.id?.trim() || createId('wish')
  const name = normalizeWishlistName(input.name)
  const editToken = input.editToken?.trim() || createId('edit')
  const createdAt = input.createdAt || now
  const updatedAt = now

  const result = await db.prepare(`
    insert into wishlists (id, name, created_at, updated_at, last_used_at, edit_token)
    values (?, ?, ?, ?, ?, ?)
    on conflict(id) do nothing
  `).bind(id, name, createdAt, updatedAt, now, editToken).run()

  if ((result.meta?.changes ?? 0) > 0) {
    for (const item of input.items ?? []) {
      await insertWishlistItem(db, id, item)
    }
  }

  return loadWishlist(db, id, true) as Promise<Wishlist>
}

async function patchWishlist(
  db: D1DatabaseBinding,
  wishlistId: string,
  input: WishlistNameInput,
): Promise<Wishlist | null> {
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: unknown[] = []

  if (input.name !== undefined) {
    fields.push('name = ?')
    values.push(normalizeWishlistName(input.name))
  }

  if (input.logo !== undefined) {
    fields.push('logo = ?')
    values.push(normalizeWishlistLogo(input.logo))
  }

  if (fields.length === 0) {
    return loadWishlist(db, wishlistId, true)
  }

  fields.push('updated_at = ?', 'last_used_at = ?')
  values.push(now, now, wishlistId)

  const result = await db.prepare(`
    update wishlists
    set ${fields.join(', ')}
    where id = ?
  `).bind(...values).run()

  if ((result.meta?.changes ?? 0) === 0) return null
  return loadWishlist(db, wishlistId, true)
}

async function deleteWishlist(db: D1DatabaseBinding, wishlistId: string): Promise<boolean> {
  const result = await db.prepare(`
    delete from wishlists
    where id = ?
  `).bind(wishlistId).run()

  return (result.meta?.changes ?? 0) > 0
}

async function addWishlistItem(
  db: D1DatabaseBinding,
  wishlistId: string,
  input: WishlistItemInput,
): Promise<Wishlist | null> {
  const exists = await wishlistExists(db, wishlistId)
  if (!exists) return null

  await insertWishlistItem(db, wishlistId, input)
  await touchWishlist(db, wishlistId)

  return loadWishlist(db, wishlistId, true)
}

async function updateWishlistItem(
  db: D1DatabaseBinding,
  wishlistId: string,
  itemId: string,
  input: WishlistItemInput,
): Promise<Wishlist | null> {
  const now = new Date().toISOString()
  const sanitized = sanitizeWishlistItemInput({
    title: input.title ?? '',
    link: input.link ?? '',
    description: input.description ?? '',
  })

  if (!sanitized.title) {
    throw new Error('Item name is required')
  }

  const result = await db.prepare(`
    update wishlist_items
    set title = ?, link = ?, description = ?, updated_at = ?, last_used_at = ?
    where wishlist_id = ? and id = ?
  `).bind(
    sanitized.title,
    sanitized.link,
    sanitized.description,
    now,
    now,
    wishlistId,
    itemId,
  ).run()

  if ((result.meta?.changes ?? 0) === 0) return null

  await touchWishlist(db, wishlistId)
  return loadWishlist(db, wishlistId, true)
}

async function deleteWishlistItem(
  db: D1DatabaseBinding,
  wishlistId: string,
  itemId: string,
): Promise<Wishlist | null> {
  const result = await db.prepare(`
    delete from wishlist_items
    where wishlist_id = ? and id = ?
  `).bind(wishlistId, itemId).run()

  if ((result.meta?.changes ?? 0) === 0) return null

  await touchWishlist(db, wishlistId)
  return loadWishlist(db, wishlistId, true)
}

async function claimWishlistItem(
  db: D1DatabaseBinding,
  wishlistId: string,
  itemId: string,
  selectedByInput: string | undefined,
): Promise<{ wishlist: Wishlist | null; claimed: boolean }> {
  const now = new Date().toISOString()
  const selectedBy = finalizeParticipantName(selectedByInput ?? '')

  if (!selectedBy) {
    throw new Error('Name is required')
  }

  const result = await db.prepare(`
    update wishlist_items
    set selected_by = ?, updated_at = ?, last_used_at = ?
    where wishlist_id = ? and id = ? and selected_by is null
  `).bind(selectedBy, now, now, wishlistId, itemId).run()
  await touchWishlist(db, wishlistId)

  const wishlist = await loadWishlist(db, wishlistId, true)
  return {
    wishlist,
    claimed: (result.meta?.changes ?? 0) > 0,
  }
}

async function releaseWishlistItem(
  db: D1DatabaseBinding,
  wishlistId: string,
  itemId: string,
  selectedByInput: string | undefined,
): Promise<Wishlist | null> {
  const now = new Date().toISOString()
  const selectedBy = finalizeParticipantName(selectedByInput ?? '')

  if (!selectedBy) {
    return loadWishlist(db, wishlistId, true)
  }

  const result = await db.prepare(`
    update wishlist_items
    set selected_by = null, updated_at = ?, last_used_at = ?
    where wishlist_id = ? and id = ? and selected_by = ?
  `).bind(now, now, wishlistId, itemId, selectedBy).run()

  if ((result.meta?.changes ?? 0) === 0) {
    return loadWishlist(db, wishlistId, true)
  }

  await touchWishlist(db, wishlistId)
  return loadWishlist(db, wishlistId, true)
}

async function insertWishlistItem(
  db: D1DatabaseBinding,
  wishlistId: string,
  input: Partial<WishlistItem>,
): Promise<void> {
  const now = new Date().toISOString()
  const sanitized = sanitizeWishlistItemInput({
    title: input.title ?? '',
    link: input.link ?? '',
    description: input.description ?? '',
  })

  if (!sanitized.title) {
    throw new Error('Item name is required')
  }

  await db.prepare(`
    insert into wishlist_items (
      id,
      wishlist_id,
      title,
      link,
      description,
      selected_by,
      created_at,
      updated_at,
      last_used_at
    )
    values (?, ?, ?, ?, ?, ?, ?, ?, ?)
    on conflict(id) do update set
      title = excluded.title,
      link = excluded.link,
      description = excluded.description,
      selected_by = excluded.selected_by,
      updated_at = excluded.updated_at,
      last_used_at = excluded.last_used_at
  `  ).bind(
    input.id?.trim() || createId('gift'),
    wishlistId,
    sanitized.title,
    sanitized.link,
    sanitized.description,
    input.selectedBy ?? null,
    input.createdAt ?? now,
    now,
    now,
  ).run()
}

async function loadWishlist(
  db: D1DatabaseBinding,
  wishlistId: string,
  touch: boolean,
): Promise<Wishlist | null> {
  if (touch) {
    await touchWishlistDeep(db, wishlistId)
  }

  const wishlistRow = await db.prepare(`
    select id, name, logo, created_at, updated_at
    from wishlists
    where id = ?
  `).bind(wishlistId).first<WishlistRow>()

  if (!wishlistRow) return null

  const itemRows = await db.prepare(`
    select id, title, link, description, selected_by, created_at, updated_at
    from wishlist_items
    where wishlist_id = ?
    order by created_at asc
  `).bind(wishlistId).all<WishlistItemRow>()

  return mapWishlist(wishlistRow, itemRows.results ?? [])
}

async function wishlistExists(db: D1DatabaseBinding, wishlistId: string): Promise<boolean> {
  const row = await db.prepare('select id from wishlists where id = ?').bind(wishlistId).first<{ id: string }>()
  return row !== null
}

async function canEditWishlist(
  db: D1DatabaseBinding,
  wishlistId: string,
  editToken: string | undefined,
): Promise<boolean> {
  const token = editToken?.trim()
  if (!token) return false

  const row = await db.prepare(`
    select id
    from wishlists
    where id = ? and edit_token = ?
  `).bind(wishlistId, token).first<{ id: string }>()

  return row !== null
}

async function touchWishlist(db: D1DatabaseBinding, wishlistId: string): Promise<void> {
  const now = new Date().toISOString()
  await db.prepare(`
    update wishlists
    set updated_at = ?, last_used_at = ?
    where id = ?
  `).bind(now, now, wishlistId).run()
}

async function touchWishlistDeep(db: D1DatabaseBinding, wishlistId: string): Promise<void> {
  const now = new Date().toISOString()
  await db.batch([
    db.prepare('update wishlists set last_used_at = ? where id = ?').bind(now, wishlistId),
    db.prepare('update wishlist_items set last_used_at = ? where wishlist_id = ?').bind(now, wishlistId),
  ])
}

async function cleanupExpiredData(db: D1DatabaseBinding): Promise<void> {
  const cutoff = new Date(Date.now() - CLEANUP_AFTER_MS).toISOString()

  await db.batch([
    db.prepare('delete from wishlist_items where last_used_at < ?').bind(cutoff),
    db.prepare('delete from wishlists where last_used_at < ?').bind(cutoff),
  ])
}

function mapWishlist(row: WishlistRow, itemRows: WishlistItemRow[]): Wishlist {
  const now = new Date().toISOString()

  return {
    id: row.id,
    name: row.name ?? DEFAULT_WISHLIST_NAME,
    logo: row.logo ?? null,
    createdAt: row.created_at ?? now,
    updatedAt: row.updated_at ?? now,
    items: itemRows.map((item) => ({
      id: item.id,
      title: item.title ?? 'Gift item',
      link: item.link ?? '',
      description: item.description ?? '',
      selectedBy: item.selected_by,
      createdAt: item.created_at ?? now,
      updatedAt: item.updated_at ?? now,
    })),
  }
}

async function readJson<T>(request: Request): Promise<T> {
  try {
    return await request.json() as T
  } catch {
    return {} as T
  }
}

function json(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return Response.json(data, {
    status,
    headers: {
      'cache-control': 'no-store',
      ...headers,
    },
  })
}

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

function normalizeWishlistName(name: string | undefined): string {
  return finalizeWishlistName(name ?? '', DEFAULT_WISHLIST_NAME)
}

function normalizeWishlistLogo(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null

  const trimmed = value.trim()
  if (!trimmed) return null

  const match = trimmed.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,([a-z0-9+/=\s]+)$/i)
  if (!match) {
    throw new Error('Logo must be a PNG, JPG, WebP, or GIF image.')
  }

  const mime = match[1]?.toLowerCase()
  const base64 = match[2]?.replace(/\s/g, '') ?? ''
  if (!mime) {
    throw new Error('Logo must be a PNG, JPG, WebP, or GIF image.')
  }

  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  const byteLength = Math.floor((base64.length * 3) / 4) - padding
  const maxBytes = 300 * 1024

  if (byteLength > maxBytes) {
    throw new Error('Logo must be 300 KB or smaller.')
  }

  return `data:${mime};base64,${base64}`
}
