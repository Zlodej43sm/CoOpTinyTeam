import { Container, Graphics } from 'pixi.js'
import { getThemeDefinition } from '@/game/config/theme'
import type { GameTheme } from '@/types'

const TRADING_VARIANTS = ['dip', 'short', 'long'] as const

export class Bug extends Container {
  constructor(theme: GameTheme) {
    super()
    const g = new Graphics()
    const themeDef = getThemeDefinition(theme)

    if (theme === 'trading') {
      const variant = TRADING_VARIANTS[Math.floor(Math.random() * TRADING_VARIANTS.length)]!
      drawTradingSignal(g, themeDef.colors.bugColor, themeDef.colors.timerFull, variant)
    } else {
      drawDevBug(g, themeDef.colors.bugColor)
    }

    this.addChild(g)
  }
}

function drawDevBug(g: Graphics, color: number): void {
  g.rect(4, 2, 8, 10).fill(color)
  g.rect(5, 0, 6, 3).fill(color)
  g.rect(5, 0, 2, 2).fill(0x000000)
  g.rect(9, 0, 2, 2).fill(0x000000)
  g.rect(0, 4, 4, 2).fill(color)
  g.rect(12, 4, 4, 2).fill(color)
  g.rect(0, 7, 4, 2).fill(color)
  g.rect(12, 7, 4, 2).fill(color)
}

function drawTradingSignal(
  g: Graphics,
  bearColor: number,
  bullColor: number,
  variant: (typeof TRADING_VARIANTS)[number],
): void {
  const border = variant === 'long' ? bullColor : bearColor
  g.roundRect(1, 1, 14, 10, 3)
    .fill({ color: 0x09141c, alpha: 0.96 })
    .stroke({ color: border, width: 1.5 })
  g.rect(3, 9, 10, 1).fill({ color: 0x24404d, alpha: 0.9 })

  if (variant === 'long') {
    drawCandle(g, 5, 7, 4, bullColor)
    drawCandle(g, 9, 5, 6, bullColor)
    g.moveTo(3, 9)
      .lineTo(7, 7)
      .lineTo(10, 6)
      .lineTo(13, 3)
      .stroke({ color: bullColor, width: 2 })
    g.moveTo(11, 3)
      .lineTo(13, 3)
      .lineTo(13, 5)
      .stroke({ color: bullColor, width: 2 })
    return
  }

  if (variant === 'short') {
    drawCandle(g, 5, 4, 7, bearColor)
    drawCandle(g, 9, 6, 5, bearColor)
    g.moveTo(3, 3)
      .lineTo(6, 4)
      .lineTo(9, 6)
      .lineTo(13, 9)
      .stroke({ color: bearColor, width: 2 })
    g.moveTo(11, 9)
      .lineTo(13, 9)
      .lineTo(13, 7)
      .stroke({ color: bearColor, width: 2 })
    return
  }

  drawCandle(g, 4.5, 4, 6, bearColor)
  drawCandle(g, 8, 7, 4, bearColor)
  drawCandle(g, 11.5, 5, 7, bullColor)
  g.moveTo(3, 5)
    .lineTo(6, 7)
    .lineTo(8, 9)
    .lineTo(10, 4)
    .lineTo(13, 5)
    .stroke({ color: 0xffcf5a, width: 2 })
}

function drawCandle(g: Graphics, x: number, top: number, bottom: number, color: number): void {
  const bodyTop = Math.min(top, bottom)
  const bodyHeight = Math.max(3, Math.abs(bottom - top))
  g.rect(x - 0.5, bodyTop - 1, 1, bodyHeight + 2).fill({ color, alpha: 0.8 })
  g.rect(x - 1.5, bodyTop, 3, bodyHeight).fill({ color, alpha: 0.95 })
}
