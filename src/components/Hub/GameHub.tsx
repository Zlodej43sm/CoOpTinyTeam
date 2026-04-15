import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { getThemeDefinition } from '@/game/config/theme'
import { trackHubGameLaunched, trackThemeSelected } from '@/analytics/events'
import { GAMES_REGISTRY, type GameEntry } from '@/games/registry'
import { rem } from '@/ui/typography'

export default function GameHub() {
  const theme = useGameStore((s) => s.theme)
  const setTheme = useGameStore((s) => s.setTheme)
  const setPhase = useGameStore((s) => s.setPhase)
  const themeDef = getThemeDefinition(theme)
  const { ui } = themeDef

  return (
    <main
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
      <header
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.85rem',
          width: '100%',
          maxWidth: '960px',
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
            fontSize: rem(0.63),
            color: ui.accent,
            letterSpacing: '0.28em',
          }}
        >
          ARCADE · SELECT YOUR GAME
        </p>

        <h1
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: rem(0.70),
            color: ui.text,
            letterSpacing: '0.08em',
            lineHeight: 1.8,
            maxWidth: 920,
          }}
        >
          Haunted IDE browser games for parent developers, toddlers, and tiny coders
        </h1>

        <p
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: rem(0.43),
            color: ui.muted,
            letterSpacing: '0.08em',
            lineHeight: 1.95,
            maxWidth: 940,
          }}
        >
          A parent-developer and their tiny coder are trapped inside a haunted IDE. Bugs
          {' '}<span style={{ color: ui.warning }}>(literal cartoon bugs)</span>{' '}
          have infected the codebase. The only way to defeat them: type the code correctly as it streams by.
        </p>

        <p
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: rem(0.38),
            color: ui.secondary,
            letterSpacing: '0.07em',
            lineHeight: 2,
            maxWidth: 940,
          }}
        >
          CoOp Tiny Team is a family-friendly browser arcade platform built for quick play sessions,
          co-op typing, tap-to-play kids modes, and screen time that parents and little kids can enjoy together.
        </p>

        <section
          aria-label="Why families play"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.8rem',
            width: '100%',
            maxWidth: 960,
            marginTop: '0.35rem',
          }}
        >
          {[
            'Parent + child co-op typing in a haunted codebase',
            'Kids arcade mode for toddlers and tiny coders who just want to tap and play',
            'Instant browser gameplay on desktop and tablet with no install needed',
          ].map((item) => (
            <div
              key={item}
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: rem(0.33),
                color: ui.text,
                lineHeight: 1.9,
                letterSpacing: '0.06em',
                padding: '0.8rem 0.9rem',
                border: `1px solid ${ui.subtleBorder}`,
                borderRadius: 20,
                background: `linear-gradient(180deg, ${hexToRgba('#ffffff', 0.04)} 0%, ${ui.selectorBackground} 100%)`,
                boxShadow: `0 10px 22px ${hexToRgba('#000000', 0.12)}`,
              }}
            >
              {item}
            </div>
          ))}
        </section>

        <div
          style={{
            display: 'flex',
            gap: '0.6rem',
            marginTop: '0.25rem',
            padding: '0.4rem 0.7rem',
            background: ui.selectorBackground,
            border: `1px solid ${ui.subtleBorder}`,
            borderRadius: 999,
          }}
        >
          {(['dev', 'trading'] as const).map((t) => {
            const active = t === theme
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  trackThemeSelected({ theme: t, source: 'hub' })
                  setTheme(t)
                }}
                style={{
                  background: active ? hexToRgba(ui.accent, 0.12) : 'transparent',
                  border: `1px solid ${active ? ui.accent : ui.inactiveButtonBorder}`,
                  color: active ? ui.accent : ui.inactiveButtonColor,
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: rem(0.48),
                  padding: '0.35rem 0.8rem',
                  cursor: 'pointer',
                  letterSpacing: '0.1em',
                  borderRadius: 999,
                }}
              >
                {t === 'dev' ? 'DEV DESK' : 'TRADING FLOOR'}
              </button>
            )
          })}
        </div>
      </header>

      <section
        aria-labelledby="featured-games-heading"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 300px))',
          justifyContent: 'center',
          gap: '1.1rem',
          width: '100%',
          maxWidth: '960px',
        }}
      >
        <h2
          id="featured-games-heading"
          style={{
            gridColumn: '1 / -1',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: rem(0.60),
            color: ui.warning,
            textAlign: 'center',
            letterSpacing: '0.1em',
            marginBottom: '0.2rem',
          }}
        >
          FAMILY ARCADE GAMES
        </h2>
        {GAMES_REGISTRY.map((entry) => (
          <GameTile
            key={entry.id}
            entry={entry}
            ui={ui}
            onLaunch={() => {
              if (!entry.comingSoon && entry.targetPhase) {
                trackHubGameLaunched({
                  gameId: entry.id,
                  title: entry.title,
                  targetPhase: entry.targetPhase,
                })
                setPhase(entry.targetPhase)
              }
            }}
          />
        ))}
      </section>

      <footer
        style={{
          marginTop: 'auto',
          paddingTop: '1rem',
          fontFamily: '"Press Start 2P", monospace',
          fontSize: rem(0.34),
          color: ui.muted,
          textAlign: 'center',
          letterSpacing: '0.08em',
          lineHeight: 2.2,
          borderTop: `1px solid ${ui.subtleBorder}`,
          width: '100%',
          maxWidth: '960px',
        }}
      >
        <div>© {new Date().getFullYear()} COOPTINYTEAM · ALL RIGHTS RESERVED</div>
        <div style={{ color: ui.accent, opacity: 0.7 }}>
          BROWSER GAMES FOR PARENT DEVELOPERS, TODDLERS, AND TINY CODERS
        </div>
        <div style={{ color: ui.accent, opacity: 0.5 }}>MORE GAMES COMING SOON</div>
      </footer>
    </main>
  )
}

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
    <article
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
          ? `linear-gradient(135deg, ${hexToRgba(entry.accentColor, 0.1)} 0%, rgba(0,0,0,0.72) 100%)`
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
        borderRadius: 24,
      }}
    >
      {entry.comingSoon && (
        <span
          style={{
            position: 'absolute',
            top: '0.55rem',
            right: '0.55rem',
            background: ui.muted,
            color: '#000',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: rem(0.34),
            padding: '0.2rem 0.45rem',
            letterSpacing: '0.08em',
            borderRadius: 999,
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
            fontSize: rem(0.34),
            padding: '0.2rem 0.45rem',
            letterSpacing: '0.08em',
            borderRadius: 999,
          }}
        >
          {entry.badge}
        </span>
      )}

      <div style={{ fontSize: rem(2), lineHeight: 1 }}>{entry.icon}</div>

      <div
        style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: rem(0.81),
          color: playable ? entry.accentColor : ui.muted,
          letterSpacing: '0.06em',
          lineHeight: 1.5,
        }}
      >
        {entry.title}
      </div>

      <div
        style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: rem(0.44),
          color: ui.secondary,
          letterSpacing: '0.1em',
          opacity: 0.8,
        }}
      >
        {entry.subtitle}
      </div>

      <div
        style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: rem(0.44),
          color: ui.muted,
          lineHeight: 1.9,
          flexGrow: 1,
        }}
      >
        {entry.description}
      </div>

      {playable && (
        <div
          style={{
            marginTop: '0.6rem',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: rem(0.55),
            color: hovered ? '#000' : entry.accentColor,
            background: hovered ? entry.accentColor : 'transparent',
            border: `1px solid ${entry.accentColor}`,
            padding: '0.45rem 0.9rem',
            textAlign: 'center',
            letterSpacing: '0.1em',
            transition: 'color 0.14s ease, background 0.14s ease',
            borderRadius: 14,
          }}
        >
          ▶ PLAY
        </div>
      )}
    </article>
  )
}

function hexToRgba(hex: string, alpha: number): string {
  if (hex.startsWith('rgba(') || hex.startsWith('rgb(')) {
    const parts = hex.match(/[\d.]+/g)
    if (parts && parts.length >= 3) {
      const [r, g, b] = parts
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
  }

  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
