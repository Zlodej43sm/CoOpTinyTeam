export type GamePhase =
  | 'hub'
  | 'menu'
  | 'wishlist'
  | 'rules'
  | 'level-select'
  | 'playing'
  | 'boss'
  | 'kids-arcade'
  | 'level-complete'
  | 'name-entry'
  | 'victory'
  | 'gameover'

export type GameTheme = 'dev' | 'trading'

export type ColorScheme = 'dark' | 'light'
export type ColorSchemePreference = 'system' | ColorScheme

export type PlayerAction = 'match' | 'miss' | 'any' | null

export type StorageMode = 'local' | 'cloud'

export interface LevelConfig {
  id: number
  filename: string
  charset: string[]
  waveSpeed: number       // px/sec
  spawnRate: number       // waves per second
  highlightWindow: number // ms player has to react
  bgmTrack: string
  isBoss: boolean
  challengesToClear: number
}

export interface ScoreEntry {
  playerName: string
  score: number
  levelReached: number
  createdAt: string
}

export interface WishlistItem {
  id: string
  title: string
  link: string
  description: string
  image?: string | null
  selectedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface Wishlist {
  id: string
  name: string
  logo?: string | null
  items: WishlistItem[]
  createdAt: string
  updatedAt: string
}

export interface WishlistAccess {
  canEdit: boolean
  editToken: string | null
}
