import { Container, Graphics, Rectangle } from 'pixi.js'
import { getThemeDefinition } from '@/game/config/theme'
import type { ThemeDefinition } from '@/game/config/theme'
import { Bug } from '@/game/entities/Bug'
import type { GameTheme } from '@/types'

const BUG_HALF_W = 8
const BUG_HALF_H = 6
const SQUASH_DURATION = 0.48

export class AmbientBug extends Container {
  private readonly themeDef: ThemeDefinition
  private readonly shadow: Graphics
  private readonly splat: Graphics
  private readonly body: Bug
  private bounds: Rectangle
  private velocityX = 0
  private velocityY = 0
  private wanderTimer = 0
  private bobPhase = Math.random() * Math.PI * 2
  private squashed = false
  private squashedTimer = 0
  private facing = 1

  constructor(bounds: Rectangle, theme: GameTheme) {
    super()
    this.bounds = bounds.clone()
    this.themeDef = getThemeDefinition(theme)

    this.shadow = new Graphics()
    this.addChild(this.shadow)

    this.splat = new Graphics()
    this.splat.visible = false
    this.addChild(this.splat)

    this.body = new Bug(theme)
    this.body.pivot.set(BUG_HALF_W, BUG_HALF_H)
    this.addChild(this.body)

    this.respawn(true)
  }

  distanceTo(x: number, y: number): number {
    if (this.squashed) return Infinity
    return Math.hypot(this.x - x, this.y - y)
  }

  setBounds(bounds: Rectangle): void {
    this.bounds = bounds.clone()
  }

  squash(): boolean {
    if (this.squashed) return false

    this.squashed = true
    this.squashedTimer = SQUASH_DURATION
    this.body.rotation = 0
    this.drawSplat()
    return true
  }

  update(dt: number): void {
    this.bobPhase += dt * 7

    if (this.squashed) {
      this.updateSquashed(dt)
      return
    }

    this.wanderTimer -= dt
    if (this.wanderTimer <= 0) {
      this.pickVelocity()
    }

    this.x += this.velocityX * dt
    this.y += this.velocityY * dt
    this.keepInsideBounds()

    const crawl = Math.abs(Math.sin(this.bobPhase))
    const bodyScaleX = this.facing * (0.9 + crawl * 0.14)
    const bodyScaleY = 0.92 + Math.abs(Math.cos(this.bobPhase * 1.25)) * 0.08

    this.body.visible = true
    this.body.alpha = 0.95
    this.body.position.set(0, Math.sin(this.bobPhase * 1.4) * 1.6)
    this.body.scale.set(bodyScaleX, bodyScaleY)
    this.body.rotation = Math.sin(this.bobPhase * 0.85) * 0.08
    this.splat.visible = false

    this.redrawShadow(0.9 + crawl * 0.15, 0.2)
  }

  private updateSquashed(dt: number): void {
    this.squashedTimer = Math.max(0, this.squashedTimer - dt)
    const progress = 1 - this.squashedTimer / SQUASH_DURATION

    this.body.visible = true
    this.body.alpha = Math.max(0, 1 - progress * 1.4)
    this.body.position.set(0, 0)
    this.body.scale.set(this.facing * (1.1 + progress * 0.55), Math.max(0.18, 0.42 - progress * 0.24))
    this.body.rotation = 0

    this.splat.visible = true
    this.splat.alpha = Math.max(0, 0.62 - progress * 0.5)
    this.splat.scale.set(0.92 + progress * 0.18)

    this.redrawShadow(1.05 + progress * 0.22, 0.12)

    if (this.squashedTimer <= 0) {
      this.respawn()
    }
  }

  private respawn(initial = false): void {
    this.squashed = false
    this.squashedTimer = 0
    this.splat.clear()
    this.splat.visible = false

    this.x = this.bounds.x + Math.random() * this.bounds.width
    this.y = this.bounds.y + Math.random() * this.bounds.height
    this.pickVelocity()
    this.body.alpha = initial ? 0.9 : 0.95
    this.body.scale.set(this.facing, 1)
    this.body.position.set(0, 0)
    this.body.rotation = 0
    this.redrawShadow(1, 0.2)
  }

  private pickVelocity(): void {
    const speed = 22 + Math.random() * 24
    const heading = Math.random() < 0.5 ? 0 : Math.PI
    const drift = (Math.random() - 0.5) * 0.7
    const angle = heading + drift

    this.velocityX = Math.cos(angle) * speed
    this.velocityY = Math.sin(angle) * speed * 0.45
    this.facing = this.velocityX < 0 ? -1 : 1
    this.wanderTimer = 1.1 + Math.random() * 2.1
  }

  private keepInsideBounds(): void {
    const minX = this.bounds.x
    const maxX = this.bounds.x + this.bounds.width
    const minY = this.bounds.y
    const maxY = this.bounds.y + this.bounds.height

    if (this.x < minX) {
      this.x = minX
      this.velocityX = Math.abs(this.velocityX)
      this.facing = 1
    } else if (this.x > maxX) {
      this.x = maxX
      this.velocityX = -Math.abs(this.velocityX)
      this.facing = -1
    }

    if (this.y < minY) {
      this.y = minY
      this.velocityY = Math.abs(this.velocityY)
    } else if (this.y > maxY) {
      this.y = maxY
      this.velocityY = -Math.abs(this.velocityY)
    }
  }

  private redrawShadow(scaleX: number, alpha: number): void {
    this.shadow.clear()
    this.shadow.ellipse(0, 12, 8 * scaleX, 3.2)
      .fill({ color: 0x000000, alpha })
  }

  private drawSplat(): void {
    const colors = this.themeDef.colors
    this.splat.clear()
    this.splat.circle(-6, 8, 5).fill({ color: colors.squashFlash, alpha: 0.45 })
    this.splat.circle(4, 8, 7).fill({ color: colors.timerMid, alpha: 0.34 })
    this.splat.circle(12, 10, 4).fill({ color: colors.timerFull, alpha: 0.28 })
    this.splat.rect(-2, 5, 14, 5).fill({ color: colors.bugColor, alpha: 0.3 })
  }
}
