// Enemy compositions by year.  Each year has 3 options (A=0, B=1, C=2).
// Unit key — type strings match ENEMY_DEFS keys: orc, goblin, ogre, general, catapult
// Logic key: left_after_delay | center_after_delay | right_after_delay | wait_for_breach
// (timer-based logics deploy at ENEMY_RESERVE_DEPLOY_S seconds OR on any breach)

export const ENEMY_COMPOSITIONS = {
  1: [
    // ── Year 1 / Option A ──────────────────────────────────────────
    {
      left:   [{ type: 'orc',     count:  5 }],
      center: [{ type: 'goblin',  count: 10 }, { type: 'general', count: 1 }],
      right:  [{ type: 'orc',     count:  5 }],
      reserves: [
        { slot: 'left',   units: [{ type: 'goblin',  count: 5 }],                               logic: 'left_after_delay'  },
        { slot: 'center', units: [{ type: 'general', count: 1 }, { type: 'goblin', count: 3 }], logic: 'wait_for_breach'      },
        { slot: 'right',  units: [{ type: 'orc',     count: 5 }],                               logic: 'right_after_delay' },
      ],
      scoutingReport: 'Mix of orcs and goblins. No catapults or ogres.',
    },
    // ── Year 1 / Option B ──────────────────────────────────────────
    {
      left:   [{ type: 'orc',    count: 20 }],
      center: [{ type: 'goblin', count: 10 }],
      right:  [{ type: 'orc',   count: 1 }, { type: 'goblin', count: 1 }],
      reserves: [
        { slot: 'left',   units: [{ type: 'general', count: 1 }, { type: 'goblin', count: 3 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'orc',     count: 1 }],                               logic: 'left_after_delay' },
        { slot: 'right',  units: [{ type: 'orc',     count: 1 }],                               logic: 'wait_for_breach'    },
      ],
      scoutingReport: 'Mix of orcs and goblins. No catapults or ogres.',
    },
    // ── Year 1 / Option C ──────────────────────────────────────────
    {
      left:   [{ type: 'orc',    count:  1 }, { type: 'goblin', count:  1 }],
      center: [{ type: 'goblin', count: 10 }, { type: 'general', count: 1 }],
      right:  [{ type: 'orc',   count: 20 }],
      reserves: [
        { slot: 'left',   units: [{ type: 'goblin',  count: 1 }],                               logic: 'wait_for_breach'     },
        { slot: 'center', units: [{ type: 'goblin',  count: 1 }],                               logic: 'right_after_delay' },
        { slot: 'right',  units: [{ type: 'general', count: 1 }, { type: 'goblin', count: 3 }], logic: 'right_after_delay' },
      ],
      scoutingReport: 'Mix of orcs and goblins. No catapults or ogres.',
    },
  ],

  2: [
    // ── Year 2 / Option A ──────────────────────────────────────────
    {
      left:   [{ type: 'orc',     count:  5 }],
      center: [{ type: 'goblin',  count: 10 }, { type: 'general', count: 1 }],
      right:  [{ type: 'orc',     count:  5 }],
      reserves: [
        { slot: 'left',   units: [{ type: 'goblin',  count: 7 }],                               logic: 'left_after_delay'  },
        { slot: 'center', units: [{ type: 'general', count: 1 }, { type: 'goblin', count: 5 }], logic: 'wait_for_breach'      },
        { slot: 'right',  units: [{ type: 'orc',     count: 7 }],                               logic: 'right_after_delay' },
      ],
      scoutingReport: 'Mix of orcs and goblins. No catapults or ogres.',
    },
    // ── Year 2 / Option B ──────────────────────────────────────────
    {
      left:   [{ type: 'orc',    count: 20 }],
      center: [{ type: 'goblin', count: 10 }],
      right:  [{ type: 'orc',   count: 1 }, { type: 'goblin', count: 1 }],
      reserves: [
        { slot: 'left',   units: [{ type: 'general', count: 1 }, { type: 'goblin', count: 3 }, { type: 'orc', count: 2 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'orc',     count: 3 }],                                                          logic: 'left_after_delay' },
        { slot: 'right',  units: [{ type: 'orc',     count: 3 }],                                                          logic: 'wait_for_breach'    },
      ],
      scoutingReport: 'Mix of orcs and goblins. No catapults or ogres.',
    },
    // ── Year 2 / Option C ──────────────────────────────────────────
    {
      left:   [{ type: 'orc',    count:  1 }, { type: 'goblin', count:  1 }],
      center: [{ type: 'goblin', count: 10 }, { type: 'general', count: 1 }],
      right:  [{ type: 'orc',   count: 20 }],
      reserves: [
        { slot: 'left',   units: [{ type: 'goblin',  count: 3 }],                                                          logic: 'wait_for_breach'     },
        { slot: 'center', units: [{ type: 'orc',     count: 3 }],                                                          logic: 'right_after_delay' },
        { slot: 'right',  units: [{ type: 'general', count: 1 }, { type: 'goblin', count: 3 }, { type: 'orc', count: 2 }], logic: 'right_after_delay' },
      ],
      scoutingReport: 'Mix of orcs and goblins. No catapults or ogres.',
    },
  ],

  3: [
    // ── Year 3 / Option A ──────────────────────────────────────────
    {
      left:   [{ type: 'orc',    count:  5 }],
      center: [{ type: 'goblin', count: 10 }, { type: 'orc', count: 10 }],
      right:  [{ type: 'orc',   count:  5 }],
      reserves: [
        { slot: 'left',   units: [{ type: 'goblin',  count: 7 }],                               logic: 'left_after_delay'  },
        { slot: 'center', units: [{ type: 'general', count: 1 }, { type: 'goblin', count: 5 }], logic: 'wait_for_breach'      },
        { slot: 'right',  units: [{ type: 'orc',     count: 7 }],                               logic: 'right_after_delay' },
      ],
      scoutingReport: 'Mix of orcs and goblins. No catapults or ogres.',
    },
    // ── Year 3 / Option B ──────────────────────────────────────────
    {
      left:   [{ type: 'orc',    count: 20 }, { type: 'general', count: 1 }],
      center: [{ type: 'goblin', count: 10 }, { type: 'ogre',    count: 1 }],
      right:  [{ type: 'orc',   count:  1 }, { type: 'goblin',   count: 1 }],
      reserves: [
        { slot: 'left',   units: [{ type: 'general', count: 1 }, { type: 'goblin', count: 3 }, { type: 'orc', count: 2 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'orc',     count: 3 }],                                                          logic: 'left_after_delay' },
        { slot: 'right',  units: [{ type: 'orc',     count: 3 }],                                                          logic: 'wait_for_breach'    },
      ],
      scoutingReport: 'Mix of orcs and goblins. And they have an ogre!',
    },
    // ── Year 3 / Option C ──────────────────────────────────────────
    {
      left:   [{ type: 'orc',    count:  1 }, { type: 'goblin', count:  1 }],
      center: [{ type: 'goblin', count: 10 }],
      right:  [{ type: 'orc',   count: 20 }, { type: 'ogre',    count:  1 }],
      reserves: [
        { slot: 'left',   units: [{ type: 'general', count: 1 }, { type: 'goblin', count: 3 }],                            logic: 'wait_for_breach'     },
        { slot: 'center', units: [{ type: 'orc',     count: 3 }, { type: 'general', count: 1 }],                           logic: 'right_after_delay' },
        { slot: 'right',  units: [{ type: 'general', count: 1 }, { type: 'goblin', count: 3 }, { type: 'orc', count: 2 }], logic: 'right_after_delay' },
      ],
      scoutingReport: 'Mix of orcs and goblins. And they have an ogre!',
    },
  ],

  4: [
    // ── Year 4 / Option A — balanced push + first catapult ────────────
    {
      left:   [{ type: 'orc',     count:  6 }, { type: 'goblin',  count: 3 }],
      center: [{ type: 'goblin',  count:  6 }, { type: 'general', count: 1 }, { type: 'catapult', count: 1 }],
      right:  [{ type: 'orc',     count:  6 }, { type: 'goblin',  count: 3 }],
      reserves: [
        { slot: 'left',   units: [{ type: 'orc',     count: 5 }],                               logic: 'left_after_delay'  },
        { slot: 'center', units: [{ type: 'ogre',    count: 1 }, { type: 'goblin', count: 3 }], logic: 'wait_for_breach'   },
        { slot: 'right',  units: [{ type: 'goblin',  count: 5 }],                               logic: 'right_after_delay' },
      ],
      scoutingReport: 'Orcs and goblins in strength — and a catapult. Watch the walls.',
    },
    // ── Year 4 / Option B — heavy left flank + catapult center ───────
    {
      left:   [{ type: 'orc',     count: 12 }, { type: 'ogre',    count: 1 }],
      center: [{ type: 'goblin',  count:  8 }, { type: 'catapult', count: 1 }],
      right:  [{ type: 'orc',     count:  5 }],
      reserves: [
        { slot: 'left',   units: [{ type: 'general', count: 1 }, { type: 'orc',    count: 5 }], logic: 'left_after_delay'  },
        { slot: 'center', units: [{ type: 'goblin',  count: 5 }],                               logic: 'center_after_delay'},
        { slot: 'right',  units: [{ type: 'orc',     count: 3 }, { type: 'general', count: 1}], logic: 'wait_for_breach'   },
      ],
      scoutingReport: 'Massive orc column on the left. Catapult in center. Hold the left wall.',
    },
    // ── Year 4 / Option C — goblin flood + catapult right ────────────
    {
      left:   [{ type: 'orc',     count:  5 }],
      center: [{ type: 'goblin',  count: 15 }, { type: 'general', count: 1 }],
      right:  [{ type: 'orc',     count:  5 }, { type: 'catapult', count: 1 }],
      reserves: [
        { slot: 'left',   units: [{ type: 'goblin',  count: 5 }],                               logic: 'wait_for_breach'   },
        { slot: 'center', units: [{ type: 'goblin',  count: 5 }, { type: 'ogre', count: 1 }],   logic: 'center_after_delay'},
        { slot: 'right',  units: [{ type: 'orc',     count: 3 }, { type: 'general', count: 1}], logic: 'right_after_delay' },
      ],
      scoutingReport: 'Goblin flood in the center. Catapult on the right. Reinforce accordingly.',
    },
  ],

  5: [
    // ── Year 5 / Option A — escalated balanced + catapult ────────────
    {
      left:   [{ type: 'orc',     count:  8 }, { type: 'goblin',  count: 5 }],
      center: [{ type: 'goblin',  count:  8 }, { type: 'general', count: 1 }, { type: 'catapult', count: 1 }],
      right:  [{ type: 'orc',     count:  8 }, { type: 'goblin',  count: 5 }, { type: 'ogre', count: 1 }],
      reserves: [
        { slot: 'left',   units: [{ type: 'goblin',  count: 5 }, { type: 'general', count: 1 }], logic: 'left_after_delay'  },
        { slot: 'center', units: [{ type: 'orc',     count: 5 }, { type: 'ogre',    count: 1 }], logic: 'wait_for_breach'   },
        { slot: 'right',  units: [{ type: 'orc',     count: 5 }],                                logic: 'right_after_delay' },
      ],
      scoutingReport: 'Full-line assault. Ogre on the right, catapult in center. Expect heavy pressure.',
    },
    // ── Year 5 / Option B — siege focus + dual ogre threat ───────────
    {
      left:   [{ type: 'orc',     count: 10 }],
      center: [{ type: 'goblin',  count:  8 }, { type: 'catapult', count: 1 }, { type: 'ogre', count: 1 }],
      right:  [{ type: 'orc',     count: 10 }, { type: 'general',  count: 2 }],
      reserves: [
        { slot: 'left',   units: [{ type: 'ogre',    count: 1 }, { type: 'orc',    count: 5 }], logic: 'left_after_delay'  },
        { slot: 'center', units: [{ type: 'goblin',  count: 5 }],                               logic: 'wait_for_breach'   },
        { slot: 'right',  units: [{ type: 'orc',     count: 3 }, { type: 'general', count: 1}], logic: 'right_after_delay' },
      ],
      scoutingReport: 'Ogre and catapult straight down the middle. Two generals on the right.',
    },
    // ── Year 5 / Option C — multi-front with catapult ────────────────
    {
      left:   [{ type: 'orc',     count:  8 }, { type: 'ogre',    count: 1 }],
      center: [{ type: 'goblin',  count: 10 }, { type: 'catapult', count: 1 }],
      right:  [{ type: 'orc',     count:  8 }, { type: 'general',  count: 2 }],
      reserves: [
        { slot: 'left',   units: [{ type: 'goblin',  count: 5 }, { type: 'general', count: 1 }], logic: 'wait_for_breach'   },
        { slot: 'center', units: [{ type: 'orc',     count: 5 }, { type: 'ogre',    count: 1 }], logic: 'center_after_delay'},
        { slot: 'right',  units: [{ type: 'goblin',  count: 5 }],                                logic: 'right_after_delay' },
      ],
      scoutingReport: 'Ogre left, catapult center, generals right. Every section under threat.',
    },
  ],
};
