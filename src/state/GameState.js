export const GameState = {
  year: 1,
  enemyCompositionIndex: 0,   // 0=A, 1=B, 2=C — set before battle start
  gold: 0,   // no carryover at campaign start; Year 1 off-season provides 100g income

  // Gold breakdown for the upcoming off-season (populated after battle ends)
  goldBreakdown: {
    base:              100,
    wallDamage:        0,
    destroyedSegments: 0,
  },

  buildings: {
    barracks:        1,   // starting building — houses Warriors & Archers
    archeryRange:    0,
    sparringGround:  0,
    officerAcademy:  0,
    monument:        0,
    scoutAcademy:    0,
    library:         0,
    mageWorkshop:    0,
    hospital:        0,
    artisanWorkshop: 0,
    armory:          0,
    weaponsmith:     0,
    siegeWorkshop:   0,
  },

  wallSegments: [
    { section: 'left',   level: 1, hp: 200, maxHp: 200 },
    { section: 'center', level: 1, hp: 200, maxHp: 200 },
    { section: 'right',  level: 1, hp: 200, maxHp: 200 },
  ],

  // Persistent unit roster. Each entry: { id, name, firstName, lastName, class,
  // gender, age, portraitId, bio, level, xp, yearOfService, assignment, injured, isNewRecruit }
  roster: [],

  // Per-playthrough uniqueness tracking
  usedNames:     new Set(),  // "FirstName LastName" strings used since campaign start
  _nextUnitId:   1,          // incremented for each unit generated

  // Portrait deck-draw state (initialized by recruitGenerator on first use)
  // Each deck: { available: [...portraitObjs], spent: [...portraitObjs] }
  portraitDecks: null,       // null until buildPortraitDecks() runs at campaign start

  // Ceremony data: populated by battle resolution before off-season begins
  fallenThisBattle:    [],   // unit objects of soldiers who died in the most recent battle
  newHeroesThisBattle: [],   // unit objects of soldiers who just completed 7 years
  // Scouts captured during the off-season join the fallen ceremony NEXT year
  capturedScouts:      [],

  sloMo: false,

  targetingPreference: {
    melee:  'default',  // warrior, captain
    ranged: 'default',  // archer, mage
    siege:  'default',  // engineer
  },

  battleResult: null,

  // ── Campaign ────────────────────────────────────────────────────────────────
  difficulty:      'easy',  // 'easy' | 'medium' | 'hard'
  campaignLength:  10,      // easy=10, medium=20, hard=30

  // Heroes who completed 7 years and chose to stay — tracked for Monument bonus
  // Each entry: { id, name, class, yearGraduated }
  graduatedHeroes: [],
};
