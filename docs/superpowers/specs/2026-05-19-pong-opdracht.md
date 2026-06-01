# Opdracht — Pong (Project #1 van P-1)

**Status:** Approved (brainstorm 2026-05-19; documenttype = beknopte opdracht/brief, doelframing = dubbel doel expliciet, scope = kern + 4 uitbreidingen, locatie = LabTech werkmap via lab-worktree, aanpak = gestructureerde opdracht-brief).
**Type:** Opdracht/brief — *geen* design-spec. Detailontwerp wordt bewust doorgeschoven naar Pong's eigen brainstorm→spec→plan via de Spec A-route.
**Doel:** De input-opdracht vastleggen voor de eerste echte projectwerklast op de uniforme agentic projectroute (Spec A): een moderne, goeduitziende Pong, te draaien als project #1 van P-1.

## Mission

- Doel: één browser-speelbare, moderne Pong (1P-vs-AI en 2P-lokaal) opleveren als eerste eindige werklast die de volledige Spec A-route doorloopt.
- Scope binnen: kern-game (twee modi, hoofdmenu, eindige win-conditie) + vier verplichte uitbreidingen (geluid, AI-moeilijkheidsgraden, pauze/herstart, instelbare matchlengte + visuele juice); meta-doel (route uitoefenen, frictie → `/evolve`, noordster interventie-dichtheid).
- Scope buiten: online/netwerk-multiplayer, accounts/login, cross-sessie persistentie/online leaderboards, mobiel/touch-besturing; én alle detail-game-/visueel-/tech-ontwerp (dat is werk voor Pong's eigen brainstorm).
- Succescriterium: dit document is een complete, ondubbelzinnige opdracht waaruit de route zelfstandig Pong's eigen brainstorm→spec→plan kan starten, met meetbare game- én meta-Definition-of-Done.

---

## 1. Context & dubbel doel

P-1 is de perpetuele motor: LabTech versterken door het onder echte projectwerklast te zetten en frictie terug te voeren naar `/evolve`. Pong is **project #1** — de eerste eindige, echte werklast die de volledige Spec A-route (uniforme agentic projectroute) doorloopt.

Het doel is expliciet **dubbel**:

1. **Product** — een moderne, goeduitziende, speelbare Pong.
2. **Meta** — de Spec A-route end-to-end uitoefenen onder realistische werklast; frictie en observaties terugvoeren naar `/evolve`; noordster = **interventie-dichtheid**, getype-gedecomponeerd per taakklasse, áltijd naast de onafhankelijke robuustheidspoort (een enkelvoudig getal is verworpen — het maskeert kwaliteitsverval).

Deze brief stuurt beide doelen. Hij pint géén detail vast dat aan Pong's eigen brainstorm toebehoort.

## 2. Deliverable — de game

Eén in de browser speelbare Pong met:

- **Modi:** 1P vs AI; 2P lokaal (twee spelers, één gedeeld keyboard).
- **Hoofdmenu:** moduskeuze, ingang naar instellingen, start.
- **Look & feel:** "modern & goeduitziend" = een strakke, eigentijdse, bewust **niet-generieke** stijl met vloeiende gameplay (richt 60 fps).
- **Eindige eind-trede:** een match eindigt op de scorelimiet met een duidelijk eindscherm (winnaar + rematch/terug-naar-menu).

Verplichte uitbreidingen (vastgelegd in de brainstorm):

- **Geluid** — SFX (paddle-, muur-, score-events) + lichte achtergrondmuziek, dempbaar.
- **AI-moeilijkheidsgraden** — kiesbare sterkte voor de computertegenstander (bv. easy/normal/hard).
- **Pauze + herstart** — tijdens een match pauzeren/hervatten, opnieuw beginnen, terug naar menu.
- **Instelbare matchlengte + visuele juice** — kiesbare scorelimiet (first-to-N) én expliciete kwaliteitseis voor visuele feedback: hit-flash, bal-trail, lichte screenshake.

## 3. Scope — expliciet buiten

Niet onderdeel van de Pong-deliverable:

- Online/netwerk-multiplayer.
- Accounts/login.
- Cross-sessie persistentie, online leaderboards of highscores die een sessie overleven.
- Mobiel/touch-besturing (desktop-keyboard is de doelinput).

Niet onderdeel van **deze brief** (bewust doorgeschoven naar Pong's eigen brainstorm→spec→plan): concrete visuele stijl/thema, AI-algoritme en exacte moeilijkheidstuning, exacte toetsen-layout, tech-stack-bevestiging, geluidsontwerp en asset-bronnen.

## 4. Definition of Done

### 4.1 Game

- Beide modi (1P-vs-AI, 2P-lokaal) volledig speelbaar van menu → match → eindscherm → rematch/menu.
- Alle vier verplichte uitbreidingen werken.
- Vloeiende gameplay (richt 60 fps) en een visueel "modern & niet-generiek" resultaat — beoordeeld via een korte visuele acceptatie binnen Pong's eigen route, niet hier vastgepind.
- Geen kritieke bugs in de happy path; responsieve besturing.

### 4.2 Meta

- De volledige Spec A-route is doorlopen, met de 3 harde poorten gepasseerd.
- Frictie en observaties zijn vastgelegd en als `/evolve`-input teruggevoerd.
- Interventie-dichtheid is per taakklasse geobserveerd, naast de onafhankelijke robuustheidspoort (noordster gehonoreerd).

## 5. Kaders & constraints

- **Tech-richting open**, met memory-indicatie: vanilla TS + Canvas, geen zware engine — definitieve keuze hoort in Pong's eigen spec.
- **Uitvoering via de Spec A-route.** De prod-tier-regel geldt: geen directe commits op main; werk via lab-worktree en `/promote-to-main`.
- **Autonomie-default L3** (uit Spec A); gekoppelde noordster.
- **Eindig project:** duidelijke eind-trede, geen scope-creep buiten secties 2–3.

## 6. Overdracht naar de route

Deze brief is de **input** (de opdracht), niet de uitvoering. De feitelijke pong-projectmap wordt later door de route gescaffold (eigen `/init-project`), waarna Pong's eigen brainstorm→spec→plan draait. De brief levert uitsluitend doel, deliverable, scope, Definition of Done en kaders; hij neemt geen ontwerpbeslissingen die aan die brainstorm toebehoren.

## 7. Open vragen voor Pong's eigen brainstorm

Bewust hier níét beslist — input voor Pong's eigen brainstorm:

- Concrete visuele stijl/thema (bv. neon-retro vs. strak-minimalistisch vs. ander).
- AI-algoritme en exacte moeilijkheidstuning per graad.
- Exacte besturings-layout (welke toetsen voor speler 1 / speler 2 bij gedeeld keyboard).
- Tech-stack-bevestiging, build- en tooling-keuzes.
- Geluidsontwerp en asset-bronnen (SFX/muziek).
