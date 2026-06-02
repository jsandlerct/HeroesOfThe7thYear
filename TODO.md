# TODO.md — Heroes of the Seventh Year

> **Rules:**
> - Do not start a task not on this list — add it first, then do it
> - Mark tasks `[x]` immediately upon completion — not at end of session
> - Add new decisions to DECISIONS.md immediately when made
> - Current sprint tasks are at the top

---

## How to Read This File

- `[ ]` — Not started
- `[~]` — In progress (only one task should be in progress at a time)
- `[x]` — Complete
- `[!]` — Blocked — reason noted inline

---

## 🔴 Sprint 1 — Foundation (MVP Core)

Goal: Get a battle scene running with placeholder units moving on a 12×16 map. Validate that Phaser handles 50+ simultaneous sprites without performance issues. No off-season UI, no stats, no XP — just units that move and attack.

### Project Setup
- [x] Initialize project structure per CLAUDE.md file layout
- [x] Install and configure Phaser (latest) — CDN, no build step
- [x] Create index.html entry point with Phaser canvas
- [x] Create shared GameState.js object with placeholder data structure
- [x] Confirm WebGL renderer active and logging frame rate

### Data Layer
- [x] Create src/data/units.js — all player unit base stats from GDD
- [x] Create src/data/enemies.js — all enemy base stats and year-up scaling from GDD
- [x] Create src/data/buildings.js — all buildings, costs, prerequisites, and bonuses from GDD

### Battle Scene — Map & Wall
- [x] Create BattleScene.js Phaser scene
- [x] Render 12×16 tile map
- [x] Render wall across map width, divided into 3 sections (Left, Center, Right)
- [x] Implement wall HP per segment (starts at Level 1 = 200 HP)
- [x] Render wall HP bar per segment
- [x] Implement wall damage reduction bonus (1% per foot of height)

### Battle Scene — Units
- [x] Create Unit.js class with: position, HP, DMG, attack speed, range, armor, team, type
- [x] Spawn placeholder player units on wall sections and in reserve
- [x] Spawn placeholder enemy units on enemy side
- [x] Implement basic movement (enemies advance toward wall, player reserves move when deployed)
- [x] Implement targeting logic for all unit types (see DECISIONS.md)
- [x] Implement attack resolution: damage, armor reduction, death
- [x] Implement Mage armor-ignore rule
- [x] Implement AoE damage for Engineer and Catapult
- [x] Validate 50+ simultaneous moving sprites — confirm acceptable frame rate

### Battle Scene — Combat Logic
- [x] Implement XP awards (killing blow, assist, took damage)
- [x] Implement elite kill bonus (6 XP for Ogre/General/Catapult kills)
- [x] Implement elite kill announcement display
- [x] Implement Captain aura (+25% DMG to 3×3 tile area, applied before rendering)
- [x] Implement Healer behavior (heal lowest HP% friendly in 2 tiles every 10s)
- [x] Implement wall breach: units drop to ground, lose damage reduction, enemies retarget
- [x] Implement enemy rout condition (all elites dead + <50% remaining)
- [x] Implement rout behavior (enemies flee to top of screen, still attackable)
- [x] Implement round end conditions (all enemies off screen OR all player units dead)

### Battle Scene — Reserve System
- [x] Implement 3 reserve slots on player side
- [x] Implement reserve deployment UI (tap/click to deploy to wall section or as sortie)
- [x] Implement Warriors/Captains locked to reserve only (cannot be placed on wall)

---

## 🟠 Battle Interactivity

Goal: Give the player meaningful in-battle controls beyond deploying reserves. Targeting preferences let the player direct unit-group focus without micromanaging individuals.

### Layout Prep
- [x] Reduce TILE constant from 50px to 40px; verify canvas renders correctly at 480×640
- [x] Hide key/legend sidebar in production battle view (keep visible in test picker / dev mode)

### Visual Feedback
- [x] Blue glow on healed unit: 0.5s postFX glow on unit sprite when Healer heals a target

### Targeting Preference UI
- [x] Add `targetingPreference` to GameState: `{ melee: 'default', ranged: 'default', siege: 'default' }`
- [x] Add targeting preference pre-check to targeting.js: if group preference is set and any enemy of that type exists on field, filter candidates to that type before standard targeting logic; else fall through to default
- [x] Add three dropdowns below canvas in index.html: Melee (Warrior/Captain), Ranged (Archer/Mage), Siege (Engineer); Healer row labeled N/A and disabled
- [x] Dropdown options: Default, Orc, Goblin, Ogre, General, Catapult
- [x] Add note under Ranged dropdown: "Overrides Mage elite-targeting when set"
- [x] Wire dropdowns to GameState.targetingPreference (onchange updates state immediately)

---

## 🎨 Visual Polish (In Progress)

- [x] Aura glow: dim gold border on units within Captain (player) or General (enemy) aura range; healer blue glow temporarily suppresses it for its duration
- [x] Slow-mo: move from in-canvas button to HTML checkbox in targeting controls bar, to the right of Siege dropdown; wire via GameState.sloMo
- [x] Persist targeting preferences and slow-mo to localStorage (key: hotyPrefs); load and apply to UI on page init

---

## 🛠️ Testing Infrastructure

- [x] Create testversion.html — clone of index.html with scenario chooser, key/legend, and all dev/test features; index.html is clean production experience (no picker, no sidebar, auto-starts Year 1 Option A)

---

## 🟡 Sprint 2 — Off Season UI

Goal: Build the off-season as an 8-step wizard in HTML/CSS. Steps 1–2 are conditional ceremonies. Steps 3–8 handle spending, personnel, deployment, and scouting. All decisions flow into GameState for the battle phase.

### Phase A — Data & State Foundation
- [x] Extend `GameState.js`: off-season fields — gold breakdown (base/wall-damage/destroyed-segment), building levels, wall HP/level per segment, unit roster array (name, class, gender, level, XP, year, portraitId, assignment, injured), per-playthrough used-name set and used-portrait set
- [x] Create `src/data/names.js` — male/female first-name pools (50 each, Anglo-Saxon/Northern European); per-class surname pools (25 each) for all 8 classes
- [x] Create `src/data/portraits.js` — portrait manifest arrays by warrior/nonwarrior × male/female × young/old; deck-draw logic (remove portrait on assignment; return dead/departed soldiers' portraits only when full category pool is exhausted)
- [x] Create `src/data/bios.js` — bio pools (young male / young female / old male / old female, 64 each)
- [x] Implement `src/offseason/recruitGenerator.js` — class distribution (capacity-aware, roster-balancing to ±1 of even split per building pair); name generation (full-name uniqueness check per playthrough); portrait deck-draw; bio selection; called after spending confirmed

### Phase B — Wizard Shell & Navigation
- [x] Build wizard shell in `src/offseason/OffSeasonUI.js`: step tracking, Next/Previous button logic, single-step rendering dispatch, state preserved on back-navigation

### Phase C — Honoring Ceremonies (Steps 1–2)
- [x] Implement Step 1 — Roll Call of the Fallen: list all fallen soldiers (portrait + name + class + years of service), sorted by years of service descending; Commander's closing line; skip if no deaths; manual advance
- [x] Implement Step 2 — Hero Departures: list all seven-year heroes; retention outcome resolved at render time (25% base stay chance); "A hero of the realm" phrasing; staying heroes noted distinctly; skip if no heroes this year; manual advance

### Phase D — Gold & Investment (Steps 3–5)
- [x] Implement Step 3 — Gold Summary: display base income, wall-damage bonus, destroyed-segment bonus, and running total; read-only informational screen
- [x] Implement Step 4 — Wall & Building Investment: three wall segments (current HP, max HP, level, repair cost, upgrade cost); full building list with current level, upgrade cost, prerequisite gating (greyed out if locked or unaffordable); running gold total updated in real time
- [x] Implement Step 5 — Confirm Spending: summarize all purchases; warn that building choices determine which recruit classes arrive; on confirm, write to GameState and trigger `recruitGenerator`

### Phase E — Personnel & Assignment (Step 6)
- [x] Implement Step 6 — Personnel Table: all combatants (not Masons/Scouts) in a sortable/filterable table; columns: Name, Class, Year of Service, Level, Assignment; new recruits visually highlighted; sort/filter state persists within session, resets next year
- [x] Assignment dropdown: options Wall Left/Center/Right + Reserve Left/Center/Right; Warriors/Captains have wall options disabled; returning soldiers default to prior year's assignment; block Next until every combatant has an assignment; popup warning if any group exceeds hard capacity
- [x] Character detail modal: triggered per row; shows portrait, full name, class, year of service, level, XP, bio, and greeting in "Commander [name], [greeting]" format (keyed by class × year of service); dismissable

### Phase F — Deployment Preview (Step 7)
- [x] Implement Step 7 — Deployment Preview: schematic of wall + reserve zones populated with assigned units, mirroring battle map layout; Back returns to Step 6 with assignments intact

### Phase G — Scout Phase (Step 8, conditional)
- [x] Implement Step 8 — Scout Deployment: shown only if Scout count > 0; player chooses to send scouts; 60% success (intel revealed) / 30% fail / 10% captured (scout permanently removed); ~3s delay; on success offer return to Step 6 then re-show Step 7 before proceeding

### Phase H — Integration & Handoff
- [x] Wire off-season end → battle handoff: write final deployment assignments into GameState so `BattleScene.js` reads unit positions and reserve group contents on startup
- [x] Update `testversion.html` to support launching the off-season wizard directly alongside the existing battle scenario chooser

---

## 🟢 Sprint 3 — Progression & Campaign Loop

Goal: Wire up XP, leveling, injuries, the 7-year arc, and the full year-over-year campaign loop. Game now plays multiple years.

### Unit Progression
- [ ] Implement XP accumulation per unit across battles
- [ ] Implement level-up threshold checks (L2=5, L3=10, L4=20, L5=30)
- [ ] Apply level-up stat bonuses (HP and DMG per unit type)
- [ ] Display unit level in battle and in off-season roster view
- [ ] Implement injury system (injured units cannot gain XP or participate in off-season)
- [ ] Implement Hospital healing cooldown reduction per level

### Campaign Loop
- [ ] Implement year counter
- [ ] Implement 7-year service tracking per unit
- [ ] Implement hero graduation (unit reaches year 7, given choice to leave or stay)
- [ ] Implement base ~10% stay chance; Monument bonus applies
- [ ] Implement super unit designation for veterans who stay (placeholder benefits for now)
- [ ] Implement Monument hero name tracking (stores graduating heroes, applies attack speed bonus)
- [ ] Implement end-of-campaign scoring (total heroes graduated)

### Enemy Scaling
- [ ] Implement year-up stat scaling for all enemy types (HP/DMG/Armor per year)
- [ ] Implement 3 composition variations per year (placeholder compositions — full table TBD)
- [ ] Implement random composition selection at battle start

### Building Bonuses (Wire Up)
- [ ] Armory: apply +7% armor per level to all player units
- [ ] Weaponsmith: apply +10% DMG multiplier per level (Warriors, Archers, Captains)
- [ ] Archery Range: apply -0.2s attack interval per level to Archers
- [ ] Sparring Ground: apply -0.2s attack interval per level to Warriors and Captains
- [ ] Mage Workshop: apply -0.5s attack interval per level to Mages
- [ ] Monument: apply -0.1s attack interval per graduated hero (max 5)
- [ ] Enforce attack speed floor: 0.5s minimum

---

## 🔵 Sprint 4 — Polish & Playtesting Prep

Goal: Make the game actually playable end-to-end. Add enough visual and UX polish to evaluate balance.

### Visual Polish
- [ ] Replace placeholder sprites with real sprite sheets
- [ ] Add unit death animations
- [ ] Add wall damage visual states (cracks, rubble)
- [ ] Add elite kill announcement UI (who got the killing blow)
- [ ] Add rout animation (enemies flee)
- [ ] Add battle outcome screen (victory / partial loss / game over)

### UX
- [ ] Add year summary screen between off-season and battle (casualties, XP earned, heroes)
- [ ] Add building tooltip descriptions
- [ ] Add unit stat display in roster view
- [ ] Responsive layout validation on mobile

### Balance Tuning (Playtesting)
- [ ] Validate Goblin armor scaling — flag if overwhelming at year 15+
- [ ] Validate move speed values (Fast/Med/Slow in tiles/second)
- [ ] Validate gold economy feel — is 100/year + wall damage enough?
- [ ] Validate XP curve — does L5 feel earned after 7 years?
- [ ] Validate elite threat level — do Ogres/Generals/Catapults feel scary?

---

## 📋 Backlog (Post-MVP)

- [ ] Mobile layout — game is desktop-first in V1; mobile requires a separate design pass (scrollable/pannable viewport or responsive tile sizing); neither portrait nor landscape fits the 12×16 grid at playable tile sizes without a dedicated solution
- [ ] Enemy composition spreadsheet — 3 variations per year across full campaign
- [ ] Scout Academy intel reveal — decide: full composition or style hint only?
- [ ] Captain unlock trigger — define: years of service? XP level? Both?
- [ ] Super unit benefits — define exact advantages for veterans who stay
- [ ] Mentorship/legacy system — define mechanics for departing hero buffs
- [ ] Enemy armor scaling curve — define year-over-year values
- [ ] Veteran retention chance — define base % and Monument bonus per level
- [ ] Units per wall section cap — define hard limit or size-based

---

## ❓ Open Questions (Unresolved Design)

> Add questions here when you hit something unresolved during implementation.
> Do not make silent assumptions — flag it here and keep going with a clearly marked placeholder.

- What does Scout Academy intel actually reveal — full enemy composition or general style (e.g. "heavy siege")?
- What triggers Captain eligibility — years served, XP level, Officer Academy level, or combination?
- What are super unit (stayed veteran) specific benefits beyond combat?
- How does the mentorship/legacy system work mechanically?
- What is the base veteran retention chance and Monument bonus per level?
- What are enemy armor values at each year — needs a defined scaling curve?
- How many units fit per wall section (4 tiles wide) — hard cap or unit-size dependent?
- Move speed values (tiles/second) for Fast / Med / Slow — to be determined during playtesting
