export const BUILDING_DEFS = {
  barracks: {
    maxLevel: 5, baseCost: 200,
    unlocks: ['warrior'],
    description: '+10 soldier capacity (Warriors & Archers)',
  },
  archeryRange: {
    maxLevel: 5, baseCost: 150,
    requires: ['barracks'],
    unlocks: ['archer'],
    bonus: { type: 'atkSpeed', unit: ['archer'], perLevel: -0.2 },
    description: '-0.2s attack interval per level (Archers)',
  },
  sparringGround: {
    maxLevel: 5, baseCost: 150,
    requires: ['barracks'],
    bonus: { type: 'atkSpeed', unit: ['warrior', 'captain'], perLevel: -0.2 },
    description: '-0.2s attack interval per level (Warriors & Captains)',
  },
  officerAcademy: {
    maxLevel: 5, baseCost: 200,
    requires: ['sparringGround'],
    unlocks: ['captain'],
    description: '+1 Captain capacity per level (max 5)',
  },
  monument: {
    maxLevel: 3, baseCost: 300,
    requires: ['officerAcademy'],
    description: 'All units attack 0.1s faster per hero inscribed. +5 hero cap per level (Lv1: up to 5, Lv2: 10, Lv3: 15).',
  },
  scoutAcademy: {
    maxLevel: 3, baseCost: 100,
    requires: ['archeryRange'],
    unlocks: ['scout'],
    description: '+1 Scout per level. Reveals enemy composition before battle.',
  },
  library: {
    maxLevel: 5, baseCost: 200,
    description: '+5 capacity (Mages & Healers)',
  },
  mageWorkshop: {
    maxLevel: 5, baseCost: 150,
    requires: ['library'],
    unlocks: ['mage'],
    bonus: { type: 'atkSpeed', unit: ['mage'], perLevel: -0.5 },
    description: '-0.5s attack interval per level (Mages)',
  },
  hospital: {
    maxLevel: 5, baseCost: 150,
    requires: ['library'],
    bonus: { type: 'healInterval', unit: ['healer'], perLevel: -1.0 },
    description: '-1.0s heal interval per level (Healers)',
  },
  artisanWorkshop: {
    maxLevel: 5, baseCost: 100,
    description: 'Auto-repairs 50 HP per wall segment per level before each battle. Required for manual wall repairs and craft buildings.',
  },
  armory: {
    maxLevel: 5, baseCost: 250,
    requires: ['artisanWorkshop'],
    bonus: { type: 'armor', unit: 'all', perLevel: 0.07 },
    description: '+7% armor per level (all units, additive)',
  },
  weaponsmith: {
    maxLevel: 5, baseCost: 250,
    requires: ['artisanWorkshop'],
    bonus: { type: 'dmg', unit: ['warrior', 'archer', 'captain'], perLevel: 0.10 },
    description: '+10% DMG per level (Warriors, Archers, Captains)',
  },
  siegeWorkshop: {
    maxLevel: 5, baseCost: 200,
    requires: ['archeryRange', 'artisanWorkshop'],
    unlocks: ['engineer'],
    description: '+1 Engineer capacity per level',
  },
};
