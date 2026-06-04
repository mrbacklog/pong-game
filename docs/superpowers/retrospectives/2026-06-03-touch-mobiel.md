# Retrospective — Touch-besturing & mobiele weergave (0.4.0) (2026-06-03)

## Context

Pong moest op mobiel (landscape) speelbaar worden: touch-bestuurde paddles, een aantikbaar menu,
en een weergave waarin het speelveld 100% zichtbaar blijft met duim-ruimte achter de paddles. Op
verzoek end-to-end gebouwd **met subagents** (subagent-driven-development).

## Wat werkte

- **De `InputState`-grens maakte touch een additieve laag.** Touch werd een tweede bron die naast
  het toetsenbord in dezelfde `InputState` mergt; de pure sim, scene-machine en veld-renderer
  bleven volledig ongewijzigd. "Vinger volgen" hergebruikte het bestaande `dir`-model (de touch-laag
  emit `dir` richting de vinger, net als de AI) → nul sim-wijziging.
- **Subagent-decompositie op disjuncte bestanden.** Drie afgebakende modules (`viewport.ts`,
  `menu-hit.ts`+`menuSelect`, `touch.ts`) gingen naar subagents met crisp interfaces + TDD; de twee
  onafhankelijke (A: viewport, B: menu) draaiden **parallel** zonder conflict omdat ze disjuncte
  bestanden raakten. De integratie (`shell.ts`+`main.ts`+`index.html`) hield de controller zelf,
  waar holistische context telt. 53 nieuwe unit-tests; pure helpers volledig getest.
- **Eén `computeLayout` als single source of truth.** De shell plaatst het canvas + de gutters met
  exact dezelfde layout-functie waartegen de touch-laag pointers mapt → geen drift tussen "waar het
  veld staat" en "waar een tik landt".
- **Slot-review ving twee echte punten** (multi-pointer last-wins → eerste-vinger-wint;
  `preventDefault` op knoppen), en één voorgestelde "fix" werd terecht **afgewezen** na
  code-verificatie (de zoneAt-grenzen zijn correcte half-open intervallen).

## Wat anders

- **De Playwright-verificatie liep eerst tegen een harnas-artefact, niet een bug.** In headless is
  `requestAnimationFrame` tot ~3 fps geknepen; mijn eerste waits (90 ms) waren korter dan één frame,
  dus lazen lege scene-klassen. Erger: in **1P** verdedigt de onaangeraakte P1-paddle niet, dus de
  AI scoorde tijdens de trage waits razendsnel 7-0 → de paddle-test draaide in *gameover*. Pas een
  schone opzet (**2P-modus**, geen auto-scorende AI, korte rAF-gesynchroniseerde waits) toonde het
  echte gedrag: de paddle volgde de vinger 450 px. Les hieronder.

## Bugs/risico's gevonden

- **Multi-pointer in dezelfde gutter** (touch.ts): twee vingers gaven last-wins; nu wint de
  eerst-neergezette (stabieler). Gefixt vóór promote.
- **Ghost-click/focus op knoppen** (shell.ts): `preventDefault` op pauze/actie-knop-pointerdown
  toegevoegd als mobiel-hygiëne.

## Geleerd → memory entries

- [Verifieer game-controls headless in 2P, niet 1P-vs-AI](../memory/playwright_game_verify_2p_niet_1p_ai.md)
  — de AI eindigt de match tijdens trage waits; gebruik rAF-gesynchroniseerde, korte waits.

## Open punten

- Touch-tuning (dead-zone 10 px, absolute gutter-mapping) is op gevoel/heuristiek gezet; een echte
  hand-test op een fysiek toestel kan de duim-reikwijdte bevestigen (fallback naar relatief slepen is
  één parameter, zoals in de spec vastgelegd).
- Geen haptics/fullscreen/oriëntatie-lock (bewust buiten scope); een optionele tap-to-fullscreen kan
  later.
