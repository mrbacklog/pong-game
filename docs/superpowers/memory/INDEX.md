# Project memory index

<!-- Eén regel per entry, format: `- [Naam](bestand.md) — korte hint`. Max 200 regels (auto-cap bij SessionStart-injectie). -->
- [Pure-sim/IO-scheiding maakt game-logica unit-testbaar](pure_sim_io_scheiding_testbare_game.md) — sim puur+seeded RNG, IO-schil dun; 67 tests zonder DOM; browser-acceptatie voor de rest
- [Verifieer AI op uitkomst, niet alleen mechaniek](ai_balans_uitkomst_test_niet_alleen_mechaniek.md) — balans is emergent; meet whiff-rate/winbaarheid via self-play; easy was onverslaanbaar ondanks groene mechaniek-tests
- [Verifieer game-controls headless in 2P, niet 1P-vs-AI](playwright_game_verify_2p_niet_1p_ai.md) — AI eindigt de match tijdens trage waits; gebruik 2P + rAF-gesynchroniseerde korte waits + DOM/canvas-scan
