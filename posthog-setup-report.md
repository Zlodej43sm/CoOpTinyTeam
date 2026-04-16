<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of your project. Four new events were instrumented across four files to fill gaps in the existing `posthog-js` analytics setup. Boss-level tracking was added to measure player progression through the hardest content. Challenge timeout tracking was added to the wave system to distinguish no-input timeouts from wrong-key misses. A game initialization failure event was added to `Game.ts` for error observability. Environment variables were verified and updated in `.env`.

| Event | Description | File |
|---|---|---|
| `boss_started` | Fired when a boss-level scene is instantiated — tracks entry into the hardest game mode. | `src/game/scenes/BossScene.ts` |
| `boss_completed` | Fired when the player clears a boss level — pairs with `boss_started` for completion-rate funnels. | `src/game/Game.ts` |
| `challenge_timed_out` | Fired when a typing challenge window expires before the player responds — distinct from a wrong-key miss. | `src/game/systems/WaveSystem.ts` |
| `game_init_failed` | Fired when the Pixi.js application fails to initialise, capturing the error message for debugging. | `src/game/Game.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://eu.posthog.com/project/159523/dashboard/624670
- **Game Start → Level Completed (Funnel)**: https://eu.posthog.com/project/159523/insights/7xcD3cXS
- **Boss Funnel: Started → Completed**: https://eu.posthog.com/project/159523/insights/o7f5DtxB
- **Level Failures Over Time**: https://eu.posthog.com/project/159523/insights/UUPRO6Bd
- **Challenge Timeout Rate**: https://eu.posthog.com/project/159523/insights/BopUKQGP
- **Score Save Success vs Failure**: https://eu.posthog.com/project/159523/insights/wZaJbHgS

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
