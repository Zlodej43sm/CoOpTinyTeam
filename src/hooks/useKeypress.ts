import { useEffect } from 'react'

export function useKeypress(onKey: (key: string) => void): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return
      onKey(e.key)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onKey])
}
