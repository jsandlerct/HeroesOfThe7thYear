// Recruit generation logic — GDD Section VI.
// Called after spending is confirmed (off-season Step 5).
// Returns array of new unit objects and pushes them onto GameState.roster.

import { MALE_NAMES, FEMALE_NAMES, SURNAMES } from '../data/names.js';
import { BIOS } from '../data/bios.js';
import { pickSurvivorGreeting } from '../data/greetings.js';
import {
  buildPortraitDecks, drawPortrait, getPortraitCategory,
} from '../data/portraits.js';
import {
  BARRACKS_SLOTS_PER_LEVEL, LIBRARY_SLOTS_PER_LEVEL,
  ARTISAN_MASON_SLOTS, SIEGE_ENGINEER_SLOTS,
  OFFICER_CAPTAIN_SLOTS, CAPTAIN_MAX, SCOUT_SLOTS_PER_LEVEL,
} from '../data/constants.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function countClass(roster, cls) {
  return roster.filter(u => u.class === cls && !u.dead).length;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Slot computation ──────────────────────────────────────────────────────────

// Returns { warrior, archer, mage, healer, captain, engineer, mason, scout }
// representing how many recruits of each class arrive this off-season.
function computeSlots(gameState) {
  const { buildings, roster } = gameState;
  const slots = {
    warrior: 0, archer: 0, mage: 0, healer: 0,
    captain: 0, engineer: 0, mason: 0, scout: 0,
  };

  // Barracks — shared warrior/archer pool
  const barracksCap = buildings.barracks * BARRACKS_SLOTS_PER_LEVEL;
  const warriors    = countClass(roster, 'warrior');
  const archers     = countClass(roster, 'archer');
  const barracksEmpty = Math.max(0, barracksCap - warriors - archers);
  if (barracksEmpty > 0) {
    const split = splitPair(warriors, archers, barracksCap, barracksEmpty);
    slots.warrior = split.a;
    slots.archer  = split.b;
  }

  // Library — shared mage/healer pool.
  // Library enables both classes; Mage Workshop and Hospital are performance upgrades only.
  const libCap   = buildings.library * LIBRARY_SLOTS_PER_LEVEL;
  const mages    = countClass(roster, 'mage');
  const healers  = countClass(roster, 'healer');
  const libEmpty = Math.max(0, libCap - mages - healers);
  if (libEmpty > 0) {
    const split = splitPair(mages, healers, libCap, libEmpty);
    slots.mage   = split.a;
    slots.healer = split.b;
  }

  // Officer Academy — one Captain slot per level (hard cap: CAPTAIN_MAX living)
  const captainCap   = Math.min(buildings.officerAcademy * OFFICER_CAPTAIN_SLOTS, CAPTAIN_MAX);
  const captainCount = countClass(roster, 'captain');
  slots.captain      = Math.max(0, captainCap - captainCount);

  // Siege Workshop — one Engineer slot per level
  const engineerCap   = buildings.siegeWorkshop * SIEGE_ENGINEER_SLOTS;
  const engineerCount = countClass(roster, 'engineer');
  slots.engineer      = Math.max(0, engineerCap - engineerCount);

  // Artisan Workshop — Mason slots
  const masonCap   = buildings.artisanWorkshop * ARTISAN_MASON_SLOTS;
  const masonCount = countClass(roster, 'mason');
  slots.mason      = Math.max(0, masonCap - masonCount);

  // Scout Academy — one Scout slot per level
  const scoutCap   = buildings.scoutAcademy * SCOUT_SLOTS_PER_LEVEL;
  const scoutCount = countClass(roster, 'scout');
  slots.scout      = Math.max(0, scoutCap - scoutCount);

  return slots;
}

// Roster-balancing split algorithm (GDD Section VI Step 2).
// Goal: after recruits arrive, each class is within ±1 of cap/2.
// a = first class current count, b = second class current count.
// totalCap = building capacity, emptySlots = slots available to fill.
// Returns { a: incomingA, b: incomingB }.
function splitPair(currentA, currentB, totalCap, emptySlots) {
  const target = Math.floor(totalCap / 2);
  const needA  = Math.max(0, target - currentA);
  const needB  = Math.max(0, target - currentB);
  const total  = needA + needB;

  if (total === 0) {
    // Both at or above target — split remaining evenly
    return { a: Math.ceil(emptySlots / 2), b: Math.floor(emptySlots / 2) };
  }
  if (total <= emptySlots) {
    // Fill to target, then distribute any leftover slots (handles odd capacities)
    const leftover = emptySlots - total;
    return { a: needA + Math.ceil(leftover / 2), b: needB + Math.floor(leftover / 2) };
  }
  // More need than empty slots — scale proportionally
  const a = Math.round((needA / total) * emptySlots);
  return { a, b: emptySlots - a };
}

// ── Name generation ───────────────────────────────────────────────────────────

function generateName(gender, unitClass, usedNames) {
  const firstPool = gender === 'male' ? MALE_NAMES : FEMALE_NAMES;
  const lastPool  = SURNAMES[unitClass] ?? SURNAMES.warrior;

  // Shuffle first names to avoid always trying the same order
  const firsts = [...firstPool].sort(() => Math.random() - 0.5);

  for (const first of firsts) {
    const lasts = [...lastPool].sort(() => Math.random() - 0.5);
    for (const last of lasts) {
      const full = `${first} ${last}`;
      if (!usedNames.has(full)) {
        usedNames.add(full);
        return { firstName: first, lastName: last, name: full };
      }
    }
  }
  // Practically impossible with 50×25=1,250 combos per class (GDD edge case note)
  const fallback = `${pick(firstPool)} ${pick(lastPool)}`;
  return { firstName: fallback.split(' ')[0], lastName: fallback.split(' ')[1], name: fallback };
}

// ── Bio selection ─────────────────────────────────────────────────────────────

function selectBio(gender, age) {
  const key = `${age}${gender.charAt(0).toUpperCase() + gender.slice(1)}`; // e.g. 'youngMale'
  const pool = BIOS[key] ?? BIOS.youngMale;
  return pick(pool);
}

// ── Single recruit generation ─────────────────────────────────────────────────

function generateOne(unitClass, gameState) {
  // Portrait determines gender and age
  const category = getPortraitCategory(unitClass);
  const portrait = drawPortrait(gameState.portraitDecks, category);
  const { gender, age } = portrait;

  const { firstName, lastName, name } = generateName(gender, unitClass, gameState.usedNames);
  const bio = selectBio(gender, age);
  const id  = gameState._nextUnitId++;

  return {
    id,
    name,
    firstName,
    lastName,
    class:         unitClass,
    gender,
    age,
    portraitId:    portrait.id,
    bio,
    level:         1,
    xp:            0,
    yearOfService: 0,
    assignment:    null,
    isNewRecruit:  true,
    hpBonus:       Math.floor(Math.random() * 5) + 1,  // 1–5 personal HP variance
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

// Initialize portrait decks on first call (start of a new campaign).
function ensurePortraitDecks(gameState) {
  if (!gameState.portraitDecks) {
    gameState.portraitDecks = buildPortraitDecks();
  }
}

// Generates the starting roster: 3 level-2 archers and 1 level-3 warrior.
// Each unit receives a random survivor greeting drawn from their class pool.
// Call once at campaign start, before the Year 1 off-season wizard.
export function generateStarterRoster(gameState) {
  ensurePortraitDecks(gameState);

  const specs = [
    { cls: 'archer',  level: 2, xp: 5  },
    { cls: 'archer',  level: 2, xp: 5  },
    { cls: 'archer',  level: 2, xp: 5  },
    { cls: 'warrior', level: 3, xp: 10 },
  ];

  const starters = specs.map(({ cls, level, xp }) => {
    const unit = generateOne(cls, gameState);
    unit.level         = level;
    unit.xp            = xp;
    unit.yearOfService = 1;
    unit.isNewRecruit  = false;
    unit.greeting      = pickSurvivorGreeting(cls);
    return unit;
  });

  gameState.roster.push(...starters);
  return starters;
}

// Generate all recruits for this off-season. Mutates gameState.roster and
// gameState.usedNames. Returns the array of newly generated unit objects.
export function generateRecruits(gameState) {
  ensurePortraitDecks(gameState);

  const slotCounts = computeSlots(gameState);
  const newRecruits = [];

  for (const [cls, count] of Object.entries(slotCounts)) {
    for (let i = 0; i < count; i++) {
      newRecruits.push(generateOne(cls, gameState));
    }
  }

  // Mark existing roster units as no longer new before adding fresh arrivals
  for (const unit of gameState.roster) {
    unit.isNewRecruit = false;
  }

  gameState.roster.push(...newRecruits);
  return newRecruits;
}
