export function isCoarsePointerDevice(): boolean {
  if (typeof window === 'undefined') return false

  return window.matchMedia('(pointer: coarse)').matches || window.navigator.maxTouchPoints > 0
}

export function getTokenTapRadius(): number {
  return isCoarsePointerDevice() ? 48 : 34
}

export function getThreatBugTapRadius(baseRadius: number): number {
  return isCoarsePointerDevice() ? baseRadius + 14 : baseRadius
}

export function getAmbientBugTapRadius(baseRadius: number): number {
  return isCoarsePointerDevice() ? baseRadius + 14 : baseRadius
}
