import { Container } from 'pixi.js'
import { CodeWave } from '@/game/entities/CodeWave'
import { CharToken, TOKEN_W } from '@/game/entities/CharToken'
import { WAVE_BOTTOM_PADDING } from '@/game/config/layout'
import type { GameTheme, LevelConfig } from '@/types'

const MIN_WAVE_COUNT = 7
export const WAVE_SPACING = 58
export const WAVE_START_Y = 55
const COOLDOWN_MS = 850
const RESERVED_SLOTS_ON_RIGHT_EDGE = 4

export function getWaveRowCount(screenH: number): number {
  const availableHeight = Math.max(0, screenH - WAVE_BOTTOM_PADDING - WAVE_START_Y)
  return Math.max(MIN_WAVE_COUNT, Math.floor(availableHeight / WAVE_SPACING) + 1)
}

type Phase = 'cooldown' | 'active'

export class WaveSystem {
  private waves: CodeWave[] = []
  private phase: Phase = 'cooldown'
  private timer = COOLDOWN_MS / 2 // start first challenge quickly
  private activeToken: CharToken | null = null
  private config: LevelConfig
  private screenW: number
  private timeScale = 1

  onChallengeStart?: (char: string, windowMs: number) => void
  onHit?: (char: string, exact: boolean) => void
  onMiss?: (char: string) => void

  constructor(
    waveContainer: Container,
    config: LevelConfig,
    screenW: number,
    screenH: number,
    theme: GameTheme,
  ) {
    this.config = config
    this.screenW = screenW

    const waveCount = getWaveRowCount(screenH)
    for (let i = 0; i < waveCount; i++) {
      const y = WAVE_START_Y + i * WAVE_SPACING
      const wave = new CodeWave(y, config.waveSpeed, screenW, theme)
      this.waves.push(wave)
      waveContainer.addChild(wave)
    }
  }

  /** Current challenge character (null when in cooldown) */
  get activeChar(): string | null {
    return this.activeToken?.char ?? null
  }

  get activeTokenPosition(): { x: number; y: number } | null {
    if (!this.activeToken || !this.activeToken.parent) return null

    return {
      x: this.activeToken.parent.position.x + this.activeToken.position.x + TOKEN_W / 2,
      y: this.activeToken.parent.position.y + this.activeToken.position.y + TOKEN_W / 2,
    }
  }

  /** 0–1 fraction of time remaining in the current challenge window */
  get challengeProgress(): number {
    if (this.phase !== 'active') return 0
    return Math.max(0, this.timer / this.config.highlightWindow)
  }

  getVisibleMatchPositions(key: string): Array<{ x: number; y: number }> {
    if (key.length !== 1) return []

    const matches: Array<{ x: number; y: number }> = []
    for (const wave of this.waves) {
      for (const token of wave.visibleTokens()) {
        if (!this.matchesChar(key, token.char)) continue
        matches.push({
          x: wave.position.x + token.position.x + TOKEN_W / 2,
          y: wave.position.y + token.position.y + TOKEN_W / 2,
        })
      }
    }

    return matches
  }

  handleKey(key: string): void {
    if (key.length === 1) {
      this.animateVisibleMatches(key)
    }

    if (this.phase !== 'active' || !this.activeToken) return
    if (key.length !== 1 && key !== 'TAP') return
    const exact =
      key !== 'TAP' &&
      this.matchesChar(key, this.activeToken.char)
    this.resolve(exact)
  }

  update(dt: number): void {
    const scaledDt = dt * this.timeScale
    const dtMs = dt * 1000 * this.timeScale

    for (const wave of this.waves) wave.update(scaledDt)

    this.timer -= dtMs

    if (this.phase === 'cooldown' && this.timer <= 0) {
      this.startChallenge()
    } else if (this.phase === 'active' && this.timer <= 0) {
      this.timeout()
    }
  }

  setTimeScale(scale: number): void {
    this.timeScale = Math.max(1, scale)
  }

  private startChallenge(): void {
    const candidates: CharToken[] = []
    // Keep the new highlighted target at least 4 positions away from the right edge.
    const maxChallengeX = this.screenW - TOKEN_W * (RESERVED_SLOTS_ON_RIGHT_EDGE + 1)
    for (const wave of this.waves) {
      for (const token of wave.visibleTokens()) {
        const worldX = wave.position.x + token.position.x
        if (
          !token.isActive &&
          worldX <= maxChallengeX &&
          this.config.charset.includes(token.char)
        ) {
          candidates.push(token)
        }
      }
    }

    if (candidates.length === 0) {
      this.timer = 200 // retry soon
      return
    }

    const token = candidates[Math.floor(Math.random() * candidates.length)]!
    token.activate()
    this.activeToken = token
    this.phase = 'active'
    this.timer = this.config.highlightWindow
    this.onChallengeStart?.(token.char, this.config.highlightWindow)
  }

  private resolve(exact: boolean): void {
    if (!this.activeToken) return
    const char = this.activeToken.char
    this.activeToken.deactivate()
    this.activeToken = null
    this.phase = 'cooldown'
    this.timer = COOLDOWN_MS
    this.onHit?.(char, exact)
  }

  private timeout(): void {
    if (!this.activeToken) return
    const char = this.activeToken.char
    this.activeToken.deactivate()
    this.activeToken = null
    this.phase = 'cooldown'
    this.timer = COOLDOWN_MS
    this.onMiss?.(char)
  }

  private animateVisibleMatches(key: string): void {
    for (const wave of this.waves) {
      for (const token of wave.visibleTokens()) {
        if (this.matchesChar(key, token.char)) {
          token.pulseOnKeypress()
        }
      }
    }
  }

  private matchesChar(input: string, activeChar: string): boolean {
    const isLetterInput = /^[a-z]$/i.test(input)
    const isLetterActive = /^[a-z]$/i.test(activeChar)
    if (isLetterInput && isLetterActive) {
      return input.toUpperCase() === activeChar.toUpperCase()
    }
    return input === activeChar
  }
}
