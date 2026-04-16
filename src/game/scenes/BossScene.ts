import { Graphics, Text } from 'pixi.js'
import { AudioSystem } from '@/game/systems/AudioSystem'
import { LevelScene } from './LevelScene'
import { useGameStore } from '@/store/gameStore'
import { trackBossStarted } from '@/analytics/events'

/** Boss scene — extends LevelScene with screen-shake and rapid-fire waves */
export class BossScene extends LevelScene {
  private shakeTimer = 0
  private shakeIntensity = 0
  private vignette: Graphics
  private warningText: Text
  private warningPhase = 0
  private elapsed = 0

  constructor(w: number, h: number, audio?: AudioSystem) {
    super(w, h, audio)
    this.vignette = this.addVignette(w, h)
    this.warningText = this.addWarningText(w)
    const { level } = useGameStore.getState()
    trackBossStarted({ level, mode: 'solo' })
  }

  triggerShake(intensity = 8): void {
    this.shakeTimer = 0.3
    this.shakeIntensity = intensity
  }

  protected override onMissVisual(): void {
    this.triggerShake(10)
  }

  override update(dt: number): void {
    this.elapsed += dt
    this.warningPhase += dt * 5.5
    this.setWaveTimeScale(Math.min(1.9, 1 + this.elapsed * 0.08))

    super.update(dt)

    this.warningText.alpha = 0.72 + 0.28 * Math.sin(this.warningPhase)
    this.vignette.alpha = 0.72 + 0.18 * Math.sin(this.warningPhase * 0.65)

    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt
      const strength = this.shakeIntensity * Math.max(0, this.shakeTimer / 0.3)
      this.position.set(
        (Math.random() - 0.5) * 2 * strength,
        (Math.random() - 0.5) * 2 * strength,
      )
    } else {
      this.position.set(0, 0)
    }
  }

  private addVignette(w: number, h: number): Graphics {
    const g = new Graphics()
    const edge = 40
    g.rect(0, 0, w, edge).fill({ color: this.themeDef.colors.bossVignette, alpha: 0.18 })
    g.rect(0, h - edge, w, edge).fill({ color: this.themeDef.colors.bossVignette, alpha: 0.18 })
    g.rect(0, 0, edge, h).fill({ color: this.themeDef.colors.bossVignette, alpha: 0.18 })
    g.rect(w - edge, 0, edge, h).fill({ color: this.themeDef.colors.bossVignette, alpha: 0.18 })
    this.addChild(g)
    return g
  }

  private addWarningText(w: number): Text {
    const textObj = new Text({
      text: this.themeDef.copy.bossWarning,
      style: {
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        fontSize: 14,
        fill: this.themeDef.colors.bossWarning,
        stroke: { color: 0x220000, width: 4 },
      },
    })
    textObj.anchor.set(0.5, 0)
    textObj.position.set(w / 2, 14)
    this.addChild(textObj)
    return textObj
  }
}
