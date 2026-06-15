import { WallSegment } from './Wall.js';
import { Unit } from './Unit.js';
import { UNIT_DEFS } from '../data/units.js';
import { ENEMY_DEFS } from '../data/enemies.js';
import { ENEMY_COMPOSITIONS } from '../data/compositions.js';
import { GameState } from '../state/GameState.js';
import { findTarget, findHealTarget, tileDist } from './targeting.js';
import { Projectile } from './Projectile.js';
import { computeEffectiveDef, applyLevelUpsToRosterUnit } from './buildingBonuses.js';
import { playMusic, fadeOutMusic, setBattleRate } from '../audio/MusicManager.js';
import {
  TILE, MAP_W, MAP_H, WALL_ROW, WALL_SECTION_W,
  COLOR_WALL_FILL,
  RESERVE_ZONE_ROWS, ENEMY_RESERVE_ROW, PLAYER_RESERVE_ROW,
  ENEMY_RESERVE_DEPLOY_S, ENEMY_RESERVE_DEPLOY_JITTER, RESERVE_ALARM_ROW,
  ATK_RANGE_BUFFER, MAX_DR, ROUT_THRESHOLD,
  CRIT_CHANCE, CRIT_MULTIPLIER,
  WALL_BREACH_DROP, SLOMOER_SCALE, NUDGE_STOP_DIST,
  ENEMY_SPAWN_ROW, ENEMY_SPAWN_SPACING, ENEMY_MOVE_DELAY,
  HEALER_XP_PER_HP, ANNOUNCE_MS,
  COUNTDOWN_STEP_MS, COUNTDOWN_FIGHT_MS,
  COLOR_ENEMY_TERRITORY, COLOR_PLAYER_TERRITORY, ALPHA_GRID,
  COLOR_ENEMY_RESERVE_ZONE, ALPHA_ENEMY_RESERVE_ZONE,
  COLOR_PLAYER_RESERVE_ZONE, ALPHA_PLAYER_RESERVE_ZONE,
  SHIELD_WALL_DURATION_S, SHIELD_WALL_ARMOR_BONUS,
} from '../data/constants.js';

export class BattleScene extends Phaser.Scene {
  constructor() { super('BattleScene'); }

  // ─────────────────────────────────────────────
  // PRELOAD
  // ─────────────────────────────────────────────
  preload() {
    for (let i = 1; i <= 5; i++) {
      this.load.svg(`sword_${i}`,     `assets/sprites/swords/sword_${i}.svg`);
      this.load.svg(`bow_${i}`,       `assets/sprites/bows/bow_${i}.svg`);
      this.load.svg(`comet_${i}`,     `assets/sprites/comets/comet_${i}.svg`);
      this.load.svg(`cross_${i}`,     `assets/sprites/crosses/cross_${i}.svg`);
      this.load.svg(`star_${i}`,      `assets/sprites/stars/star_${i}.svg`);
      this.load.svg(`trebuchet_${i}`, `assets/sprites/trebuchet/trebuchet_${i}.svg`);
    }
    this.load.svg('enemy_orc',      'assets/sprites/enemy/pickaxe.svg');
    this.load.svg('enemy_goblin',   'assets/sprites/enemy/spear.svg');
    this.load.svg('enemy_general',  'assets/sprites/enemy/skull.svg');
    this.load.svg('enemy_ogre',     'assets/sprites/enemy/ogre.svg');
    this.load.svg('enemy_catapult', 'assets/sprites/enemy/catapult.svg');

    this.load.audio('sfx_battle_start', 'assets/SFX/battle start.wav');
    this.load.audio('sfx_enemy_move',   'assets/SFX/enemy start move.wav');
    this.load.audio('sfx_melee1',       'assets/SFX/melee1.wav');
    this.load.audio('sfx_melee2',       'assets/SFX/melee2.wav');
    this.load.audio('sfx_melee3',       'assets/SFX/melee3.wav');
    this.load.audio('sfx_archer',       'assets/SFX/archer.mp3');
    this.load.audio('sfx_spear',        'assets/SFX/spear.wav');
    this.load.audio('sfx_catapult',     'assets/SFX/catapult engineer.wav');
    this.load.audio('sfx_ogre',         'assets/SFX/ogre.mp3');
    this.load.audio('sfx_orc_wall',     'assets/SFX/orc on wall.wav');
    this.load.audio('sfx_breach',       'assets/SFX/breach.wav');
    this.load.audio('sfx_retreat',      'assets/SFX/retreat.wav');
    this.load.audio('sfx_mage',         'assets/SFX/mage.wav');
    this.load.audio('sfx_heal',         'assets/SFX/heal.wav');
  }

  // ─────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────
  create() {
    this.units       = [];
    this.walls       = [];
    this.projectiles = [];
    this.battleOver      = false;
    this.countdownActive = true;
    this.startingEnemyCount       = 0;
    this.startingActiveEnemyCount = 0;
    this.battleTime      = 0;
    this.playerReserve   = [];
    this.enemyReserve    = [];
    this._alarmTriggered       = false;
    this._routTriggered        = false;
    this._enemyMoveStarted     = false;
    this._catapultRushTriggered = false;  // set once when only catapults remain
    GameState.battleResult     = null;   // reset from prior battle so tactic buttons work
    // Randomize enemy reserve deploy time ±JITTER seconds so each battle feels different.
    // All slots share the same value so the entire reserve wave deploys together.
    this._reserveDeployTime = ENEMY_RESERVE_DEPLOY_S +
      (Math.random() * 2 - 1) * ENEMY_RESERVE_DEPLOY_JITTER;
    this._deployMenu     = null;

    this._buildMap();
    this._buildReserveZones();
    this._buildWalls();
    this._spawnPlayerUnits();
    this._spawnEnemies();
    this._deduplicatePositions();
    this._buildUI();

    this.startingEnemyCount       = this.units.filter(u => u.team === 'enemy').length;
    this.startingActiveEnemyCount = this.units.filter(u => u.team === 'enemy' && !u.isInReserve).length;

    this._tacticHandler = (e) => {
      if (!this.battleOver && !this.countdownActive) this._activateTactic(e.detail.key);
    };
    document.addEventListener('activateTactic', this._tacticHandler);

    this._sfx('sfx_battle_start');
    this._startCountdown();

    const rendererType = this.game.renderer.type === Phaser.WEBGL ? 'WebGL' : 'Canvas';
    console.log(`[BattleScene] Renderer: ${rendererType} | Units spawned: ${this.units.length}`);
    if (this.game.renderer.type !== Phaser.WEBGL) {
      console.warn('[BattleScene] WARNING: WebGL not active — performance may be degraded');
    }
  }

  // ─────────────────────────────────────────────
  // MAP
  // ─────────────────────────────────────────────
  _buildMap() {
    this.add.rectangle(
      (MAP_W * TILE) / 2, (WALL_ROW * TILE) / 2,
      MAP_W * TILE, WALL_ROW * TILE, COLOR_ENEMY_TERRITORY
    ).setDepth(0);

    const playerH = (MAP_H - WALL_ROW - 1) * TILE;
    this.add.rectangle(
      (MAP_W * TILE) / 2, (WALL_ROW + 1) * TILE + playerH / 2,
      MAP_W * TILE, playerH, COLOR_PLAYER_TERRITORY
    ).setDepth(0);

    const g = this.add.graphics().setDepth(0);
    g.lineStyle(1, 0x000000, ALPHA_GRID);
    for (let col = 0; col <= MAP_W; col++) {
      g.moveTo(col * TILE, 0).lineTo(col * TILE, MAP_H * TILE);
    }
    for (let row = 0; row <= MAP_H; row++) {
      g.moveTo(0, row * TILE).lineTo(MAP_W * TILE, row * TILE);
    }
    g.strokePath();
  }

  // ─────────────────────────────────────────────
  // WALLS
  // ─────────────────────────────────────────────
  _buildWalls() {
    const defs = [
      { section: 'left',   startTile: 0 },
      { section: 'center', startTile: WALL_SECTION_W },
      { section: 'right',  startTile: WALL_SECTION_W * 2 },
    ];
    for (const d of defs) {
      const gsState = GameState.wallSegments.find(w => w.section === d.section);
      const seg = new WallSegment(d.section, d.startTile, gsState.level, gsState.hp, gsState.maxHp, this);
      this.walls.push(seg);
    }
    this._drawWallTransitions();
  }

  _drawWallTransitions() {
    const pyBottom = (WALL_ROW + 1) * TILE;

    for (let i = 0; i < this.walls.length - 1; i++) {
      const left  = this.walls[i];
      const right = this.walls[i + 1];
      const bx    = right.startTile * TILE;

      const pyLeft  = left.topTile  * TILE;
      const pyRight = right.topTile * TILE;
      if (pyLeft === pyRight) continue;

      // Ramp width equals the height difference — keeps a consistent 45° slope
      // regardless of whether the step is 1 tile (lv 1↔3) or 2 tiles (lv 1↔5).
      const rampW = Math.abs(pyLeft - pyRight);

      const g = this.add.graphics().setDepth(1);
      g.fillStyle(COLOR_WALL_FILL, 1);
      g.beginPath();

      if (pyLeft > pyRight) {
        // Right section is taller — ramp on left edge of right section
        g.moveTo(bx,          pyLeft);
        g.lineTo(bx + rampW,  pyRight);
        g.lineTo(bx + rampW,  pyBottom);
        g.lineTo(bx,          pyBottom);
      } else {
        // Left section is taller — ramp on right edge of left section
        g.moveTo(bx - rampW,  pyLeft);
        g.lineTo(bx,          pyRight);
        g.lineTo(bx,          pyBottom);
        g.lineTo(bx - rampW,  pyBottom);
      }

      g.closePath();
      g.fillPath();
    }
  }

  _wallAtX(tileX) {
    return this.walls.find(w => w.containsX(Math.floor(tileX))) ?? null;
  }

  // ─────────────────────────────────────────────
  // RESERVE ZONES
  // ─────────────────────────────────────────────
  _buildReserveZones() {
    const SECTIONS   = ['left', 'center', 'right'];
    const START_COLS = [0, WALL_SECTION_W, WALL_SECTION_W * 2];
    const zoneW = WALL_SECTION_W * TILE;
    const zoneH = RESERVE_ZONE_ROWS * TILE;

    for (let i = 0; i < 3; i++) {
      const cx = (START_COLS[i] + WALL_SECTION_W / 2) * TILE;

      // Enemy reserve — top rows
      this.add.rectangle(
        cx, (ENEMY_RESERVE_ROW + RESERVE_ZONE_ROWS / 2) * TILE,
        zoneW, zoneH, COLOR_ENEMY_RESERVE_ZONE, ALPHA_ENEMY_RESERVE_ZONE
      ).setDepth(1);
      this.enemyReserve.push({
        section: SECTIONS[i], startCol: START_COLS[i],
        units: [], deployed: false, logic: null,
      });

      // Player reserve — bottom rows
      this.add.rectangle(
        cx, (PLAYER_RESERVE_ROW + RESERVE_ZONE_ROWS / 2) * TILE,
        zoneW, zoneH, COLOR_PLAYER_RESERVE_ZONE, ALPHA_PLAYER_RESERVE_ZONE
      ).setDepth(1);
      this.playerReserve.push({
        section: SECTIONS[i], startCol: START_COLS[i],
        units: [], deployed: false, btn: null,
      });
    }
  }

  // Returns a scaled enemy def for the current year.
  _scaledEnemyDef(type) {
    const base = ENEMY_DEFS[type];
    const y    = Math.max(0, GameState.year - 1);
    const up   = base.yearUp ?? {};
    return {
      ...base,
      hp:    base.hp    + (up.hp    ?? 0) * y,
      dmg:   base.dmg   + (up.dmg   ?? 0) * y,
      armor: Math.min(0.90, base.armor + (up.armor ?? 0) * y),
    };
  }

  // unitList = [{type, count}, ...]
  _populateEnemyReserve(slotIdx, unitList, logic) {
    const slot = this.enemyReserve[slotIdx];
    slot.logic = logic;
    const flat = [];
    for (const { type, count } of unitList)
      for (let k = 0; k < count; k++) flat.push(type);
    const row1n = Math.ceil(flat.length / 2);
    for (let i = 0; i < flat.length; i++) {
      const type     = flat[i];
      const row      = i < row1n ? 0 : 1;
      const nInRow   = row === 0 ? row1n : flat.length - row1n;
      const idxInRow = row === 0 ? i : i - row1n;
      const x = slot.startCol + (idxInRow + 0.5) * (WALL_SECTION_W / nInRow);
      const y = ENEMY_RESERVE_ROW + 0.5 + row;
      const u = this._spawnUnit(type, this._scaledEnemyDef(type), 'enemy', x, y);
      u.isInReserve = true;
      u.isStationary = true;
      u.reserveSlot = slot;
      slot.units.push(u);
    }
  }

  // ─────────────────────────────────────────────
  // SPAWN HELPERS
  // ─────────────────────────────────────────────
  _spawnUnit(type, def, team, x, y) {
    const u = new Unit(type, def, team, x, y, this);
    this.units.push(u);
    return u;
  }

  _spawnPlayerUnits() {
    const roster = GameState.roster.filter(u => !u.dead && u.assignment);

    // If no roster assignments exist (e.g. launched directly from test picker without
    // going through the off-season), fall back to the Sprint 1 hardcoded composition.
    if (roster.length === 0) {
      this._spawnPlayerUnitsHardcoded();
      return;
    }

    const WALL_SECTIONS = [
      { assignKey: 'wallLeft',   section: 'left',   startCol: 0 },
      { assignKey: 'wallCenter', section: 'center', startCol: WALL_SECTION_W },
      { assignKey: 'wallRight',  section: 'right',  startCol: WALL_SECTION_W * 2 },
    ];
    const RESERVE_SLOTS = [
      { assignKey: 'reserveLeft',   slotIdx: 0 },
      { assignKey: 'reserveCenter', slotIdx: 1 },
      { assignKey: 'reserveRight',  slotIdx: 2 },
    ];
    const ENGINEER_SLOTS = [
      { assignKey: 'engineerLeft',   startCol: 0 },
      { assignKey: 'engineerCenter', startCol: WALL_SECTION_W },
      { assignKey: 'engineerRight',  startCol: WALL_SECTION_W * 2 },
    ];

    const engineerY    = WALL_ROW + 2.5;  // engineers: midway between wall (row 12) and reserves (rows 14-15)

    // ── Wall units ────────────────────────────────────────────────────────────
    for (const ws of WALL_SECTIONS) {
      const seg   = this.walls.find(w => w.section === ws.section);
      const wallY    = seg.topTile + 0.5;  // front face of wall (advances as wall levels up)
      const magWallY = seg.topTile + 1.5;  // mages stand one row behind the front
      const units = roster.filter(u => u.assignment === ws.assignKey);
      const n     = Math.max(units.length, 1);
      units.forEach((ru, k) => {
        const def = computeEffectiveDef(ru, GameState);
        if (!def) return;
        const x = ws.startCol + (k + 0.5) * (WALL_SECTION_W / n);
        const y = (ru.class === 'mage' || ru.class === 'healer') ? magWallY : wallY;
        const u = this._spawnUnit(ru.class, def, 'player', x, y);
        u.xp           = ru.xp           ?? 0;
        u.level        = ru.level        ?? 1;
        u._startLevel  = u.level;
        u.bonusHp      = ru.bonusHp      ?? 0;
        u.bonusDmg     = ru.bonusDmg     ?? 0;
        u.healXpAccum  = ru.healXpAccum  ?? 0;
        u.isStationary = true;
        u.rosterId     = ru.id;
        u.isOnWall    = true;
        u.wallSection = seg;
      });
    }

    // ── Engineer field units (midway between wall and reserves) ───────────────
    for (const es of ENGINEER_SLOTS) {
      const units = roster.filter(u => u.assignment === es.assignKey);
      const n     = Math.max(units.length, 1);
      units.forEach((ru, k) => {
        const def = computeEffectiveDef(ru, GameState);
        if (!def) return;
        const x = es.startCol + (k + 0.5) * (WALL_SECTION_W / n);
        const u = this._spawnUnit(ru.class, def, 'player', x, engineerY);
        u.xp           = ru.xp           ?? 0;
        u.level        = ru.level        ?? 1;
        u._startLevel  = u.level;
        u.bonusHp      = ru.bonusHp      ?? 0;
        u.bonusDmg     = ru.bonusDmg     ?? 0;
        u.healXpAccum  = ru.healXpAccum  ?? 0;
        u.isStationary = true;
        u.rosterId     = ru.id;
      });
    }

    // ── Reserve units ─────────────────────────────────────────────────────────
    for (const rs of RESERVE_SLOTS) {
      const slot  = this.playerReserve[rs.slotIdx];
      const units = roster.filter(u => u.assignment === rs.assignKey)
        .sort((a, b) => (a.class === 'healer' ? 1 : 0) - (b.class === 'healer' ? 1 : 0));
      const n     = units.length;
      const row1n = Math.ceil(n / 2);
      units.forEach((ru, k) => {
        const def = computeEffectiveDef(ru, GameState);
        if (!def) return;
        const row      = k < row1n ? 0 : 1;
        const nInRow   = row === 0 ? row1n : n - row1n;
        const idxInRow = row === 0 ? k : k - row1n;
        const x = slot.startCol + (idxInRow + 0.5) * (WALL_SECTION_W / Math.max(nInRow, 1));
        const y = PLAYER_RESERVE_ROW + 0.5 + row;
        const u = this._spawnUnit(ru.class, def, 'player', x, y);
        u.xp           = ru.xp           ?? 0;
        u.level        = ru.level        ?? 1;
        u._startLevel  = u.level;
        u.bonusHp      = ru.bonusHp      ?? 0;
        u.bonusDmg     = ru.bonusDmg     ?? 0;
        u.healXpAccum  = ru.healXpAccum  ?? 0;
        u.isInReserve  = true;
        u.isStationary = true;
        u.reserveSlot  = slot;
        u.rosterId     = ru.id;
        slot.units.push(u);
      });
    }
  }

  // Hardcoded Sprint 1 test composition — used when no roster assignments exist.
  _spawnPlayerUnitsHardcoded() {
    const WALL_SECTION_TYPES = ['archer', 'archer', 'archer', 'healer'];
    const SECTION_START_COLS = [0, WALL_SECTION_W, WALL_SECTION_W * 2];
    const SECTION_NAMES      = ['left', 'center', 'right'];

    for (let si = 0; si < 3; si++) {
      const seg      = this.walls.find(w => w.section === SECTION_NAMES[si]);
      const wallY    = seg.topTile + 0.5;
      const startCol = SECTION_START_COLS[si];
      const n        = WALL_SECTION_TYPES.length;
      for (let k = 0; k < n; k++) {
        const x = startCol + (k + 0.5) * (WALL_SECTION_W / n);
        const u = this._spawnUnit(WALL_SECTION_TYPES[k], UNIT_DEFS[WALL_SECTION_TYPES[k]], 'player', x, wallY);
        u.isStationary = true;
        u.isOnWall     = true;
        u.wallSection  = seg;
      }
    }

    const RESERVE_SLOT_TYPES = [
      [...Array(5).fill('warrior'), 'mage'],
      [...Array(5).fill('warrior'), 'captain', 'mage'],
      [...Array(5).fill('warrior'), 'mage'],
    ];
    for (let si = 0; si < 3; si++) {
      const slot  = this.playerReserve[si];
      const types = RESERVE_SLOT_TYPES[si];
      const n     = types.length;
      const row1n = Math.ceil(n / 2);
      for (let k = 0; k < n; k++) {
        const row      = k < row1n ? 0 : 1;
        const nInRow   = row === 0 ? row1n : n - row1n;
        const idxInRow = row === 0 ? k : k - row1n;
        const x = slot.startCol + (idxInRow + 0.5) * (WALL_SECTION_W / nInRow);
        const y = PLAYER_RESERVE_ROW + 0.5 + row;
        const u = this._spawnUnit(types[k], UNIT_DEFS[types[k]], 'player', x, y);
        u.isInReserve  = true;
        u.isStationary = true;
        u.reserveSlot  = slot;
        slot.units.push(u);
      }
    }
  }

  _spawnEnemies() {
    const comp = ENEMY_COMPOSITIONS[GameState.year];
    if (comp) {
      this._spawnFromComposition(comp[GameState.enemyCompositionIndex ?? 0]);
    } else {
      this._spawnStressTest();
    }
  }

  _spawnFromComposition(comp) {
    const LANE_COLS = [0, WALL_SECTION_W, WALL_SECTION_W * 2];
    const lanes     = [comp.left, comp.center, comp.right];

    for (let li = 0; li < 3; li++) {
      const startCol = LANE_COLS[li];
      const flat = [];
      for (const { type, count } of lanes[li])
        for (let k = 0; k < count; k++) flat.push(type);
      flat.sort((a, b) => (b === 'general' ? 1 : 0) - (a === 'general' ? 1 : 0));

      // Catapults always spawn at a fixed row just below the enemy reserve zone
      const catapults = flat.filter(t => t === 'catapult');
      const others    = flat.filter(t => t !== 'catapult');

      others.forEach((type, idx) => {
        const col = idx % WALL_SECTION_W;
        const row = Math.floor(idx / WALL_SECTION_W);
        this._spawnUnit(type, this._scaledEnemyDef(type), 'enemy',
          startCol + col + 0.5, ENEMY_SPAWN_ROW + row * ENEMY_SPAWN_SPACING);
      });

      catapults.forEach((type, ci) => {
        const x = startCol + (ci + 0.5) * (WALL_SECTION_W / Math.max(catapults.length, 1));
        this._spawnUnit(type, this._scaledEnemyDef(type), 'enemy', x, ENEMY_RESERVE_ROW + 2);
      });
    }

    for (const u of this.units) {
      if (u.team === 'enemy' && u.type !== 'ogre' && !u.isInReserve) u.moveDelay = ENEMY_MOVE_DELAY;
    }

    const SLOT_IDX = { left: 0, center: 1, right: 2 };
    for (const r of comp.reserves) {
      this._populateEnemyReserve(SLOT_IDX[r.slot], r.units, r.logic);
    }
  }

  _spawnStressTest() {
    const spread = (count, y, type) => {
      const def = this._scaledEnemyDef(type);
      for (let i = 0; i < count; i++)
        this._spawnUnit(type, def, 'enemy', (i + 0.5) * (MAP_W / count), y);
    };

    spread(5, ENEMY_RESERVE_ROW + 2, 'catapult');
    for (let row = 0; row < 5; row++)
      spread(5, ENEMY_SPAWN_ROW + 0.7 + row * 0.5, 'goblin');
    for (let row = 0; row < 5; row++)
      spread(5, ENEMY_SPAWN_ROW + 3.4 + row * 0.5, 'orc');
    spread(5, ENEMY_SPAWN_ROW + 6.3, 'ogre');

    for (const u of this.units) {
      if (u.team === 'enemy' && u.type !== 'ogre' && !u.isInReserve) u.moveDelay = ENEMY_MOVE_DELAY;
    }

    this._populateEnemyReserve(0, [{ type: 'orc',     count: 10 }], 'left_after_delay');
    this._populateEnemyReserve(1, [{ type: 'goblin',  count: 10 }], 'center_after_delay');
    this._populateEnemyReserve(2, [{ type: 'general', count:  5 }], 'center_after_delay');
  }

  // ─────────────────────────────────────────────
  // POSITION DEDUPLICATION
  // ─────────────────────────────────────────────
  _deduplicatePositions() {
    const byRow = new Map();
    for (const unit of this.units) {
      const py = Math.round(unit.y * TILE);
      if (!byRow.has(py)) byRow.set(py, []);
      byRow.get(py).push(unit);
    }
    for (const units of byRow.values()) {
      units.sort((a, b) => a.x - b.x);
      const usedPx = new Set();
      for (const unit of units) {
        let px = Math.round(unit.x * TILE);
        while (usedPx.has(px)) px++;
        usedPx.add(px);
        unit.x = px / TILE;
      }
    }
    for (const unit of this.units) unit.syncSprite();
  }

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────
  _startCountdown() {
    const W = MAP_W * TILE;
    const H = MAP_H * TILE;
    const style = {
      fontSize: '96px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 8,
    };
    const txt = this.add.text(W / 2, H / 2, '3', style)
      .setOrigin(0.5, 0.5).setDepth(20);

    this.time.delayedCall(COUNTDOWN_STEP_MS,     () => txt.setText('2'));
    this.time.delayedCall(COUNTDOWN_STEP_MS * 2, () => txt.setText('1'));
    this.time.delayedCall(COUNTDOWN_STEP_MS * 3, () => {
      txt.setText('FIGHT!').setStyle({ ...style, fontSize: '64px', color: '#ffdd44' });
      playMusic('battle');
    });
    this.time.delayedCall(COUNTDOWN_STEP_MS * 3 + COUNTDOWN_FIGHT_MS, () => {
      txt.destroy();
      this.countdownActive = false;
      document.dispatchEvent(new CustomEvent('battleReady'));
    });
  }

  // ─────────────────────────────────────────────
  _buildUI() {
    const W = MAP_W * TILE;
    this.statusText = this.add.text(W / 2, 10, '', {
      fontSize: '13px', color: '#ffffff', backgroundColor: '#00000099',
      padding: { x: 8, y: 3 },
    }).setOrigin(0.5, 0).setDepth(10);

    this.announceText = this.add.text(W / 2, MAP_H * TILE / 2 - 40, '', {
      fontSize: '22px', color: '#ffdd44', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
      wordWrap: { width: W - 32 },
      align: 'center',
    }).setOrigin(0.5, 0.5).setDepth(11).setVisible(false);

    this.timerText = this.add.text(W / 2, 6, '0:00', {
      fontSize: '16px', color: '#dddddd', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(11);

    for (const slot of this.playerReserve) {
      const cx = (slot.startCol + WALL_SECTION_W / 2) * TILE;
      const by = (PLAYER_RESERVE_ROW + 1) * TILE + 6;
      const btn = this.add.text(cx, by, `DEPLOY\n(${slot.units.length})`, {
        fontSize: '10px', color: '#88aaff',
        backgroundColor: '#00000099',
        padding: { x: 5, y: 3 },
        align: 'center',
      }).setOrigin(0.5, 0).setDepth(12).setInteractive({ useHandCursor: true });

      btn.on('pointerover',  () => { if (!slot.deployed) btn.setColor('#aaccff'); });
      btn.on('pointerout',   () => { if (!slot.deployed) btn.setColor('#88aaff'); });
      btn.on('pointerdown',  () => this._showDeployMenu(slot));
      slot.btn = btn;
    }
  }

  _showAnnouncement(msg, color) {
    this.announceText.setText(msg).setColor(color ?? '#ffdd44').setVisible(true);
    // Don't hide if the battle has already ended — _endBattle reuses this same text object
    this.time.delayedCall(ANNOUNCE_MS, () => {
      if (!this.battleOver) this.announceText.setVisible(false);
    });
  }

  // ─────────────────────────────────────────────
  // PLAYER RESERVE DEPLOY MENU
  // ─────────────────────────────────────────────
  _showDeployMenu(slot) {
    if (slot.deployed) return;
    this._hideDeployMenu();

    const W       = MAP_W * TILE;
    const x_L     = W / 4;
    const x_C     = W / 2;
    const x_R     = W * 3 / 4;
    const rowH    = 28;
    // Anchor menu inside the reserve zone (bottom of canvas) so it doesn't cover the active battlefield
    const yBase   = MAP_H * TILE - 20;
    const y_sort  = yBase - rowH * 2;
    const y_reinf = yBase - rowH;
    const y_cncl  = yBase;

    const ROWS = [
      [
        { label: 'Sortie Left',      action: 'sortie_left',      x: x_L },
        { label: 'Sortie Center',    action: 'sortie_center',    x: x_C },
        { label: 'Sortie Right',     action: 'sortie_right',     x: x_R },
      ],
      [
        { label: 'Reinforce Left',   action: 'reinforce_left',   x: x_L },
        { label: 'Reinforce Center', action: 'reinforce_center', x: x_C },
        { label: 'Reinforce Right',  action: 'reinforce_right',  x: x_R },
      ],
    ];
    const ROW_Y = [y_sort, y_reinf];

    // Dim the whole canvas behind the menu and dismiss on outside click
    const dismissZone = this.add.rectangle(W / 2, MAP_H * TILE / 2, W, MAP_H * TILE, 0x000000, 0.25)
      .setDepth(18).setInteractive();
    dismissZone.on('pointerdown', () => this._hideDeployMenu());

    const bg = this.add.rectangle(W / 2, (y_sort + y_cncl) / 2, W - 24, rowH * 3 + 8, 0x000000, 0.90)
      .setDepth(19);

    const makeBtn = (opt, y) => {
      const btn = this.add.text(opt.x, y, opt.label, {
        fontSize: '11px', color: '#ffffff',
        backgroundColor: '#1a1a1aee', padding: { x: 9, y: 5 },
      }).setOrigin(0.5, 0.5).setDepth(20).setInteractive({ useHandCursor: true });
      btn.on('pointerover',  () => btn.setColor('#ffdd44'));
      btn.on('pointerout',   () => btn.setColor('#ffffff'));
      btn.on('pointerdown',  () => { this._deployPlayerSlot(slot, opt.action); this._hideDeployMenu(); });
      return btn;
    };

    const cancel = this.add.text(x_C, y_cncl, 'Cancel', {
      fontSize: '10px', color: '#777777',
      backgroundColor: '#1a1a1aee', padding: { x: 9, y: 4 },
    }).setOrigin(0.5, 0.5).setDepth(20).setInteractive({ useHandCursor: true });
    cancel.on('pointerover',  () => cancel.setColor('#aaaaaa'));
    cancel.on('pointerout',   () => cancel.setColor('#777777'));
    cancel.on('pointerdown',  () => this._hideDeployMenu());

    this._deployMenu = [
      dismissZone,
      bg,
      ...ROWS.flatMap((row, ri) => row.map(opt => makeBtn(opt, ROW_Y[ri]))),
      cancel,
    ];
  }

  _hideDeployMenu() {
    if (!this._deployMenu) return;
    for (const item of this._deployMenu) item.destroy();
    this._deployMenu = null;
  }

  _deployPlayerSlot(slot, action) {
    if (slot.deployed) return;
    slot.deployed = true;
    if (slot.btn) slot.btn.setText('DEPLOYED').setColor('#555566').disableInteractive();

    const [mode, section] = action ? action.split('_') : ['free', null];
    const targetWall = section ? (this.walls.find(w => w.section === section) ?? null) : null;

    for (const u of slot.units) {
      if (u.isDead) continue;
      u.isInReserve  = false;
      u.isStationary = false;
      u.moveDelay    = 0;

      if (mode === 'sortie' && targetWall) {
        u.waypoint = { x: targetWall.x, y: WALL_ROW };
      } else if (mode === 'reinforce' && targetWall) {
        if (u.type === 'archer' || u.type === 'mage') {
          // Walk to their wall row; on arrival they mount the wall and become stationary
          const wallY = u.type === 'mage' ? WALL_ROW + 1.5 : WALL_ROW + 0.5;
          u.waypoint      = { x: targetWall.x, y: wallY };
          u.reinforceWall = targetWall;
        } else if (u.type === 'healer') {
          u.waypoint = { x: targetWall.x, y: targetWall.topTile + 1.5 };
        } else {
          // Warriors/Captains: hold just behind wall until breach releases them
          u.waypoint         = { x: targetWall.x, y: WALL_ROW + 1 };
          u.reinforceSection = targetWall;
        }
      }
      // 'free' (auto-release on breach): normal targeting takes over
    }
  }

  _updateStatus() {
    const alive       = this.units.filter(u => u.team === 'enemy' && !u.isDead).length;
    const total       = this.startingEnemyCount;
    const playerAlive = this.units.filter(u => u.team === 'player' && !u.isDead).length;
    this.statusText.setText(
      `Year ${GameState.year}  |  Enemies: ${alive}/${total}  |  Defenders: ${playerAlive}`
    );
    this._refreshReserveButtons();
  }

  _refreshReserveButtons() {
    for (const slot of this.playerReserve) {
      if (slot.deployed || !slot.btn) continue;
      const alive = slot.units.filter(u => !u.isDead).length;
      slot.btn.setText(`DEPLOY\n(${alive})`);
    }
  }

  // ─────────────────────────────────────────────
  // RESERVE LOGIC
  // ─────────────────────────────────────────────
  _checkReserves() {
    // Alarm: any player unit crosses into top rows — release all enemy reserves
    if (!this._alarmTriggered) {
      if (this.units.some(u => u.team === 'player' && !u.isDead && u.y < RESERVE_ALARM_ROW)) {
        this._alarmTriggered = true;
        for (const slot of this.enemyReserve) {
          if (!slot.deployed) this._deployEnemySlot(slot);
        }
        return;
      }
    }

    const anyBreached = this.walls.some(w => w.isBreached);
    for (const slot of this.enemyReserve) {
      if (slot.deployed) continue;
      if (slot.units.every(u => u.isDead)) continue;

      const trigger = anyBreached || this.battleTime >= this._reserveDeployTime;
      if (trigger) this._deployEnemySlot(slot);
    }
  }

  _deployEnemySlot(slot) {
    slot.deployed = true;
    this._sfx('sfx_enemy_move');
    const dirSection = slot.logic === 'left_after_delay'   ? 'left'
                     : slot.logic === 'center_after_delay' ? 'center'
                     : slot.logic === 'right_after_delay'  ? 'right'
                     : null;
    const targetWall = dirSection ? this.walls.find(w => w.section === dirSection) ?? null : null;
    for (const u of slot.units) {
      if (u.isDead) continue;
      u.isInReserve  = false;
      u.isStationary = false;
      u.moveDelay    = 0;
      if (targetWall) u.target = targetWall;
      if (this._routTriggered) u.isRouting = true;
    }
  }

  // ─────────────────────────────────────────────
  // UPDATE LOOP
  // ─────────────────────────────────────────────
  update(time, delta) {
    if (this.battleOver) return;
    if (this.countdownActive) {
      for (const u of this.units) if (!u.isDead) u.syncSprite();
      return;
    }
    const dt = (delta / 1000) * (GameState.sloMo ? SLOMOER_SCALE : 1);

    this.battleTime += delta / 1000;

    const mins = Math.floor(this.battleTime / 60);
    const secs = Math.floor(this.battleTime % 60).toString().padStart(2, '0');
    this.timerText.setText(`${mins}:${secs}`);

    this.units = this.units.filter(u => !u._spritesDone);

    this._tickUnits(dt);
    this._applySeparation();
    this._tickProjectiles(dt);
    this._updateAuraGlows();

    for (const u of this.units) if (!u.isDead) u.syncSprite();

    this._updateStatus();
    this._checkReserves();
    this._checkCatapultRush();
    this._checkRout();
    this._checkRoundEnd();
  }

  // ─────────────────────────────────────────────
  // AURA GLOWS
  // ─────────────────────────────────────────────
  _updateAuraGlows() {
    const providers = this.units.filter(u =>
      !u.isDead && !u.isInReserve && (u.hasCaptainAura || u.hasGeneralAura)
    );
    for (const unit of this.units) {
      if (unit.isDead || unit.isInReserve) continue;
      const inAura = providers.some(p =>
        p !== unit && p.team === unit.team && tileDist(unit, p) <= p.auraRadius
      );
      unit.setAuraGlow(inAura);
    }
  }

  // ─────────────────────────────────────────────
  // UNIT TICK
  // ─────────────────────────────────────────────
  _tickUnits(dt) {
    for (const unit of this.units) {
      if (unit.isDead || unit.isInReserve) continue;

      if (unit.isRouting) {
        unit.y -= unit.moveSpeed * dt;
        continue;
      }

      if (unit.moveDelay > 0) {
        unit.moveDelay -= dt;
        continue;
      }

      if (unit.team === 'enemy' && !this._enemyMoveStarted) {
        this._enemyMoveStarted = true;
        this._sfx('sfx_enemy_move');
      }

      // Refresh stale target
      if (unit.target && (
        unit.target.isDead ||
        (unit.target.isWall && unit.target.isBreached) ||
        (!unit.target.isWall && unit.target.y < 0) ||
        // Enemy wall targets become stale the moment player pressure is active
        (unit.team === 'enemy' && unit.target.isWall &&
          (this.walls.some(w => w.isBreached) ||
           this.units.some(u => u.team === 'player' && !u.isDead && u.y < WALL_ROW && !u.isOnWall)))
      )) {
        unit.target = null;
      }

      // Player units: clear target if it no longer matches the active targeting preference
      // (handles mid-battle preference changes and any initial mismatch)
      if (unit.target && !unit.target.isWall && unit.team === 'player') {
        const PREF_GROUP = { warrior:'melee', captain:'melee', archer:'ranged', mage:'ranged', engineer:'siege' };
        const group = PREF_GROUP[unit.type];
        const pref  = group && GameState.targetingPreference[group];
        if (pref && pref !== 'default' && unit.target.type !== pref) {
          const hasPreferred = this.units.some(u =>
            u.team === 'enemy' && !u.isDead && !u.isInReserve && u.y >= 0 && u.type === pref
          );
          if (hasPreferred) unit.target = null;
        }
      }

      // Mage: yield current non-elite target when an elite enters range (default pref only)
      if (unit.type === 'mage' && unit.target && !unit.target.isElite &&
          GameState.targetingPreference.ranged === 'default') {
        const hasEliteInRange = this.units.some(e =>
          e.team === 'enemy' && !e.isDead && !e.isInReserve && e.isElite &&
          e.y >= 0 && tileDist(unit, e) <= unit.range
        );
        if (hasEliteInRange) unit.target = null;
      }

      // Engineer: yield current non-catapult target when a catapult enters range (default pref only)
      if (unit.type === 'engineer' && unit.target && !unit.target.isWall &&
          unit.target.type !== 'catapult' &&
          GameState.targetingPreference.siege === 'default') {
        const hasCatapultInRange = this.units.some(e =>
          e.team === 'enemy' && !e.isDead && !e.isInReserve && e.type === 'catapult' &&
          e.y >= 0 && tileDist(unit, e) <= unit.range
        );
        if (hasCatapultInRange) unit.target = null;
      }

      if (!unit.target) {
        unit.target = findTarget(unit, this.units, this.walls);
      }

      // Catapults anchor as soon as they have a target in range — they always spawn
      // at the fixed forward row (ENEMY_RESERVE_ROW + 2) so no advance is needed
      if (unit.team === 'enemy' && unit.type === 'catapult' && !unit.isStationary &&
          unit.target && tileDist(unit, unit.target) <= unit.range &&
          unit.y >= ENEMY_RESERVE_ROW + 2) {
        unit.isStationary = true;
      }

      // Move toward target (non-stationary units)
      if (!unit.isStationary) {
        if (unit.waypoint) {
          const wdx = unit.waypoint.x - unit.x;
          const wdy = unit.waypoint.y - unit.y;
          const arrived = (wdx * wdx + wdy * wdy) < NUDGE_STOP_DIST * NUDGE_STOP_DIST;
          // Sortie: clear when past wall; reinforce: clear on arrival
          if (!unit.reinforceSection && (unit.y <= WALL_ROW || arrived)) {
            if (arrived && unit.reinforceWall) {
              // Archer/mage reaches the wall — mount it and become stationary
              unit.y            = unit.type === 'mage' ? WALL_ROW + 1.5 : WALL_ROW + 0.5;
              unit.isOnWall     = true;
              unit.wallSection  = unit.reinforceWall;
              unit.isStationary = true;
              unit.reinforceWall = null;
            }
            unit.waypoint = null;
          } else {
            this._nudgeToward(unit, unit.waypoint.x, unit.waypoint.y, dt);
          }
        } else if (unit.target) {
          this._moveToward(unit, unit.target, dt);
        }
      }

      // Attack timer
      unit.atkTimer -= dt;
      if (unit.atkTimer <= 0) {
        const tgt = unit.target;
        if (tgt && tileDist(unit, tgt) <= unit.range + ATK_RANGE_BUFFER) {
          if (tgt.isWall) {
            this._attackWall(unit, tgt);
          } else {
            this._attackUnit(unit, tgt);
          }
          unit.atkTimer += unit.atkSpeed;
        }
      }

      // Healer heal tick
      if (unit.isHealer) {
        unit.healTimer -= dt;
        if (unit.healTimer <= 0) {
          const healTgt = findHealTarget(unit, this.units);
          if (healTgt) {
            let totalHpRestored = healTgt.maxHp - healTgt.hp;
            healTgt.hp = healTgt.maxHp;
            healTgt.triggerHealGlow(this);

            // Area Healer: also restore allies within 0.75 tiles of the primary target
            if (unit.areaHeal) {
              const splash = this.units.filter(u =>
                u !== healTgt && u.team === 'player' && !u.isDead && !u.isInReserve &&
                u.hp < u.maxHp && tileDist(u, healTgt) <= 0.75
              );
              for (const ally of splash) {
                totalHpRestored += ally.maxHp - ally.hp;
                ally.hp = ally.maxHp;
                ally.triggerHealGlow(this);
              }
            }

            unit.statDamageHealed = (unit.statDamageHealed ?? 0) + totalHpRestored;
            unit.healXpAccum = (unit.healXpAccum ?? 0) + totalHpRestored;
            const xpEarned = Math.floor(unit.healXpAccum / HEALER_XP_PER_HP);
            if (xpEarned > 0) {
              unit.awardXp(xpEarned);
              unit.healXpAccum -= xpEarned * HEALER_XP_PER_HP;
            }
            unit.healTimer += unit.healInterval;
          }
        }
      }
    }
  }

  // ─────────────────────────────────────────────
  // MOVEMENT
  // ─────────────────────────────────────────────
  _nudgeToward(unit, tx, ty, dt) {
    const dx   = tx - unit.x;
    const dy   = ty - unit.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < NUDGE_STOP_DIST) return;
    const step = Math.min(unit.moveSpeed * dt, dist) / dist;
    unit.x += dx * step;
    unit.y += dy * step;
  }

  _moveToward(unit, target, dt) {
    const dx   = target.x - unit.x;
    const dy   = target.y - unit.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const stopDist = Math.max(unit.range, 0);
    if (dist <= stopDist) return;

    const speed = unit.moveSpeed * dt;
    const step  = Math.min(speed, dist - stopDist) / dist;
    let newX = unit.x + dx * step;
    let newY = unit.y + dy * step;

    // Wall blocks enemies only while all sections are intact — one breach compromises the line
    if (unit.team === 'enemy' && !this.walls.some(w => w.isBreached)) {
      const seg = this._wallAtX(newX);
      if (seg && newY > seg.blockY) newY = seg.blockY;
    }

    unit.x = newX;
    unit.y = newY;
  }

  // ─────────────────────────────────────────────
  // SEPARATION
  // ─────────────────────────────────────────────
  _applySeparation() {
    const units = this.units;
    for (let i = 0; i < units.length; i++) {
      const a = units[i];
      if (a.isDead || a.isStationary) continue;

      for (let j = i + 1; j < units.length; j++) {
        const b = units[j];
        if (b.isDead) continue;

        // Friendly units pass through healers freely
        if (a.team === b.team && (a.type === 'healer' || b.type === 'healer')) continue;

        const minDist = a.collisionRadius + b.collisionRadius;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 >= minDist * minDist) continue;

        const dist = dist2 > 0.0001 ? Math.sqrt(dist2) : 0;
        let nx, ny;
        if (dist > 0) {
          nx = dx / dist; ny = dy / dist;
        } else {
          nx = (i % 2 === 0) ? 1 : -1; ny = 0;
        }

        const overlap = minDist - (dist > 0 ? dist : 0);
        if (!b.isStationary) {
          const half = overlap * 0.5;
          a.x += nx * half;  a.y += ny * half;
          b.x -= nx * half;  b.y -= ny * half;
        } else {
          a.x += nx * overlap;  a.y += ny * overlap;
        }
      }

      if (a.team === 'enemy' && !this.walls.some(w => w.isBreached)) {
        const seg = this._wallAtX(a.x);
        if (seg && !seg.isBreached && a.y > seg.blockY) {
          a.y = seg.blockY;
        }
      }
    }
  }

  // ─────────────────────────────────────────────
  // COMBAT
  // ─────────────────────────────────────────────

  // Rapid-fire Mage: second valid target excluding `primaryTarget`.
  // Uses standard Mage logic: nearest elite in range, else furthest in range.
  _findSecondMageTarget(mage, primaryTarget) {
    const enemies = this.units.filter(u =>
      u.team === 'enemy' && !u.isDead && !u.isInReserve && u.y >= 0 && u !== primaryTarget
    );
    const elitesInRange = enemies.filter(e => e.isElite && tileDist(mage, e) <= mage.range);
    if (elitesInRange.length) {
      return elitesInRange.reduce((best, c) => tileDist(mage, c) < tileDist(mage, best) ? c : best);
    }
    const inRange = enemies.filter(e => tileDist(mage, e) <= mage.range);
    if (!inRange.length) return null;
    return inRange.reduce((best, c) => tileDist(mage, c) > tileDist(mage, best) ? c : best);
  }

  _getAuraBonus(attacker) {
    const auraProviders = this.units.filter(u =>
      u.team === attacker.team && !u.isDead && u !== attacker &&
      (u.hasCaptainAura || u.hasGeneralAura)
    );
    let bonus = 0;
    for (const p of auraProviders) {
      if (tileDist(attacker, p) <= p.auraRadius) bonus += p.auraDmgBonus;
    }
    return bonus;
  }

  _attackUnit(attacker, target) {
    const baseDmg = attacker.dmg * (1 + this._getAuraBonus(attacker));
    let effectiveDR = attacker.ignoresArmor
      ? (target.isOnWall && target.wallSection ? target.wallSection.getDamageReduction() : 0)
      : target.armor + (target.isOnWall && target.wallSection ? target.wallSection.getDamageReduction() : 0);
    effectiveDR = Math.min(effectiveDR, MAX_DR);
    let finalDmg = Math.max(1, Math.floor(baseDmg * (1 - effectiveDR)));

    const isCrit = attacker.team === 'player' && Math.random() < attacker.critChance;
    if (isCrit) finalDmg = Math.floor(finalDmg * CRIT_MULTIPLIER);

    if (attacker.range > 1) {
      const proj = new Projectile(attacker, target, finalDmg, this, this);
      proj.isCrit = isCrit;
      this.projectiles.push(proj);
      switch (attacker.type) {
        case 'archer':   this._sfx('sfx_archer');   break;
        case 'goblin':   this._sfx('sfx_spear');    break;
        case 'mage':     this._sfx('sfx_mage');     break;
        case 'engineer': this._sfx('sfx_catapult'); break;
        case 'catapult': this._sfx('sfx_catapult'); break;
      }

      // Rapid-fire Mage: fire a simultaneous second projectile at another valid target
      if (attacker.rapidFire && attacker.type === 'mage') {
        const secondTarget = this._findSecondMageTarget(attacker, target);
        if (secondTarget && !secondTarget.isWall) {
          const baseDmg2      = attacker.dmg * (1 + this._getAuraBonus(attacker));
          let   dr2           = attacker.ignoresArmor ? 0 : secondTarget.armor +
            (secondTarget.isOnWall && secondTarget.wallSection ? secondTarget.wallSection.getDamageReduction() : 0);
          dr2 = Math.min(dr2, MAX_DR);
          let finalDmg2 = Math.max(1, Math.floor(baseDmg2 * (1 - dr2)));
          const isCrit2 = Math.random() < attacker.critChance;
          if (isCrit2) finalDmg2 = Math.floor(finalDmg2 * CRIT_MULTIPLIER);
          const proj2 = new Projectile(attacker, secondTarget, finalDmg2, this, this);
          proj2.isCrit = isCrit2;
          this.projectiles.push(proj2);
        }
      }
    } else {
      this._applyDamage(attacker, target, finalDmg, isCrit);
      if (attacker.isAoe) this._applyAoeSplash(attacker, target, finalDmg);
      this._spawnBloodBurst(target.x * TILE, target.y * TILE, 4);
      if (attacker.type === 'ogre') this._sfx('sfx_ogre');
      else this._sfxMelee();
    }
  }

  _spawnBloodBurst(worldX, worldY, count = 4) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = (0.3 + Math.random() * 0.7) * TILE;
      const dot   = this.add.rectangle(worldX, worldY, 3, 3, 0xCC1111).setDepth(7);
      this.tweens.add({
        targets:  dot,
        x:        worldX + Math.cos(angle) * dist,
        y:        worldY + Math.sin(angle) * dist,
        alpha:    0,
        duration: 260 + Math.random() * 120,
        ease:     'Quad.easeOut',
        onComplete: () => dot.destroy(),
      });
    }
  }

  _tickProjectiles(dt) {
    for (const p of this.projectiles) p.update(dt);
    this.projectiles = this.projectiles.filter(p => !p.done);
  }

  _attackWall(attacker, wallSeg) {
    if (attacker.cannotDamageWall) return;
    const baseDmg = Math.floor(attacker.dmg * (1 + this._getAuraBonus(attacker)));
    if (attacker.range > 1) {
      this.projectiles.push(new Projectile(attacker, wallSeg, baseDmg, this, this));
      this._sfx('sfx_catapult');
    } else {
      const justBreached = wallSeg.takeDamage(baseDmg);
      if (justBreached) this._handleWallBreach(wallSeg);
      if (attacker.type === 'ogre') this._sfx('sfx_ogre');
      else this._sfxWallHit();
    }
  }

  _applyDamage(attacker, target, amount, isCrit = false) {
    target.hp -= amount;
    target.damageTaken += amount;
    target.lastAttacker = attacker;
    target.damageBy[attacker.id] = (target.damageBy[attacker.id] ?? 0) + amount;
    if (isCrit) target.triggerCritGlow(this);
    if (target.hp <= 0) {
      this._handleDeath(target);
    } else if (target.team === 'player') {
      target.statSurvivedAttacks++;
    }
  }

  _applyAoeSplash(attacker, primaryTarget, primaryDmg) {
    if (primaryTarget.isWall) return;
    const splashTargets = this.units.filter(u =>
      !u.isDead && !u.isOnWall && u !== primaryTarget &&
      u.team === primaryTarget.team &&
      tileDist(u, primaryTarget) <= attacker.aoeRadius
    );
    for (const u of splashTargets) {
      const dr  = attacker.ignoresArmor ? 0 : u.armor;
      const dmg = Math.max(1, Math.floor(primaryDmg * (1 - dr)));
      this._applyDamage(attacker, u, dmg);
    }
  }

  // ─────────────────────────────────────────────
  // DEATH & XP
  // ─────────────────────────────────────────────

  // Call after awardXp to resolve level-ups and announce reaching Veteran rank (L3).
  _applyLevelUpAndAnnounce(unit) {
    const prevLevel = unit.level;
    unit._applyLevelUps();
    if (prevLevel < 3 && unit.level >= 3) {
      const ru         = unit.rosterId != null ? GameState.roster.find(r => r.id === unit.rosterId) : null;
      const classLabel = unit.type.charAt(0).toUpperCase() + unit.type.slice(1);
      const name       = ru?.name ?? classLabel;
      this._showAnnouncement(`${name} (${classLabel}) reached Veteran rank!`, '#aaddff');
    }
  }

  _startDeathAnimation(unit) {
    // Greyscale sprite and icon via ColorMatrix postFX
    for (const obj of [unit.sprite, unit.icon]) {
      if (obj?.postFX) obj.postFX.addColorMatrix().grayscale(1);
    }
    // Fade out sprite, icon, and HP bars
    const targets = [unit.sprite, unit.icon, unit.hpBarBg, unit.hpBarFg].filter(Boolean);
    this.tweens.add({
      targets,
      alpha: 0,
      duration: 600,
      ease: 'Linear',
      onComplete: () => {
        unit.destroySprites();
        unit._spritesDone = true;
      },
    });
  }

  _handleDeath(unit) {
    unit.isDead      = true;
    unit._spritesDone = false;
    this._startDeathAnimation(unit);

    // Immediately mark the corresponding roster entry dead so battle-end XP
    // writeback doesn't need to track a dead-units list separately.
    if (unit.rosterId != null && unit.team === 'player') {
      const ru = GameState.roster.find(r => r.id === unit.rosterId);
      if (ru) {
        ru.dead     = true;
        ru.diedYear = GameState.year;
        const startLevel = unit._startLevel ?? ru.level;
        ru.xp       = unit.xp;
        ru.bonusHp  = unit.bonusHp;
        ru.bonusDmg = unit.bonusDmg;
        applyLevelUpsToRosterUnit(ru);
        if (ru.class === 'engineer') ru.level = Math.min(ru.level, startLevel + 1);
        ru.statKills           = (ru.statKills           ?? 0) + unit.statKills;
        ru.statAssists         = (ru.statAssists         ?? 0) + unit.statAssists;
        ru.statSurvivedAttacks = (ru.statSurvivedAttacks ?? 0) + unit.statSurvivedAttacks;
        ru.statDamageHealed    = (ru.statDamageHealed    ?? 0) + unit.statDamageHealed;
        ru.statOgresKilled     = (ru.statOgresKilled     ?? 0) + unit.statOgresKilled;
        ru.statGeneralsKilled  = (ru.statGeneralsKilled  ?? 0) + unit.statGeneralsKilled;
        ru.healXpAccum         = unit.healXpAccum ?? 0;
      }
    }

    const killer = unit.lastAttacker;
    if (killer && !killer.isDead) {
      const killXp = unit.isElite ? 6 : 2;
      killer.awardXp(killXp);
      if (killer.team === 'player') {
        killer.statKills++;
        if (unit.type === 'ogre')    killer.statOgresKilled++;
        if (unit.type === 'general') killer.statGeneralsKilled++;
        this._applyLevelUpAndAnnounce(killer);
      }
    }
    for (const [idStr, dmg] of Object.entries(unit.damageBy)) {
      const id = Number(idStr);
      if (killer && id === killer.id) continue;
      if (dmg / unit.maxHp >= 0.30) {
        const helper = this.units.find(u => u.id === id && !u.isDead);
        if (helper) {
          helper.awardXp(1);
          if (helper.team === 'player') {
            helper.statAssists++;
            this._applyLevelUpAndAnnounce(helper);
          }
        }
      }
    }

    if (unit.isElite && killer) {
      const eliteName  = unit.type.charAt(0).toUpperCase() + unit.type.slice(1);
      const killerClass = killer.type.charAt(0).toUpperCase() + killer.type.slice(1);
      const rosterUnit  = killer.rosterId != null
        ? GameState.roster.find(r => r.id === killer.rosterId) : null;
      const killerName  = rosterUnit?.name ?? killerClass;
      this._showAnnouncement(`${eliteName} slain by ${killerName} (${killerClass})!`, '#ffdd44');
    }
  }

  // ─────────────────────────────────────────────
  // WALL BREACH
  // ─────────────────────────────────────────────
  _handleWallBreach(seg) {
    for (const u of this.units) {
      if (u.isOnWall && u.wallSection === seg) {
        u.isOnWall    = false;
        u.isStationary = false;  // fallen wall units can now move and give chase
        u.y += WALL_BREACH_DROP;
      }
    }
    for (const u of this.units) {
      if (u.target === seg) u.target = null;
    }
    // Auto-release all undeployed player reserves on any breach
    for (const slot of this.playerReserve) {
      if (!slot.deployed) this._deployPlayerSlot(slot, null);
    }
    // Release reinforce-hold melee units waiting behind wall
    for (const u of this.units) {
      if (u.reinforceSection && !u.isDead) {
        u.waypoint = null;
        u.reinforceSection = null;
      }
    }
    this._sfx('sfx_breach');
    this._showAnnouncement(`${seg.section.toUpperCase()} WALL BREACHED!`, '#ff4444');
    if (!this._battleMusicBoosted) {
      this._battleMusicBoosted = true;
      setBattleRate(1.1);
    }
  }

  // When only catapults remain (no other active enemy units), all player melee
  // units (Warriors and Captains) sortie toward the nearest catapult.
  // Triggered once per battle when the condition first becomes true.
  _checkCatapultRush() {
    if (this._catapultRushTriggered || this._routTriggered) return;

    const activeEnemies = this.units.filter(u => u.team === 'enemy' && !u.isDead && !u.isInReserve);
    if (activeEnemies.length === 0) return;
    const onlyCatapults = activeEnemies.every(u => u.type === 'catapult');
    if (!onlyCatapults) return;

    this._catapultRushTriggered = true;
    this._showAnnouncement('Only catapults remain — charge!', '#ff8844');

    // Force-deploy all player melee reserves as sortie
    for (const slot of this.playerReserve) {
      if (!slot.deployed) {
        const hasMelee = slot.units.some(u => !u.isDead && (u.type === 'warrior' || u.type === 'captain'));
        if (hasMelee) this._deployPlayerSlot(slot, 'sortie_center');
      }
    }

    // All living wall/field melee units: clear stationary/wall state and target nearest catapult
    for (const u of this.units) {
      if (u.team !== 'player' || u.isDead || u.isInReserve) continue;
      if (u.type !== 'warrior' && u.type !== 'captain') continue;
      const nearestCat = activeEnemies.reduce((best, c) =>
        tileDist(u, c) < tileDist(u, best) ? c : best
      );
      u.target           = nearestCat;
      u.isStationary     = false;
      u.isOnWall         = false;
      u.wallSection      = null;
      u.reinforceSection = null;
      u.waypoint         = null;
    }
  }

  // ─────────────────────────────────────────────
  // ROUT & END
  // ─────────────────────────────────────────────
  _checkRout() {
    const allAlive = this.units.filter(u => u.team === 'enemy' && !u.isDead);
    const active   = allAlive.filter(u => !u.isInReserve);
    if (!active.length) return;

    if (this._routTriggered) {
      for (const u of active) if (!u.isRouting) u.isRouting = true;
      return;
    }

    const elitesAlive  = active.filter(u => u.isElite).length;  // reserve elites don't block rout
    const playerAlive  = this.units.filter(u => u.team === 'player' && !u.isDead).length;
    if (elitesAlive === 0 &&
        allAlive.length < this.startingEnemyCount * ROUT_THRESHOLD &&
        playerAlive > allAlive.length) {
      this._routTriggered = true;
      this._sfx('sfx_retreat');
      for (const u of active) u.isRouting = true;
      // Release reinforce-hold player units so they give chase
      for (const u of this.units) {
        if (u.team === 'player' && !u.isDead && !u.isInReserve && !u.isStationary) {
          u.reinforceSection = null;
          u.waypoint = null;
        }
      }
      this._showAnnouncement('ENEMY IS ROUTING!', '#44ff88');
    }
  }

  _checkRoundEnd() {
    const active = this.units.filter(u => u.team === 'enemy' && !u.isDead && !u.isInReserve);
    const allOffScreen = active.every(u => u.y < -1);
    if (active.length === 0 || allOffScreen) {
      this._endBattle('victory');
      return;
    }
    const playerAlive = this.units.filter(u => u.team === 'player' && !u.isDead).length;
    if (playerAlive === 0) {
      this._endBattle('defeat');
    }
  }

  // ─────────────────────────────────────────────
  // SFX HELPERS
  // ─────────────────────────────────────────────
  _sfx(key) {
    if (this.battleOver || !GameState.soundEnabled) return;
    if (!this.cache.audio.has(key)) return;
    this.sound.play(key);
  }

  _sfxMelee() {
    if (this.battleOver || !GameState.soundEnabled) return;
    const now = Date.now();
    this._sfxCooldowns ??= {};
    if (now - (this._sfxCooldowns.melee ?? 0) < 120) return;
    this._sfxCooldowns.melee = now;
    this.sound.play(`sfx_melee${Math.ceil(Math.random() * 3)}`);
  }

  _sfxWallHit() {
    if (this.battleOver || !GameState.soundEnabled) return;
    const now = Date.now();
    this._sfxCooldowns ??= {};
    if (now - (this._sfxCooldowns.orc_wall ?? 0) < 250) return;
    this._sfxCooldowns.orc_wall = now;
    this.sound.play('sfx_orc_wall');
  }

  // ─────────────────────────────────────────────
  // SURPRISE TACTICS
  // ─────────────────────────────────────────────
  _activateTactic(key) {
    switch (key) {
      case 'massSortie':   this._tacticMassSortie();   break;
      case 'coveringFire': this._tacticCoveringFire();  break;
      case 'barrage':      this._tacticBarrage();       break;
      case 'healingGrace': this._tacticHealingGrace();  break;
      case 'shieldWall':   this._tacticShieldWall();    break;
    }
  }

  // All non-Engineer, non-wall player units get a 50% move speed boost.
  // Deploy all reserves as sortie; release any melee units holding in Reinforce mode.
  _tacticMassSortie() {
    // Deploy undeployed reserves
    for (const slot of this.playerReserve) {
      if (!slot.deployed) this._deployPlayerSlot(slot, 'sortie_' + slot.section);
    }
    // Release melee units holding behind the wall in Reinforce mode
    for (const u of this.units) {
      if (u.team !== 'player' || u.isDead || u.isInReserve) continue;
      if (!u.reinforceSection) continue;
      if (u.type !== 'warrior' && u.type !== 'captain') continue;
      const wall = u.reinforceSection;
      u.reinforceSection = null;
      u.isStationary     = false;
      u.waypoint         = { x: wall.x, y: WALL_ROW };  // sortie north through wall
    }
    // Speed boost to all deployed non-wall non-engineer melee
    for (const u of this.units) {
      if (u.team !== 'player' || u.isDead || u.isInReserve) continue;
      if (u.isOnWall || u.type === 'engineer') continue;
      u.moveSpeed *= 1.5;
    }
    this._showAnnouncement('⚔ Mass Sortie!', '#ffdd44');
  }

  // All Archers fire one immediate free volley (does not reset attack timer).
  _tacticCoveringFire() {
    const liveEnemies = this.units.filter(e => e.team === 'enemy' && !e.isDead && !e.isInReserve && e.y >= 0);
    for (const u of this.units) {
      if (u.team !== 'player' || u.isDead || u.isInReserve) continue;
      if (u.type !== 'archer') continue;
      // Only fire at enemies actually in range — farthest in range, matching normal archer priority
      const inRange = liveEnemies.filter(e => tileDist(u, e) <= u.range + ATK_RANGE_BUFFER);
      if (!inRange.length) continue;
      const tgt = inRange.reduce((best, c) => tileDist(u, c) > tileDist(u, best) ? c : best);
      this._attackUnit(u, tgt);
    }
    this._showAnnouncement('🏹 Covering Fire!', '#ffdd44');
  }

  // All Engineers and Mages fire one immediate free shot (does not reset attack timer).
  _tacticBarrage() {
    const liveEnemies = this.units.filter(e => e.team === 'enemy' && !e.isDead && !e.isInReserve && e.y >= 0);
    for (const u of this.units) {
      if (u.team !== 'player' || u.isDead || u.isInReserve) continue;
      if (u.type !== 'engineer' && u.type !== 'mage') continue;
      const inRange = liveEnemies.filter(e => tileDist(u, e) <= u.range + ATK_RANGE_BUFFER);
      if (!inRange.length) continue;
      // findTarget honors catapult/elite priority; if it returns out-of-range, fall back to inRange[0]
      const ft = findTarget(u, this.units, this.walls);
      const tgt = (ft && !ft.isWall && inRange.includes(ft)) ? ft : inRange[0];
      this._attackUnit(u, tgt);
    }
    this._showAnnouncement('💥 Barrage!', '#ffdd44');
  }

  // All Healers immediately trigger their heal; cooldown resets to full after.
  _tacticHealingGrace() {
    const BURST_MS = 600;  // ms between burst pulses

    const firePulse = (isLast) => {
      for (const u of this.units) {
        if (u.team !== 'player' || u.isDead || u.isInReserve || !u.isHealer) continue;
        const healTgt = findHealTarget(u, this.units);
        if (healTgt) {
          let totalHpRestored = healTgt.maxHp - healTgt.hp;
          healTgt.hp = healTgt.maxHp;
          healTgt.triggerHealGlow(this);
          if (u.areaHeal) {
            const splash = this.units.filter(ally =>
              ally !== healTgt && ally.team === 'player' && !ally.isDead && !ally.isInReserve &&
              ally.hp < ally.maxHp && tileDist(ally, healTgt) <= 0.75
            );
            for (const ally of splash) {
              totalHpRestored += ally.maxHp - ally.hp;
              ally.hp = ally.maxHp;
              ally.triggerHealGlow(this);
            }
          }
          u.statDamageHealed = (u.statDamageHealed ?? 0) + totalHpRestored;
          u.healXpAccum = (u.healXpAccum ?? 0) + totalHpRestored;
          const xpEarned = Math.floor(u.healXpAccum / HEALER_XP_PER_HP);
          if (xpEarned > 0) {
            u.awardXp(xpEarned);
            u.healXpAccum -= xpEarned * HEALER_XP_PER_HP;
          }
        }
        if (isLast) u.healTimer = u.healInterval;
      }
    };

    firePulse(false);
    this.time.delayedCall(BURST_MS,     () => { if (!this.battleOver) firePulse(false); });
    this.time.delayedCall(BURST_MS * 2, () => { if (!this.battleOver) firePulse(true);  });

    this._showAnnouncement('✦ Healing Grace!', '#88ccff');
  }

  // All Warriors and Captains gain +40% armor for 10 seconds, then revert.
  _tacticShieldWall() {
    const affected = [];
    for (const u of this.units) {
      if (u.team !== 'player' || u.isDead || u.isInReserve) continue;
      if (u.type !== 'warrior' && u.type !== 'captain') continue;
      u.armor += SHIELD_WALL_ARMOR_BONUS;
      affected.push(u);
    }
    this.time.delayedCall(SHIELD_WALL_DURATION_S * 1000, () => {
      for (const u of affected) {
        if (!u.isDead) u.armor -= SHIELD_WALL_ARMOR_BONUS;
      }
    });
    this._showAnnouncement('🛡 Shield Wall!', '#ffdd44');
  }

  _endBattle(result) {
    if (this.battleOver) return;
    this.battleOver = true;
    this._hideDeployMenu();
    document.removeEventListener('activateTactic', this._tacticHandler);

    // Award "took damage" XP to surviving (non-dead) player units
    for (const u of this.units) {
      if (u.team === 'player' && !u.isDead && u.damageTaken > 0) u.awardXp(1);
    }

    // Write XP and level back to surviving roster units; track which leveled up
    GameState.leveledUpThisBattle = GameState.leveledUpThisBattle ?? [];
    for (const u of this.units) {
      if (u.team !== 'player' || u.rosterId == null) continue;
      const ru = GameState.roster.find(r => r.id === u.rosterId);
      if (!ru || ru.dead) continue;
      const startLevel = u._startLevel ?? ru.level;
      ru.xp       = u.xp;
      ru.bonusHp  = u.bonusHp;
      ru.bonusDmg = u.bonusDmg;
      applyLevelUpsToRosterUnit(ru);
      if (ru.class === 'engineer') ru.level = Math.min(ru.level, startLevel + 1);
      if (ru.level > startLevel) GameState.leveledUpThisBattle.push(ru.id);
      ru.statKills           = (ru.statKills           ?? 0) + u.statKills;
      ru.statAssists         = (ru.statAssists         ?? 0) + u.statAssists;
      ru.statSurvivedAttacks = (ru.statSurvivedAttacks ?? 0) + u.statSurvivedAttacks;
      ru.statDamageHealed    = (ru.statDamageHealed    ?? 0) + u.statDamageHealed;
      ru.statOgresKilled     = (ru.statOgresKilled     ?? 0) + u.statOgresKilled;
      ru.statGeneralsKilled  = (ru.statGeneralsKilled  ?? 0) + u.statGeneralsKilled;
      ru.healXpAccum         = u.healXpAccum ?? 0;
    }

    // Write wall HP back to GameState so off-season gold and repair screens
    // reflect actual battle damage.
    for (const wall of this.walls) {
      const seg = GameState.wallSegments.find(s => s.section === wall.section);
      if (seg) seg.hp = wall.hp;
    }

    this.sound.stopAll();
    if (result === 'victory') {
      playMusic('victory', { loop: false });
    } else {
      fadeOutMusic(1200, 'gameover');
    }

    GameState.battleResult = result;
    const msg = result === 'victory' ? 'VICTORY!' : 'DEFEAT';
    const col = result === 'victory' ? '#44ff44' : '#ff4444';
    this.announceText.setText(msg).setColor(col).setVisible(true);
    this.statusText.setText('');

    // Fire battleComplete after a short delay so the player sees the result.
    // index.html listens for this to start the off-season transition.
    this.time.delayedCall(3000, () => {
      document.dispatchEvent(new CustomEvent('battleComplete', { detail: { result } }));
    });
  }
}
