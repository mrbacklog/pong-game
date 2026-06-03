# Changelog

Alle wijzigingen aan Pong. Format: [keepachangelog.com](https://keepachangelog.com/en/1.1.0/). Versies volgen [SemVer](https://semver.org/).

## [0.3.1] — 2026-06-03 — AI leest de serve betrouwbaar

### Changed

- **Geen concentratie-verslapping op de opening-serve.** De serve (bal recht vanuit het
  midden, traag, met volle reactietijd) is de meest leesbare bal van het spel; een lapse
  hoorde daar niet. De AI leest nu op álle niveaus de serve betrouwbaar (`ball.lastHitBy === 0`
  → geen lapse, alleen scherpe focus-jitter). De moeilijkheid leeft volledig in de rally's,
  waar het concentratie-model ongewijzigd blijft. Gemeten serve-whiff: easy/normal/hard
  **0%** (was 44%/23%/4,5%); rally-whiff onveranderd (easy ~47%, normal ~22%, hard ~4%).

### Added

- **Serve/rally-splitsing in de balans-regressietest** (`tests/sim/ai-balance.test.ts`) —
  borgt apart dat élk niveau de center-serve betrouwbaar leest én dat easy in rally's
  winbaar blijft met monotone moeilijkheid.

## [0.3.0] — 2026-06-03 — eerlijke AI (concentratie-model)

### Changed

- **AI-balans herzien** — de AI maakt nu *echte, vastgehouden* inschattingsfouten over waar de bal landt, in plaats van een perfecte voorspelling waarvan de willekeurige ruis elke reactie-tik opnieuw rolde en daardoor wegmiddelde. Per balnadering rolt de AI éénmaal of hij scherp is (`focus`) of een concentratie-verslapping heeft, en commit zich aan dat (mogelijk foute) onderscheppingspunt tot de bal reset. Gevolg: **easy is nu daadwerkelijk te verslaan** (~44% misjudgments), normal blijft uitdagend (~23%), hard blijft scherp (~4,5%). Voorheen miste zelfs easy de bal vrijwel nooit (~1%), waardoor geen mens een punt won.

### Added

- **Balans-regressietest** (`tests/sim/ai-balance.test.ts`) — deterministische headless self-play meet de AI-whiff-rate per niveau en borgt dat easy winbaar blijft, hard scherp blijft, en de moeilijkheid monotoon oploopt.

## [0.2.0] — 2026-06-02 — eerste speelbare release

### Added

- **Kern-game** — 1P-vs-AI en 2P-lokaal (gedeeld keyboard), hoofdmenu (moduskeuze/instellingen/start), eindige win-conditie (first-to-N) met eindscherm (winnaar + rematch/menu).
- **Pure simulatie** (`src/sim/*`) — deterministische ball/paddle/collision/score/ai/step met seeded RNG; volledig unit-getest (vitest).
- **Neon-retro renderer** (`src/render/*`) — Canvas 2D met glow, plus de verplichte visuele juice: hit-flash, bal-trail, lichte screenshake (pure `effects.ts`, getest).
- **Geluid** (`src/io/audio.ts`) — procedurele WebAudio-SFX (paddle/muur/score) + dempbare muziekloop; geen externe assets.
- **AI-moeilijkheidsgraden** — easy/normal/hard via predictieve intercept-tracking met per-graad tuning.
- **Pauze + herstart** — pauzeren/hervatten, opnieuw beginnen, terug naar menu via pure scene-state-machine.
- **Instelbare matchlengte** — first-to-N (3/5/7/11).

### Engineering

- Vanilla TypeScript (strict) + Canvas 2D, geen engine; fixed-timestep loop (sim @ 120 Hz). Gates groen: typecheck, biome, 60 vitest-tests.
