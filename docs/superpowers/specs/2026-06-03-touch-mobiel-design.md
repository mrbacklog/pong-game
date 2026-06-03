# Design — Touch-besturing & mobiele weergave (2026-06-03)

**Status:** Approved-in-brainstorm (2026-06-03). Detailplan volgt via writing-plans.
**Doel:** Pong volledig speelbaar maken op een mobiel toestel in landscape, met touch-bestuurde
paddles, een touch-menu, en een weergave waarin het speelveld altijd 100% zichtbaar is en de
duimen náást (achter) de paddles ruimte hebben.

## 1. Kernprincipe

Touch wordt **één extra bron van `InputState`**, naast het toetsenbord. De pure simulatie
(`src/sim/*`), de scene-state-machine (`src/scene/machine.ts`), score en de veld-renderer
(`src/render/renderer.ts`) blijven **ongewijzigd** — zij consumeren uitsluitend `InputState`.
Dit is dezelfde grens die toetsenbord en AI al gebruiken. Alle nieuwe logica leeft in de IO-schil
en is, waar puur, unit-getest.

Concreet levert de touch-laag per tick bijdragen aan `InputState`:
- `p1Dir` / `p2Dir` — afgeleid uit de vinger-positie (paddle jaagt naar de vinger).
- edge-acties (`confirm`, `navLeft`, `navRight`, `pause`, `back`) — uit menu-/UI-taps.

Deze worden **gemerged** met de toetsenbord-`InputState` (OR voor edges, niet-nul-wint voor dirs),
zodat desktop en touch naast elkaar blijven werken.

## 2. Weergave & layout

### 2.1 Eis
Het 16:9-speelveld is **altijd volledig zichtbaar**; de duimen bedienen de paddles in
**zij-gutters achter de paddles** (links voor P1, rechts voor P2) en bedekken nooit het veld.

### 2.2 Layout
```
┌───┬───────────────────────────┬───┐
│ ║ │      SPEELVELD 16:9        │ ║ │   ║ = duim-rail (verticaal slepen)
│ ▟ │     (100% zichtbaar)       │ ▙ │   ▟▙ = paddle-positie-indicator
└───┴───────────────────────────┴───┘
  P1-gutter                P2-gutter (alleen 2P)
```
- Het veld wordt **op hoogte gepast** (`height = 100dvh − safe-area`, breedte via 16:9), gecentreerd.
- Links en rechts ontstaan **gutters**. Op toestellen breder dan 16:9 (de meeste in landscape)
  vullen die de natuurlijke restbreedte. Is een toestel te smal (≤ ~16:9), dan reserveren we een
  **minimale gutter** (`GUTTER_MIN`, richtwaarde 64 px CSS per zijde) en past het veld in de
  resterende breedte — het veld blijft 100% zichtbaar, alleen iets kleiner.
- **Portret** (hoogte > breedte): toon een **"draai je toestel"-overlay**; geen spel.

### 2.3 DOM-structuur
- `#game` (canvas, 1280×720): de veld-renderer, **ongewijzigd**, gecentreerd, op hoogte geschaald.
- `#shell` (overlay div over de volle viewport, `touch-action: none`): vangt alle pointer-events,
  bevat de gutter-rails + paddle-indicatoren (CSS + JS-positie), de **pauze-knop** (hoek), en de
  **portret-overlay**. De shell tekent geen spel; hij vangt touch en toont UI-affordances.
- `<head>`: `viewport-fit=cover`, `user-scalable=no, maximum-scale=1`; CSS `env(safe-area-inset-*)`
  zodat notches/safe-areas het veld niet overlappen.

## 3. Besturing (vinger volgen)

- Elke actieve aanwijzer (pointer) in een gutter zet een **target-y** voor die zijde.
- Mapping: de verticale positie binnen de gutter (`pointer.clientY`, geklemd op de veld-hoogte) →
  `targetY` in veld-coördinaten (0..`FIELD_H`).
- Per tick berekent de touch-laag `dir` richting `targetY` met een dead-zone (zelfde patroon als
  `aiPaddleDir`): `|targetCenter − paddleCenter| > deadZone ? sign : 0`. De paddle jaagt aan
  `PADDLE_SPEED` — direct en responsief, **zonder enige sim-wijziging**.
- **Default = absolute mapping** (gutter-hoogte → vol paddle-bereik). Als de duim-reikwijdte in
  playtest knelt, is de fallback **relatief slepen** (paddle volgt de delta) — één toggle, geen
  architectuurwijziging.
- 1P: alleen de **linker** gutter is actief (speler = P1, consistent met W/S); de AI speelt P2.
- 2P: beide gutters actief (twee duimen, één toestel).

## 4. Touch-menu & pauze

Het menu wordt al met `< pijlen >` per rij getekend (`render/menu.ts`). We voegen géén tweede menu
toe; we maken het bestaande **aantikbaar**:
- `render/menu-hit.ts` (puur): gegeven veld-coördinaten → welke rij + of links/rechts/midden is
  geraakt → een **edge-actie** (`navLeft`/`navRight` om een waarde te wisselen; `confirm` op de
  START-rij). Spiegelt exact de draw-layout uit `menu.ts` (gedeelde layout-constanten om drift te
  voorkomen).
- De touch-laag mapt een tik in het veldgebied tijdens scene `menu` → `menu-hit` → `InputState`.
- **Pauze:** een pauze-knop in de hoek tijdens `playing` (shell) → `pause`. In scene `paused`/
  `gameover` mapt een tik op het overlay naar `confirm` (resume/rematch) of `back` (menu), via
  dezelfde hit-zones.

De scene-machine en menu-reducer blijven volledig ongewijzigd; ze krijgen alleen `InputState` zoals
altijd.

## 5. Nieuwe/aangepaste bestanden

| Bestand | Aard | Verantwoordelijkheid |
|---|---|---|
| `src/io/viewport.ts` | nieuw, puur | client-px ↔ veld-coords (via letterbox-rect), gutter-geometrie, oriëntatie-classificatie |
| `src/io/touch.ts` | nieuw, IO | pointer-listeners → per-zijde target-y + UI-taps → `InputState`-bijdrage; `sample()`-API zoals `input.ts` |
| `src/render/menu-hit.ts` | nieuw, puur | veld-coords → menu-edge-actie (spiegelt `menu.ts`-layout) |
| `src/io/input.ts` | klein | gedeelde `mergeInputState(a, b)`-helper (of in main) |
| `src/main.ts` | klein | touch-manager naast keyboard aanmaken; `InputState` mergen; gutter-indicator-render aansturen |
| `index.html` | uitbreiding | `#shell`-overlay, gutter-rails/pauze-knop/portret-overlay (CSS), viewport-meta, safe-area, `touch-action:none` |
| `src/render/renderer.ts` | additief (optioneel) | géén wijziging vereist; gutter-indicatoren leven in de shell, niet in de veld-render |

Geen wijzigingen aan `sim/*`, `scene/machine.ts`, `sim/score.ts`.

## 6. Testbaarheid

- **Unit (vitest, puur):** `viewport.ts` (px↔veld-mapping incl. letterbox + gutters, oriëntatie),
  de `dir`-naar-target-functie in `touch.ts` (afgesplitst als pure helper), en `menu-hit.ts`
  (elke rij + links/rechts/START correct).
- **Browser (Playwright touch-emulatie):** pointer-drag in de P1-gutter → linker paddle beweegt;
  twee aanwijzers (2P) → beide paddles; tik op een menu-pijl wisselt de waarde; tik START → match
  start; pauze-knop → paused; portret-viewport → rotatie-overlay; landscape → veld volledig in beeld
  met zichtbare gutters.

## 7. Bewust buiten scope (YAGNI)

Online/netwerk-multiplayer, haptische feedback, gamepad-API, gedwongen fullscreen + oriëntatie-lock
(we doen het zónder lock; een optionele tap-to-fullscreen kan een latere iteratie zijn), en het in
het menu kiezen van de bestuurde kant (1P = links, vast).

## 8. Definition of Done

- Op een landscape-mobiel (Playwright touch-emulatie als proxy): 1P en 2P volledig speelbaar met
  touch; menu, start, pauze, rematch werken zonder toetsenbord.
- Speelveld is in elke ondersteunde landscape-verhouding 100% zichtbaar; gutters bestaan en de
  duim bedekt het veld niet; portret toont de rotatie-overlay.
- Desktop/toetsenbord blijft onveranderd werken (touch is additief).
- Pure helpers unit-getest; touch-bedrading + display Playwright-geverifieerd; gates groen
  (typecheck, biome, vitest); CHANGELOG-entry; promote + Pages-deploy; live geverifieerd.
