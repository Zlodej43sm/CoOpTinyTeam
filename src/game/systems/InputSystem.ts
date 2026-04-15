import { useGameStore } from '@/store/gameStore'

type KeyCallback = (key: string) => void
type VirtualKeyEvent = CustomEvent<string>

export class InputSystem {
  private listeners = new Set<KeyCallback>()
  private handler: (e: KeyboardEvent) => void
  private tapHandler: (e: TouchEvent) => void
  private pointerHandler: (e: PointerEvent) => void
  private virtualKeyHandler: (e: Event) => void

  constructor() {
    this.handler = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.key === 'Escape') {
        const { paused, setPaused } = useGameStore.getState()
        setPaused(!paused)
        return
      }
      if (useGameStore.getState().paused) return
      const key = e.key.length === 1 ? e.key : e.key
      this.listeners.forEach((cb) => cb(key))
    }

    this.tapHandler = (e: TouchEvent) => {
      const target = e.target instanceof HTMLElement ? e.target : null
      if (target?.closest('[data-no-global-tap="true"]')) return
      const { paused, phase, activeChar } = useGameStore.getState()
      if (paused) return
      e.preventDefault()
      const key = phase === 'kids-arcade' && activeChar ? activeChar : 'TAP'
      this.listeners.forEach((cb) => cb(key))
    }

    this.pointerHandler = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      if (e.button !== 0) return

      const target = e.target instanceof HTMLElement ? e.target : null
      if (target?.closest('[data-no-global-tap="true"]')) return

      const { paused, phase, activeChar } = useGameStore.getState()
      if (paused || phase !== 'kids-arcade') return

      e.preventDefault()
      this.listeners.forEach((cb) => cb(activeChar ?? 'TAP'))
    }

    this.virtualKeyHandler = (e: Event) => {
      if (useGameStore.getState().paused) return
      const key = (e as VirtualKeyEvent).detail
      if (typeof key !== 'string' || key.length === 0) return
      this.listeners.forEach((cb) => cb(key))
    }

    window.addEventListener('keydown', this.handler)
    window.addEventListener('touchstart', this.tapHandler, { passive: false })
    window.addEventListener('pointerdown', this.pointerHandler)
    window.addEventListener('vkey', this.virtualKeyHandler as EventListener)
  }

  on(cb: KeyCallback): void {
    this.listeners.add(cb)
  }

  off(cb: KeyCallback): void {
    this.listeners.delete(cb)
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handler)
    window.removeEventListener('touchstart', this.tapHandler)
    window.removeEventListener('pointerdown', this.pointerHandler)
    window.removeEventListener('vkey', this.virtualKeyHandler as EventListener)
    this.listeners.clear()
  }
}
