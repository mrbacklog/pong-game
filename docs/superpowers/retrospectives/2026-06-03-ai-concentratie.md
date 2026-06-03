# Retrospective — Eerlijke AI via concentratie-model (0.3.0) (2026-06-03)

## Context

Na de eerste speelbare release (0.2.0) bleek bij echt spelen dat **geen mens ooit een punt van de AI won — zelfs niet op easy**. De feedback was kwalitatief en scherp: de AI maakte nooit *echte* inschattingsfouten over waar de bal zou landen; het voelde als een muur in plaats van een tegenstander. Gevraagd: een kleine, gerichte balans-fix die easy daadwerkelijk winbaar maakt zonder hard af te zwakken.

Gediagnosticeerd in `src/sim/ai.ts`: de AI voorspelde de intercept *perfect* (incl. muur-bounces via triangle-wave-folding) en rolde zijn willekeurige "predictionError" **elke reactie-tik opnieuw** (easy: per 220 ms). Omdat de basisvoorspelling exact is en de fout telkens opnieuw rolt, **middelde de fout weg** naarmate de bal naderde — de AI convergeerde op het juiste punt en miste vrijwel nooit (gemeten whiff-rate easy ~1%, normal/hard 0%). De `maxSpeed`-cap werd correct toegepast; snelheid was niet de oorzaak.

## Wat werkte

- **De fix raakte de structurele oorzaak, niet de getallen.** Vervangen door een *concentratie-model*: per balnadering rolt de AI **één keer** of hij scherp is (`focus`) of een verslapping heeft, en **commit** zich aan dat (mogelijk foute) onderscheppingspunt tot de bal reset. Vastgehouden fout i.p.v. wegmiddelende ruis — precies het "concentratie"-gevoel dat gevraagd werd.
- **Deterministische balans-harness als TDD-anker.** `tests/sim/ai-balance.test.ts` simuleert honderden losse verdedigingen per niveau met seeded RNG en meet de AI-whiff-rate direct (níet afhankelijk van een mens-proxy). De test reproduceerde de bug eerst (rood: easy 1,3%), en borgt nu: easy winbaar (~44%), hard scherp (~4,5%), monotoon oplopend. Meetbaar vóór én na.
- **Eerste mens-proxy-harness werd verworpen toen de cijfers degeneerden** (`{1,0,0}`): een perfecte huidige-positie-volger als "mens" is bovenmenselijk en meet de verkeerde eigenschap. De pivot naar directe AI-whiff-meting was getrouwer aan de klacht.
- **End-to-end geleverd in één run:** gates groen → build → browser-smoke (schone load, geen JS-fouten) → squash-promote 0.3.0 → Pages-deploy → **live geverifieerd** dat `lapseError` in de gedeployde `main.js` op pong.mrbacklog.nl staat.

## Wat anders

- **De 0.2.0-gates verifieerden de AI als *werkend*, nooit als *verslaanbaar*.** 67 unit-tests dekten de AI-mechaniek (tracking, dead-zone, reactie), maar geen enkele test stelde de *balans*-eigenschap "een mens kan winnen op easy". Die emergente eigenschap dook pas op bij echt spelen. Les: voor tegenstander-AI hoort een **uitkomst-test** (win/whiff-rate via self-play) bij de kern, niet alleen mechaniek-tests.
- **Browser-screenshots op een continu-animerende canvas zijn onbetrouwbaar** (Playwright-timeout op "waiting for stability"). De schone *load* + console-check + de deterministische harness gaven het echte bewijs; screenshots najagen was verspilling.

## Bugs/risico's gevonden

- **Wegmiddelende voorspel-fout** (ai.ts): de per-tik her-rollende `predictionError` had nauwelijks effect omdat het rond de exacte voorspelling middelde. Opgelost door de fout per balnadering te latchen (`aiCommitted`/`aiError` in `GameState`).

## Geleerd → memory entries

- [Verifieer tegenstander-AI op uitkomst (winbaarheid), niet alleen mechaniek](ai_balans_uitkomst_test_niet_alleen_mechaniek.md)

## Open punten

- Tuning is op gemeten whiff-rate gekalibreerd, niet op live mensenspel. Aanbevolen: korte desktop-speelsessie per niveau om het *gevoel* te bevestigen (de cijfers zeggen winbaar; speel-plezier is subjectief).
- LabTech-meta-frictie (geen spoor van gebouwde externe producten in LabTech; verouderde "Pong nooit gebouwd"-memory) is een aparte `/evolve`-kandidaat — hoort in de LabTech-werkmap, niet hier.
