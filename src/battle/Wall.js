import {
  TILE, MAP_W, MAP_H, WALL_ROW, WALL_SECTION_W,
  WALL_DR, WALL_LABEL_SIZE,
  COLOR_WALL_FILL, ALPHA_WALL_BREACH, WALL_BLOCK_Y,
  COLOR_WALL_HP_BAR_BG, COLOR_WALL_HP_HIGH, COLOR_WALL_HP_MED, COLOR_WALL_HP_LOW,
  HP_THRESH_MED, HP_THRESH_LOW,
  COLOR_WALL_DAMAGED, COLOR_WALL_CRITICAL,
} from '../data/constants.js';

export { TILE, MAP_W, MAP_H, WALL_ROW };   // re-export for legacy imports in main.js

// ── Battlement constants ──────────────────────────────────────────────────────
const MERLON_COUNT = 9;    // merlons per section
const MERLON_H     = 14;   // px — protrudes above wall top

// ── Segmented HP bar constants ────────────────────────────────────────────────
const BAR_SEGS     = 10;   // number of HP segments
const BAR_H        = 5;    // segment height px
const BAR_SEG_GAP  = 2;    // px gap between segments
const BAR_MARGIN   = 6;    // px from wall left/right edges
const BAR_FROM_BTM = 9;    // px from wall bottom edge to bar center

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
    const extraTiles = level >= 5 ? 2 : level >= 3 ? 1 : 0;
    const h          = TILE * (1 + extraTiles);
    const rectCY     = pyBottom - h / 2;
    const pyTop      = pyBottom - h;

    // Tile-space top row (used for unit positioning and enemy blocking)
    this.topTile = WALL_ROW - extraTiles;
    this.blockY  = this.topTile - WALL_BLOCK_Y;

    this._px        = px;
    this._py        = pyTop;
    this._pyBottom  = pyBottom;
    this._w         = w;
    this._h         = h;
    this._scene     = scene;
    this._sectionIdx    = startTile / WALL_SECTION_W;
    this._damageState   = 0;
    this._crackGraphics = null;

    // Main wall body
    this.rect = scene.add.rectangle(px + w / 2, rectCY, w, h, COLOR_WALL_FILL)
      .setDepth(1);

    // Stone detailing — thin horizontal courses drawn over the fill
    this._stoneG = scene.add.graphics().setDepth(2);
    this._drawStoneDetail(COLOR_WALL_FILL);

    // Battlements
    this._merlonG = scene.add.graphics().setDepth(2);
    this._drawMerlons(COLOR_WALL_FILL);

    // HP bar (segmented, drawn on the wall face)
    this._hpBarG = scene.add.graphics().setDepth(3);
    this.updateHpBar();

    // Section label
    scene.add.text(px + w / 2, rectCY - h * 0.12, section[0].toUpperCase(), {
      fontSize: WALL_LABEL_SIZE, color: '#cccccc', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setDepth(3);
  }

  // ── Battlement rendering ────────────────────────────────────────────────────

  _drawMerlons(fillColor) {
    const g    = this._merlonG;
    const step = this._w / MERLON_COUNT;
    const mw   = Math.round(step * 0.54);  // merlon occupies 54% of its slot
    const mOff = (step - mw) / 2;          // centering offset within slot
    const top  = this._py - MERLON_H;

    g.clear();
    g.setAlpha(this.isBreached ? ALPHA_WALL_BREACH : 1);
    g.fillStyle(fillColor, 1);
    for (let i = 0; i < MERLON_COUNT; i++) {
      g.fillRect(this._px + i * step + mOff, top, mw, MERLON_H);
    }
    // Thin top edge on each merlon for contrast
    g.fillStyle(0xaaaaaa, 0.5);
    for (let i = 0; i < MERLON_COUNT; i++) {
      g.fillRect(this._px + i * step + mOff, top, mw, 2);
    }
  }

  // ── Stone course lines ──────────────────────────────────────────────────────

  _drawStoneDetail(fillColor) {
    const g = this._stoneG;
    g.clear();
    // Subtle horizontal mortar lines every ~16px through the wall height
    const lineColor = Phaser.Display.Color.IntegerToColor(fillColor);
    const r = Math.max(0, lineColor.red   - 22);
    const gv = Math.max(0, lineColor.green - 22);
    const b = Math.max(0, lineColor.blue  - 22);
    const dark = Phaser.Display.Color.GetColor(r, gv, b);
    g.fillStyle(dark, 0.55);
    const courseH = 2;
    const spacing = Math.round(TILE * 0.36);  // one course line per ~1/3 tile
    let y = this._py + spacing;
    while (y < this._pyBottom - 4) {
      g.fillRect(this._px + 2, y, this._w - 4, courseH);
      y += spacing;
    }
  }

  // ── Segmented HP bar ────────────────────────────────────────────────────────

  updateHpBar() {
    const g   = this._hpBarG;
    const pct = this.hp / this.maxHp;
    g.clear();

    const barX   = this._px + BAR_MARGIN;
    const barCY  = this._pyBottom - BAR_FROM_BTM;
    const totalW = this._w - 2 * BAR_MARGIN;
    const segW   = (totalW - (BAR_SEGS - 1) * BAR_SEG_GAP) / BAR_SEGS;
    const filled = Math.ceil(pct * BAR_SEGS);
    const color  = pct > HP_THRESH_MED ? COLOR_WALL_HP_HIGH
                 : pct > HP_THRESH_LOW ? COLOR_WALL_HP_MED
                 : COLOR_WALL_HP_LOW;

    // Dim background strip
    g.fillStyle(0x111111, 0.65);
    g.fillRect(barX - 1, barCY - BAR_H / 2 - 1, totalW + 2, BAR_H + 2);

    for (let i = 0; i < BAR_SEGS; i++) {
      const sx = barX + i * (segW + BAR_SEG_GAP);
      g.fillStyle(i < filled ? color : 0x222222, 1);
      g.fillRect(sx, barCY - BAR_H / 2, segW, BAR_H);
    }
  }

  // ── Damage visuals ──────────────────────────────────────────────────────────

  _updateDamageVisuals() {
    const pct = this.hp / this.maxHp;

    const newState = this.isBreached      ? 3
                   : pct <= HP_THRESH_LOW ? 2
                   : pct <= HP_THRESH_MED ? 1
                   : 0;

    if (newState === this._damageState) return;
    this._damageState = newState;

    const fillColor = newState === 0 ? COLOR_WALL_FILL
                    : newState === 1 ? COLOR_WALL_DAMAGED
                    : COLOR_WALL_CRITICAL;
    const alpha = newState === 3 ? ALPHA_WALL_BREACH : 1;

    this.rect.setFillStyle(fillColor, alpha);
    this._drawMerlons(fillColor);
    this._drawStoneDetail(fillColor);

    // Crack graphics
    if (this._crackGraphics) { this._crackGraphics.destroy(); this._crackGraphics = null; }
    if (newState === 0) return;

    const { px, py, w, h, idx } = { px: this._px, py: this._py, w: this._w, h: this._h, idx: this._sectionIdx };
    const data    = CRACK_DATA[idx] ?? CRACK_DATA[0];
    const cg      = this._scene.add.graphics().setDepth(3);
    this._crackGraphics = cg;

    cg.lineStyle(1, 0x000000, 0.45);
    for (const [x1p, y1p, x2p, y2p] of data.light) {
      cg.lineBetween(px + x1p * w, py + y1p * h, px + x2p * w, py + y2p * h);
    }
    if (newState >= 2) {
      cg.lineStyle(2, 0x111111, 0.65);
      for (const [x1p, y1p, x2p, y2p] of data.heavy) {
        cg.lineBetween(px + x1p * w, py + y1p * h, px + x2p * w, py + y2p * h);
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

  getDamageReduction() {
    return WALL_DR[this.level] ?? WALL_DR[1];
  }

  containsX(tileX) {
    return tileX >= this.startTile && tileX < this.startTile + WALL_SECTION_W;
  }
}
