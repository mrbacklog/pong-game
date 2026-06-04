---
name: playwright_game_verify_2p_niet_1p_ai
description: Verifieer game-controls in een headless browser in 2P (geen auto-scorende AI) met rAF-gesynchroniseerde korte waits — in 1P eindigt de AI de match tijdens trage waits en draait je test in gameover
metadata:
  type: reference
---

Bij het Playwright-verifiëren van Pong's touch-besturing leek de paddle niet te bewegen. Oorzaak was
het test-harnas, niet de code: (1) in headless is `requestAnimationFrame` tot ~3 fps geknepen, dus
`setTimeout`-waits van ~90 ms vielen binnen één frame en lazen lege/oude DOM-staat; (2) in **1P-vs-AI**
verdedigt de niet-bestuurde P1-paddle niet, dus de AI scoorde tijdens de trage waits in seconden 7-0
en de paddle-test draaide in *gameover* i.p.v. *playing*.

**Why:** een spel met een AI-tegenstander en een eindige win-conditie verandert van scene terwijl je
test "wacht"; gecombineerd met rAF-throttling in headless krijg je niet-reproduceerbare, misleidende
metingen die op een bug lijken.

**How to apply:** verifieer paddle-/control-gedrag in **2P-modus** (beide paddles menselijk → geen
auto-scoring die de match beëindigt), of zet de win-conditie hoog. Gebruik **rAF-gesynchroniseerde
waits** (await N `requestAnimationFrame`-callbacks) i.p.v. `setTimeout`, zodat je met de geknepen
game-loop meebeweegt; houd het aantal frames klein. Lees scene-overgangen uit de DOM (bv. een shell-
klasse die de scene spiegelt) en meet paddle-posities desnoods door een canvas-kolom te scannen op de
paddle-kleur. Zie ook [[ai_balans_uitkomst_test_niet_alleen_mechaniek]] (de AI is sterk — dat maakt
1P-verificatie juist instabiel).
