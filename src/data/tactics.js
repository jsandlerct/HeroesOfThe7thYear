// Surprise Tactic definitions — V1 set (5 total).
// Each tactic is single-use and stored as a key string in GameState.tactics.

export const TACTICS = {
  massSortie: {
    key:         'massSortie',
    name:        'Mass Sortie',
    description: 'All non-Engineer units not on the wall charge forward. Reserves deploy immediately as a sortie.',
    icon:        '⚔',
  },
  coveringFire: {
    key:         'coveringFire',
    name:        'Covering Fire',
    description: 'All Archers fire one immediate free volley without consuming their attack timer.',
    icon:        '🏹',
  },
  barrage: {
    key:         'barrage',
    name:        'Barrage',
    description: 'All Engineers and Mages fire one immediate free shot without consuming their attack timer.',
    icon:        '💥',
  },
  healingGrace: {
    key:         'healingGrace',
    name:        'Healing Grace',
    description: 'All Healers immediately trigger their heal regardless of cooldown. Cooldown resets after.',
    icon:        '✦',
  },
  shieldWall: {
    key:         'shieldWall',
    name:        'Shield Wall',
    description: 'All Warriors and Captains gain +40% armor for 10 seconds.',
    icon:        '🛡',
  },
};

export const TACTIC_KEYS = Object.keys(TACTICS);
