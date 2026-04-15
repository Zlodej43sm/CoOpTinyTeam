import { Application, Container } from 'pixi.js'
import type { Ticker } from 'pixi.js'
import { LevelScene } from '@/game/scenes/LevelScene'
import { BossScene } from '@/game/scenes/BossScene'
import { KidsArcadeScene, KIDS_ARCADE_BGM_TRACK } from '@/game/scenes/KidsArcadeScene'
import { LEVELS } from '@/game/config/levels'
import { getThemeDefinition } from '@/game/config/theme'
import { AudioSystem } from '@/game/systems/AudioSystem'
import { useGameStore } from '@/store/gameStore'

type ActiveScene = Container & {
  update: (dt: number) => void
  onLevelComplete?: () => void
}

export class Game {
  private app: Application | null = null
  private scene: ActiveScene | null = null
  private audio: AudioSystem | null = null
  private unsubscribe: (() => void) | null = null
  private initPromise: Promise<void> | null = null
  private initialized = false
  private destroyed = false
  private currentBgmTrack: string | null = null
  private readonly handleResize = () => {
    const { phase } = useGameStore.getState()
    if (phase === 'playing' || phase === 'boss' || phase === 'kids-arcade') {
      this.startLevel()
    }
  }
  private readonly handleTick = (tick: Ticker) => {
    const { phase, paused } = useGameStore.getState()
    if (!paused && (phase === 'playing' || phase === 'boss' || phase === 'kids-arcade')) {
      this.scene?.update(tick.deltaMS / 1000)
    }
  }

  async init(container: HTMLElement): Promise<void> {
    if (this.initPromise) return this.initPromise

    this.destroyed = false
    const app = new Application()
    this.app = app
    this.audio = new AudioSystem()
    this.audio.setMuted(!useGameStore.getState().soundEnabled)

    this.initPromise = (async () => {
      try {
        const themeDef = getThemeDefinition(useGameStore.getState().theme)
        await app.init({
          resizeTo: container,
          background: themeDef.colors.bg,
          antialias: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
        })

        this.initialized = true

        if (this.destroyed || this.app !== app) {
          this.disposeInitializedApp()
          return
        }

        container.appendChild(app.canvas)

        // Watch for phase transitions that require a new level scene
        this.unsubscribe = useGameStore.subscribe((state, prev) => {
          if (
            state.phase !== prev.phase &&
            (state.phase === 'playing' || state.phase === 'boss' || state.phase === 'kids-arcade')
          ) {
            this.startLevel()
            return
          }

          if (state.soundEnabled !== prev.soundEnabled) {
            this.syncSound()
          }
        })
        window.addEventListener('resize', this.handleResize)

        this.startLevel()

        app.ticker.add(this.handleTick)
      } catch (error) {
        this.audio?.destroy()
        this.audio = null
        this.cleanupState()
        throw error
      } finally {
        this.initPromise = null
      }
    })()

    return this.initPromise
  }

  startLevel(): void {
    if (!this.app || !this.initialized || this.destroyed) return

    this.audio?.stopBgm()

    if (this.scene) {
      if (this.scene.parent === this.app.stage) {
        this.app.stage.removeChild(this.scene)
      }
      this.scene.destroy({ children: true })
      this.scene = null
    }

    const { level, phase } = useGameStore.getState()
    const isKidsArcade = phase === 'kids-arcade'
    const config = LEVELS[(level - 1) % LEVELS.length]!
    this.currentBgmTrack = isKidsArcade ? KIDS_ARCADE_BGM_TRACK : config.bgmTrack
    const { width, height } = this.app.screen
    this.scene = isKidsArcade
      ? new KidsArcadeScene(width, height, this.audio ?? undefined)
      : config.isBoss
        ? new BossScene(width, height, this.audio ?? undefined)
        : new LevelScene(width, height, this.audio ?? undefined)
    this.app.stage.addChild(this.scene)
    this.syncSound()

    if (isKidsArcade) return

    this.scene.onLevelComplete = () => {
      const { level, setLevel, setPaused, setPhase } = useGameStore.getState()
      setPaused(false)
      if (level >= LEVELS.length) {
        setPhase('name-entry')
      } else {
        setLevel(level + 1)
        setPhase('level-complete')
        // LevelComplete component will set phase back to 'playing' after delay
        // which triggers the subscribe above → startLevel()
      }
    }
  }

  destroy(): void {
    this.destroyed = true

    if (!this.initialized) {
      this.unsubscribe?.()
      this.unsubscribe = null
      if (this.scene) {
        this.scene.destroy({ children: true })
        this.scene = null
      }
      this.audio?.destroy()
      this.audio = null
      return
    }

    this.disposeInitializedApp()
  }

  private disposeInitializedApp(): void {
    if (!this.app || !this.initialized) {
      this.cleanupState()
      return
    }

    window.removeEventListener('resize', this.handleResize)
    this.unsubscribe?.()
    this.unsubscribe = null

    this.app.ticker.remove(this.handleTick)

    if (this.scene) {
      if (this.scene.parent === this.app.stage) {
        this.app.stage.removeChild(this.scene)
      }
      this.scene.destroy({ children: true })
      this.scene = null
    }

    this.audio?.destroy()
    this.audio = null

    this.app.destroy(true)
    this.cleanupState()
  }

  private cleanupState(): void {
    this.unsubscribe?.()
    this.unsubscribe = null
    this.scene = null
    this.app = null
    this.initialized = false
    this.currentBgmTrack = null
  }

  private syncSound(): void {
    if (!this.audio) return

    const { soundEnabled } = useGameStore.getState()
    this.audio.setMuted(!soundEnabled)

    if (!soundEnabled || !this.currentBgmTrack) return
    this.audio.playBgm(this.currentBgmTrack)
  }
}
