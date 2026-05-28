export const BUILDING_DEFS = {
  barracks: {
    maxLevel: 5, baseCost: 200,
    unlocks: ['warrior'],
    description: 'Trains Warriors. Required for most military buildings.',
  },
  archeryRange: {
    maxLevel: 5, baseCost: 200,
    requires: ['barracks'],
    unlocks: ['archer'],
    bonus: { type: 'atkSpeed', unit: ['archer'], perLevel: -0.2 },
    description: 'Trains Archers. Each level -0.2s attack interval.',
  },
  sparringGround: {
    maxLevel: 5, baseCost: 200,
    requires: ['barracks'],
    bonus: { type: 'atkSpeed', unit: ['warrior', 'captain'], perLevel: -0.2 },
    description: 'Each level -0.2s attack interval for Warriors and Captains.',
  },
  officerAcademy: {
    maxLevel: 5, baseCost: 200,
    requires: ['sparringGround'],
    unlocks: ['captain'],
    description: 'Unlocks Captains. Max 5 levels = max 5 Captains total.',
  },
  monument: {
    maxLevel: 1, baseCost: 200,
    requires: ['officerAcademy'],
    description: 'Tracks graduating heroes. -0.1s attack interval per hero (max 5).',
  },
  scoutAcademy: {
    maxLevel: 3, baseCost: 200,
    requires: ['archeryRange'],
    unlocks: ['scout'],
    description: 'Provides pre-battle enemy intel.',
  },
  library: {
    maxLevel: 5, baseCost: 200,
    description: 'Required for magical buildings.',
  },
  mageWorkshop: {
    maxLevel: 5, baseCost: 200,
    requires: ['library'],
    unlocks: ['mage'],
    bonus: { type: 'atkSpeed', unit: ['mage'], perLevel: -0.5 },
    description: 'Trains Mages. Each level -0.5s attack interval.',
  },
  hospital: {
    maxLevel: 5, baseCost: 200,
    requires: ['library'],
    bonus: { type: 'healInterval', unit: ['healer'], perLevel: -1.0 },
    description: 'Each level -1.0s heal interval for Healers.',
  },
  artisanWorkshop: {
    maxLevel: 5, baseCost: 200,
    description: 'Required for crafting buildings.',
  },
  armory: {
    maxLevel: 5, baseCost: 200,
    requires: ['artisanWorkshop'],
    bonus: { type: 'armor', unit: 'all', perLevel: 0.07 },
    description: 'Each level +7% armor for all player units (additive).',
  },
  weaponsmith: {
    maxLevel: 5, baseCost: 200,
    requires: ['artisanWorkshop'],
    bonus: { type: 'dmg', unit: ['warrior', 'archer', 'captain'], perLevel: 0.10 },
    description: 'Each level +10% DMG for Warriors, Archers, Captains.',
  },
  siegeWorkshop: {
    maxLevel: 5, baseCost: 200,
    requires: ['archeryRange', 'artisanWorkshop'],
    unlocks: ['engineer'],
    description: 'Trains Engineers.',
  },
  mason: {
    maxLevel: 5, baseCost: 200,
    unlocks: ['mason'],
    description: 'Each Mason repairs 50 HP of wall per off-season.',
  },
};
