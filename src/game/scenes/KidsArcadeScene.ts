import { Container, Graphics, Text } from 'pixi.js'
import { trackCharAction } from '@/analytics/events'
import { AudioSystem } from '@/game/systems/AudioSystem'
import { LevelScene } from '@/game/scenes/LevelScene'
import { useGameStore } from '@/store/gameStore'

export const KIDS_ARCADE_BGM_TRACK = '/assets/sounds/bgm/kids.mp3'

const PRAISE_WORDS = ['WOW!', 'YAY!', 'SUPER!', 'POP!', 'NICE!'] as const
const TRADING_PRAISE_WORDS = ['GREEN!', 'LONG!', 'POP!', 'GAIN!', 'UP!'] as const
const SPARKLE_COLORS = [0xfff0a6, 0xff8fab, 0x8ce99a, 0x74c0fc, 0xffffff, 0xffcf5a] as const

type Sparkle = {
  gfx: Graphics
  vx: number
  vy: number
  life: number
  maxLife: number
  spin: number
}

type Praise = {
  text: Text
  life: number
  maxLife: number
  vy: number
  wobble: number
}

export class KidsArcadeScene extends LevelScene {
  private readonly effectLayer: Container
  private readonly endlessText: Text
  private readonly topGlow: Graphics
  private readonly sparkles: Sparkle[] = []
  private readonly praises: Praise[] = []
  private auraPhase = 0
  private hitGlow = 0
  private missGlow = 0

  constructor(w: number, h: number, audio?: AudioSystem) {
    super(w, h, audio)
    const colors = this.themeDef.colors

    this.deployLabel.visible = false
    this.deployBarTrack.visible = false
    this.deployBarFill.visible = false
    this.progressText.visible = false
    for (const stageText of this.stageTexts) {
      stageText.visible = false
    }
    this.progressText.text = this.themeDef.copy.kidsModeLabel
    this.progressText.style.fill = colors.timerMid

    this.topGlow = new Graphics()
    this.addChild(this.topGlow)

    this.endlessText = new Text({
      text: this.themeDef.copy.kidsBanner,
      style: {
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        fontSize: 10,
        fill: colors.activeChar,
        stroke: { color: colors.activeCharBorder, width: 4 },
      },
    })
    this.endlessText.anchor.set(0.5, 0)
    this.endlessText.position.set(w / 2, 14)
    this.addChild(this.endlessText)

    this.effectLayer = new Container()
    this.addChild(this.effectLayer)
  }

  update(dt: number): void {
    super.update(dt)
    this.auraPhase += dt * 3.4
    this.hitGlow = Math.max(0, this.hitGlow - dt * 2.1)
    this.missGlow = Math.max(0, this.missGlow - dt * 1.8)

    const titlePulse = Math.abs(Math.sin(this.auraPhase))
    this.endlessText.scale.set(1 + titlePulse * 0.04)
    this.endlessText.alpha = 0.72 + titlePulse * 0.28

    this.topGlow.clear()
    this.topGlow.rect(0, 0, this.w, 58).fill({
      color: this.missGlow > 0.08 ? this.themeDef.colors.timerLow : this.themeDef.colors.timerMid,
      alpha: 0.06 + titlePulse * 0.03 + this.hitGlow * 0.08 + this.missGlow * 0.1,
    })
    this.topGlow.rect(0, this.h - 122, this.w, 122).fill({
      color: this.hitGlow > 0.08 ? this.themeDef.colors.timerMid : this.themeDef.colors.timerFull,
      alpha: 0.03 + this.hitGlow * 0.08,
    })

    this.updateSparkles(dt)
    this.updatePraises(dt)
  }

  protected handleWaveHit(char: string, exact: boolean): void {
    this.scoring.recordHit(char, exact)
    useGameStore.getState().setActiveChar(null)
    this.audio?.play('match')
    this.triggerFlash(exact ? this.themeDef.colors.timerMid : this.themeDef.colors.timerFull)
    this.coder.onHit()
    this.hitGlow = exact ? 1 : 0.72
    this.progressText.text = this.themeDef.copy.kidsModeLabel
    this.spawnSparkles(this.w * 0.5, this.h - 82, exact ? 18 : 12, exact ? 1 : 0.75)
    this.spawnPraise(this.w * 0.5, this.h - 118)
  }

  protected handleWaveMiss(char: string): void {
    const { recordAction, setActiveChar } = useGameStore.getState()
    trackCharAction({ char, correct: false, responseTimeMs: -1 })
    recordAction('miss')
    setActiveChar(null)
    this.audio?.play('miss')
    this.triggerFlash(this.themeDef.colors.timerLow)
    this.missGlow = 1
    this.progressText.text = this.themeDef.copy.kidsModeLabel
    this.spawnSparkles(this.w * 0.5, this.h - 82, 8, 0.55)
  }

  private spawnSparkles(x: number, y: number, count: number, strength: number): void {
    for (let i = 0; i < count; i++) {
      const gfx = new Graphics()
      const size = 4 + Math.random() * 8
      const color = SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)]!
      if (Math.random() > 0.45) {
        gfx.circle(0, 0, size * 0.5).fill({ color, alpha: 0.95 })
      } else {
        gfx.rect(-size / 2, -size / 2, size, size).fill({ color, alpha: 0.95 })
      }
      gfx.position.set(x, y)
      this.effectLayer.addChild(gfx)

      const speed = 60 + Math.random() * 180 * strength
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.55
      this.sparkles.push({
        gfx,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 38,
        life: 0.45 + Math.random() * 0.3,
        maxLife: 0.75,
        spin: (Math.random() - 0.5) * 9,
      })
    }
  }

  private updateSparkles(dt: number): void {
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const sparkle = this.sparkles[i]!
      sparkle.life -= dt
      sparkle.vy += 180 * dt
      sparkle.gfx.position.x += sparkle.vx * dt
      sparkle.gfx.position.y += sparkle.vy * dt
      sparkle.gfx.rotation += sparkle.spin * dt
      sparkle.gfx.alpha = Math.max(0, sparkle.life / sparkle.maxLife)
      sparkle.gfx.scale.set(0.8 + sparkle.gfx.alpha * 0.8)

      if (sparkle.life <= 0) {
        sparkle.gfx.destroy()
        this.sparkles.splice(i, 1)
      }
    }
  }

  private spawnPraise(x: number, y: number): void {
    const praiseWords = this.themeDef.id === 'trading' ? TRADING_PRAISE_WORDS : PRAISE_WORDS
    const text = new Text({
      text: praiseWords[Math.floor(Math.random() * praiseWords.length)]!,
      style: {
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        fontSize: 18,
        fill: this.themeDef.colors.activeChar,
        stroke: { color: this.themeDef.colors.activeCharBorder, width: 6 },
      },
    })
    text.anchor.set(0.5, 0.5)
    text.position.set(x, y - 40)
    this.effectLayer.addChild(text)
    this.praises.push({
      text,
      life: 0.9,
      maxLife: 0.9,
      vy: 58,
      wobble: Math.random() * Math.PI * 2,
    })
  }

  private updatePraises(dt: number): void {
    for (let i = this.praises.length - 1; i >= 0; i--) {
      const praise = this.praises[i]!
      praise.life -= dt
      const alpha = Math.max(0, praise.life / praise.maxLife)
      praise.text.position.y -= praise.vy * dt
      praise.text.position.x += Math.sin(this.auraPhase * 6 + praise.wobble) * 12 * dt
      praise.text.alpha = alpha
      praise.text.scale.set(0.84 + alpha * 0.32)

      if (praise.life <= 0) {
        praise.text.destroy()
        this.praises.splice(i, 1)
      }
    }
  }
}
