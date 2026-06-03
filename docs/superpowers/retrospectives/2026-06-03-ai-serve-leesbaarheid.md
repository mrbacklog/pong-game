# Retrospective — AI leest de serve betrouwbaar (0.3.1) (2026-06-03)

## Context

Direct na 0.3.0 (concentratie-model) kwam speel-feedback: op **medium** misjudge't de AI
de bal "net iets te vaak wanneer die vanuit het midden komt" — d.w.z. op de opening-serve;
de rest voelde perfect. Vraag: geldt dat ook voor **hard**?

## Wat werkte

- **Eerst meten, toen fixen.** De 0.3.0-balanstest mat — achteraf bezien — *alléén* serves
  (bal vanuit center). Een serve/rally-splitsing in de harness toonde meteen het antwoord:
  serve-whiff easy/normal/hard **44%/23%/4,5%**, rally-whiff **47%/22%/4%**. Serve en rally
  waren vrijwel gelijk → ja, hard had exact hetzelfde serve-probleem (4,5%). De
  speel-observatie was correct en kwantificeerbaar.
- **De fix volgde uit het inzicht, niet uit getallen-draaien.** Een serve (recht vanuit center,
  traag, volle reactietijd) is de meest leesbare bal; een concentratie-lapse hoort daar niet.
  Eén conditie — `ball.lastHitBy === 0` → geen lapse — bracht serve-whiff op alle niveaus naar
  **0%** terwijl rally-whiff exact onveranderd bleef. Geen hertuning van de moeilijkheid nodig.
- **`lastHitBy` was al een bestaand, betekenisvol signaal** (0 = nog niet geraakt = serve),
  dus de serve-detectie kostte geen nieuwe state.

## Wat anders

- **Eén aggregaat-metriek verборg een asymmetrie.** De 0.3.0-test ("AI-whiff-rate per niveau")
  leek de balans te dekken, maar serveerde elke trial vanuit center → het mat in feite alleen
  serves en miste dat serve en rally verschillend *zouden moeten* zijn. Les: als één getal twee
  speel-situaties samenvat die je los wilt kunnen sturen, splits de metriek — anders dekt een
  groene test een gedrag dat een speler wél als fout ervaart.

## Bugs/risico's gevonden

- **Concentratie-lapse op de serve** (ai.ts): het model behandelde de opening-serve identiek
  aan een rally-bal en gaf 'm dezelfde lapse-kans, ook op hard. Opgelost door de serve uit te
  zonderen van de lapse.
- **Operationeel (geen productbug):** `git worktree remove --force` volgde een achtergebleven
  `node_modules`-junction en wiste de hoofd-`node_modules` (npm-install herstelde 't). Les:
  verwijder de junction expliciet (PowerShell `(Get-Item).Delete()`) en verifieer vóór de
  worktree-remove. Vastgelegd voor LabTech.

## Geleerd → memory entries

- Bijgewerkt: [Verifieer AI op uitkomst, niet alleen mechaniek](../memory/ai_balans_uitkomst_test_niet_alleen_mechaniek.md)
  — aangevuld met de serve/rally-splitsing (één aggregaat verbergt deelgedrag).

## Open punten

- Tuning blijft op gemeten whiff-rate gekalibreerd; live speelgevoel per niveau bevestigen blijft
  aan te raden (nu specifiek: voelt de serve op hard "fair" en blijft easy in rally's winbaar).
