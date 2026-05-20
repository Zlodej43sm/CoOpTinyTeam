import { useGameStore } from '@/store/gameStore'

type KeyCallback = (key: string) => void
type VirtualKeyEvent = CustomEvent<string>

export class InputSystem {
  private listeners = new Set<KeyCallback>()
  private handler: (e: KeyboardEvent) => void
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

    this.virtualKeyHandler = (e: Event) => {
      if (useGameStore.getState().paused) return
      const key = (e as VirtualKeyEvent).detail
      if (typeof key !== 'string' || key.length === 0) return
      this.listeners.forEach((cb) => cb(key))
    }

    window.addEventListener('keydown', this.handler)
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
    window.removeEventListener('vkey', this.virtualKeyHandler as EventListener)
    this.listeners.clear()
  }
}
