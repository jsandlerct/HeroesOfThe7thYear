import {
  TILE, MAP_W, MAP_H, WALL_ROW, WALL_SECTION_W,
  WALL_DR, WALL_HP_BAR_H, WALL_HP_BAR_Y, WALL_LABEL_SIZE,
  COLOR_WALL_FILL, ALPHA_WALL_BREACH, WALL_BLOCK_Y,
  COLOR_WALL_HP_BAR_BG, COLOR_WALL_HP_HIGH, COLOR_WALL_HP_MED, COLOR_WALL_HP_LOW,
  HP_THRESH_MED, HP_THRESH_LOW,
  COLOR_WALL_DAMAGED, COLOR_WALL_CRITICAL,
} from '../data/constants.js';

export { TILE, MAP_W, MAP_H, WALL_ROW };   // re-export for legacy imports in main.js

// Crack line data per section (3 sections × 2 damage bands).
// Each entry is [x1pct, y1pct, x2pct, y2pct] as fractions of wall section size.
const CRACK_DATA = [
  // Left section
  {
    light: [[0.15, 0.05, 0.28, 0.70], [0.28, 0.70, 0.45, 0.95]],
    heavy: [[0.28, 0.40, 0.58, 0.15], [0.60, 0.30, 0.80, 0.90]],
  },
  // Center section
  {
    light: [[0.48, 0.05, 0.36, 0.65], [0.36, 0.65, 0.55, 0.92]],
    heavy: [[0.36, 0.65, 0.18, 0.88], [0.62, 0.20, 0.74, 0.80]],
  },
  // Right section
  {
    light: [[0.72, 0.08, 0.55, 0.68], [0.55, 0.68, 0.38, 0.92]],
    heavy: [[0.55, 0.68, 0.68, 0.95], [0.28, 0.18, 0.48, 0.55]],
  },
];

export class WallSegment {
  constructor(section, startTile, level, hp, maxHp, scene) {
    this.isWall    = true;
    this.section   = section;
    this.startTile = startTile;
    this.level     = level;
    this.maxHp     = maxHp;
    this.hp        = hp;
    this.isBreached = false;

    // Tile-space center (used by targeting distance checks)
    this.x = startTile + WALL_SECTION_W / 2;
    this.y = WALL_ROW + 0.5;

    const px         = startTile * TILE;
    const pyBottom   = (WALL_ROW + 1) * TILE;  // bottom edge stays fixed
    const w          = WALL_SECTION_W * TILE;
    // Visual height scales with level — higher-level walls extend toward the enemy
    const extraTiles = level >= 5 ? 2 : level >= 3 ? 1 : 0;
    const h          = TILE * (1 + extraTiles);
    const rectCY     = pyBottom - h / 2;  // center Y: wall grows upward as h increases
    const pyTop      = pyBottom - h;      // top edge moves toward the enemy

    // Tile-space top row (used for unit positioning and enemy blocking)
    this.topTile = WALL_ROW - extraTiles;
    // Y at which enemies are stopped (just north of wall face)
    this.blockY  = this.topTile - WALL_BLOCK_Y;

    this._px    = px;
    this._py    = pyTop;   // stored as top edge for crack drawing
    this._w     = w;
    this._h     = h;
    this._scene = scene;
    this._sectionIdx = startTile / WALL_SECTION_W;
    this._damageState = 0;  // 0 = intact, 1 = light, 2 = heavy, 3 = breached
    this._crackGraphics = null;

    this.rect = scene.add.rectangle(px + w / 2, rectCY, w, h, COLOR_WALL_FILL)
      .setDepth(1);

    this.hpBarBg = scene.add.rectangle(px + w / 2, pyTop + WALL_HP_BAR_Y, w, WALL_HP_BAR_H, COLOR_WALL_HP_BAR_BG)
      .setOrigin(0.5, 0.5).setDepth(2);
    this.hpBarFg = scene.add.rectangle(px, pyTop + WALL_HP_BAR_Y, w, WALL_HP_BAR_H, COLOR_WALL_HP_HIGH)
      .setOrigin(0, 0.5).setDepth(2);

    scene.add.text(px + w / 2, rectCY, section[0].toUpperCase(), {
      fontSize: WALL_LABEL_SIZE, color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setDepth(3);
  }

  _updateDamageVisuals() {
    const pct = this.hp / this.maxHp;

    // Determine damage band
    const newState = this.isBreached  ? 3
                   : pct <= HP_THRESH_LOW ? 2
                   : pct <= HP_THRESH_MED ? 1
                   : 0;

    if (newState === this._damageState) return;
    this._damageState = newState;

    // Tint wall fill
    const fillColor = newState === 0 ? COLOR_WALL_FILL
                    : newState === 1 ? COLOR_WALL_DAMAGED
                    : COLOR_WALL_CRITICAL;
    const alpha     = newState === 3 ? ALPHA_WALL_BREACH : 1;
    this.rect.setFillStyle(fillColor, alpha);

    // Redraw crack graphics
    if (this._crackGraphics) { this._crackGraphics.destroy(); this._crackGraphics = null; }
    if (newState === 0) return;

    const { px, py, w, h, idx } = { px: this._px, py: this._py, w: this._w, h: this._h, idx: this._sectionIdx };
    const data    = CRACK_DATA[idx] ?? CRACK_DATA[0];
    const g       = this._scene.add.graphics().setDepth(3);
    this._crackGraphics = g;

    // Light cracks (shown at state 1+)
    g.lineStyle(1, 0x000000, 0.45);
    for (const [x1p, y1p, x2p, y2p] of data.light) {
      g.lineBetween(px + x1p * w, py + y1p * h, px + x2p * w, py + y2p * h);
    }

    // Heavy cracks (shown at state 2+)
    if (newState >= 2) {
      g.lineStyle(2, 0x111111, 0.65);
      for (const [x1p, y1p, x2p, y2p] of data.heavy) {
        g.lineBetween(px + x1p * w, py + y1p * h, px + x2p * w, py + y2p * h);
      }
    }
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.updateHpBar();
    const justBreached = this.hp <= 0 && !this.isBreached;
    if (justBreached) this.isBreached = true;
    this._updateDamageVisuals();
    return justBreached;
  }

  updateHpBar() {
    const pct   = this.hp / this.maxHp;
    const fullW = WALL_SECTION_W * TILE;
    this.hpBarFg.setDisplaySize(Math.max(0, Math.floor(pct * fullW)), WALL_HP_BAR_H);
    const color = pct > HP_THRESH_MED ? COLOR_WALL_HP_HIGH
                : pct > HP_THRESH_LOW ? COLOR_WALL_HP_MED
                : COLOR_WALL_HP_LOW;
    this.hpBarFg.setFillStyle(color);
  }

  getDamageReduction() {
    return WALL_DR[this.level] ?? WALL_DR[1];
  }

  containsX(tileX) {
    return tileX >= this.startTile && tileX < this.startTile + WALL_SECTION_W;
  }
}
