# Changelog

Alle wijzigingen aan Pong. Format: [keepachangelog.com](https://keepachangelog.com/en/1.1.0/). Versies volgen [SemVer](https://semver.org/).

## [0.4.2] — 2026-06-04 — mobiele polish (input-bewuste hints + knop-plaatsing)

### Changed

- **Input-bewuste hints.** De interface herkent nu de *laatst gebruikte* invoer (best practice:
  Pointer Events `pointerType` + `keydown`, met een coarse-pointer begin-gok — zoals what-input/
  react-aria). Op **touch** verdwijnen de verwarrende toetsenbord-teksten volledig (menu-legenda,
  pauze- en game-over-hints); op toetsenbord/muis blijven ze. Werkt ook op hybride toestellen.
- **Knop-plaatsing.** De pauze-knop staat niet langer boven-midden (pal over de stand) maar
  **rechtsboven**; de fullscreen-knop linksboven — beide in de lege hoeken, vrij van de gecentreerde
  score. De pauze/game-over-actiebalk (Hervat/Opnieuw/Menu) zit nu netjes onder de titel.

### Engineering

- Nieuwe pure-geteste module `io/input-mode.ts` (dynamische modaliteits-tracker, injecteerbaar
  window). `drawMenu/drawPause/drawGameOver` krijgen de modus door en laten hints weg op touch.
  7 nieuwe unit-tests; Playwright verifieerde dat de hint op touch verdwijnt (2710→0 pixels) en de
  knoppen vrij van de score staan. Sim/scene ongewijzigd.

## [0.4.1] — 2026-06-04 — tap-to-fullscreen

### Added

- **Volledig-scherm-knop (⛶).** Een tikbare toggle linksboven schakelt fullscreen aan/uit; bij
  het ingaan wordt best-effort de oriëntatie op landscape vergrendeld (Android). De knop wordt
  alleen getoond waar de Fullscreen API beschikbaar is (`document.fullscreenEnabled`) — op iOS
  Safari, waar het niet betrouwbaar werkt, verschijnt geen dode knop, en in portret is hij verborgen.
  Het icoon wisselt ⛶ ↔ ⤢ op `fullscreenchange`, en de layout herberekent bij het veranderen van de
  viewport. Puur een shell-uitbreiding; sim/scene/renderer ongewijzigd.

## [0.4.0] — 2026-06-03 — touch-besturing & mobiele weergave

### Added

- **Touch-besturing (landscape mobiel).** De paddles zijn nu met de duim te bedienen: je vinger
  in de **zij-gutter achter de paddle** (links voor P1, rechts voor P2) en de paddle jaagt naar je
  vinger ("vinger volgen"). 1P bestuurt links; 2P-lokaal speelt met twee duimen op één toestel.
  Touch is een tweede `InputState`-bron naast het toetsenbord — de pure sim, scene-machine en
  veld-renderer bleven ongewijzigd.
- **Aantikbaar menu + touch-UI.** Tik een menu-rij (links/rechts) om de waarde te wisselen, tik
  START om te beginnen; een pauze-knop tijdens spel en Hervat/Opnieuw/Menu-knoppen bij pauze en
  game-over. Volledig speelbaar zonder toetsenbord.
- **Mobiele weergave.** Het 16:9-veld wordt op hoogte gepast en is **altijd 100% zichtbaar**, met
  gegarandeerde zij-gutters (duim-ruimte achter de paddles); `viewport-fit=cover` + safe-area,
  `touch-action: none`. In portret verschijnt een **"draai je toestel"-overlay**.

### Engineering

- Nieuwe, grotendeels pure modules: `io/viewport.ts` (height-fit layout + client↔veld-mapping),
  `render/menu-hit.ts` (menu-hittest), `io/touch.ts` (pointers → `InputState`, met `dirToTarget`),
  `io/shell.ts` (DOM-layout via dezelfde `computeLayout` als single source of truth). `InputState`
  kreeg een optionele `menuSelect` (directe rij-selectie). 53 nieuwe unit-tests; Playwright
  touch-emulatie verifieerde layout, menu, scene-knoppen, gutter→paddle en de portret-overlay.

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
