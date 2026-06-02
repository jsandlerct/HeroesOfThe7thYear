import { WallSegment } from './Wall.js';
import { Unit } from './Unit.js';
import { UNIT_DEFS } from '../data/units.js';
import { ENEMY_DEFS } from '../data/enemies.js';
import { ENEMY_COMPOSITIONS } from '../data/compositions.js';
import { GameState } from '../state/GameState.js';
import { findTarget, findHealTarget, tileDist } from './targeting.js';
import { Projectile } from './Projectile.js';
import {
  TILE, MAP_W, MAP_H, WALL_ROW, WALL_SECTION_W,
  RESERVE_ZONE_ROWS, ENEMY_RESERVE_ROW, PLAYER_RESERVE_ROW,
  ENEMY_RESERVE_DEPLOY_S, RESERVE_ALARM_ROW,
  ATK_RANGE_BUFFER, MAX_DR, ROUT_THRESHOLD,
  WALL_BLOCK_Y, WALL_BREACH_DROP, SLOMOER_SCALE, NUDGE_STOP_DIST,
  ENEMY_SPAWN_ROW, ENEMY_SPAWN_SPACING, ENEMY_MOVE_DELAY,
  HEALER_HEAL_S, HEALER_XP_PER_HP, ANNOUNCE_MS,
  COUNTDOWN_STEP_MS, COUNTDOWN_FIGHT_MS,
  COLOR_ENEMY_TERRITORY, COLOR_PLAYER_TERRITORY, ALPHA_GRID,
  COLOR_ENEMY_RESERVE_ZONE, ALPHA_ENEMY_RESERVE_ZONE,
  COLOR_PLAYER_RESERVE_ZONE, ALPHA_PLAYER_RESERVE_ZONE,
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
    this._alarmTriggered = false;
    this._routTriggered  = false;
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
      const seg = new WallSegment(d.section, d.startTile, gsState.level, gsState.hp, this);
      this.walls.push(seg);
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
      const u = this._spawnUnit(type, ENEMY_DEFS[type], 'enemy', x, y);
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

    const wallY     = WALL_ROW + 0.5;
    const engineerY = WALL_ROW + 1.5;  // engineers deploy behind the wall (row 12)

    // ── Wall units ────────────────────────────────────────────────────────────
    for (const ws of WALL_SECTIONS) {
      const seg   = this.walls.find(w => w.section === ws.section);
      const units = roster.filter(u => u.assignment === ws.assignKey);
      const n     = Math.max(units.length, 1);
      units.forEach((ru, k) => {
        const def = UNIT_DEFS[ru.class];
        if (!def) return;
        const isEngineer = ru.class === 'engineer';
        const x = ws.startCol + (k + 0.5) * (WALL_SECTION_W / n);
        const y = isEngineer ? engineerY : wallY;
        const u = this._spawnUnit(ru.class, def, 'player', x, y);
        u.isStationary = true;
        u.rosterId     = ru.id;
        if (!isEngineer) {
          u.isOnWall    = true;
          u.wallSection = seg;
        }
      });
    }

    // ── Reserve units ─────────────────────────────────────────────────────────
    for (const rs of RESERVE_SLOTS) {
      const slot  = this.playerReserve[rs.slotIdx];
      const units = roster.filter(u => u.assignment === rs.assignKey);
      const n     = units.length;
      const row1n = Math.ceil(n / 2);
      units.forEach((ru, k) => {
        const def = UNIT_DEFS[ru.class];
        if (!def) return;
        const row      = k < row1n ? 0 : 1;
        const nInRow   = row === 0 ? row1n : n - row1n;
        const idxInRow = row === 0 ? k : k - row1n;
        const x = slot.startCol + (idxInRow + 0.5) * (WALL_SECTION_W / Math.max(nInRow, 1));
        const y = PLAYER_RESERVE_ROW + 0.5 + row;
        const u = this._spawnUnit(ru.class, def, 'player', x, y);
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
    const wallY = WALL_ROW + 0.5;

    for (let si = 0; si < 3; si++) {
      const seg      = this.walls.find(w => w.section === SECTION_NAMES[si]);
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
      flat.forEach((type, idx) => {
        const col = idx % WALL_SECTION_W;
        const row = Math.floor(idx / WALL_SECTION_W);
        this._spawnUnit(type, ENEMY_DEFS[type], 'enemy',
          startCol + col + 0.5, ENEMY_SPAWN_ROW + row * ENEMY_SPAWN_SPACING);
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
    const spread = (count, y, type, def) => {
      for (let i = 0; i < count; i++)
        this._spawnUnit(type, def, 'enemy', (i + 0.5) * (MAP_W / count), y);
    };

    spread(5, ENEMY_SPAWN_ROW, 'catapult', ENEMY_DEFS.catapult);
    for (let row = 0; row < 5; row++)
      spread(5, ENEMY_SPAWN_ROW + 0.7 + row * 0.5, 'goblin', ENEMY_DEFS.goblin);
    for (let row = 0; row < 5; row++)
      spread(5, ENEMY_SPAWN_ROW + 3.4 + row * 0.5, 'orc', ENEMY_DEFS.orc);
    spread(5, ENEMY_SPAWN_ROW + 6.3, 'ogre', ENEMY_DEFS.ogre);

    for (const u of this.units) {
      if (u.team === 'enemy' && u.type !== 'ogre' && !u.isInReserve) u.moveDelay = ENEMY_MOVE_DELAY;
    }

    this._populateEnemyReserve(0, [{ type: 'orc',     count: 10 }], 'left_after_delay');
    this._populateEnemyReserve(1, [{ type: 'goblin',  count: 10 }], 'center_after_delay');
    this._populateEnemyReserve(2, [{ type: 'general', count:  5 }], 'wait_for_breach');
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
    });
    this.time.delayedCall(COUNTDOWN_STEP_MS * 3 + COUNTDOWN_FIGHT_MS, () => {
      txt.destroy();
      this.countdownActive = false;
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
    const yBase   = PLAYER_RESERVE_ROW * TILE - 8;
    const y_sort  = yBase - rowH * 2;
    const y_reinf = yBase - rowH;
    const y_cncl  = yBase;

    const ROWS = [
      [
        { label: 'Sortie L',    action: 'sortie_left',      x: x_L },
        { label: 'Sortie C',    action: 'sortie_center',    x: x_C },
        { label: 'Sortie R',    action: 'sortie_right',     x: x_R },
      ],
      [
        { label: 'Reinforce L', action: 'reinforce_left',   x: x_L },
        { label: 'Reinforce C', action: 'reinforce_center', x: x_C },
        { label: 'Reinforce R', action: 'reinforce_right',  x: x_R },
      ],
    ];
    const ROW_Y = [y_sort, y_reinf];

    const bg = this.add.rectangle(W / 2, (y_sort + y_cncl) / 2, W - 24, rowH * 3 + 8, 0x000000, 0.80)
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
        if (['archer', 'mage', 'healer'].includes(u.type)) {
          // Move to just behind the wall, then engage enemies normally once arrived
          u.waypoint = { x: targetWall.x, y: WALL_ROW + 1 };
        } else {
          // Move to just behind wall, then hold until breach releases them
          u.waypoint = { x: targetWall.x, y: WALL_ROW + 1 };
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

      let trigger = false;
      switch (slot.logic) {
        case 'wait_for_breach':          trigger = anyBreached; break;
        case 'left_after_delay':
        case 'center_after_delay':
        case 'right_after_delay':
          // Release on breach OR when timer expires
          trigger = anyBreached || this.battleTime >= ENEMY_RESERVE_DEPLOY_S;
          break;
      }
      if (trigger) this._deployEnemySlot(slot);
    }
  }

  _deployEnemySlot(slot) {
    slot.deployed = true;
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
      for (const u of this.units) u.syncSprite();
      return;
    }
    const dt = (delta / 1000) * (GameState.sloMo ? SLOMOER_SCALE : 1);

    this.battleTime += delta / 1000;

    const mins = Math.floor(this.battleTime / 60);
    const secs = Math.floor(this.battleTime % 60).toString().padStart(2, '0');
    this.timerText.setText(`${mins}:${secs}`);

    const justDied = this.units.filter(u => u.isDead);
    for (const u of justDied) u.destroySprites();
    this.units = this.units.filter(u => !u.isDead);

    this._tickUnits(dt);
    this._applySeparation();
    this._tickProjectiles(dt);
    this._updateAuraGlows();

    for (const u of this.units) u.syncSprite();

    this._updateStatus();
    this._checkReserves();
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

      // Refresh stale target
      if (unit.target && (
        unit.target.isDead ||
        (unit.target.isWall && unit.target.isBreached) ||
        (!unit.target.isWall && unit.target.y < 0) ||
        // Enemy wall targets become stale the moment player pressure is active
        (unit.team === 'enemy' && unit.target.isWall &&
          (this.walls.some(w => w.isBreached) ||
           this.units.some(u => u.team === 'player' && !u.isDead && u.y < WALL_ROW)))
      )) {
        unit.target = null;
      }

      if (!unit.target) {
        unit.target = findTarget(unit, this.units, this.walls);
      }

      // Move toward target (non-stationary units)
      if (!unit.isStationary) {
        if (unit.waypoint) {
          const wdx = unit.waypoint.x - unit.x;
          const wdy = unit.waypoint.y - unit.y;
          const arrived = (wdx * wdx + wdy * wdy) < NUDGE_STOP_DIST * NUDGE_STOP_DIST;
          // Sortie: clear when past wall; ranged reinforce: clear when arrived at destination
          if (!unit.reinforceSection && (unit.y <= WALL_ROW || arrived)) {
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
            const hpRestored = healTgt.maxHp - healTgt.hp;
            healTgt.hp = healTgt.maxHp;
            healTgt.triggerHealGlow(this);
            unit.healXpAccum = (unit.healXpAccum ?? 0) + hpRestored;
            const xpEarned = Math.floor(unit.healXpAccum / HEALER_XP_PER_HP);
            if (xpEarned > 0) {
              unit.awardXp(xpEarned);
              unit.healXpAccum -= xpEarned * HEALER_XP_PER_HP;
            }
            unit.healTimer += HEALER_HEAL_S;
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
    if (unit.team === 'enemy' && newY > WALL_ROW - WALL_BLOCK_Y &&
        !this.walls.some(w => w.isBreached)) {
      const seg = this._wallAtX(newX);
      if (seg) newY = WALL_ROW - WALL_BLOCK_Y;
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
        if (seg && !seg.isBreached && a.y > WALL_ROW - WALL_BLOCK_Y) {
          a.y = WALL_ROW - WALL_BLOCK_Y;
        }
      }
    }
  }

  // ─────────────────────────────────────────────
  // COMBAT
  // ─────────────────────────────────────────────
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
    const finalDmg = Math.max(1, Math.floor(baseDmg * (1 - effectiveDR)));

    if (attacker.range > 1) {
      this.projectiles.push(new Projectile(attacker, target, finalDmg, this, this));
    } else {
      this._applyDamage(attacker, target, finalDmg);
      if (attacker.isAoe) this._applyAoeSplash(attacker, target, finalDmg);
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
    } else {
      const justBreached = wallSeg.takeDamage(baseDmg);
      if (justBreached) this._handleWallBreach(wallSeg);
    }
  }

  _applyDamage(attacker, target, amount) {
    target.hp -= amount;
    target.damageTaken += amount;
    target.lastAttacker = attacker;
    target.damageBy[attacker.id] = (target.damageBy[attacker.id] ?? 0) + amount;
    if (target.hp <= 0) this._handleDeath(target);
  }

  _applyAoeSplash(attacker, primaryTarget, primaryDmg) {
    if (!primaryTarget.isWall) {
      const splashTargets = this.units.filter(u =>
        !u.isDead && u !== primaryTarget &&
        u.team === primaryTarget.team &&
        !u.isOnWall &&
        tileDist(u, primaryTarget) <= attacker.aoeRadius
      );
      for (const u of splashTargets) {
        const dr  = attacker.ignoresArmor ? 0 : u.armor;
        const dmg = Math.max(1, Math.floor(primaryDmg * (1 - dr)));
        this._applyDamage(attacker, u, dmg);
      }
    }
    if (attacker.type === 'catapult') {
      for (const w of this.walls) {
        if (!w.isBreached && w !== primaryTarget && tileDist(w, primaryTarget) <= attacker.aoeRadius) {
          const just = w.takeDamage(Math.floor(primaryDmg * 0.5));
          if (just) this._handleWallBreach(w);
        }
      }
    }
  }

  // ─────────────────────────────────────────────
  // DEATH & XP
  // ─────────────────────────────────────────────
  _handleDeath(unit) {
    unit.isDead = true;

    const killer = unit.lastAttacker;
    if (killer && !killer.isDead) {
      const killXp = unit.isElite ? 6 : 2;
      killer.awardXp(killXp);
    }
    for (const [idStr, dmg] of Object.entries(unit.damageBy)) {
      const id = Number(idStr);
      if (killer && id === killer.id) continue;
      if (dmg / unit.maxHp >= 0.30) {
        const helper = this.units.find(u => u.id === id && !u.isDead);
        if (helper) helper.awardXp(1);
      }
    }

    if (unit.isElite && killer) {
      const name = killer.type.charAt(0).toUpperCase() + killer.type.slice(1);
      this._showAnnouncement(`${name} slew the ${unit.type}!`, '#ffdd44');
    }
  }

  // ─────────────────────────────────────────────
  // WALL BREACH
  // ─────────────────────────────────────────────
  _handleWallBreach(seg) {
    for (const u of this.units) {
      if (u.isOnWall && u.wallSection === seg) {
        u.isOnWall = false;
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
    this._showAnnouncement(`${seg.section.toUpperCase()} WALL BREACHED!`, '#ff4444');
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

  _endBattle(result) {
    if (this.battleOver) return;
    this.battleOver = true;
    this._hideDeployMenu();

    for (const u of this.units) {
      if (u.team === 'player' && u.damageTaken > 0) u.awardXp(1);
    }

    GameState.battleResult = result;
    const msg = result === 'victory' ? 'VICTORY!' : 'DEFEAT — GAME OVER';
    const col = result === 'victory' ? '#44ff44' : '#ff4444';
    this.announceText.setText(msg).setColor(col).setVisible(true);
    this.statusText.setText('');
  }
}
