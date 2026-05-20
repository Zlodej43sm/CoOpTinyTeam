const VIEWER_JOINED_KEY = 'coop-tiny-team-wishlist-viewer-joined'

type ViewerJoinedRecord = Record<string, string>

function readJoinedRecord(): ViewerJoinedRecord {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(VIEWER_JOINED_KEY)
    return raw ? (JSON.parse(raw) as ViewerJoinedRecord) : {}
  } catch {
    return {}
  }
}

function writeJoinedRecord(record: ViewerJoinedRecord): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(VIEWER_JOINED_KEY, JSON.stringify(record))
  } catch {
    // ignore storage failures
  }
}

export function getJoinedViewerName(wishlistId: string): string | null {
  const name = readJoinedRecord()[wishlistId]?.trim()
  return name && name.length > 0 ? name : null
}

export function saveJoinedViewerName(wishlistId: string, name: string): void {
  const trimmed = name.trim()
  if (!trimmed) return

  const record = readJoinedRecord()
  record[wishlistId] = trimmed
  writeJoinedRecord(record)
}

export function clearJoinedViewerName(wishlistId: string): void {
  const record = readJoinedRecord()
  delete record[wishlistId]
  writeJoinedRecord(record)
}
