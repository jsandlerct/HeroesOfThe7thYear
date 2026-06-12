// Computes effective unit stats for a roster unit, incorporating:
//   - Level-up stat bonuses (HP and DMG per level above 1)
//   - Building bonuses from current GameState.buildings
//   - Attack speed floor enforcement
//
// Returns a plain object shaped like a UNIT_DEFS entry — pass directly to Unit constructor.

import { UNIT_DEFS, SPECIALIZATION_DEFS } from '../data/units.js';
import { HEALER_HEAL_S, MAX_LEVEL, XP_THRESHOLDS, CRIT_CHANCE } from '../data/constants.js';
import {
  ATK_SPEED_FLOOR,
  ARMORY_ARMOR_PER_LEVEL,
  WEAPONSMITH_DMG_PER_LEVEL,
  ARCHERY_RANGE_ATK_SPEED_PER_LEVEL,
  SPARRING_GROUND_ATK_SPEED_PER_LEVEL,
  MAGE_WORKSHOP_ATK_SPEED_PER_LEVEL,
  HOSPITAL_HEAL_S_PER_LEVEL,
  MONUMENT_ATK_SPEED_PER_HERO,
  MONUMENT_HERO_CAP_PER_LEVEL,
} from '../data/constants.js';

export function computeEffectiveDef(rosterUnit, gameState) {
  const base  = UNIT_DEFS[rosterUnit.class];
  const level = rosterUnit.level ?? 1;
  const levelsUp = level - 1;
  const b = gameState.buildings;

  // Level-scaled base stats (+ personal HP variance + accumulated level-up bonuses)
  let hp       = base.hp  + (base.lvlHp  ?? 0) * levelsUp + (rosterUnit.hpBonus  ?? 0) + (rosterUnit.bonusHp  ?? 0);
  let dmg      = base.dmg + (base.lvlDmg ?? 0) * levelsUp                               + (rosterUnit.bonusDmg ?? 0);
  let armor    = base.armor ?? 0;
  let atkSpeed = base.atkSpeed;

  // Armory: +7% armor per level (all units)
  armor += (b.armory ?? 0) * ARMORY_ARMOR_PER_LEVEL;

  // Weaponsmith: +10% DMG multiplier per level (Warriors, Archers, Captains)
  if (['warrior', 'archer', 'captain'].includes(rosterUnit.class)) {
    dmg *= 1 + (b.weaponsmith ?? 0) * WEAPONSMITH_DMG_PER_LEVEL;
  }

  // Archery Range: -0.2s per level (Archers)
  if (rosterUnit.class === 'archer') {
    atkSpeed -= (b.archeryRange ?? 0) * ARCHERY_RANGE_ATK_SPEED_PER_LEVEL;
  }

  // Sparring Ground: -0.2s per level (Warriors, Captains)
  if (['warrior', 'captain'].includes(rosterUnit.class)) {
    atkSpeed -= (b.sparringGround ?? 0) * SPARRING_GROUND_ATK_SPEED_PER_LEVEL;
  }

  // Mage Workshop: -0.5s per level (Mages)
  if (rosterUnit.class === 'mage') {
    atkSpeed -= (b.mageWorkshop ?? 0) * MAGE_WORKSHOP_ATK_SPEED_PER_LEVEL;
  }

  // Monument: -0.1s per graduated hero who stayed; cap scales with monument level
  const monLevel  = b.monument ?? 0;
  const heroCap   = monLevel * MONUMENT_HERO_CAP_PER_LEVEL;
  const heroCount = Math.min((gameState.graduatedHeroes ?? []).length, heroCap);
  atkSpeed -= heroCount * MONUMENT_ATK_SPEED_PER_HERO;

  // Attack speed floor
  atkSpeed = Math.max(ATK_SPEED_FLOOR, atkSpeed);

  // Hospital: reduced heal interval for Healers
  let healInterval = HEALER_HEAL_S;
  if (rosterUnit.class === 'healer') {
    healInterval = Math.max(ATK_SPEED_FLOOR, HEALER_HEAL_S - (b.hospital ?? 0) * HOSPITAL_HEAL_S_PER_LEVEL);
  }

  // ── Specialization ─────────────────────────────────────────────────────────
  let moveSpeed  = base.moveSpeed ?? 1.5;
  let range      = base.range;
  let aoeRadius  = base.aoeRadius ?? 0;
  let isAoe      = base.isAoe ?? false;
  let auraRadius = base.auraRadius ?? 0;
  let rapidFire  = false;
  let areaHeal   = false;
  let critChance = CRIT_CHANCE;
  let color      = base.color;

  const spec = rosterUnit.specialization;
  if (spec) {
    const specPaths = SPECIALIZATION_DEFS[rosterUnit.class]?.paths ?? [];
    const specPath  = specPaths.find(p => p.id === spec);
    if (specPath) color = specPath.color;

    switch (spec) {
      case 'mounted':      moveSpeed *= 2; break;
      case 'heavy':        armor += 0.20; break;
      case 'longbow':      range += 2; break;
      case 'sharpshooter': critChance += 0.25; break;
      case 'explosive':    isAoe = true; aoeRadius = 0.75; break;
      case 'rapidfire':    rapidFire = true; break;
      case 'area':         areaHeal = true; break;
      case 'combat':       armor += 0.20; break;
      case 'inspiring':    auraRadius = 2.0; break;
      case 'heroic':       hp = Math.round(hp * 1.5); dmg = Math.round(dmg * 1.5); break;
      case 'flameshot':    aoeRadius = 1.5; break;
      case 'antisiege':    aoeRadius = 0.75; dmg = Math.round(dmg * 1.5); break;
    }
  }

  return {
    ...base,
    hp,
    dmg,
    armor,
    atkSpeed,
    healInterval,
    moveSpeed,
    range,
    aoeRadius,
    isAoe,
    auraRadius,
    rapidFire,
    areaHeal,
    critChance,
    color,
    specialization: spec ?? null,
  };
}

// Applies level-up thresholds to a plain roster unit object (no battle Unit instance needed).
// Mutates the object in place. Call after writing XP from battle.
export function applyLevelUpsToRosterUnit(unit) {
  if (!UNIT_DEFS[unit.class]) return;
  while (unit.level < MAX_LEVEL && unit.xp >= XP_THRESHOLDS[unit.level]) {
    unit.level++;
  }
}
