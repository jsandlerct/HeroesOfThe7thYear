// Specialization paths per class. Each has two options unlocked at level 3.
// id: key stored on rosterUnit.specialization
// color: overrides the unit's sprite fill color in battle
export const SPECIALIZATION_DEFS = {
  warrior: {
    paths: [
      { id: 'mounted', label: 'Mounted',   desc: 'Double move speed',  color: 0x6AABFF },
      { id: 'heavy',   label: 'Heavy',     desc: 'Armor 20% → 40%',    color: 0x1A3A7A },
    ],
  },
  archer: {
    paths: [
      { id: 'longbow',      label: 'Longbow',      desc: '+2 range',                      color: 0xAAE040 },
      { id: 'sharpshooter', label: 'Sharpshooter', desc: '+25% crit chance (30% total)',  color: 0x2D6B1A },
    ],
  },
  mage: {
    paths: [
      { id: 'explosive', label: 'Explosive',  desc: 'Attacks deal AoE (0.75 tile radius)',              color: 0xCC88FF },
      { id: 'rapidfire', label: 'Rapid-fire', desc: 'Fires a second projectile at another valid target', color: 0x4A0080 },
    ],
  },
  healer: {
    paths: [
      { id: 'area',   label: 'Area',   desc: 'Heal radiates 0.75 tiles from primary target', color: 0xFFFF88 },
      { id: 'combat', label: 'Combat', desc: 'Armor 10% → 30%',                               color: 0xFFAA33 },
    ],
  },
  captain: {
    paths: [
      { id: 'inspiring', label: 'Inspiring', desc: 'Aura radius 1.5 → 2.0 tiles', color: 0xFFF0A0 },
      { id: 'heroic',    label: 'Heroic',    desc: '+50% DMG, +50% HP',            color: 0xB87333 },
    ],
  },
  engineer: {
    paths: [
      { id: 'flameshot', label: 'Flameshot',  desc: 'AoE radius +25%',              color: 0xFF3300 },
      { id: 'antisiege', label: 'Anti-siege', desc: 'AoE radius −25%, DMG +50%',    color: 0x8B3A00 },
    ],
  },
};

export const UNIT_DEFS = {
  warrior: {
    hp: 20, dmg: 5, atkSpeed: 2, range: 1, armor: 0.20,
    lvlHp: 10, lvlDmg: 3,
    moveSpeed: 1.5,
    color: 0x4472C4,
    wallUnit: false,
  },
  archer: {
    hp: 10, dmg: 3, atkSpeed: 2, range: 5, armor: 0.10,
    lvlHp: 5, lvlDmg: 2,
    moveSpeed: 1.5,
    color: 0x70AD47,
    wallUnit: true,
  },
  mage: {
    hp: 7, dmg: 7, atkSpeed: 5, range: 7, armor: 0,
    lvlHp: 3, lvlDmg: 10,
    ignoresArmor: true,
    moveSpeed: 1.5,
    color: 0x9B30FF,
    wallUnit: true,
  },
  healer: {
    hp: 10, dmg: 3, atkSpeed: 5, range: 1, armor: 0.10,
    lvlHp: 5, lvlDmg: 1,
    isHealer: true,
    moveSpeed: 1.5,
    color: 0xEEEEEE,
    wallUnit: true,
  },
  captain: {
    hp: 25, dmg: 5, atkSpeed: 2, range: 1, armor: 0.20,
    lvlHp: 15, lvlDmg: 3,
    moveSpeed: 1.5,
    hasCaptainAura: true,
    auraRadius: 1.5,
    auraDmgBonus: 0.25,
    color: 0xFFD700,
    wallUnit: false,
  },
  engineer: {
    hp: 10, dmg: 15, atkSpeed: 10, range: 11, armor: 0.10,
    lvlHp: 5, lvlDmg: 7,
    isAoe: true, aoeRadius: 1.0,
    color: 0xFF6600,
    spriteScale: 2,
    wallUnit: false, // deployed behind the wall on player side, not on it
  },
};
