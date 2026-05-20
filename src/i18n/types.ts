import type { GameTheme } from '@/types'

export type AppLocale = 'en' | 'es' | 'de' | 'fr' | 'zh' | 'uk' | 'ru' | 'id'

export type RulesSectionMessages = {
  heading: string
  lines: readonly [string, string]
}

export type ThemeCopyMessages = {
  themeChip: string
  tagline: string
  levelSelectTitle: string
  chooseLevelLabel: string
  rulesTitle: string
  rulesSubtitle: string
  scoreRules: RulesSectionMessages
  dangerRules: RulesSectionMessages
  coopRules: RulesSectionMessages
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

export type GameRegistryMessages = {
  title: string
  subtitle: string
  description: string
  badge?: string
}

export type Messages = {
  localeNames: Record<AppLocale, string>
  colorScheme: {
    auto: string
    light: string
    dark: string
    ariaLabel: string
  }
  language: {
    ariaLabel: string
  }
  common: {
    back: string
    save: string
    saving: string
    refresh: string
    play: string
    soon: string
    score: string
    player: string
    submit: string
    replay: string
    exit: string
    startGame: string
    allGames: string
    retry: string
    menu: string
    saveScore: string
    pts: string
    updating: string
    cancel: string
    refreshing: string
    copying: string
    deleting: string
    downloading: string
    loading: string
    showMore: string
    showLess: string
  }
  controls: {
    soundOn: string
    soundOff: string
    fullscreen: string
    windowed: string
    pause: string
    resume: string
  }
  touch: {
    kidsTap: string
    tapHighlighted: string
    tapBonus: string
  }
  hud: {
    matchTarget: string
    nextTargetLoading: string
    funLoop: string
    runStatus: string
    kidsHint: string
    coopHint: string
    bugBonus: string
    dipBonus: string
    kidsLives: string
    livesHint: string
    clearedProgress: string
    flowLive: string
    flowSuffix: string
    endlessFun: string
  }
  hub: {
    arcadeLabel: string
    title: string
    story: string
    platform: string
    whyFamiliesAria: string
    whyFamilies: readonly [string, string, string]
    themeMode: string
    giftsLabel: string
    giftsTitle: string
    giftsLead: string
    giftsDescription: string
    openWishlist: string
    featuredGames: string
    footerRights: string
    footerTagline: string
    footerMore: string
  }
  menu: {
    bigHelpers: string
    themeMode: string
    kidsArcade: string
  }
  wishlist: {
    defaultName: string
    eyebrow: string
    title: string
    cloudSaved: string
    localOnly: string
    shareView: string
    canEdit: string
    loading: string
    noItems: string
    openShared: string
    sharedWishlist: string
    yourName: string
    reservedAs: string
    openList: string
    yourLists: string
    yourListsHint: string
    newList: string
    noOwnerLists: string
    wishlistName: string
    save: string
    shareThisList: string
    copyShareLink: string
    ownerEditLink: string
    copyEditLink: string
    deleteList: string
    addGiftItem: string
    itemName: string
    productLink: string
    notes: string
    addGift: string
    adding: string
    editLinkNotice: string
    backToMain: string
    itemOpen: string
    itemSelected: string
    edit: string
    remove: string
    removing: string
    saveGift: string
    release: string
    select: string
    selecting: string
    selectedBy: string
    scanOrTap: string
    downloadQr: string
    openLink: string
    defaultItemTitle: string
    namePlaceholder: string
    itemsAriaLabel: string
    shareAriaLabel: string
    openSharedAriaLabel: string
    itemPhotoLabel: string
    uploadItemPhoto: string
    changeItemPhoto: string
    removeItemPhoto: string
    itemPhotoHint: string
    logoLabel: string
    uploadLogo: string
    changeLogo: string
    removeLogo: string
    logoHint: string
    nameLockedHint: string
    notices: Record<string, string>
    confirmRemove: string
    confirmDelete: string
  }
  theme: Record<GameTheme, ThemeCopyMessages>
  games: Record<string, GameRegistryMessages>
  tip: {
    buyCoffee: string
  }
}
