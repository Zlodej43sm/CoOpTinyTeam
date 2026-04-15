export type GamePhase =
  | 'hub'
  | 'menu'
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
