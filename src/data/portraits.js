// Portrait manifest and deck-draw system.
// GDD Section VI: warrior portraits for Warrior/Archer/Captain; nonwarrior for all others.
// Deck-draw: portrait removed from available pool on assignment. Dead/departed soldiers'
// portraits are NOT returned mid-playthrough; they re-enter only when the entire category
// pool is exhausted.

function makePool(category, gender, age, count) {
  const pool = [];
  for (let n = 1; n <= count; n++) {
    pool.push({
      id:   `${category}_${gender}_${age}_${n}`,
      gender,
      age,
      file: `assets/portraits/${category}/${gender}/${age}/${category}_${gender}_${age}_portrait${n}.png`,
    });
  }
  return pool;
}

export const WARRIOR_PORTRAITS = [
  ...makePool('warrior', 'male',   'old',    7),
  ...makePool('warrior', 'male',   'young', 44),
  ...makePool('warrior', 'female', 'old',    4),
  ...makePool('warrior', 'female', 'young', 55),
];

export const NONWARRIOR_PORTRAITS = [
  ...makePool('nonwarrior', 'male',   'old',   31),
  ...makePool('nonwarrior', 'male',   'young', 14),
  ...makePool('nonwarrior', 'female', 'old',   16),
  ...makePool('nonwarrior', 'female', 'young', 41),
];

// O(1) lookup by portrait ID
export const PORTRAIT_BY_ID = Object.fromEntries(
  [...WARRIOR_PORTRAITS, ...NONWARRIOR_PORTRAITS].map(p => [p.id, p])
);

// Classes that draw from the warrior portrait pool
const WARRIOR_PORTRAIT_CLASSES = new Set(['warrior', 'archer', 'captain']);

export function getPortraitCategory(unitClass) {
  return WARRIOR_PORTRAIT_CLASSES.has(unitClass) ? 'warrior' : 'nonwarrior';
}

// Build fresh portrait decks for a new playthrough.
// available: portraits that can be drawn; spent: portraits from dead/departed soldiers.
export function buildPortraitDecks() {
  return {
    warrior:    { available: [...WARRIOR_PORTRAITS],    spent: [] },
    nonwarrior: { available: [...NONWARRIOR_PORTRAITS], spent: [] },
  };
}

// Draw one portrait from the deck for the given category. Mutates deck.
// Returns the portrait object { id, gender, age, file }.
export function drawPortrait(deck, category) {
  const pool = deck[category];
  if (pool.available.length === 0) {
    pool.available = [...pool.spent];
    pool.spent = [];
  }
  const idx = Math.floor(Math.random() * pool.available.length);
  const [portrait] = pool.available.splice(idx, 1);
  return portrait;
}

// Call when a soldier dies or departs. Their portrait waits in spent until
// the entire category pool is exhausted, at which point spent portraits re-enter.
export function returnPortraitToSpent(deck, category, portraitId) {
  const portrait = PORTRAIT_BY_ID[portraitId];
  if (portrait) deck[category].spent.push(portrait);
}
