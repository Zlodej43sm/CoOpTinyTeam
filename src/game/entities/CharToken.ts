import { Container, Graphics, Text } from 'pixi.js'
import { getThemeDefinition } from '@/game/config/theme'
import type { ThemeDefinition } from '@/game/config/theme'
import type { GameTheme } from '@/types'

export const TOKEN_W = 26

export class CharToken extends Container {
  private readonly themeDef: ThemeDefinition
  private keyBurst: Graphics
  private textObj: Text
  private box: Graphics
  char: string
  private baseColor: number
  private _active = false
  private pulsePhase = 0
  private keypressTimer = 0
  private keypressPhase = 0

  constructor(char: string, theme: GameTheme) {
    super()
    this.char = char
    this.themeDef = getThemeDefinition(theme)
    this.baseColor = pickSyntaxColor(this.themeDef.syntaxColors)

    this.keyBurst = new Graphics()
    this.addChild(this.keyBurst)

    this.box = new Graphics()
    this.addChild(this.box)

    this.textObj = new Text({
      text: char,
      style: {
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        fontSize: 14,
        fill: 0xffffff,
      },
    })
    this.textObj.anchor.set(0.5, 0.5)
    this.textObj.position.set(TOKEN_W / 2, TOKEN_W / 2)
    this.textObj.tint = this.baseColor
    this.addChild(this.textObj)
  }

  get isActive(): boolean {
    return this._active
  }

  pulseOnKeypress(): void {
    this.keypressTimer = 0.3
    this.keypressPhase = 0
  }

  activate(): void {
    this._active = true
    this.pulsePhase = 0
    this.textObj.tint = this.themeDef.colors.activeChar
    this.textObj.scale.set(22 / 14)
    this.redrawBox(true)
  }

  deactivate(): void {
    this._active = false
    this.textObj.tint = this.baseColor
    this.textObj.scale.set(1)
    this.redrawBox(false)
  }

  reset(char: string): void {
    this.char = char
    this.baseColor = pickSyntaxColor(this.themeDef.syntaxColors)
    this._active = false
    this.keypressTimer = 0
    this.keypressPhase = 0
    this.keyBurst.clear()
    this.scale.set(1)
    this.rotation = 0
    this.alpha = 1
    this.position.y = 0
    this.textObj.text = char
    this.textObj.tint = this.baseColor
    this.textObj.scale.set(1)
    this.redrawBox(false)
  }

  update(dt: number): void {
    const { activeChar, keyBurstInner } = this.themeDef.colors
    let scale = 1
    let rotation = 0
    let alpha = 1
    let offsetY = 0
    let textScale = this._active ? 22 / 14 : 1
    let tint = this._active ? activeChar : this.baseColor
    let burstStrength = 0

    if (this._active) {
      this.pulsePhase += dt * 8
      const pulse = Math.abs(Math.sin(this.pulsePhase))
      scale = 1.16 + 0.2 * pulse
      rotation = Math.sin(this.pulsePhase * 0.7) * 0.06
      alpha = 0.88 + 0.12 * pulse
    }

    if (this.keypressTimer > 0) {
      this.keypressTimer = Math.max(0, this.keypressTimer - dt)
      this.keypressPhase += dt * 22
      burstStrength = this.keypressTimer / 0.3
      scale += 0.26 * burstStrength + 0.12 * Math.abs(Math.sin(this.keypressPhase))
      rotation += Math.sin(this.keypressPhase) * 0.12 * burstStrength
      offsetY -= 8 * burstStrength
      alpha = Math.max(alpha, 0.96)
      textScale = Math.max(textScale, this._active ? 26 / 14 : 18 / 14)
      tint = this._active ? activeChar : keyBurstInner
    }

    this.textObj.tint = tint
    this.textObj.scale.set(textScale)
    this.scale.set(scale)
    this.rotation = rotation
    this.alpha = alpha
    this.position.y = offsetY
    this.redrawKeyBurst(burstStrength)
  }

  private redrawBox(active: boolean): void {
    const colors = this.themeDef.colors
    this.box.clear()
    if (active) {
      this.box.rect(-8, -8, TOKEN_W + 16, TOKEN_W + 16)
        .fill({ color: colors.challengeBg, alpha: 0.72 })
      this.box.rect(-8, -8, TOKEN_W + 16, TOKEN_W + 16)
        .stroke({ color: colors.activeCharBorder, width: 4 })
      this.box.rect(-4, -4, TOKEN_W + 8, TOKEN_W + 8)
        .stroke({ color: colors.timerMid, width: 2 })
    }
  }

  private redrawKeyBurst(strength: number): void {
    const colors = this.themeDef.colors
    this.keyBurst.clear()

    if (strength <= 0) return

    const cx = TOKEN_W / 2
    const cy = TOKEN_W / 2
    const progress = 1 - strength
    const outerRadius = 10 + progress * 18
    const innerRadius = 5 + progress * 10
    const glowAlpha = 0.2 + strength * 0.22
    const ringAlpha = 0.45 + strength * 0.35

    this.keyBurst.circle(cx, cy, outerRadius)
      .fill({ color: colors.keyBurstOuter, alpha: glowAlpha })
    this.keyBurst.circle(cx, cy, innerRadius)
      .fill({ color: colors.keyBurstInner, alpha: glowAlpha * 0.9 })
    this.keyBurst.circle(cx, cy, outerRadius + 2)
      .stroke({ color: colors.keyBurstRing, width: 2, alpha: ringAlpha })
  }
}

function pickSyntaxColor(colors: readonly number[]): number {
  return colors[Math.floor(Math.random() * colors.length)]!
}
