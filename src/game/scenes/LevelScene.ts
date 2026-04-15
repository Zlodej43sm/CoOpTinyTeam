import { Container, Graphics, Rectangle, Text } from 'pixi.js'
import { WaveSystem, WAVE_SPACING, WAVE_START_Y, getWaveRowCount } from '@/game/systems/WaveSystem'
import { InputSystem } from '@/game/systems/InputSystem'
import { ScoringSystem } from '@/game/systems/ScoringSystem'
import { AudioSystem } from '@/game/systems/AudioSystem'
import { AmbientBug } from '@/game/entities/AmbientBug'
import { Bug } from '@/game/entities/Bug'
import { Coder } from '@/game/entities/Coder'
import { FOOTER_BOTTOM_TAIL, FOOTER_PANEL_HEIGHT, FOOTER_PIPELINE_HEIGHT } from '@/game/config/layout'
import { LEVELS } from '@/game/config/levels'
import { getThemeDefinition } from '@/game/config/theme'
import type { ThemeDefinition } from '@/game/config/theme'
import { useGameStore } from '@/store/gameStore'
import { trackLevelCompleted } from '@/analytics/events'

const TIMER_BAR_H = 10
const MAX_BUGS = 3
const FOOTER_HEIGHT = FOOTER_PANEL_HEIGHT - FOOTER_BOTTOM_TAIL
const PIPELINE_GAP = FOOTER_PIPELINE_HEIGHT
const PIPELINE_MAX_W = 520
const PIPELINE_CONNECTOR_GAP = 18
const PIPELINE_SEGMENT_H = 18
const AMBIENT_BUG_SQUASH_RADIUS = 30

export class LevelScene extends Container {
  protected w: number
  protected h: number
  protected waveSystem: WaveSystem
  private inputSystem: InputSystem
  protected readonly scoring: ScoringSystem
  private timerBar: Graphics
  private timerBarMaxW: number
  private challengeHint: Text
  protected readonly deployBarTrack: Graphics
  protected readonly deployBarFill: Graphics
  protected readonly deployLabel: Text
  protected readonly progressText: Text
  protected readonly bugs: Bug[] = []
  protected readonly ambientBugs: AmbientBug[] = []
  private threatBug: Bug
  protected readonly coder: Coder
  protected readonly audio?: AudioSystem
  protected readonly themeDef: ThemeDefinition
  protected readonly stageTexts: Text[] = []
  private readonly startTimeMs = Date.now()
  private levelFinished = false
  private challengePulse = 0
  private threatPulse = 0
  private readonly levelNumber: number
  private lastHudChallengeProgress = -1

  // Flash overlay
  private flashOverlay: Graphics
  private flashAlpha = 0
  private flashColor = 0x00ff00

  // Level progress
  private hitsCompleted = 0
  private readonly challengesToClear: number

  onLevelComplete?: () => void

  constructor(w: number, h: number, audio?: AudioSystem) {
    super()
    this.w = w
    this.h = h
    this.audio = audio
    this.timerBarMaxW = w * 0.55
    this.themeDef = getThemeDefinition(useGameStore.getState().theme)
    const colors = this.themeDef.colors

    const level = useGameStore.getState().level
    this.levelNumber = level
    const config = LEVELS[(level - 1) % LEVELS.length]!
    this.challengesToClear = config.challengesToClear
    const footerTopY = h - FOOTER_PANEL_HEIGHT
    const footerContentBottomY = footerTopY + FOOTER_HEIGHT
    useGameStore.getState().setFooterLevelStats(0, this.challengesToClear)
    useGameStore.getState().setFooterChallengeProgress(0)

    // ── Background ──────────────────────────────────────────────
    const bg = new Graphics()
    bg.rect(0, 0, w, h).fill(colors.bg)
    this.addChild(bg)

    // Scanlines (static, drawn once)
    const scanlines = new Graphics()
    for (let y = 0; y < h; y += 4) {
      scanlines.rect(0, y, w, 1).fill({ color: colors.scanline, alpha: 0.12 })
    }
    this.addChild(scanlines)

    // Grid lines between wave rows
    const waveRowCount = getWaveRowCount(h)
    const lastWaveY = WAVE_START_Y + (waveRowCount - 1) * WAVE_SPACING
    const grid = new Graphics()
    for (let i = 0; i <= waveRowCount; i++) {
      const gy = WAVE_START_Y + i * WAVE_SPACING
      grid.rect(0, gy - 1, w, 1).fill({ color: colors.gridLine, alpha: 0.6 })
    }
    this.addChild(grid)

    // ── Wave layer ───────────────────────────────────────────────
    const waveContainer = new Container()
    this.addChild(waveContainer)
    this.threatBug = new Bug(this.themeDef.id)
    this.threatBug.visible = false
    this.addChild(this.threatBug)

    const ambientBugTop = Math.max(34, WAVE_START_Y - 18)
    const ambientBugBottom = Math.min(footerTopY - PIPELINE_GAP - 8, lastWaveY + 28)
    const ambientBugBounds = new Rectangle(
      34,
      ambientBugTop,
      Math.max(120, w - 68),
      Math.max(120, ambientBugBottom - ambientBugTop),
    )
    const ambientBugCount = useGameStore.getState().phase === 'kids-arcade' ? 6 : 3
    for (let i = 0; i < ambientBugCount; i++) {
      const bug = new AmbientBug(ambientBugBounds, this.themeDef.id)
      this.ambientBugs.push(bug)
      this.addChild(bug)
    }

    // ── Bottom UI ────────────────────────────────────────────────
    const pipelineLaneTop = footerTopY - PIPELINE_GAP
    const pipelineLane = new Graphics()
    pipelineLane.roundRect(16, pipelineLaneTop + 2, w - 32, PIPELINE_GAP - 4, 12)
      .fill({ color: colors.deployTrack, alpha: 0.4 })
      .stroke({ color: colors.deployTrackBorder, width: 2, alpha: 0.65 })
    pipelineLane.rect(28, pipelineLaneTop + 1, w - 56, 1)
      .fill({ color: colors.deployTrackBorder, alpha: 0.45 })
    this.addChild(pipelineLane)

    const footerPanel = new Graphics()
    footerPanel.rect(0, footerTopY, w, FOOTER_PANEL_HEIGHT)
      .fill({ color: colors.challengeBg, alpha: 0.76 })
    footerPanel.rect(0, footerTopY + 1, w, FOOTER_HEIGHT - 1)
      .fill({ color: colors.bg, alpha: 0.32 })
    footerPanel.rect(0, footerTopY + FOOTER_HEIGHT, w, FOOTER_BOTTOM_TAIL)
      .fill({ color: colors.deployTrack, alpha: 0.18 })
    this.addChild(footerPanel)

    const divider = new Graphics()
    divider.rect(0, footerTopY, w, 1).fill({ color: colors.divider, alpha: 0.8 })
    this.addChild(divider)

    this.coder = new Coder()
    this.coder.position.set(88, footerTopY + 42)
    this.coder.setBaseY(footerTopY + 42)
    this.addChild(this.coder)

    // Big challenge character hint
    this.challengeHint = new Text({
      text: '',
      style: {
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        fontSize: 54,
        fill: colors.activeChar,
        stroke: { color: colors.activeCharBorder, width: 10 },
      },
    })
    this.challengeHint.anchor.set(0.5, 0.5)
    this.challengeHint.position.set(w / 2, footerTopY + 46)
    this.addChild(this.challengeHint)

    this.deployLabel = new Text({
      text: `${this.themeDef.copy.progressLabel} FLOW`,
      style: {
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        fontSize: 8,
        fill: colors.deployTrackBorder,
      },
    })
    this.deployLabel.anchor.set(0.5, 0)
    this.deployLabel.position.set(w / 2, pipelineLaneTop + 6)
    this.addChild(this.deployLabel)

    this.deployBarTrack = new Graphics()
    this.addChild(this.deployBarTrack)

    this.deployBarFill = new Graphics()
    this.addChild(this.deployBarFill)

    for (let i = 0; i < LEVELS.length; i++) {
      const stageText = new Text({
        text: String(i + 1),
        style: {
          fontFamily: '"Press Start 2P", "Courier New", monospace',
          fontSize: 8,
          fill: colors.activeChar,
        },
      })
      stageText.anchor.set(0.5, 0.5)
      this.stageTexts.push(stageText)
      this.addChild(stageText)
    }

    // Level progress counter (e.g. "8 / 12")
    this.progressText = new Text({
      text: `${this.themeDef.copy.levelWordShort} ${this.levelNumber} - 0/${this.challengesToClear}`,
      style: {
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        fontSize: 9,
        fill: colors.progressIdle,
      },
    })
    this.progressText.anchor.set(1, 1)
    this.progressText.position.set(w - 14, footerContentBottomY - 10)
    this.addChild(this.progressText)

    // Timer bar track
    const timerBg = new Graphics()
    const tx = (w - this.timerBarMaxW) / 2
    timerBg.rect(tx, footerContentBottomY - TIMER_BAR_H - 12, this.timerBarMaxW, TIMER_BAR_H)
      .fill({ color: colors.timerTrack })
    this.addChild(timerBg)

    // Timer bar fill (redrawn each frame)
    this.timerBar = new Graphics()
    this.addChild(this.timerBar)

    // Flash overlay — on top of everything
    this.flashOverlay = new Graphics()
    this.addChild(this.flashOverlay)
    this.flashColor = colors.timerFull

    const missedLives = Math.max(0, MAX_BUGS - useGameStore.getState().lives)
    for (let i = 0; i < missedLives; i++) {
      this.spawnBug()
    }

    this.updateDeploymentProgressBar()

    // ── Systems ──────────────────────────────────────────────────
    this.scoring = new ScoringSystem()
    this.inputSystem = new InputSystem()
    this.waveSystem = new WaveSystem(waveContainer, config, w, h, this.themeDef.id)

    this.waveSystem.onChallengeStart = (char, _ms) => {
      this.scoring.startChallenge()
      useGameStore.getState().setActiveChar(char)
      useGameStore.getState().setFooterChallengeProgress(1)
    }

    this.waveSystem.onHit = (char, exact) => {
      this.handleWaveHit(char, exact)
    }

    this.waveSystem.onMiss = (char) => {
      this.handleWaveMiss(char)
    }

    this.inputSystem.on((key) => this.handleInputKey(key))
  }

  update(dt: number): void {
    this.coder.update(dt)
    this.waveSystem.update(dt)
    for (const bug of this.ambientBugs) bug.update(dt)
    this.updateThreatBug(dt)

    // Challenge hint
    const activeChar = this.waveSystem.activeChar
    this.challengeHint.text = activeChar ?? ''
    if (activeChar) {
      this.challengePulse += dt * 8
      const pulse = Math.abs(Math.sin(this.challengePulse))
      this.challengeHint.scale.set(1.02 + pulse * 0.16)
      this.challengeHint.alpha = 0.82 + pulse * 0.18
    } else {
      this.challengePulse = 0
      this.challengeHint.scale.set(1)
      this.challengeHint.alpha = 0.55
    }

    // Timer bar
    this.timerBar.clear()
    const progress = this.waveSystem.challengeProgress
    const roundedHudProgress = Math.round(progress * 100) / 100
    if (roundedHudProgress !== this.lastHudChallengeProgress) {
      this.lastHudChallengeProgress = roundedHudProgress
      useGameStore.getState().setFooterChallengeProgress(roundedHudProgress)
    }
    if (progress > 0) {
      const barW = this.timerBarMaxW * progress
      const tx = (this.w - this.timerBarMaxW) / 2
      const color =
        progress > 0.5 ? this.themeDef.colors.timerFull
        : progress > 0.25 ? this.themeDef.colors.timerMid
        : this.themeDef.colors.timerLow
      this.timerBar.rect(tx, this.footerTopY + FOOTER_HEIGHT - TIMER_BAR_H - 12, barW, TIMER_BAR_H).fill(color)
    }

    // Flash fade
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 3.5)
      this.flashOverlay.clear()
      if (this.flashAlpha > 0) {
        this.flashOverlay
          .rect(0, 0, this.w, this.h)
          .fill({ color: this.flashColor, alpha: this.flashAlpha })
      }
    }
  }

  protected triggerFlash(color: number): void {
    this.flashColor = color
    this.flashAlpha = 0.28
  }

  protected handleInputKey(key: string): void {
    const matchPositions = this.waveSystem.getVisibleMatchPositions(key)
    this.trySquashAmbientBug(matchPositions)
    this.waveSystem.handleKey(key)
  }

  protected handleWaveHit(char: string, exact: boolean): void {
    this.scoring.recordHit(char, exact)
    useGameStore.getState().setActiveChar(null)
    this.audio?.play(exact ? 'match' : 'miss')
    this.triggerFlash(exact ? this.themeDef.colors.timerFull : this.themeDef.colors.timerMid)
    this.coder.onHit()
    this.hitsCompleted++
    useGameStore.getState().setFooterChallengeProgress(0)
    this.updateProgressText()
    this.updateDeploymentProgressBar()
    if (!this.levelFinished && this.hitsCompleted >= this.challengesToClear) {
      this.completeLevel()
    }
  }

  protected handleWaveMiss(char: string): void {
    this.scoring.recordMiss(char)
    useGameStore.getState().setActiveChar(null)
    useGameStore.getState().setFooterChallengeProgress(0)
    this.audio?.play('miss')
    this.triggerFlash(this.themeDef.colors.timerLow)
    this.onMissVisual()
    this.spawnBug()
  }

  private updateThreatBug(dt: number): void {
    const activeTokenPos = this.waveSystem.activeTokenPosition
    if (!activeTokenPos) {
      this.threatBug.visible = false
      return
    }

    this.threatPulse += dt * 7.5
    this.threatBug.visible = true

    const challengeElapsed = 1 - this.waveSystem.challengeProgress
    const climbOffsets = [72, 46, 20, -8]
    const climbStage = Math.min(this.bugs.length, climbOffsets.length - 1)
    const baseOffset = climbOffsets[climbStage] ?? climbOffsets[0]
    const animatedOffset = baseOffset - challengeElapsed * 26
    const wobbleX = 20 + Math.sin(this.threatPulse * 1.6) * 4
    const wobbleY = Math.sin(this.threatPulse * 2.1) * 3

    this.threatBug.position.set(
      activeTokenPos.x + wobbleX,
      activeTokenPos.y + animatedOffset + wobbleY,
    )
    this.threatBug.scale.set(1.05 + challengeElapsed * 0.18)
    this.threatBug.rotation = Math.sin(this.threatPulse) * 0.08
    this.threatBug.alpha = 0.72 + challengeElapsed * 0.28
  }

  protected onMissVisual(): void {
    // subclasses can add boss-specific feedback
  }

  protected setWaveTimeScale(scale: number): void {
    this.waveSystem.setTimeScale(scale)
  }

  protected updateProgressText(): void {
    this.progressText.text = `${this.themeDef.copy.levelWordShort} ${this.levelNumber} - ${this.hitsCompleted}/${this.challengesToClear}`
    useGameStore.getState().setFooterLevelStats(this.hitsCompleted, this.challengesToClear)
    if (this.hitsCompleted >= this.challengesToClear * 0.75) {
      this.progressText.style.fill = this.themeDef.colors.progressHot
    } else {
      this.progressText.style.fill = this.themeDef.colors.progressIdle
    }
  }

  protected updateDeploymentProgressBar(): void {
    const footerTopY = this.footerTopY
    const progress = this.challengesToClear > 0
      ? Math.min(1, this.hitsCompleted / this.challengesToClear)
      : 0
    const color =
      progress >= 0.75 ? this.themeDef.colors.timerFull
      : progress >= 0.4 ? this.themeDef.colors.timerMid
      : this.themeDef.colors.deployTrackBorder
    const stageCount = LEVELS.length
    const currentStageIndex = Math.max(0, Math.min(stageCount - 1, this.levelNumber - 1))
    const pipelineWidth = Math.min(this.w - 72, PIPELINE_MAX_W)
    const stageWidth = (pipelineWidth - PIPELINE_CONNECTOR_GAP * (stageCount - 1)) / stageCount
    const pipelineX = (this.w - pipelineWidth) / 2
    const pipelineY = footerTopY - PIPELINE_GAP + 22
    const pipelineCenterY = pipelineY + PIPELINE_SEGMENT_H / 2

    this.deployLabel.text = `${this.themeDef.copy.progressLabel} FLOW`
    this.deployBarTrack.clear()
    this.deployBarFill.clear()

    for (let i = 0; i < stageCount; i++) {
      const stageX = pipelineX + i * (stageWidth + PIPELINE_CONNECTOR_GAP)
      const isPast = i < currentStageIndex
      const isCurrent = i === currentStageIndex
      const stageFillWidth = isPast
        ? stageWidth - 4
        : isCurrent
          ? Math.max(0, (stageWidth - 4) * progress)
          : 0
      const stageFillColor = isPast ? this.themeDef.colors.timerFull : color
      const stageBorder = isPast
        ? this.themeDef.colors.timerFull
        : isCurrent
          ? this.themeDef.colors.activeCharBorder
          : this.themeDef.colors.deployTrackBorder
      const stageBg = isCurrent
        ? this.themeDef.colors.challengeBg
        : this.themeDef.colors.deployTrack

      this.deployBarTrack.roundRect(stageX, pipelineY, stageWidth, PIPELINE_SEGMENT_H, 5)
        .fill({ color: stageBg, alpha: i > currentStageIndex ? 0.52 : 0.92 })
        .stroke({ color: stageBorder, width: isCurrent ? 2.5 : 2, alpha: i > currentStageIndex ? 0.6 : 0.95 })

      if (stageFillWidth > 0) {
        this.deployBarFill.roundRect(stageX + 2, pipelineY + 2, stageFillWidth, PIPELINE_SEGMENT_H - 4, 4)
          .fill({ color: stageFillColor, alpha: 0.96 })
      }

      const label = this.stageTexts[i]
      if (label) {
        label.position.set(stageX + stageWidth / 2, pipelineCenterY)
        label.alpha = i > currentStageIndex ? 0.58 : 1
        label.style.fill = i > currentStageIndex
          ? this.themeDef.colors.progressIdle
          : this.themeDef.colors.activeChar
      }

      if (i >= stageCount - 1) continue

      const connectorStartX = stageX + stageWidth + 3
      const connectorEndX = stageX + stageWidth + PIPELINE_CONNECTOR_GAP - 3
      this.deployBarTrack.moveTo(connectorStartX, pipelineCenterY)
        .lineTo(connectorEndX - 6, pipelineCenterY)
        .stroke({ color: this.themeDef.colors.deployTrackBorder, width: 2, alpha: 0.75 })
      this.deployBarTrack.moveTo(connectorEndX - 6, pipelineCenterY - 4)
        .lineTo(connectorEndX, pipelineCenterY)
        .lineTo(connectorEndX - 6, pipelineCenterY + 4)
        .stroke({ color: this.themeDef.colors.deployTrackBorder, width: 2, alpha: 0.75 })
    }
  }

  private trySquashAmbientBug(points: Array<{ x: number; y: number }>): void {
    if (points.length === 0) return

    let bestBug: AmbientBug | null = null
    let bestDistance = AMBIENT_BUG_SQUASH_RADIUS

    for (const bug of this.ambientBugs) {
      for (const point of points) {
        const distance = bug.distanceTo(point.x, point.y)
        if (distance < bestDistance) {
          bestDistance = distance
          bestBug = bug
        }
      }
    }

    if (!bestBug?.squash()) return
    this.flashAlpha = Math.max(this.flashAlpha, 0.16)
    this.flashColor = this.themeDef.colors.squashFlash
  }

  protected spawnBug(): void {
    if (this.bugs.length >= MAX_BUGS) return
    const bug = new Bug(this.themeDef.id)
    bug.position.set(12 + this.bugs.length * 22, this.footerTopY + 8)
    this.bugs.push(bug)
    this.addChild(bug)
  }

  protected get footerTopY(): number {
    return this.h - FOOTER_PANEL_HEIGHT
  }

  private completeLevel(): void {
    this.levelFinished = true
    const { level, score } = useGameStore.getState()
    const durationSec = Math.max(0.1, Math.round((Date.now() - this.startTimeMs) / 100) / 10)

    this.audio?.play('levelup')
    trackLevelCompleted({ level, score, durationSec })
    this.onLevelComplete?.()
  }

  destroy(options?: Parameters<Container['destroy']>[0]): void {
    const { resetFooterHud, setActiveChar } = useGameStore.getState()
    setActiveChar(null)
    resetFooterHud()
    this.inputSystem.destroy()
    super.destroy(options)
  }
}
