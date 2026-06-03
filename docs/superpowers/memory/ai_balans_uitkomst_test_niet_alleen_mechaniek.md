---
name: ai_balans_uitkomst_test_niet_alleen_mechaniek
description: Verifieer tegenstander-AI op uitkomst (winbaarheid / whiff-rate via self-play), niet alleen op mechaniek — balans is emergent en ontsnapt aan unit-tests van losse functies
metadata:
  type: reference
---

De 0.2.0-AI had 67 groene unit-tests die de *mechaniek* dekten (intercept-tracking, dead-zone, reactie-cooldown), maar geen enkele test verifieerde de *balans*: of een mens kan winnen. Gevolg: easy was in de praktijk onverslaanbaar (gemeten AI-whiff-rate ~1%) — geen mens won ooit een punt — terwijl alle tests groen stonden. De oorzaak (perfecte intercept-voorspelling + elke reactie-tik her-rollende fout die wegmiddelde) was alleen zichtbaar op uitkomst-niveau, niet in de losse functies.

**Why:** speelbalans is een *emergente* eigenschap van de hele sim-lus (AI + bal + botsing + versnelling) over vele beurten. Mechaniek-tests ("beweegt naar target", "respecteert dead-zone") kunnen allemaal slagen terwijl het samengestelde gedrag onspeelbaar is. Balans verifiëren vereist het meten van de *uitkomst*, niet de tussenstappen.

**How to apply:** schrijf voor tegenstander-AI een deterministische self-play-harness (seeded RNG) die de uitkomst per niveau meet — bv. AI-whiff-rate over honderden losse verdedigingen, of win-rate tegen een vaste opponent — en assert winbaarheid + monotone moeilijkheid (zie `tests/sim/ai-balance.test.ts`). Meet de AI *direct*; een "perfecte" mens-proxy is vaak bovenmenselijk en meet de verkeerde eigenschap (degenereerde naar `{1,0,0}`). Maak de inschattingsfout bovendien *vastgehouden* per balnadering (concentratie-model: latch `aiError` tot reset) i.p.v. her-rollende ruis, anders middelt de fout weg. Zie ook [[pure_sim_io_scheiding_testbare_game]].
