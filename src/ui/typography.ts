export const UI_FONT_SCALE = 1.15

export function rem(size: number): string {
  const scaled = Math.round(size * UI_FONT_SCALE * 100) / 100
  return `${scaled}rem`
}
