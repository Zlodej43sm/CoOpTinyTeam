import { Container, Graphics } from 'pixi.js'

/** Player character — pixel ninja coder (placeholder shape) */
export class Coder extends Container {
  private baseY = 0
  private bobPhase = 0
  private hitTimer = 0

  constructor() {
    super()
    const g = new Graphics()
    // Body
    g.rect(4, 8, 16, 14).fill(0x39ff14)
    // Head
    g.rect(6, 0, 12, 10).fill(0xffd700)
    // Eyes
    g.rect(8, 3, 3, 3).fill(0x000000)
    g.rect(13, 3, 3, 3).fill(0x000000)
    // Belt (keyboard warrior sash)
    g.rect(4, 14, 16, 3).fill(0xffaa00)
    this.addChild(g)
  }

  setBaseY(y: number): void {
    this.baseY = y
    this.position.y = y
  }

  update(dt: number): void {
    this.bobPhase += dt * 2.2
    this.position.y = this.baseY + Math.sin(this.bobPhase) * 2.5

    if (this.hitTimer > 0) {
      this.hitTimer = Math.max(0, this.hitTimer - dt)
    }

    const bounce = this.hitTimer > 0 ? this.hitTimer / 0.22 : 0
    this.scale.set(1 + bounce * 0.28)
  }

  onHit(): void {
    this.hitTimer = 0.22
  }
}
