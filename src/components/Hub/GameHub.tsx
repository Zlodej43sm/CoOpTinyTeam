import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { ThemeUi } from '@/game/config/theme'
import { trackHubGameLaunched, trackNavigationClick, trackThemeSelected } from '@/analytics/events'
import { GAMES_REGISTRY, type GameEntry } from '@/games/registry'
import { useThemeDefinition } from '@/hooks/useThemeDefinition'
import { useTranslation } from '@/hooks/useTranslation'
import { pushWishlistPath } from '@/services/navigation'
import { rem } from '@/ui/typography'

export default function GameHub() {
  const theme = useGameStore((s) => s.theme)
  const setTheme = useGameStore((s) => s.setTheme)
  const setPhase = useGameStore((s) => s.setPhase)
  const themeDef = useThemeDefinition()
  const { messages, t } = useTranslation()
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
          {messages.hub.arcadeLabel}
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
          {messages.hub.title}
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
          {messages.hub.story}
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
          {messages.hub.platform}
        </p>

        <section
          aria-label={messages.hub.whyFamiliesAria}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.8rem',
            width: '100%',
            maxWidth: 960,
            marginTop: '0.35rem',
          }}
        >
          {messages.hub.whyFamilies.map((item) => (
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
                {messages.theme[t].themeChip}
              </button>
            )
          })}
        </div>
      </header>

      <section
        aria-labelledby="wishlist-heading"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
          gap: '1rem',
          width: '100%',
          maxWidth: '960px',
          padding: '1rem',
          border: `1px solid ${ui.subtleBorder}`,
          borderRadius: 18,
          background: `linear-gradient(180deg, ${hexToRgba('#ffffff', 0.05)} 0%, ${hexToRgba(ui.secondary, 0.06)} 100%), ${ui.selectorBackground}`,
          boxShadow: `0 18px 42px ${hexToRgba('#000000', 0.2)}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            minWidth: 0,
          }}
        >
          <p
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: rem(0.35),
              color: ui.warning,
              letterSpacing: '0.12em',
              lineHeight: 1.7,
            }}
          >
            {messages.hub.giftsLabel}
          </p>
          <h2
            id="wishlist-heading"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: rem(0.58),
              color: ui.text,
              letterSpacing: '0.05em',
              lineHeight: 1.7,
            }}
          >
            {messages.hub.giftsTitle}
          </h2>
          <p
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: rem(0.36),
              color: ui.muted,
              letterSpacing: '0.05em',
              lineHeight: 1.95,
            }}
          >
            {messages.hub.giftsLead}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'stretch',
            gap: '0.7rem',
            minWidth: 0,
          }}
        >
          <button
            type="button"
            onClick={() => {
              trackNavigationClick({ cta: 'wishlist', source: 'hub', targetPhase: 'wishlist' })
              pushWishlistPath()
              setPhase('wishlist')
            }}
            style={{
              background: `linear-gradient(180deg, ${hexToRgba(ui.accent, 0.16)} 0%, ${hexToRgba(ui.controlBg, 0.94)} 100%)`,
              border: `2px solid ${ui.accent}`,
              color: ui.accent,
              padding: '0.85rem 1rem',
              fontSize: rem(0.42),
              fontFamily: '"Press Start 2P", monospace',
              cursor: 'pointer',
              letterSpacing: '0.08em',
              lineHeight: 1.5,
              borderRadius: 14,
              boxShadow: `0 12px 24px ${hexToRgba(ui.accent, 0.14)}`,
            }}
          >
            {messages.hub.openWishlist}
          </button>
          <div
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: rem(0.31),
              color: ui.secondary,
              lineHeight: 1.9,
              letterSpacing: '0.06em',
              textAlign: 'center',
            }}
          >
            {messages.hub.giftsDescription}
          </div>
        </div>
      </section>

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
          {messages.hub.featuredGames}
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
        <div>{t(messages.hub.footerRights, { year: new Date().getFullYear() })}</div>
        <div style={{ color: ui.text }}>
          {messages.hub.footerTagline}
        </div>
        <div style={{ color: ui.muted }}>{messages.hub.footerMore}</div>
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
  ui: ThemeUi
  onLaunch: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const { messages } = useTranslation()
  const gameCopy = messages.games[entry.id]
  const playable = !entry.comingSoon
  const title = gameCopy?.title ?? entry.title
  const subtitle = gameCopy?.subtitle ?? entry.subtitle
  const description = gameCopy?.description ?? entry.description
  const badge = gameCopy?.badge ?? entry.badge

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
          {messages.common.soon}
        </span>
      )}
      {badge && !entry.comingSoon && (
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
          {badge}
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
        {title}
      </div>

      <div
        style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: rem(0.44),
          color: ui.muted,
          letterSpacing: '0.1em',
        }}
      >
        {subtitle}
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
        {description}
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
          {messages.common.play}
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
