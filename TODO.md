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

## 🟡 Sprint 2 — Off Season UI

Goal: Build the off-season interface in HTML/CSS. Player can spend gold, build/upgrade buildings, and see incoming recruits. No persistence yet — state resets on reload.

### Gold & Resource Display
- [ ] Display current gold total
- [ ] Display incoming gold calculation (100 base + wall damage)
- [ ] Display current year number

### Building Interface
- [ ] Create tabbed navigation: Melee & Reserves / Ranged & Artillery / Magic & Healing / Engineering / General Infrastructure
- [ ] Render building cards per tab: name, current level, quantity, upgrade cost, prerequisites
- [ ] Implement prerequisite gating (greyed out if prereqs not met)
- [ ] Implement purchase/upgrade flow (deduct gold, update GameState)
- [ ] Implement building dependency tree validation

### Recruit Display
- [ ] Show incoming recruit count (fills empty slots after spending)
- [ ] Show recruit composition (skewed toward 50/50 roster balance)
- [ ] Implement roster balance algorithm (checks current roster ratio, skews incoming)
- [ ] Restrict recruit pool to archetypes supported by existing buildings

### Wall Management
- [ ] Display wall segment status (HP, level, damage taken)
- [ ] Implement wall repair (spend gold, restore HP via Masons)
- [ ] Implement wall upgrade (spend gold, increase level)

### Transition
- [ ] "Begin Battle" button transitions from off-season UI to Phaser battle scene
- [ ] GameState correctly passes all off-season decisions into battle scene

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
