import { trackTipClicked } from '@/analytics/events'

const TIP_URL = import.meta.env.VITE_TIP_URL as string | undefined

const METHODS = ['Apple Pay', 'Google Pay', 'Card', 'BLIK']

export default function TipButton() {
  if (!TIP_URL) return null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.3rem',
        marginTop: '0.2rem',
      }}
    >
      <a
        href={TIP_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackTipClicked({ source: 'tip-button' })}
        style={{
          display: 'inline-block',
          color: '#FFB347',
          fontSize: '0.35rem',
          fontFamily: '"Press Start 2P", monospace',
          textDecoration: 'none',
          letterSpacing: '0.08em',
          opacity: 0.85,
        }}
      >
        ❤️ BUY US A COFFEE
      </a>

      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          alignItems: 'center',
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '0.26rem',
          color: '#777',
          letterSpacing: '0.06em',
        }}
      >
        {METHODS.map((m, i) => (
          <span key={m} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            {i > 0 && <span style={{ opacity: 0.4 }}>·</span>}
            {m}
          </span>
        ))}
      </div>
    </div>
  )
}
