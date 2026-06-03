# DECISIONS.md — Heroes of the Seventh Year

> These decisions are locked. Do not relitigate them.  
> New decisions go at the bottom of the relevant section with a date.  
> Format: `[YYYY-MM-DD] Decision description`

---

## Architecture

- [2025-05-27] Tech stack: HTML5 + Phaser (latest) for battle phase, HTML/CSS for off-season UI, shared JavaScript state object bridging both
- [2025-05-27] Phaser owns the battle canvas entirely; off-season UI is pure HTML/CSS layered over or alongside canvas
- [2025-05-27] All game logic (combat resolution, targeting, XP math) runs in JavaScript; Phaser handles visual rendering only
- [2025-05-27] Unit animations use sprite sheets only — no individual images
- [2025-05-27] All unit, enemy, and building stats are defined in src/data/ — never hardcoded
- [2026-05-28] All constants and magic numbers live in src/data/constants.js — no raw literals elsewhere in the codebase

---

## Game Structure

- [2025-05-27] Each campaign year = one off-season phase + one battle phase, no exceptions
- [2025-05-27] Difficulty determines campaign length: Easy = 10 years, Medium = 20 years, Hard = 30 years
- [2025-05-27] First 10 years are the learning ramp regardless of difficulty — same threat curve, campaign simply ends at different points
- [2025-05-27] Game over condition: all player units dead (total wipe) — not wall breach alone
- [2025-05-27] Primary win condition: survive to end of campaign. Score = total heroes graduated (survived 7 years)

---

## Battle Phase

- [2025-05-27] Map is 12 tiles wide × 16 tiles tall
- [2025-05-27] Wall divides map horizontally; 3 sections (Left, Center, Right), each 4 tiles wide
- [2026-05-27] Wall sits at row 11 (0-indexed) — ~10 enemy rows of approach, ~4 player rows behind wall
- [2026-05-27] Engineers are deployed stationary on the player side of the wall (row 12), NOT on the wall itself — they shoot over it at range 11
- [2025-05-27] Warriors and Captains are NEVER assigned to wall sections — always in reserve
- [2025-05-27] 3 reserve slots on both player side and enemy side
- [2025-05-27] Reserve units start at edge of map and move in when deployed
- [2025-05-27] Units assigned to wall sections cannot move during battle
- [2025-05-27] Wall is a barrier with HP — melee enemies cannot reach player units until wall is breached
- [2025-05-27] Goblins cannot damage the wall — they target player units only (ranged)
- [2025-05-27] Melee enemies (Orcs, Ogres, Generals) attack wall HP directly
- [2025-05-27] Catapults deal AoE damage that hits both wall HP and player units on wall
- [2025-05-27] Wall grants damage reduction bonus to all units on it: 1% per foot of height (Level 1 = +10%, Level 2/3 = +20%, Level 4/5 = +30%)
- [2025-05-27] On wall breach: units on wall drop to ground, lose damage reduction bonus; breaching enemies target nearest ground unit
- [2025-05-27] After breach: Engineers and reserve units on player side become valid targets
- [2025-05-27] Each year has 3 possible enemy composition variations, randomly selected at battle start
- [2025-05-27] Enemy rout condition: all active Ogres + Generals + Catapults dead AND remaining enemies < 50% of starting count AND player units outnumber remaining enemies
- [2025-05-27] Routed enemies flee toward top of screen; can still be attacked during retreat
- [2025-05-27] Round ends when: all enemies off screen (victory) OR all player units dead (game over)

---

## Targeting

- [2025-05-27] Warrior / Captain: nearest enemy
- [2025-05-27] Archer: furthest enemy in range
- [2025-05-27] Mage: nearest elite (Ogre/General/Catapult); if none in range, furthest in range
- [2025-05-27] Engineer: furthest enemy in range
- [2025-05-27] Healer: lowest HP% friendly within 2 tiles
- [2025-05-27] Orc / Ogre / General: nearest wall section; on breach, nearest ground unit
- [2025-05-27] Goblin: furthest player unit in range; advances until in range
- [2026-05-28] Catapult: nearest wall section (same as melee); on breach, nearest player unit
- [2026-05-28] AoE splash damage does not affect units that are on a wall (wall provides cover)
- [2026-05-28] Enemy targeting override: if any wall is breached OR any player unit has crossed to the enemy side (y < WALL_ROW), all wall-targeting enemies (orc/ogre/general/catapult) switch to targeting player units instead; reverts to wall-targeting if neither condition holds

---

## Unit Stats & Progression

- [2025-05-27] Attack speed floor: 0.5 seconds minimum for all units regardless of building bonuses
- [2025-05-27] Weaponsmith damage bonus applies to Warriors, Archers, and Captains only (not Mages or Engineers)
- [2025-05-27] Weaponsmith bonus is applied before Captain aura calculation
- [2025-05-27] Captain aura: +25% DMG to all friendlies in 3×3 tile area (additive)
- [2025-05-27] Sparring Ground attack speed bonus applies to both Warriors and Captains
- [2025-05-27] Max 5 Captains total (Officer Academy max 5 levels = 5 capacity)
- [2025-05-27] Healer heals lowest HP% friendly within 2 tiles to full every 10s (not partial heal)
- [2025-05-27] Mage ignores target armor entirely
- [2025-05-27] Engineer deals AoE damage at range 11 (near-full map width, trebuchet-style)
- [2025-05-27] XP awards: killing blow = 2 XP; assist (≥30% HP dealt) = 1 XP; took damage = 1 XP
- [2025-05-27] Elite kill bonus: killing blow on Ogre/General/Catapult = 6 XP (tripled)
- [2025-05-27] Level thresholds: L2=5 XP, L3=10 XP, L4=20 XP, L5=30 XP
- [2025-05-27] Level up stats per level: Warrior +10 HP/+3 DMG; Archer +5 HP/+2 DMG; Mage +3 HP/+10 DMG; Healer +5 HP/+1 DMG; Captain +15 HP/+3 DMG; Engineer +5 HP/+10 DMG
- [2025-05-27] Injuries prevent XP gain and off-season participation; Healers and Hospitals reduce recovery time

---

## Elite Units & Kill Announcements

- [2025-05-27] Ogre, General, and Catapult are elite units
- [2025-05-27] On elite kill: display on-screen announcement showing which player unit landed killing blow
- [2025-05-27] Elite kills award 6 XP for killing blow (3× standard)

---

## Buildings & Economy

- [2025-05-27] Building dependency tree: Barracks → Archery Range → Scout Academy / Siege Workshop; Barracks → Sparring Ground → Officer Academy → Monument; Library → Mage Workshop / Hospital; Artisan Workshop → Armory / Weaponsmith / Siege Workshop (also requires Archery Range)
- [2025-05-27] All blank building costs default to 200 gold per level
- [2025-05-27] Armory: +7% armor per level (additive, all units)
- [2025-05-27] Weaponsmith: +10% DMG multiplier per level (Warriors, Archers, Captains only)
- [2025-05-27] Monument tracks hero names for bonus accounting; stores up to 5 heroes' worth of attack speed bonus (-0.1s per hero, max -0.5s total)
- [2025-05-27] Hospital: -1.0s heal interval per level (applies to healer healing cooldown, not attack speed)
- [2025-05-27] Mason: repairs/builds 50 HP of wall damage per Mason per off-season
- [2026-06-02] Artisan Workshop: automatically repairs 50 HP per wall segment per level at off-season start (before gold breakdown is computed for display); shown as a notice on the investment screen

---

## Gold & Recruits

- [2026-06-02] Gold per off-season: base tax is random each year — 100, 150, or 200 gold (equal probability, rolled at off-season start); +1 per missing wall HP (pre-repair); +200 per fully destroyed segment
- [2025-05-27] Gold is spent first; recruits arrive after all spending is complete
- [2025-05-27] Recruits fill all empty housing slots after spending
- [2025-05-27] Recruit composition: random but skews toward 50/50 balance based on current roster (not capacity)
- [2025-05-27] Only archetypes supported by existing buildings can appear in recruit pool
- [2025-05-27] King sends additional resources as comeback mechanic when player suffers serious losses

---

## Wall

- [2025-05-27] Wall upgraded per segment independently
- [2025-05-27] Wall Level 1: Height 10, Thickness 1, HP 200, Cost 100
- [2025-05-27] Wall Level 2: Height 20, Thickness 1, HP 300, Cost 200
- [2025-05-27] Wall Level 3: Height 20, Thickness 2, HP 400, Cost 300
- [2025-05-27] Wall Level 4: Height 30, Thickness 2, HP 500, Cost 400
- [2025-05-27] Wall Level 5: Height 30, Thickness 3, HP 600, Cost 500
- [2025-05-27] Ladder mechanic deferred to V2 — wall height has no gameplay effect in V1 beyond damage reduction bonus

---

## Progression & Legacy

- [2025-05-27] Seven-year arc: recruits who survive 7 years leave as heroes (base 25% chance to stay; Monument and veteran stipend provide additional bonus — exact values TBD)
- [2025-05-27] Veterans who stay become super units (exact advantages TBD — see Open Questions)
- [2025-05-27] Legacy/mentorship system: departing heroes leave passive buff to future recruits in their archetype (exact mechanics TBD)
- [2025-05-27] Goblin stats kept as-is for now; armor scaling to be evaluated during playtesting

---

## Move Speeds

- [2026-05-27] Move speed values (tiles/second): Slow = 0.5, Med = 1.0, Fast = 2.0
- [2026-05-27] These are Sprint 1 starting values — to be tuned during playtesting

---

## Unit Icons

- [2026-05-28] Ogre icon: custom ogre image (placeholder rectangle currently) — image forthcoming
- [2026-05-28] Engineer icon: trebuchet image — image forthcoming

---

## Reserve System

- [2026-05-28] 3 reserve slots per side (left/center/right), each aligned with its wall section center; capacity 25 units per slot
- [2026-05-28] Reserve zones are rows 0–1 (enemy, red highlight) and rows 14–15 (player, blue highlight); no label
- [2026-05-28] Reserve units are stationary and inert until deployed — skipped by targeting, movement, and attack tick
- [2026-05-28] Enemy reserve deployment logics: wait_for_breach (any breach triggers); left/center/right_after_Xs (real-clock 20 s OR any wall breach — whichever comes first, advance on that wall section)
- [2026-05-28] Alarm condition: any player unit crosses into rows 0–7 instantly releases all undeployed enemy reserves
- [2026-05-28] Rout threshold uses total starting enemy count (all units including reserves); alive count also includes reserves — rout requires all elites dead AND fewer than 50% of all starting enemies still alive
- [2026-05-28] When rout triggers, any enemy reserves deployed afterward are immediately set to routing; round-end checks still operate on active (non-reserve) enemies only
- [2026-05-28] Player deployment: pre-assigned to slots before battle; deployed via in-battle button → 6-option menu (Sortie Left/Center/Right, Reinforce Left/Center/Right); one-way, no recall
- [2026-05-28] Wall breach auto-releases all undeployed player reserves immediately with no directional preset (normal targeting takes over)
- [2026-05-28] Sortie: units advance through/past wall into enemy territory; normal targeting applies
- [2026-05-28] Reinforce: Archers/Mages/Healers target that wall section; Warriors/Captains advance and fight near the wall
- [2026-05-28] Enemy reserve compositions come from a per-year spreadsheet (TBD); placeholder used in stress test

---

## Sprint 1 Test Composition

- [2026-05-28] Test composition — Player (39): Wall = 5 Archers + 1 Healer per section (18 total); Reserve = 5 Warriors + 1 Captain + 1 Mage per slot (21 total); 0 Engineers
- [2026-05-28] Stress test composition — Enemy (85 total): Main battle (60): 5 Catapults + 25 Goblins + 25 Orcs + 5 Ogres; Reserve (25): left=10 Orcs (left_after_1minute), center=10 Goblins (center_after_1minute), right=5 Generals (wait_for_breach); main battle start at row 2+; ogres advance immediately, all others wait 1 second
- [2026-05-27] Placeholder sprites: colored rectangles (no sprite sheets yet)

---

## Enemy Compositions

- [2026-05-28] Enemy composition data lives in `src/data/compositions.js`, exported as `ENEMY_COMPOSITIONS` keyed by year number
- [2026-05-28] Each year entry is an array of 3 options (index 0=A, 1=B, 2=C); option is randomly selected at battle start and stored in `GameState.enemyCompositionIndex`
- [2026-05-28] Each composition option has: `left`, `center`, `right` lane unit arrays `[{type, count}]`; `reserves` array `[{slot, units, logic}]`; and `scoutingReport` string (for Sprint 3 Scout Academy reveal)
- [2026-05-28] Years without a defined composition fall back to the stress test (85-unit hardcoded spawn) — currently year 99 is the stress test trigger
- [2026-05-28] During development, `index.html` shows a test picker overlay (9 buttons: Year 1–3 × Option A–C, plus stress test) so specific compositions can be loaded without running the full campaign loop

---

## Battle UI & Layout

- [2026-05-29] Tile size is 46px; canvas = 552×736 (adjusted from 40px after targeting controls moved to a single compact row)
- [2026-05-29] Targeting controls rendered as one inline row below canvas: "Targeting: Melee [drop] Ranged [drop] Siege [drop]" — no Healer row, no notes
- [2026-05-29] Status bar (Year / Enemies / Defenders) moved to top-center of canvas; FPS counter removed
- [2026-05-29] Battle starts with a 3-2-1-FIGHT! countdown (1s per number, 0.7s for FIGHT!); game loop is frozen during countdown so player can set targeting preferences
- [2026-05-29] Key/legend sidebar is hidden in production battle view — unit icons carry the visual identity; sidebar remains visible in dev/test picker view only
- [2026-05-29] Targeting preference UI: three dropdowns (Melee, Ranged, Siege) displayed below the battle canvas
- [2026-05-29] Healer is excluded from targeting preference UI — labeled N/A; it targets friendlies, not enemies
- [2026-05-29] Each dropdown includes "Default" as first option, which means standard targeting rules apply for that group
- [2026-05-29] Ranged group override applies to Mages — player accepts consequences (Mage may ignore elites); dropdown shows a brief warning note
- [2026-05-29] Game is desktop-first for V1; mobile layout deferred to a later sprint
- [2026-05-29] Healed units display a 0.5s blue postFX glow on their sprite; implemented via Phaser postFX.addGlow() removed by delayedCall
- [2026-05-29] Healer healTimer initializes to 0 (not HEALER_HEAL_S) — healer fires as soon as it finds an injured ally, then 10s cooldown; original 10s startup delay caused healers to die before first heal
- [2026-05-29] Healer XP: 1 XP per 50 HP healed (accumulated across heals, fractional HP tracked in healXpAccum)
- [2026-05-29] Aura glow: units within a Captain or General aura radius show a dim gold postFX glow (AURA_GLOW_COLOR 0xccaa00, outer 3); healer blue heal glow temporarily suppresses the gold for its 500ms duration; after blue fades the gold naturally returns on next tick if still in aura
- [2026-05-29] Targeting candidates exclude isInReserve units — reserve units are inert and must not be targetable by either side; also fixes mage elite targeting which previously could pick an out-of-range reserve General as "nearest elite" and fail to find in-range active elites
- [2026-05-29] Mage elite targeting uses elitesInRange (filter before nearest) not nearElite + range check after; old approach silently fell back to non-elite targets when the globally-nearest elite was out of range
- [2026-05-29] On rout trigger: all non-reserve, non-stationary player units have reinforceSection and waypoint cleared so they give chase; previously reinforce-hold warriors stayed frozen behind the wall because only wall breach released reinforceSection
- [2026-05-29] Reinforce for archers/mages/healers: uses a waypoint to WALL_ROW+1 (same position as warriors) — waypoint clears on arrival so normal enemy targeting takes over; warriors/captains keep reinforceSection hold until breach; ranged units must NOT have wall segment set as target (causes them to attack/shoot the wall and refuse to move)
- [2026-05-29] Slow-mo is a player-facing feature: moved from an in-canvas debug button to a "Slow Mo" checkbox in the HTML targeting controls bar (right-aligned, to the right of Siege dropdown); state lives in GameState.sloMo; BattleScene reads it each tick
- [2026-05-29] Targeting preferences and slow-mo are persisted to localStorage under key 'hotyPrefs' (JSON: melee, ranged, siege, sloMo); loaded and applied to both GameState and UI elements on page init; shared between index.html and testversion.html

---

## Off-Season Data Layer (Sprint 2)

- [2026-06-01] Recruit generation: `generateRecruits(gameState)` in `src/offseason/recruitGenerator.js`; called after spending confirmed; returns new unit array and pushes to `GameState.roster`
- [2026-06-01] Portrait decks stored in `GameState.portraitDecks` (null until first generation); initialized via `buildPortraitDecks()` from `portraits.js`; `available` array shrinks on draw, `spent` array holds dead/departed until available exhausted
- [2026-06-01] Unit ID: simple integer counter stored in `GameState._nextUnitId`, incremented per unit
- [2026-06-02] Level 1 recruits receive a personal HP bonus of 1–5 (rolled at generation, stored as `hpBonus` on the roster unit, applied permanently in `computeEffectiveDef`); starter veterans do not receive this bonus
- [2026-06-02] On each level-up in battle, unit randomly gains either +1–3 HP or +1–3 DMG; stored as `bonusHp`/`bonusDmg` on the roster unit (persists across battles); applied in `computeEffectiveDef` before Weaponsmith multiplier
- [2026-06-02] Library enables both Mages and Healers for recruitment — no Mage Workshop or Hospital required; those buildings are performance upgrades only (attack speed / heal interval)
- [2026-06-01] `buildings.mason` key removed from GameState (was an earlier design artifact); mason housing uses `artisanWorkshop` level × `ARTISAN_MASON_SLOTS` per GDD spec
- [2026-06-01] Bio pool has 10 entries per sub-pool (youngMale/youngFemale/oldMale/oldFemale) as starting content; target is 64 per pool — expand as content is written
- [2026-06-01] `isNewRecruit` flag on unit: true on arrival, set to false on existing roster units when new recruits are generated
- [2026-06-01] Wizard shell: `startOffSeason(gameState, onComplete)` in `OffSeasonUI.js`; `initNavButtons()` called once at page load to wire Previous/Next; step renderers receive `(gs, wizardState, contentEl, wizard)` where `wizard` exposes `setNextEnabled`, `setNextLabel`, `proceed`
- [2026-06-01] Step files live in `src/offseason/steps/`; each exports a single `render` function; wizard imports all 8 and filters by conditionals at launch time
- [2026-06-01] Hero retention resolved in `resolveHeroRetention()` before the ceremony step renders — `hero.staying` is set once and not re-rolled on back-navigation
- [2026-06-01] `wizardState.spending` and `wizardState.assignments` are the authoritative in-wizard copies; final values written to GameState in `finish()` callback chain (steps write to wizardState; `onComplete` callback applies to GameState)
- [2026-06-01] Off-season wizard is full-screen (position: fixed; inset: 0) — responsive to any viewport; header and nav are fixed strips; content area scrolls; step content centered at max-width 960px via .os-inner wrapper injected by OffSeasonUI.renderStep
- [2026-06-02] Fallen ceremony: display yearOfService + 1 to include the year they fell in; "1 year of service" for singular, "N years of service" for N ≥ 2
- [2026-06-01] Hero ceremony: staying heroes noted with gold border on portrait and gold italic tagline; departed heroes use muted parchment text — same card layout for both outcomes
- [2026-06-01] `wizardState.stayingHeroes` is populated in stepHeroes.render; onComplete handler applies their 1 XP/off-season bonus to the roster
- [2026-06-01] Gold breakdown computed at wizard start in `OffSeasonUI.computeGoldBreakdown`; `wizardState.goldAvailable` = carryover + new income; `gs.gold` not modified until Confirm is clicked
- [2026-06-01] Wall upgrades: one upgrade per segment per season (enforced in stepInvest by disabling the upgrade button after first purchase); buildings allow multiple upgrades per season
- [2026-06-01] Prereq check in stepInvest uses effective level (gs.buildings[key] + spending.buildings[key]) — buying Barracks and Archery Range in the same season is allowed
- [2026-06-01] `wizardState.spendingConfirmed = true` set on Confirm; re-visiting Step 5 via Previous shows a "confirmed" message rather than the form again
- [2026-06-01] Wall repair: free (no gold); one Mason provides 50 HP capacity; Repair button adds min(50, remaining damage) HP per click; Undo removes the last 50 HP increment
- [2026-06-01] Personnel table sort/filter state lives in `wizardState.personnelState` — persists across back/forward navigation within a session
- [2026-06-01] New recruits generated in Step 5 are added to `wizardState.assignments` on Step 6 first render (seeded to null); units missing from the map after wizard start get added defensively at render time
- [2026-06-01] Wall section capacity warning threshold: 10 units (placeholder — hard cap is an open design question; see TODO Backlog); reserve section warning: 25 units (from decisions)
- [2026-06-01] Detail modal appended to `document.body` at z-index 200; single modal enforced by removing `#os-detail-modal` before creating a new one
- [2026-06-01] Greeting in modal: "Commander, [greeting]" — player name system not yet implemented; "Commander" used as placeholder
- [2026-06-01] Greetings file: `src/data/greetings.js`; 2 strings per class × year (56 combinations); `pickGreeting(cls, yearOfService)` maps yearOfService+1 to key 1–7
- [2026-06-01] Deployment preview layout: enemy approach strip (top), 3 wall section cards with HP bars, THE WALL divider bar, 3 reserve zone cards (bottom); class legend at foot; read-only — Back returns to Step 6 with assignments intact via wizard shell
- [2026-06-01] Unit dot colors in deployment preview derived from `UNIT_DEFS[cls].color` (integer) converted to CSS hex
- [2026-06-01] Scouts captured during the off-season are added to `gs.capturedScouts[]` (not `fallenThisBattle`); at the start of the NEXT off-season, `startOffSeason` merges `capturedScouts` into `fallenThisBattle` so they appear in that year's Roll Call of the Fallen, then clears the buffer
- [2026-06-01] Scout step odds: 60% success, 30% fail, 10% captured; resolved via single `Math.random()` roll
- [2026-06-01] On scout success: enemy composition for the upcoming battle is pre-selected and stored in `wizardState.scoutedCompositionIndex`; `gs.enemyCompositionIndex` is set immediately so it persists to battle start
- [2026-06-01] "Revise Deployment" on scout success uses `wizard.jumpTo('personnel')` to navigate back to Step 6; player then walks through Step 7 (deployment preview) again before returning to Step 8 which shows the cached result without re-rolling
- [2026-06-01] Wizard API extended with `setPrevEnabled(bool)` and `jumpTo(stepId)` for scout step navigation control
- [2026-06-01] `BattleScene._spawnPlayerUnits()`: reads `GameState.roster` (filtered to `!dead && assignment`) when populated; falls back to `_spawnPlayerUnitsHardcoded()` when roster is empty (e.g. battle launched directly from test picker)
- [2026-06-01] Handoff sequence: `onComplete(wizardState)` → write `wizardState.assignments[id]` to each roster unit → `launchBattle()` → BattleScene reads assignments
- [2026-06-01] Engineers assigned to wall sections spawn at WALL_ROW + 1.5 (behind the wall) rather than WALL_ROW + 0.5 — consistent with the "stationary behind wall" decision
- [2026-06-01] Sprint 3 hook: `index.html` will trigger `startOffSeason` from a `battleComplete` event fired by BattleScene after Year 1; Year 1 launches directly into battle with no prior off-season
- [2026-06-01] Portrait display size in ceremonies: 72×72px

---

## Combat: Critical Hits

- [2026-06-02] All player units have a 5% base crit chance on every attack; crits deal triple damage (CRIT_MULTIPLIER = 3)
- [2026-06-02] On crit: bright red postFX glow (0xff2200) flashes on the target for 350ms; applies to both melee and ranged hits (ranged: triggers on projectile landing)
- [2026-06-02] Crit is player-only — enemy units do not crit

---

## Design Simplifications (2026-06-02)

- [2026-06-02] Injury system removed — not in current design; no injury tracking in code or GDD
- [2026-06-02] Super unit mechanics removed — veterans who stay are just high-level normal units; no special super-unit advantages
- [2026-06-02] Captain unlock trigger removed — Captains are recruited like any other unit; Officer Academy capacity is the only gate
- [2026-06-02] Scout Academy always reveals full enemy composition on success (not a hint) — already implemented in Sprint 2

---

## Sprint 3 — Progression & Campaign Loop

- [2026-06-02] XP earned in battle is written back to GameState.roster units via `rosterId` linkage: deaths written in `_handleDeath`, survivors written in `_endBattle`
- [2026-06-02] Level-up stat bonuses applied immediately in battle (Unit._applyLevelUps called after every awardXp); also applied to roster unit on battle-end writeback via `applyLevelUpsToRosterUnit` in buildingBonuses.js
- [2026-06-02] Building bonuses applied at battle spawn time via `computeEffectiveDef(rosterUnit, gameState)` in `src/battle/buildingBonuses.js`; not stored on roster units (recomputed each battle to reflect current building levels)
- [2026-06-02] Enemy stats scaled by year: `hp += yearUp.hp * (year-1)`, same for dmg and armor; armor capped at 0.90; computed in `BattleScene._scaledEnemyDef(type)`
- [2026-06-02] yearOfService increments for all surviving (non-dead) roster units after each battle — death is the only thing that ends the count (GDD changelog)
- [2026-06-02] Heroes who stay: `isVeteran = true` flag set; added to `GameState.graduatedHeroes`; staying bonus = 1 XP to all remaining roster units (per stepHeroes.js note); heroes who depart are marked `dead = true` and removed from active roster
- [2026-06-02] Campaign end screen: shown after year > campaignLength; displays hero graduation count; no restart in V1
- [2026-06-02] Year 1 starts with a full off-season (gold + buildings + personnel + deployment); ceremonies skipped automatically by existing conditionals; targeted controls shown after first off-season completes
- [2026-06-02] Starting state: `gold: 0` (Year 1 off-season provides 100g income); `buildings: { barracks: 1 }` only — all others start at 0
- [2026-06-02] BootScene added to main.js as the Phaser auto-start scene; BattleScene started explicitly via `game.scene.start()` from off-season `onComplete`
- [2026-06-02] BattleScene fires `battleComplete` CustomEvent on `document` 3 seconds after battle ends; index.html listener handles year advance + off-season start
- [2026-06-02] Elite kill announcement format: `"<EliteType> slain by <character name> (<class>)!"` — falls back to class name when no roster unit is linked (e.g. test picker launches)
- [2026-06-02] Unit death animation: greyscale via postFX ColorMatrix + 600ms alpha fade; `isDead` set immediately (game logic unaffected); sprites destroyed on tween complete; units removed from scene on `_spritesDone` flag
- [2026-06-02] Wall damage visuals: 3-band tint (intact 0x888888 / damaged 0x776655 / critical 0x664433 / breached ALPHA_WALL_BREACH); crack lines drawn via Graphics at light (>25% HP) and heavy (≤25% HP) bands; crack pattern is section-indexed for visual variety
- [2026-06-02] Unit icons are final art — no sprite sheet replacement needed; rout animation not needed (fleeing off-screen is sufficient)

---

## GDD Maintenance

- [2026-05-29] GDD updates must use targeted Edit calls against specific sections — never rewrite the whole file from scratch. Full rewrites risk losing sections due to context window limits. Add a Changelog entry for each update session.

---

## Testing Infrastructure

- [2026-05-29] Two HTML entry points: `index.html` = clean production experience (no test UI, auto-starts Year 1 with randomly selected composition); `testversion.html` = dev/test experience with scenario chooser, key/legend sidebar, and stress test button — both import the same JS modules
- [2026-05-29] Random composition selection in `index.html` uses `Math.floor(Math.random() * 3)` at page load for Year 1

---

## V2 Deferred (Do Not Implement in V1)

- [2025-05-27] Ladder mechanics and wall height gameplay effects
- [2025-05-27] Enemy Mages
- [2025-05-27] Random events and crises (plague, defections, weather, political disruptions)
- [2025-05-27] Morale / psychological system for individual units
- [2025-05-27] Archer subtypes (longbow, crossbow, etc.)
