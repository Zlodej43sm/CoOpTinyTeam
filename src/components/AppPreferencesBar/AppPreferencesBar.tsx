import ColorSchemeSwitcher from '@/components/ColorSchemeSwitcher/ColorSchemeSwitcher'
import LanguageSwitcher from '@/components/LanguageSwitcher/LanguageSwitcher'

export default function AppPreferencesBar() {
  const insetTop = 'max(0.55rem, env(safe-area-inset-top))'

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: insetTop,
          left: 'max(0.55rem, env(safe-area-inset-left))',
          zIndex: 1400,
        }}
      >
        <ColorSchemeSwitcher />
      </div>
      <div
        style={{
          position: 'fixed',
          top: insetTop,
          right: 'max(0.55rem, env(safe-area-inset-right))',
          zIndex: 1400,
        }}
      >
        <LanguageSwitcher />
      </div>
    </>
  )
}
