import { WALL_ROW, HEALER_HEAL_RANGE } from '../data/constants.js';

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
// a wall is breached, or a player unit has crossed to the enemy side.
function playerPressureActive(playerUnits, wallSegments) {
  return wallSegments.some(w => w.isBreached) ||
         playerUnits.some(u => u.y < WALL_ROW);
}

export function findTarget(unit, allUnits, wallSegments) {
  const playerUnits = allUnits.filter(u => u.team === 'player' && !u.isDead);
  const enemyUnits  = allUnits.filter(u => u.team === 'enemy'  && !u.isDead && u.y >= 0);

  switch (unit.type) {
    case 'warrior':
    case 'captain':
      return nearest(unit, enemyUnits);

    case 'archer':
    case 'engineer': {
      const inRange = farthestInRange(unit, enemyUnits);
      return inRange ?? nearest(unit, enemyUnits);
    }

    case 'mage': {
      const elites = enemyUnits.filter(e => e.isElite);
      const nearElite = nearest(unit, elites);
      if (nearElite && tileDist(unit, nearElite) <= unit.range) return nearElite;
      const inRange = farthestInRange(unit, enemyUnits);
      return inRange ?? nearest(unit, enemyUnits);
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
      if (playerPressureActive(playerUnits, wallSegments)) {
        const inRange = farthestInRange(unit, playerUnits);
        return inRange ?? nearest(unit, playerUnits);
      }
      const activeWalls = wallSegments.filter(w => !w.isBreached);
      return activeWalls.length ? nearestWall(unit, activeWalls) : nearest(unit, playerUnits);
    }

    default:
      return null;
  }
}

export function findHealTarget(healer, allUnits) {
  const allies = allUnits.filter(u =>
    u.team === healer.team && !u.isDead && u !== healer && u.hp < u.maxHp
  );
  return lowestHpPct(healer, allies, HEALER_HEAL_RANGE);
}
