import { Howl, Howler } from 'howler'

type SoundId = 'match' | 'miss' | 'levelup'

type SynthStep = {
  frequency: number
  duration: number
  wave?: OscillatorType
  volume?: number
}

type BgmPreset = {
  notes: number[]
  duration: number
  wave: OscillatorType
}

const SOUND_PATHS: Record<SoundId, string> = {
  match: '/assets/sounds/match.mp3',
  miss: '/assets/sounds/miss.mp3',
  levelup: '/assets/sounds/levelup.mp3',
}

export class AudioSystem {
  private sounds: Partial<Record<SoundId, Howl>> = {}
  private failedAssets = new Set<string>()
  private bgm: Howl | null = null
  private bgmTrack: string | null = null
  private bgmInterval: number | null = null
  private bgmIndex = 0
  private audioContext: AudioContext | null = null
  private destroyed = false
  private muted = false

  constructor() {
    for (const [id, path] of Object.entries(SOUND_PATHS) as [SoundId, string][]) {
      const sound = this.createHowl(path, false, 0.7)
      if (sound) this.sounds[id] = sound
    }
  }

  setMuted(muted: boolean): void {
    if (this.destroyed || this.muted === muted) return

    this.muted = muted
    Howler.mute(muted)

    if (muted) {
      this.stopBgmPlayback(false)
      if (this.audioContext?.state === 'running') {
        void this.audioContext.suspend().catch(() => undefined)
      }
      return
    }

    if (this.audioContext?.state === 'suspended') {
      void this.audioContext.resume().catch(() => undefined)
    }

    if (this.bgmTrack && !this.bgm && this.bgmInterval === null) {
      this.playBgm(this.bgmTrack)
    }
  }

  play(id: SoundId): void {
    if (this.destroyed || this.muted) return

    const sound = this.sounds[id]
    const path = SOUND_PATHS[id]
    if (sound && !this.failedAssets.has(path)) {
      try {
        sound.play()
        return
      } catch {
        this.markAssetFailed(path)
      }
    }

    this.playSynthEffect(id)
  }

  playBgm(track: string): void {
    if (this.destroyed) return
    if (this.bgmTrack === track && (this.bgm?.playing() || this.bgmInterval !== null)) return

    this.stopBgmPlayback(false)
    this.bgmTrack = track
    if (this.muted) return

    const bgm = this.createHowl(track, true, 0.4)
    if (!bgm) {
      this.startSynthBgm(track)
      return
    }

    this.bgm = bgm

    try {
      bgm.play()
    } catch {
      this.markAssetFailed(track)
      this.startSynthBgm(track)
    }
  }

  stopBgm(): void {
    this.stopBgmPlayback()
  }

  private stopBgmPlayback(clearTrack = true): void {
    if (this.bgm) {
      try {
        this.bgm.stop()
        this.bgm.unload()
      } catch {
        // ignore unload failures during cleanup
      }
      this.bgm = null
    }

    if (this.bgmInterval !== null) {
      window.clearInterval(this.bgmInterval)
      this.bgmInterval = null
    }

    if (clearTrack) {
      this.bgmTrack = null
    }
    this.bgmIndex = 0
  }

  destroy(): void {
    this.destroyed = true
    Howler.mute(false)
    this.stopBgm()

    for (const sound of Object.values(this.sounds)) {
      try {
        sound?.unload()
      } catch {
        // ignore unload failures during cleanup
      }
    }

    this.sounds = {}

    if (this.audioContext && this.audioContext.state !== 'closed') {
      void this.audioContext.close().catch(() => undefined)
    }
    this.audioContext = null
  }

  private createHowl(path: string, loop: boolean, volume: number): Howl | null {
    if (this.failedAssets.has(path)) return null

    try {
      return new Howl({
        src: [path],
        preload: true,
        loop,
        volume,
        onloaderror: () => {
          this.markAssetFailed(path)
          if (this.bgmTrack === path) this.startSynthBgm(path)
        },
        onplayerror: () => {
          this.markAssetFailed(path)
          if (this.bgmTrack === path) this.startSynthBgm(path)
        },
      })
    } catch {
      this.markAssetFailed(path)
      return null
    }
  }

  private markAssetFailed(path: string): void {
    this.failedAssets.add(path)

    if (this.bgm && this.bgmTrack === path) {
      try {
        this.bgm.stop()
        this.bgm.unload()
      } catch {
        // ignore unload failures during fallback
      }
      this.bgm = null
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null

    if (!this.audioContext) {
      const AudioCtor =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtor) return null

      try {
        this.audioContext = new AudioCtor()
      } catch {
        return null
      }
    }

    if (!this.muted && this.audioContext.state === 'suspended') {
      void this.audioContext.resume().catch(() => undefined)
    }

    return this.audioContext
  }

  private playSynthEffect(id: SoundId): void {
    if (this.muted) return

    const ctx = this.getAudioContext()
    if (!ctx) return

    const start = ctx.currentTime + 0.01
    let offset = 0

    for (const step of this.getSynthEffect(id)) {
      this.scheduleTone(
        ctx,
        start + offset,
        step.frequency,
        step.duration,
        step.volume ?? 0.06,
        step.wave ?? 'square',
      )
      offset += step.duration
    }
  }

  private startSynthBgm(track: string): void {
    if (this.muted) return

    const ctx = this.getAudioContext()
    if (!ctx || this.bgmInterval !== null) return

    const preset = this.getBgmPreset(track)
    const playStep = () => {
      if (this.bgmTrack !== track) return
      const note = preset.notes[this.bgmIndex % preset.notes.length]!
      this.scheduleTone(ctx, ctx.currentTime + 0.01, note, preset.duration * 0.9, 0.03, preset.wave)
      this.bgmIndex += 1
    }

    playStep()
    this.bgmInterval = window.setInterval(playStep, preset.duration * 1000)
  }

  private scheduleTone(
    ctx: AudioContext,
    startTime: number,
    frequency: number,
    duration: number,
    volume: number,
    wave: OscillatorType,
  ): void {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = wave
    osc.frequency.setValueAtTime(frequency, startTime)

    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(startTime)
    osc.stop(startTime + duration + 0.02)
  }

  private getSynthEffect(id: SoundId): SynthStep[] {
    switch (id) {
      case 'match':
        return [
          { frequency: 523.25, duration: 0.08, wave: 'square', volume: 0.05 },
          { frequency: 659.25, duration: 0.09, wave: 'square', volume: 0.045 },
        ]
      case 'miss':
        return [
          { frequency: 220, duration: 0.1, wave: 'sawtooth', volume: 0.05 },
          { frequency: 174.61, duration: 0.12, wave: 'triangle', volume: 0.04 },
        ]
      case 'levelup':
        return [
          { frequency: 523.25, duration: 0.09, wave: 'square', volume: 0.05 },
          { frequency: 659.25, duration: 0.09, wave: 'square', volume: 0.05 },
          { frequency: 783.99, duration: 0.09, wave: 'square', volume: 0.05 },
          { frequency: 1046.5, duration: 0.16, wave: 'triangle', volume: 0.045 },
        ]
    }
  }

  private getBgmPreset(track: string): BgmPreset {
    if (track.includes('level4')) {
      return {
        notes: [220, 261.63, 293.66, 349.23, 392, 349.23, 293.66, 261.63],
        duration: 0.18,
        wave: 'square',
      }
    }

    if (track.includes('level3')) {
      return {
        notes: [196, 246.94, 293.66, 329.63, 392, 329.63, 293.66, 246.94],
        duration: 0.22,
        wave: 'triangle',
      }
    }

    if (track.includes('level2')) {
      return {
        notes: [220, 261.63, 329.63, 392, 349.23, 329.63, 261.63, 246.94],
        duration: 0.27,
        wave: 'square',
      }
    }

    return {
      notes: [261.63, 329.63, 392, 329.63, 293.66, 261.63, 329.63, 392],
      duration: 0.33,
      wave: 'triangle',
    }
  }
}
