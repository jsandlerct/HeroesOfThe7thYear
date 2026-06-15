# CLAUDE.md — Heroes of the Seventh Year

## Session Start Protocol — No Exceptions

Every Claude Code session begins with this sequence, in order:

1. Read this file (CLAUDE.md) completely
2. Read DECISIONS.md — these are locked, do not relitigate them
3. Read TODO.md — find the current task, do not start something not on the list
4. Before implementing any game system, read the relevant section of the GDD (`docs/GDD.html`)
5. When any decision is made (design or implementation), write it to DECISIONS.md immediately — not at end of session
6. Mark tasks done in TODO.md immediately upon completion — not at end of session

---

## Project Overview

**Game:** Heroes of the Seventh Year  
**Genre:** Wall defense + generational strategy (auto-battler combat)  
**Platform:** Browser (HTML5), responsive desktop and mobile  
**Status:** Design complete — in development

A wall defense strategy game where the player commands the defense of a great wall over 10–30 years. Each year has an off-season (resource allocation, building, recruiting) and a battle phase (auto-battler with reserve deployment decisions). Recruits serve for seven years and leave as heroes — or die trying.

---

## Tech Stack

| Layer | Technology | Role |
|---|---|---|
| Platform | HTML5 | Browser-native, no install |
| Battle phase | Phaser (latest) | WebGL rendering, 50+ units, game loop |
| Off-season UI | HTML / CSS | Tabbed menus, building screens, resource UI |
| State | JavaScript (shared state object) | Bridges Phaser scenes and HTML UI |

### Key Architecture Rules
- Phaser owns the battle phase canvas entirely
- HTML/CSS owns all off-season UI — do not build menus inside Phaser
- A single shared JS state object is the source of truth for all game data
- Game logic (combat resolution, targeting, XP) runs in JavaScript — Phaser handles visual playback only
- Unit animations must use sprite sheets, not individual images (minimizes draw calls)
- Attack speed floor: 0.5 seconds minimum for all units

---

## Source of Truth Hierarchy

When there is any conflict between files:

1. **DECISIONS.md** — highest authority for anything already decided
2. **heroes-seventh-year-gdd.html** — authoritative for all design intent and stats
3. **TODO.md** — authoritative for what to work on and in what order
4. **This file** — authoritative for process and architecture

---

## File Structure

```
/
├── CLAUDE.md           ← This file. Read first, every session.
├── DECISIONS.md        ← All locked decisions. Read second.
├── TODO.md             ← Task list. Read third.
├── heroes-seventh-year-gdd.html  ← Full game design document (project root)
├── src/
│   ├── main.js         ← Entry point
│   ├── state/
│   │   └── GameState.js    ← Shared state object
│   ├── battle/
│   │   ├── BattleScene.js  ← Phaser scene for battle phase
│   │   ├── Unit.js         ← Unit class (player and enemy)
│   │   ├── Wall.js         ← Wall segments
│   │   └── targeting.js    ← All targeting logic
│   ├── offseason/
│   │   └── OffSeasonUI.js  ← HTML/CSS off-season interface
│   └── data/
│       ├── units.js        ← Unit stat definitions
│       ├── enemies.js      ← Enemy stat definitions
│       └── buildings.js    ← Building definitions and dependency tree
├── assets/
│   ├── sprites/        ← Sprite sheets only — no individual unit images
│   └── ui/
└── index.html
```

---

## Core Rules for Claude Code

### Never Do These
- Do not start a task not listed in TODO.md — add it first, then do it
- Do not relitigate decisions in DECISIONS.md — they are locked
- Do not hardcode stats — all unit, enemy, and building stats live in `src/data/`
- Do not build UI inside Phaser — off-season UI is HTML/CSS only
- Do not use individual images for units — sprite sheets only
- Do not leave DECISIONS.md or TODO.md updates until end of session

### Always Do These
- Read the GDD section relevant to what you're implementing before writing code
- Write decisions to DECISIONS.md the moment they are made
- Mark tasks complete in TODO.md the moment they are done
- Keep game logic decoupled from rendering
- Validate stats against GDD before implementing

### When You're Unsure
- Check DECISIONS.md first — it may already be decided
- Check the GDD — the answer is usually there
- If genuinely unresolved, flag it clearly in a comment and add it to the Open Questions section of TODO.md — do not make assumptions silently

---

## Quick Reference — Key Stats

### Player Units (base stats)
| Unit | HP | DMG | Atk Speed | Range | Armor | Special |
|---|---|---|---|---|---|---|
| Warrior | 20 | 5 | 2s | 1 | 20% | — |
| Archer | 10 | 3 | 2s | 5 | 10% | — |
| Mage | 7 | 7 | 5s | 7 | 0% | Ignores target armor |
| Healer | 10 | 3 | 5s | 1 | 10% | Heals lowest HP% friendly in 2 tiles every 10s |
| Captain | 25 | 5 | 2s | 1 | 20% | +25% DMG aura, 3×3 tiles |
| Engineer | 10 | 15 | 10s | 11 | 10% | AoE damage |

### Enemy Units (base stats)
| Unit | HP | DMG | Atk Speed | Move | Armor | Special |
|---|---|---|---|---|---|---|
| Orc | 15 | 5 | 2s | Med | 20% | — |
| Goblin | 10 | 4 | 3s | Fast | 10% | Cannot damage wall |
| Ogre | 100 | 25 | 5s | Slow | 30% | Ignores player armor. Elite. |
| General | 30 | 7 | 2s | Med | 20% | +25% DMG aura. Armor scales fast. Elite. |
| Catapult | 20 | 15 | 10s | Slow | 10% | AoE. Range 9. Elite. |

### Targeting Rules
| Unit | Targets |
|---|---|
| Warrior / Captain | Nearest enemy |
| Archer | Furthest in range |
| Mage | Nearest elite (Ogre/General/Catapult); else furthest in range |
| Engineer | Furthest in range |
| Healer | Lowest HP% friendly within 2 tiles |
| Orc / Ogre / General | Nearest wall; on breach, nearest ground unit |
| Goblin / Catapult | Furthest player unit in range |

### XP Awards
| Action | XP |
|---|---|
| Killing blow | 2 XP (6 XP for Ogre/General/Catapult) |
| Assist (≥30% HP dealt) | 1 XP |
| Took damage | 1 XP |

### Level Thresholds
| Level | XP Required |
|---|---|
| 1→2 | 5 |
| 2→3 | 10 |
| 3→4 | 20 |
| 4→5 | 30 |

### Gold Economy
- Base: 100 gold/year
- +1 gold per missing wall HP
- +200 gold per fully destroyed wall segment

### Battle Win Condition (per year)
Enemies rout when: all Ogres + Generals + Catapults dead AND remaining enemies < 50% of starting count. Routed enemies flee toward top of screen and can still be attacked. Round ends when all enemies off screen (victory) or all player units dead (game over).
