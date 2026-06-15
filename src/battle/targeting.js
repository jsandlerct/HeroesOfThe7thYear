import { WALL_ROW, HEALER_HEAL_RANGE } from '../data/constants.js';
import { GameState } from '../state/GameState.js';

const TARGETING_GROUP = {
  warrior: 'melee',  captain: 'melee',
  archer:  'ranged', mage:    'ranged',
  engineer: 'siege',
};

export function tileDist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function nearest(unit, candidates) {
  if (!candidates.length) return null;
  return candidates.reduce((best, c) =>
    tileDist(unit, c) < tileDist(unit, best) ? c : best
  );
}

function farthestInRange(unit, candidates) {
  const inRange = candidates.filter(c => tileDist(unit, c) <= unit.range);
  if (!inRange.length) return null;
  return inRange.reduce((best, c) =>
    tileDist(unit, c) > tileDist(unit, best) ? c : best
  );
}

function nearestWall(unit, walls) {
  if (!walls.length) return null;
  return walls.reduce((best, w) =>
    tileDist(unit, w) < tileDist(unit, best) ? w : best
  );
}

function lowestHpPct(unit, allies, range) {
  const inRange = allies.filter(a =>
    a !== unit && !a.isDead && tileDist(unit, a) <= range
  );
  if (!inRange.length) return null;
  return inRange.reduce((best, a) =>
    (a.hp / a.maxHp) < (best.hp / best.maxHp) ? a : best
  );
}

// True when enemies should switch from wall-targeting to unit-targeting:
// a wall is breached, or a player unit has crossed to the enemy side (sortie).
// Wall-mounted units are excluded — thick walls place defenders north of WALL_ROW
// but they are not "in the field"; only sortieing units trigger this.
function playerPressureActive(playerUnits, wallSegments) {
  return wallSegments.some(w => w.isBreached) ||
         playerUnits.some(u => u.y < WALL_ROW && !u.isOnWall);
}

export function findTarget(unit, allUnits, wallSegments) {
  const playerUnits    = allUnits.filter(u => u.team === 'player' && !u.isDead && !u.isInReserve);
  const allEnemyUnits  = allUnits.filter(u => u.team === 'enemy'  && !u.isDead && !u.isInReserve && u.y >= 0);
  let   enemyUnits     = allEnemyUnits;

  // Apply targeting preference override for player units.
  // Captured separately from allEnemyUnits so class-specific priority logic
  // (engineer catapults, mage elites) can always see the full enemy pool.
  if (unit.team === 'player') {
    const group = TARGETING_GROUP[unit.type];
    const pref  = group && GameState.targetingPreference[group];
    if (pref && pref !== 'default') {
      const preferred = allEnemyUnits.filter(e => e.type === pref);
      if (preferred.length) enemyUnits = preferred;
    }
  }

  switch (unit.type) {
    case 'warrior':
    case 'captain':
      return nearest(unit, enemyUnits);

    case 'archer': {
      const inRange = farthestInRange(unit, enemyUnits);
      return inRange ?? nearest(unit, enemyUnits);
    }

    case 'engineer': {
      // 1. Catapults in range — always checked against full enemy pool, immune to preference override
      const allInRange = allEnemyUnits.filter(e => tileDist(unit, e) <= unit.range);
      const catapultsInRange = allInRange.filter(e => e.type === 'catapult');
      if (catapultsInRange.length) return nearest(unit, catapultsInRange);
      // 2. Largest clump within preference-filtered pool
      const inRange = enemyUnits.filter(e => tileDist(unit, e) <= unit.range);
      if (inRange.length) {
        const aoeR = unit.aoeRadius ?? 1.5;
        return inRange.reduce((best, c) => {
          const cCount = inRange.filter(e => tileDist(c, e) <= aoeR).length;
          const bCount = inRange.filter(e => tileDist(best, e) <= aoeR).length;
          return cCount > bCount ? c : best;
        });
      }
      return nearest(unit, allEnemyUnits);
    }

    case 'mage': {
      // Elite priority checked against full pool — immune to preference override
      const elitesInRange = allEnemyUnits.filter(e => e.isElite && tileDist(unit, e) <= unit.range);
      if (elitesInRange.length) return nearest(unit, elitesInRange);
      const inRange = farthestInRange(unit, enemyUnits);
      return inRange ?? nearest(unit, allEnemyUnits);
    }

    case 'healer':
      return nearest(unit, enemyUnits.filter(e => tileDist(unit, e) <= unit.range));

    case 'orc':
    case 'ogre':
    case 'general': {
      if (playerPressureActive(playerUnits, wallSegments)) {
        return nearest(unit, playerUnits);
      }
      const activeWalls = wallSegments.filter(w => !w.isBreached);
      return activeWalls.length ? nearestWall(unit, activeWalls) : nearest(unit, playerUnits);
    }

    case 'goblin': {
      const inRange = farthestInRange(unit, playerUnits);
      return inRange ?? nearest(unit, playerUnits);
    }

    case 'catapult': {
      const activeWalls = wallSegments.filter(w => !w.isBreached);
      return activeWalls.length ? nearestWall(unit, activeWalls) : nearest(unit, playerUnits);
    }

    default:
      return null;
  }
}

export function findHealTarget(healer, allUnits) {
  const allies = allUnits.filter(u =>
    u.team === healer.team && !u.isDead && !u.isInReserve && u !== healer && u.hp < u.maxHp
  );
  return lowestHpPct(healer, allies, HEALER_HEAL_RANGE);
}
