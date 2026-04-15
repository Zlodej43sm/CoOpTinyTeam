import { Container } from 'pixi.js'
import { CharToken, TOKEN_W } from './CharToken'
import type { GameTheme } from '@/types'

// Wide visual charset — makes rows look like real code
const VISUAL_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789(){}[];:=><+-_|&'

const TOKEN_COUNT = 48

function randomChar(): string {
  return VISUAL_CHARS[Math.floor(Math.random() * VISUAL_CHARS.length)]!
}

export class CodeWave extends Container {
  readonly tokens: CharToken[]
  private speed: number
  private screenW: number

  constructor(y: number, speed: number, screenW: number, theme: GameTheme) {
    super()
    this.speed = speed
    this.screenW = screenW
    this.tokens = []

    // Stagger start so waves look different from each other
    this.position.x = -Math.floor(Math.random() * TOKEN_W * (TOKEN_COUNT / 2))
    this.position.y = y

    for (let i = 0; i < TOKEN_COUNT; i++) {
      const token = new CharToken(randomChar(), theme)
      token.position.set(i * TOKEN_W, 0)
      this.tokens.push(token)
      this.addChild(token)
    }
  }

  update(dt: number): void {
    this.position.x -= this.speed * dt

    for (const token of this.tokens) {
      token.update(dt)

      // Recycle token that scrolled fully off the left edge
      const worldX = this.position.x + token.position.x
      if (worldX < -TOKEN_W) {
        let maxLocal = -Infinity
        for (const t of this.tokens) {
          if (t.position.x > maxLocal) maxLocal = t.position.x
        }
        token.position.x = maxLocal + TOKEN_W
        if (!token.isActive) token.reset(randomChar())
      }
    }
  }

  /** Returns tokens currently visible on screen */
  visibleTokens(): CharToken[] {
    return this.tokens.filter((t) => {
      const wx = this.position.x + t.position.x
      return wx >= 0 && wx <= this.screenW
    })
  }

  setSpeed(speed: number): void {
    this.speed = speed
  }
}
