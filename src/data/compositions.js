// Enemy compositions by year.  Each year has 3 options (A=0, B=1, C=2).
// Unit key -- type strings match ENEMY_DEFS keys: orc, goblin, ogre, general, catapult
// Logic key: left_after_delay | center_after_delay | right_after_delay
// (timer-based logics deploy at ENEMY_RESERVE_DEPLOY_S seconds OR on any breach)
// Catapults always appear in main lane columns (never in reserves) and spawn at a fixed row.
// Ogres always appear in main lane columns (never in reserves) -- they advance immediately
// as shock troops; starting in reserve makes them arrive too late to be effective.

export const ENEMY_COMPOSITIONS = {
  1: [
    // -- Year 1 / Option A
    {
      left:   [{ type: 'orc', count: 5 }],
      center:   [{ type: 'goblin', count: 8 }, { type: 'general', count: 1 }],
      right:   [{ type: 'orc', count: 5 }],
      reserves: [
        { slot: 'left', units: [{ type: 'goblin', count: 5 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'general', count: 1 }, { type: 'goblin', count: 3 }], logic: 'center_after_delay' },
        { slot: 'right', units: [{ type: 'orc', count: 5 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "Mix of orcs and goblins.  No catapults or ogres",
    },
    // -- Year 1 / Option B
    {
      left:   [{ type: 'orc', count: 15 }],
      center:   [{ type: 'goblin', count: 6 }, { type: 'general', count: 1 }],
      right:   [{ type: 'orc', count: 1 }, { type: 'goblin', count: 1 }],
      reserves: [
        { slot: 'left', units: [{ type: 'general', count: 1 }, { type: 'goblin', count: 3 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'orc', count: 1 }], logic: 'left_after_delay' },
        { slot: 'right', units: [{ type: 'orc', count: 1 }], logic: 'center_after_delay' },
      ],
      scoutingReport: "Mix of orcs and goblins.  No catapults or ogres",
    },
    // -- Year 1 / Option C
    {
      left:   [{ type: 'orc', count: 1 }, { type: 'goblin', count: 1 }],
      center:   [{ type: 'goblin', count: 7 }, { type: 'general', count: 1 }],
      right:   [{ type: 'orc', count: 14 }],
      reserves: [
        { slot: 'left', units: [{ type: 'goblin', count: 1 }], logic: 'center_after_delay' },
        { slot: 'center', units: [{ type: 'goblin', count: 1 }], logic: 'right_after_delay' },
        { slot: 'right', units: [{ type: 'general', count: 1 }, { type: 'goblin', count: 3 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "Mix of orcs and goblins.  No catapults or ogres",
    },
  ],

  2: [
    // -- Year 2 / Option A
    {
      left:   [{ type: 'orc', count: 5 }],
      center:   [{ type: 'goblin', count: 9 }, { type: 'general', count: 1 }],
      right:   [{ type: 'orc', count: 5 }],
      reserves: [
        { slot: 'left', units: [{ type: 'goblin', count: 7 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'general', count: 1 }, { type: 'goblin', count: 5 }], logic: 'center_after_delay' },
        { slot: 'right', units: [{ type: 'orc', count: 7 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "Mix of orcs and goblins.  No catapults or ogres",
    },
    // -- Year 2 / Option B
    {
      left:   [{ type: 'orc', count: 15 }],
      center:   [{ type: 'goblin', count: 10 }, { type: 'general', count: 1 }],
      right:   [{ type: 'orc', count: 1 }, { type: 'goblin', count: 1 }],
      reserves: [
        { slot: 'left', units: [{ type: 'general', count: 1 }, { type: 'goblin', count: 3 }, { type: 'orc', count: 2 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'orc', count: 3 }], logic: 'left_after_delay' },
        { slot: 'right', units: [{ type: 'orc', count: 3 }], logic: 'center_after_delay' },
      ],
      scoutingReport: "Mix of orcs and goblins.  No catapults or ogres",
    },
    // -- Year 2 / Option C
    {
      left:   [{ type: 'orc', count: 1 }, { type: 'goblin', count: 1 }],
      center:   [{ type: 'goblin', count: 8 }, { type: 'general', count: 1 }],
      right:   [{ type: 'orc', count: 16 }],
      reserves: [
        { slot: 'left', units: [{ type: 'goblin', count: 3 }], logic: 'center_after_delay' },
        { slot: 'center', units: [{ type: 'orc', count: 3 }], logic: 'right_after_delay' },
        { slot: 'right', units: [{ type: 'general', count: 1 }, { type: 'goblin', count: 3 }, { type: 'orc', count: 2 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "Mix of orcs and goblins.  No catapults or ogres",
    },
  ],

  3: [
    // -- Year 3 / Option A
    {
      left:   [{ type: 'orc', count: 5 }],
      center:   [{ type: 'goblin', count: 10 }, { type: 'orc', count: 10 }, { type: 'general', count: 1 }],
      right:   [{ type: 'orc', count: 5 }],
      reserves: [
        { slot: 'left', units: [{ type: 'goblin', count: 7 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'general', count: 1 }, { type: 'goblin', count: 5 }], logic: 'center_after_delay' },
        { slot: 'right', units: [{ type: 'orc', count: 7 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "Mix of orcs and goblins.  No catapults or ogres",
    },
    // -- Year 3 / Option B
    {
      left:   [{ type: 'orc', count: 20 }, { type: 'general', count: 1 }],
      center:   [{ type: 'ogre', count: 1 }, { type: 'goblin', count: 10 }],
      right:   [{ type: 'orc', count: 1 }, { type: 'goblin', count: 1 }],
      reserves: [
        { slot: 'left', units: [{ type: 'general', count: 1 }, { type: 'goblin', count: 3 }, { type: 'orc', count: 2 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'orc', count: 3 }], logic: 'left_after_delay' },
        { slot: 'right', units: [{ type: 'orc', count: 3 }], logic: 'center_after_delay' },
      ],
      scoutingReport: "Mix of orcs and goblins.  An ogre leads the center column -- their first.",
    },
    // -- Year 3 / Option C
    {
      left:   [{ type: 'orc', count: 1 }, { type: 'goblin', count: 1 }],
      center:   [{ type: 'goblin', count: 10 }],
      right:   [{ type: 'ogre', count: 1 }, { type: 'orc', count: 20 }, { type: 'general', count: 1 }],
      reserves: [
        { slot: 'left', units: [{ type: 'goblin', count: 3 }], logic: 'center_after_delay' },
        { slot: 'center', units: [{ type: 'orc', count: 3 }, { type: 'general', count: 1 }], logic: 'right_after_delay' },
        { slot: 'right', units: [{ type: 'general', count: 1 }, { type: 'goblin', count: 3 }, { type: 'orc', count: 2 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "Mix of orcs and goblins.  An ogre spearheads the right column -- their first.",
    },
  ],

  4: [
    // -- Year 4 / Option A
    {
      left:   [{ type: 'orc', count: 8 }, { type: 'goblin', count: 5 }],
      center:   [{ type: 'ogre', count: 1 }, { type: 'goblin', count: 12 }, { type: 'general', count: 2 }],
      right:   [{ type: 'orc', count: 8 }, { type: 'goblin', count: 5 }],
      reserves: [
        { slot: 'left', units: [{ type: 'orc', count: 5 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'goblin', count: 4 }], logic: 'left_after_delay' },
        { slot: 'right', units: [{ type: 'orc', count: 5 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "A large mixed force of orcs and goblins. Two generals spotted among their ranks. An ogre leads the center column. No catapults.",
    },
    // -- Year 4 / Option B
    {
      left:   [{ type: 'ogre', count: 2 }, { type: 'orc', count: 15 }],
      center:   [{ type: 'goblin', count: 8 }, { type: 'general', count: 1 }],
      right:   [{ type: 'orc', count: 7 }],
      reserves: [
        { slot: 'left', units: [{ type: 'orc', count: 5 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'goblin', count: 3 }], logic: 'right_after_delay' },
        { slot: 'right', units: [{ type: 'goblin', count: 3 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "A heavy orc force with two ogres at the front of the left column and a general. Goblins present but outnumbered by foot soldiers.",
    },
    // -- Year 4 / Option C
    {
      left:   [{ type: 'orc', count: 5 }],
      center:   [{ type: 'goblin', count: 8 }, { type: 'general', count: 1 }],
      right:   [{ type: 'ogre', count: 2 }, { type: 'orc', count: 15 }],
      reserves: [
        { slot: 'left', units: [{ type: 'goblin', count: 4 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'goblin', count: 3 }], logic: 'left_after_delay' },
        { slot: 'right', units: [{ type: 'orc', count: 5 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "A heavy orc force with two ogres at the front of the right column and a general. Goblins present but outnumbered by foot soldiers.",
    },
  ],

  5: [
    // -- Year 5 / Option A
    {
      left:   [{ type: 'orc', count: 10 }, { type: 'goblin', count: 5 }],
      center:   [{ type: 'ogre', count: 1 }, { type: 'goblin', count: 10 }, { type: 'general', count: 1 }, { type: 'catapult', count: 1 }],
      right:   [{ type: 'orc', count: 10 }, { type: 'goblin', count: 5 }],
      reserves: [
        { slot: 'left', units: [{ type: 'orc', count: 5 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'goblin', count: 3 }], logic: 'left_after_delay' },
        { slot: 'right', units: [{ type: 'goblin', count: 5 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "A large mixed force of orcs and goblins with a general. An ogre spearheads the center. A catapult was spotted being hauled with the column.",
    },
    // -- Year 5 / Option B
    {
      left:   [{ type: 'ogre', count: 1 }, { type: 'orc', count: 18 }, { type: 'catapult', count: 1 }],
      center:   [{ type: 'goblin', count: 10 }, { type: 'general', count: 1 }],
      right:   [{ type: 'orc', count: 8 }],
      reserves: [
        { slot: 'left', units: [{ type: 'orc', count: 3 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'goblin', count: 4 }], logic: 'right_after_delay' },
        { slot: 'right', units: [{ type: 'orc', count: 4 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "A massive orc column with an ogre leading the left and a general. A catapult is moving with them -- first siege weapon confirmed.",
    },
    // -- Year 5 / Option C
    {
      left:   [{ type: 'orc', count: 8 }],
      center:   [{ type: 'ogre', count: 1 }, { type: 'goblin', count: 8 }, { type: 'general', count: 1 }, { type: 'catapult', count: 1 }],
      right:   [{ type: 'goblin', count: 20 }],
      reserves: [
        { slot: 'left', units: [{ type: 'orc', count: 4 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'goblin', count: 2 }], logic: 'left_after_delay' },
        { slot: 'right', units: [{ type: 'goblin', count: 5 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "A very large goblin contingent with orcs, an ogre leading the center, a general, and a catapult. Heavy numbers on all counts.",
    },
  ],

  6: [
    // -- Year 6 / Option A
    {
      left:   [{ type: 'ogre', count: 1 }, { type: 'orc', count: 12 }, { type: 'goblin', count: 8 }],
      center:   [{ type: 'goblin', count: 15 }, { type: 'general', count: 2 }, { type: 'catapult', count: 1 }],
      right:   [{ type: 'ogre', count: 1 }, { type: 'orc', count: 12 }, { type: 'goblin', count: 8 }],
      reserves: [
        { slot: 'left', units: [{ type: 'orc', count: 4 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'goblin', count: 3 }], logic: 'left_after_delay' },
        { slot: 'right', units: [{ type: 'orc', count: 4 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "A formidable force -- orcs, goblins, two ogres leading the flanks, two generals, and at least one catapult confirmed in the column.",
    },
    // -- Year 6 / Option B
    {
      left:   [{ type: 'orc', count: 10 }, { type: 'goblin', count: 5 }],
      center:   [{ type: 'ogre', count: 1 }, { type: 'goblin', count: 12 }, { type: 'general', count: 2 }, { type: 'catapult', count: 1 }],
      right:   [{ type: 'orc', count: 10 }, { type: 'goblin', count: 5 }],
      reserves: [
        { slot: 'left', units: [{ type: 'goblin', count: 5 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'general', count: 2 }], logic: 'left_after_delay' },
        { slot: 'right', units: [{ type: 'goblin', count: 5 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "Orcs and goblins in force, with two generals, an ogre smashing through center, and a catapult. A well-commanded army.",
    },
    // -- Year 6 / Option C
    {
      left:   [{ type: 'ogre', count: 3 }, { type: 'orc', count: 20 }],
      center:   [{ type: 'goblin', count: 10 }, { type: 'general', count: 1 }],
      right:   [{ type: 'orc', count: 5 }, { type: 'goblin', count: 5 }, { type: 'catapult', count: 1 }],
      reserves: [
        { slot: 'left', units: [{ type: 'orc', count: 5 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'goblin', count: 3 }], logic: 'right_after_delay' },
        { slot: 'right', units: [{ type: 'goblin', count: 3 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "A very large orc force -- three ogres spearheading the left flank, a general, goblins, and a catapult somewhere in the column.",
    },
  ],

  7: [
    // -- Year 7 / Option A
    {
      left:   [{ type: 'ogre', count: 2 }, { type: 'orc', count: 12 }, { type: 'goblin', count: 8 }],
      center:   [{ type: 'goblin', count: 18 }, { type: 'general', count: 2 }, { type: 'catapult', count: 1 }],
      right:   [{ type: 'ogre', count: 2 }, { type: 'orc', count: 12 }, { type: 'goblin', count: 8 }],
      reserves: [
        { slot: 'left', units: [{ type: 'orc', count: 5 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'goblin', count: 4 }], logic: 'left_after_delay' },
        { slot: 'right', units: [{ type: 'orc', count: 5 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "A large and well-balanced army. Orcs, goblins, four ogres leading the flanks, two generals, and a catapult confirmed.",
    },
    // -- Year 7 / Option B
    {
      left:   [{ type: 'ogre', count: 2 }, { type: 'orc', count: 8 }, { type: 'goblin', count: 15 }],
      center:   [{ type: 'goblin', count: 20 }, { type: 'general', count: 1 }, { type: 'catapult', count: 1 }],
      right:   [{ type: 'ogre', count: 2 }, { type: 'orc', count: 8 }, { type: 'goblin', count: 15 }],
      reserves: [
        { slot: 'left', units: [{ type: 'orc', count: 3 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'general', count: 1 }], logic: 'left_after_delay' },
        { slot: 'right', units: [{ type: 'orc', count: 3 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "Enormous goblin numbers -- the largest yet -- with orcs, four ogres charging the flanks, two generals, and a catapult in tow.",
    },
    // -- Year 7 / Option C
    {
      left:   [{ type: 'orc', count: 8 }, { type: 'goblin', count: 5 }],
      center:   [{ type: 'goblin', count: 10 }, { type: 'general', count: 1 }],
      right:   [{ type: 'ogre', count: 3 }, { type: 'orc', count: 20 }, { type: 'general', count: 1 }, { type: 'catapult', count: 1 }],
      reserves: [
        { slot: 'left', units: [{ type: 'goblin', count: 4 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'goblin', count: 3 }], logic: 'right_after_delay' },
        { slot: 'right', units: [{ type: 'orc', count: 4 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "A heavy orc and goblin force. Three ogres smashing through the right, two generals, and a catapult among them.",
    },
  ],

  8: [
    // -- Year 8 / Option A
    {
      left:   [{ type: 'ogre', count: 1 }, { type: 'orc', count: 15 }, { type: 'goblin', count: 10 }],
      center:   [{ type: 'goblin', count: 20 }, { type: 'general', count: 2 }, { type: 'catapult', count: 1 }],
      right:   [{ type: 'ogre', count: 1 }, { type: 'orc', count: 15 }, { type: 'goblin', count: 10 }],
      reserves: [
        { slot: 'left', units: [{ type: 'orc', count: 5 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'general', count: 2 }], logic: 'left_after_delay' },
        { slot: 'right', units: [{ type: 'orc', count: 5 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "A very large force -- orcs, goblins, two ogres at the vanguard of each flank, four generals, and a catapult confirmed. Expect sustained siege fire.",
    },
    // -- Year 8 / Option B
    {
      left:   [{ type: 'ogre', count: 5 }, { type: 'orc', count: 25 }, { type: 'general', count: 1 }],
      center:   [{ type: 'goblin', count: 15 }, { type: 'general', count: 1 }, { type: 'catapult', count: 1 }],
      right:   [{ type: 'orc', count: 10 }, { type: 'goblin', count: 5 }],
      reserves: [
        { slot: 'left', units: [{ type: 'orc', count: 5 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'goblin', count: 3 }], logic: 'left_after_delay' },
        { slot: 'right', units: [{ type: 'orc', count: 4 }, { type: 'goblin', count: 3 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "Overwhelming orc numbers -- five ogres at the front of the left column, two generals, with goblins and a catapult. The largest force yet.",
    },
    // -- Year 8 / Option C
    {
      left:   [{ type: 'orc', count: 8 }, { type: 'goblin', count: 5 }],
      center:   [{ type: 'ogre', count: 2 }, { type: 'goblin', count: 25 }, { type: 'general', count: 3 }, { type: 'catapult', count: 1 }],
      right:   [{ type: 'orc', count: 8 }, { type: 'goblin', count: 5 }],
      reserves: [
        { slot: 'left', units: [{ type: 'goblin', count: 3 }], logic: 'left_after_delay' },
        { slot: 'right', units: [{ type: 'goblin', count: 3 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "Orcs and a massive goblin contingent. Three generals, two ogres smashing through center, and a catapult spotted in the column.",
    },
  ],

  9: [
    // -- Year 9 / Option A
    {
      left:   [{ type: 'ogre', count: 3 }, { type: 'orc', count: 18 }, { type: 'goblin', count: 10 }],
      center:   [{ type: 'goblin', count: 20 }, { type: 'general', count: 2 }, { type: 'catapult', count: 1 }],
      right:   [{ type: 'ogre', count: 3 }, { type: 'orc', count: 18 }, { type: 'goblin', count: 10 }],
      reserves: [
        { slot: 'left', units: [{ type: 'orc', count: 5 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'general', count: 2 }], logic: 'left_after_delay' },
        { slot: 'right', units: [{ type: 'orc', count: 5 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "An enormous army. Orcs, goblins, six ogres spearheading the flanks, four generals, and a catapult. This is a major assault force.",
    },
    // -- Year 9 / Option B
    {
      left:   [{ type: 'ogre', count: 3 }, { type: 'orc', count: 10 }, { type: 'goblin', count: 20 }],
      center:   [{ type: 'goblin', count: 25 }, { type: 'general', count: 1 }, { type: 'catapult', count: 1 }],
      right:   [{ type: 'ogre', count: 3 }, { type: 'orc', count: 10 }, { type: 'goblin', count: 20 }],
      reserves: [
        { slot: 'left', units: [{ type: 'orc', count: 3 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'general', count: 2 }], logic: 'left_after_delay' },
        { slot: 'right', units: [{ type: 'orc', count: 3 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "Vast goblin numbers with a large orc contingent -- six ogres charging the flanks, three generals, and a catapult. Possibly the largest force we've ever faced.",
    },
    // -- Year 9 / Option C
    {
      left:   [{ type: 'orc', count: 8 }, { type: 'goblin', count: 8 }],
      center:   [{ type: 'goblin', count: 15 }, { type: 'general', count: 1 }, { type: 'catapult', count: 1 }],
      right:   [{ type: 'ogre', count: 5 }, { type: 'orc', count: 25 }, { type: 'general', count: 2 }, { type: 'catapult', count: 1 }],
      reserves: [
        { slot: 'left', units: [{ type: 'goblin', count: 3 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'goblin', count: 2 }], logic: 'right_after_delay' },
        { slot: 'right', units: [{ type: 'orc', count: 5 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "A large force of orcs and goblins. Five ogres leading the right column, three generals, and two catapults confirmed. They are not holding anything back.",
    },
  ],

  10: [
    // -- Year 10 / Option A
    {
      left:   [{ type: 'ogre', count: 4 }, { type: 'orc', count: 20 }, { type: 'goblin', count: 15 }],
      center:   [{ type: 'goblin', count: 25 }, { type: 'general', count: 3 }, { type: 'catapult', count: 1 }],
      right:   [{ type: 'ogre', count: 4 }, { type: 'orc', count: 20 }, { type: 'goblin', count: 15 }],
      reserves: [
        { slot: 'left', units: [{ type: 'orc', count: 5 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'general', count: 2 }], logic: 'left_after_delay' },
        { slot: 'right', units: [{ type: 'orc', count: 5 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "Everything they have. Enormous orc and goblin numbers, four ogres per flank in the vanguard, five generals, and a catapult. This is their full strength.",
    },
    // -- Year 10 / Option B
    {
      left:   [{ type: 'ogre', count: 6 }, { type: 'orc', count: 30 }, { type: 'general', count: 1 }],
      center:   [{ type: 'goblin', count: 20 }, { type: 'general', count: 2 }, { type: 'catapult', count: 1 }],
      right:   [{ type: 'ogre', count: 6 }, { type: 'orc', count: 30 }, { type: 'general', count: 1 }],
      reserves: [
        { slot: 'left', units: [{ type: 'orc', count: 5 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'general', count: 2 }], logic: 'left_after_delay' },
        { slot: 'right', units: [{ type: 'orc', count: 5 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "An overwhelming orc tide -- six ogres per flank in the vanguard, three generals per side, and a catapult. Staggering numbers.",
    },
    // -- Year 10 / Option C
    {
      left:   [{ type: 'ogre', count: 2 }, { type: 'orc', count: 15 }, { type: 'goblin', count: 10 }, { type: 'catapult', count: 1 }],
      center:   [{ type: 'goblin', count: 20 }, { type: 'general', count: 3 }, { type: 'catapult', count: 1 }],
      right:   [{ type: 'ogre', count: 2 }, { type: 'orc', count: 15 }, { type: 'goblin', count: 10 }, { type: 'catapult', count: 1 }],
      reserves: [
        { slot: 'left', units: [{ type: 'orc', count: 5 }], logic: 'left_after_delay' },
        { slot: 'center', units: [{ type: 'general', count: 2 }, { type: 'goblin', count: 3 }], logic: 'left_after_delay' },
        { slot: 'right', units: [{ type: 'orc', count: 5 }], logic: 'right_after_delay' },
      ],
      scoutingReport: "Three catapults confirmed -- the most we have ever seen. Orcs, goblins, four ogres leading the flanks, five generals. They intend to bring the walls down.",
    },
  ],

};
