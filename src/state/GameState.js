export const GameState = {
  year: 1,
  enemyCompositionIndex: 0,   // 0=A, 1=B, 2=C — set before battle start
  gold: 100,

  buildings: {
    barracks: 1,
    archeryRange: 1,
    sparringGround: 0,
    officerAcademy: 0,
    monument: 0,
    scoutAcademy: 0,
    library: 0,
    mageWorkshop: 1,
    hospital: 0,
    artisanWorkshop: 0,
    armory: 0,
    weaponsmith: 0,
    siegeWorkshop: 1,
    mason: 0,
  },

  wallSegments: [
    { section: 'left',   level: 1, hp: 200, maxHp: 200 },
    { section: 'center', level: 1, hp: 200, maxHp: 200 },
    { section: 'right',  level: 1, hp: 200, maxHp: 200 },
  ],

  // Persistent roster between battles (Sprint 3)
  roster: [],

  battleResult: null,
};
