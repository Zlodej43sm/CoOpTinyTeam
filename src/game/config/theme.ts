import { LEVELS } from '@/game/config/levels'
import type { GameTheme } from '@/types'

type ThemeColors = {
  bg: number
  gridLine: number
  activeChar: number
  activeCharBorder: number
  timerFull: number
  timerMid: number
  timerLow: number
  timerTrack: number
  challengeBg: number
  bugColor: number
  scanline: number
  divider: number
  deployTrack: number
  deployTrackBorder: number
  progressIdle: number
  progressHot: number
  keyBurstOuter: number
  keyBurstInner: number
  keyBurstRing: number
  squashFlash: number
  bossVignette: number
  bossWarning: number
}

type ThemeUi = {
  appBackground: string
  panelBorder: string
  panelBackground: string
  panelShadow: string
  text: string
  muted: string
  accent: string
  secondary: string
  warning: string
  danger: string
  logoGlow: string
  hudGradient: string
  controlBg: string
  score: string
  scoreShadow: string
  badge: string
  badgeShadow: string
  livesColor: string
  livesBackground: string
  livesBorder: string
  livesShadow: string
  subtleBorder: string
  inactiveButtonBorder: string
  inactiveButtonColor: string
  selectorBackground: string
}

type RulesSection = {
  heading: string
  lines: readonly [string, string]
}

type ThemeCopy = {
  themeChip: string
  tagline: string
  levelSelectTitle: string
  chooseLevelLabel: string
  rulesTitle: string
  rulesSubtitle: string
  scoreRules: RulesSection
  dangerRules: RulesSection
  coopRules: RulesSection
  progressLabel: string
  bossWarning: string
  levelCompleteTitle: string
  levelCompleteBossLoading: string
  levelCompleteNextLoading: string
  victoryTitle: string
  defeatTitle: string
  namePrompt: string
  leaderboardVictory: string
  leaderboardDefeat: string
  highScoresLabel: string
  pauseTitle: string
  pauseHint: string
  kidsBanner: string
  kidsModeLabel: string
  levelWord: string
  levelWordShort: string
}

export type ThemeDefinition = {
  id: GameTheme
  syntaxColors: readonly number[]
  colors: ThemeColors
  ui: ThemeUi
  copy: ThemeCopy
  levelNames: readonly string[]
  livesGlyph: string
}

const DEV_THEME: ThemeDefinition = {
  id: 'dev',
  syntaxColors: [
    0x569cd6,
    0x6a9955,
    0xb5cea8,
    0x9cdcfe,
    0xd4d4d4,
    0xc586c0,
    0xdcdcaa,
    0x4ec9b0,
  ] as const,
  colors: {
    bg: 0x0d0d0d,
    gridLine: 0x1a1a1a,
    activeChar: 0xfff1f1,
    activeCharBorder: 0xff4258,
    timerFull: 0x39ff14,
    timerMid: 0xffaa00,
    timerLow: 0xff4444,
    timerTrack: 0x2a2a2a,
    challengeBg: 0x2b0b10,
    bugColor: 0xff4444,
    scanline: 0x000000,
    divider: 0x333333,
    deployTrack: 0x112235,
    deployTrackBorder: 0x284867,
    progressIdle: 0x555555,
    progressHot: 0x39ff14,
    keyBurstOuter: 0xff6a3d,
    keyBurstInner: 0xffd166,
    keyBurstRing: 0xfff3c0,
    squashFlash: 0xff8b57,
    bossVignette: 0xff3344,
    bossWarning: 0xff6677,
  },
  ui: {
    appBackground:
      'radial-gradient(circle at 18% 12%, rgba(109, 220, 255, 0.18) 0%, rgba(109, 220, 255, 0) 26%), radial-gradient(circle at 82% 10%, rgba(255, 216, 112, 0.16) 0%, rgba(255, 216, 112, 0) 24%), radial-gradient(circle at top, rgba(28, 63, 70, 0.96) 0%, rgba(10, 15, 24, 0.98) 48%, rgba(4, 6, 10, 1) 100%)',
    panelBorder: 'rgba(125, 255, 99, 0.38)',
    panelBackground:
      'linear-gradient(180deg, rgba(22, 48, 58, 0.96) 0%, rgba(12, 20, 28, 0.98) 52%, rgba(6, 8, 12, 1) 100%)',
    panelShadow: '0 20px 48px rgba(7, 14, 25, 0.45), 0 0 28px rgba(109, 220, 255, 0.14)',
    text: '#e8fff5',
    muted: '#a6c7c1',
    accent: '#7dff63',
    secondary: '#6ddcff',
    warning: '#ffd870',
    danger: '#ff7d93',
    logoGlow: 'drop-shadow(0 0 18px rgba(125, 255, 99, 0.4)) drop-shadow(0 0 24px rgba(109, 220, 255, 0.24))',
    hudGradient:
      'linear-gradient(to bottom, rgba(7, 16, 27, 0.84) 0%, rgba(7, 16, 27, 0.32) 72%, transparent 100%)',
    controlBg: 'rgba(12, 24, 38, 0.92)',
    score: '#89ff5c',
    scoreShadow: '0 0 12px rgba(125, 255, 99, 0.72)',
    badge: '#79d9ff',
    badgeShadow: '0 0 14px rgba(121, 217, 255, 0.32)',
    livesColor: '#ff4444',
    livesBackground: 'linear-gradient(180deg, rgba(82, 18, 30, 0.62) 0%, rgba(42, 8, 14, 0.5) 100%)',
    livesBorder: 'rgba(255, 102, 122, 0.46)',
    livesShadow: '0 0 14px rgba(255, 90, 116, 0.92)',
    subtleBorder: 'rgba(255, 255, 255, 0.12)',
    inactiveButtonBorder: '#666',
    inactiveButtonColor: '#c6d0d4',
    selectorBackground: 'linear-gradient(180deg, rgba(125, 255, 99, 0.06) 0%, rgba(109, 220, 255, 0.08) 100%)',
  },
  copy: {
    themeChip: 'DEV DESK',
    tagline: 'co-op typing for dev parents\n& tiny coders',
    levelSelectTitle: 'SELECT LEVEL',
    chooseLevelLabel: 'CHOOSE LEVEL',
    rulesTitle: 'GAME RULES',
    rulesSubtitle: 'Team up and clear the haunted codebase.',
    scoreRules: {
      heading: 'HOW TO SCORE',
      lines: [
        'Press any key or tap the screen while a character is highlighted to earn 10 points.',
        'Press the exact same character to earn 100 points, and smash a crawling bug for +75.',
      ],
    },
    dangerRules: {
      heading: 'WATCH FOR DANGER',
      lines: [
        'The highlighted character glows with a red warning frame. React before the timer bar runs out.',
        'Each miss adds a bug. When lives run out, the session ends and you save your score.',
      ],
    },
    coopRules: {
      heading: 'CO-OP PLAY',
      lines: [
        'Kids can mash any key for small points. Adults can match the exact symbol for the big bonus.',
        'Use the HUD buttons in game to pause, replay the current level, or exit to the menu.',
      ],
    },
    progressLabel: 'DEPLOY',
    bossWarning: 'PRODUCTION PANIC',
    levelCompleteTitle: 'FILE DEPLOYED ✓',
    levelCompleteBossLoading: 'LOADING BOSS FILE...',
    levelCompleteNextLoading: 'LOADING NEXT FILE...',
    victoryTitle: 'DEPLOY SUCCESS',
    defeatTitle: 'SESSION ENDED',
    namePrompt: 'ENTER YOUR NAME',
    leaderboardVictory: 'YOU WIN!',
    leaderboardDefeat: 'GAME OVER',
    highScoresLabel: 'HIGH SCORES',
    pauseTitle: 'PAUSED',
    pauseHint: 'PRESS ESC OR TAP RESUME',
    kidsBanner: 'CLICK, TAP, OR TYPE',
    kidsModeLabel: 'KIDS ARCADE',
    levelWord: 'LEVEL',
    levelWordShort: 'LVL',
  },
  levelNames: LEVELS.map((level) => level.filename),
  livesGlyph: '♥',
}

const TRADING_THEME: ThemeDefinition = {
  id: 'trading',
  syntaxColors: [
    0x5ec8ff,
    0x25e38f,
    0xff7373,
    0xffd166,
    0xb8f2e6,
    0x8ce99a,
    0xf8f4e3,
    0x7dd3fc,
  ] as const,
  colors: {
    bg: 0x07131a,
    gridLine: 0x14313a,
    activeChar: 0xfff7dd,
    activeCharBorder: 0xff6b6b,
    timerFull: 0x25e38f,
    timerMid: 0xffc857,
    timerLow: 0xff5f5f,
    timerTrack: 0x11303d,
    challengeBg: 0x261012,
    bugColor: 0xff6868,
    scanline: 0x020b0f,
    divider: 0x1f4650,
    deployTrack: 0x0c2230,
    deployTrackBorder: 0x236777,
    progressIdle: 0x6e8b96,
    progressHot: 0x25e38f,
    keyBurstOuter: 0xff7676,
    keyBurstInner: 0x25e38f,
    keyBurstRing: 0xfff7dd,
    squashFlash: 0xffa94d,
    bossVignette: 0xff4d5a,
    bossWarning: 0xff9292,
  },
  ui: {
    appBackground:
      'radial-gradient(circle at top, rgba(7, 36, 42, 0.98) 0%, rgba(5, 18, 24, 0.98) 40%, rgba(2, 8, 11, 1) 100%)',
    panelBorder: 'rgba(94, 200, 255, 0.28)',
    panelBackground:
      'linear-gradient(180deg, rgba(8, 27, 34, 0.96) 0%, rgba(5, 14, 19, 0.98) 100%)',
    panelShadow: '0 0 30px rgba(94, 200, 255, 0.12)',
    text: '#eafcff',
    muted: '#7ca2ad',
    accent: '#25e38f',
    secondary: '#5ec8ff',
    warning: '#ffd166',
    danger: '#ff6b6b',
    logoGlow: 'drop-shadow(0 0 18px rgba(94, 200, 255, 0.35))',
    hudGradient:
      'linear-gradient(to bottom, rgba(2, 12, 18, 0.8) 0%, rgba(2, 12, 18, 0.22) 70%, transparent 100%)',
    controlBg: 'rgba(7, 22, 28, 0.94)',
    score: '#25e38f',
    scoreShadow: '0 0 8px rgba(37, 227, 143, 0.8)',
    badge: '#5ec8ff',
    badgeShadow: '0 0 10px rgba(94, 200, 255, 0.35)',
    livesColor: '#ff7a7a',
    livesBackground: 'rgba(58, 10, 14, 0.55)',
    livesBorder: 'rgba(255, 107, 107, 0.38)',
    livesShadow: '0 0 12px rgba(255, 107, 107, 0.85)',
    subtleBorder: 'rgba(94, 200, 255, 0.14)',
    inactiveButtonBorder: '#4f6770',
    inactiveButtonColor: '#afc4cb',
    selectorBackground: 'rgba(94, 200, 255, 0.06)',
  },
  copy: {
    themeChip: 'TRADING FLOOR',
    tagline: 'co-op typing for chart watchers\n& tiny traders',
    levelSelectTitle: 'SELECT SETUP',
    chooseLevelLabel: 'CHOOSE SETUP',
    rulesTitle: 'TRADING RULES',
    rulesSubtitle: 'Ride the tape and stay ahead of market pressure.',
    scoreRules: {
      heading: 'HOW TO SCORE',
      lines: [
        'Press any key or tap while a ticker is highlighted to bank 10 points.',
        'Hit the exact symbol to bank 100 points, and smash a crawling dip marker for +75.',
      ],
    },
    dangerRules: {
      heading: 'WATCH THE TAPE',
      lines: [
        'The active ticker flashes inside a red trade box. React before the pressure bar empties.',
        'Each miss stacks another dip marker. When the stack fills, the session closes and you lock your score.',
      ],
    },
    coopRules: {
      heading: 'DESK TEAMPLAY',
      lines: [
        'Kids can tap anything for light gains. Adults can hit the exact symbol for the big green pop.',
        'Use the HUD buttons to pause the desk, replay the setup, or exit back to the menu.',
      ],
    },
    progressLabel: 'POSITION',
    bossWarning: 'MARKET PANIC',
    levelCompleteTitle: 'SETUP LOCKED',
    levelCompleteBossLoading: 'OPENING VOLATILITY MODE...',
    levelCompleteNextLoading: 'LOADING NEXT SETUP...',
    victoryTitle: 'SESSION GREEN',
    defeatTitle: 'RISK LIMIT HIT',
    namePrompt: 'TAG YOUR TICKER',
    leaderboardVictory: 'CLOSE IN GREEN',
    leaderboardDefeat: 'MARKET CLOSED',
    highScoresLabel: 'TOP PNL',
    pauseTitle: 'DESK PAUSED',
    pauseHint: 'PRESS ESC OR TAP RESUME',
    kidsBanner: 'TAP THE TICKER',
    kidsModeLabel: 'KIDS ARCADE',
    levelWord: 'SETUP',
    levelWordShort: 'SET',
  },
  levelNames: [
    'opening_range.ts',
    'buy_the_dip.py',
    'risk_model.sh',
    'short_squeeze.ts',
  ] as const,
  livesGlyph: '▼',
}

const THEMES: Record<GameTheme, ThemeDefinition> = {
  dev: DEV_THEME,
  trading: TRADING_THEME,
}

export function getThemeDefinition(theme: GameTheme): ThemeDefinition {
  return THEMES[theme]
}

export function getLevelDisplayName(theme: GameTheme, level: number): string {
  const themeLevel = THEMES[theme].levelNames[(level - 1) % THEMES[theme].levelNames.length]
  return themeLevel ?? LEVELS[(level - 1) % LEVELS.length]?.filename ?? `${THEMES[theme].copy.levelWord} ${level}`
}
