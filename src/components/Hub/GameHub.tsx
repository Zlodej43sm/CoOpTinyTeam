import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { getThemeDefinition } from '@/game/config/theme'
import { GAMES_REGISTRY, type GameEntry } from '@/games/registry'

export default function GameHub() {
  const theme = useGameStore((s) => s.theme)
  const setTheme = useGameStore((s) => s.setTheme)
  const setPhase = useGameStore((s) => s.setPhase)
  const themeDef = getThemeDefinition(theme)
  const { ui } = themeDef

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem 1rem 3rem',
        gap: '2rem',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <img
          src="/assets/logo.webp"
          alt="CoOp Tiny Team"
          style={{
            width: 'min(240px, 52vw)',
            height: 'auto',
            filter: ui.logoGlow,
          }}
        />
        <p
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '0.4rem',
            color: ui.accent,
            letterSpacing: '0.28em',
          }}
        >
          ARCADE · SELECT YOUR GAME
        </p>
        <p
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '0.3rem',
            color: ui.muted,
            letterSpacing: '0.1em',
            lineHeight: 2,
          }}
        >
          CO-OP FUN FOR DEV PARENTS &amp; TINY CODERS
        </p>

        {/* Theme switcher */}
        <div
          style={{
            display: 'flex',
            gap: '0.6rem',
            marginTop: '0.25rem',
            padding: '0.4rem 0.7rem',
            background: ui.selectorBackground,
            border: `1px solid ${ui.subtleBorder}`,
          }}
        >
          {(['dev', 'trading'] as const).map((t) => {
            const active = t === theme
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                style={{
                  background: active ? hexToRgba(ui.accent, 0.12) : 'transparent',
                  border: `1px solid ${active ? ui.accent : ui.inactiveButtonBorder}`,
                  color: active ? ui.accent : ui.inactiveButtonColor,
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: '0.3rem',
                  padding: '0.35rem 0.8rem',
                  cursor: 'pointer',
                  letterSpacing: '0.1em',
                }}
              >
                {t === 'dev' ? 'DEV DESK' : 'TRADING FLOOR'}
              </button>
            )
          })}
        </div>
      </header>

      {/* ── Game tile grid ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 300px))',
          justifyContent: 'center',
          gap: '1.1rem',
          width: '100%',
          maxWidth: '960px',
        }}
      >
        {GAMES_REGISTRY.map((entry) => (
          <GameTile
            key={entry.id}
            entry={entry}
            ui={ui}
            onLaunch={() => {
              if (!entry.comingSoon && entry.targetPhase) {
                setPhase(entry.targetPhase)
              }
            }}
          />
        ))}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer
        style={{
          marginTop: 'auto',
          paddingTop: '1rem',
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '0.27rem',
          color: ui.muted,
          textAlign: 'center',
          letterSpacing: '0.08em',
          lineHeight: 2.2,
          borderTop: `1px solid ${ui.subtleBorder}`,
          width: '100%',
          maxWidth: '960px',
        }}
      >
        <div>© 2024 OLEKSII POVOLOTSKYI · ALL RIGHTS RESERVED</div>
        <div style={{ color: ui.accent, opacity: 0.5 }}>MORE GAMES COMING SOON</div>
      </footer>
    </div>
  )
}

// ── Tile ─────────────────────────────────────────────────────────────────────

function GameTile({
  entry,
  ui,
  onLaunch,
}: {
  entry: GameEntry
  ui: ReturnType<typeof getThemeDefinition>['ui']
  onLaunch: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const playable = !entry.comingSoon

  return (
    <div
      role={playable ? 'button' : undefined}
      tabIndex={playable ? 0 : undefined}
      onClick={onLaunch}
      onKeyDown={(e) => {
        if (playable && (e.key === 'Enter' || e.key === ' ')) onLaunch()
      }}
      onMouseEnter={() => playable && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.55rem',
        padding: '1.1rem',
        background: hovered
          ? `linear-gradient(135deg, ${hexToRgba(entry.accentColor, 0.10)} 0%, rgba(0,0,0,0.72) 100%)`
          : ui.panelBackground,
        border: `2px solid ${
          playable && hovered ? entry.accentColor : playable ? hexToRgba(entry.accentColor, 0.35) : ui.subtleBorder
        }`,
        boxShadow: hovered ? `0 0 26px ${hexToRgba(entry.accentColor, 0.28)}` : ui.panelShadow,
        cursor: playable ? 'pointer' : 'default',
        opacity: entry.comingSoon ? 0.52 : 1,
        transition: 'border-color 0.14s ease, box-shadow 0.14s ease, background 0.14s ease',
        position: 'relative',
        outline: 'none',
      }}
    >
      {/* Badge */}
      {entry.comingSoon && (
        <span
          style={{
            position: 'absolute',
            top: '0.55rem',
            right: '0.55rem',
            background: ui.muted,
            color: '#000',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '0.25rem',
            padding: '0.2rem 0.45rem',
            letterSpacing: '0.08em',
          }}
        >
          SOON
        </span>
      )}
      {entry.badge && !entry.comingSoon && (
        <span
          style={{
            position: 'absolute',
            top: '0.55rem',
            right: '0.55rem',
            background: entry.accentColor,
            color: '#000',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '0.25rem',
            padding: '0.2rem 0.45rem',
            letterSpacing: '0.08em',
          }}
        >
          {entry.badge}
        </span>
      )}

      {/* Icon */}
      <div style={{ fontSize: '2rem', lineHeight: 1 }}>{entry.icon}</div>

      {/* Title */}
      <div
        style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '0.52rem',
          color: playable ? entry.accentColor : ui.muted,
          letterSpacing: '0.06em',
          lineHeight: 1.5,
        }}
      >
        {entry.title}
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '0.28rem',
          color: ui.secondary,
          letterSpacing: '0.1em',
          opacity: 0.8,
        }}
      >
        {entry.subtitle}
      </div>

      {/* Description */}
      <div
        style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '0.28rem',
          color: ui.muted,
          lineHeight: 1.9,
          flexGrow: 1,
        }}
      >
        {entry.description}
      </div>

      {/* CTA */}
      {playable && (
        <div
          style={{
            marginTop: '0.6rem',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '0.35rem',
            color: hovered ? '#000' : entry.accentColor,
            background: hovered ? entry.accentColor : 'transparent',
            border: `1px solid ${entry.accentColor}`,
            padding: '0.45rem 0.9rem',
            textAlign: 'center',
            letterSpacing: '0.1em',
            transition: 'color 0.14s ease, background 0.14s ease',
          }}
        >
          ▶ PLAY
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
